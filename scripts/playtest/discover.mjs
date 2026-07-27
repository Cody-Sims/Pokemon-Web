#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:net';

import { chromium, devices } from '@playwright/test';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_SCENARIOS = [
  'boot',
  'new-game',
  'overworld-fuzz',
  'mobile-controls',
  'mobile-rotation',
];
const VALID_SCENARIOS = new Set(DEFAULT_SCENARIOS);
const DEFAULT_PROFILES = ['desktop', 'mobile-landscape', 'mobile-portrait'];
const VALID_PROFILES = new Set(DEFAULT_PROFILES);
const SCENARIO_PROFILES = {
  boot: ['desktop'],
  'new-game': ['desktop'],
  'overworld-fuzz': ['desktop'],
  'mobile-controls': ['mobile-landscape', 'mobile-portrait'],
  'mobile-rotation': ['mobile-landscape'],
};
const BLOCKING_KINDS = new Set([
  'pageerror',
  'console-error',
  'requestfailed',
  'http-error',
  'scenario-failure',
  'checkpoint',
  'visual-layout',
]);
const FUZZ_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'z', 'x'];
const MOBILE_SELECTORS = {
  controls: '#mobile-controls',
  joystick: '#joystick-zone',
  buttonA: '#btn-a',
  buttonB: '#btn-b',
  menu: '#mobile-menu-btn',
};
const OVERWORLD_SAVE = {
  version: 2,
  timestamp: 1,
  party: [],
  boxes: [],
  boxNames: Array.from({ length: 12 }, (_, index) => `Box ${index + 1}`),
  badges: [],
  flags: { game_started: true },
  trainersDefeated: [],
  pokedex: { seen: [], caught: [] },
  nuzlockeEncountered: [],
  visitedMaps: ['pallet-town'],
  hallOfFame: [],
  playerName: 'Playtester',
  playerGender: 'boy',
  currentMap: 'pallet-town',
  playerPosition: { x: 12, y: 14, direction: 'down' },
  bag: [],
  money: 3000,
  trainerId: '00001',
  playtime: 0,
  difficulty: 'classic',
  challengeModes: [],
  monotypeLock: null,
  settings: {
    textSpeed: 'fast',
    musicVolume: 0,
    sfxVolume: 0,
    battleAnimations: false,
    textScale: 'medium',
    colorblindMode: 'off',
    reducedMotion: true,
    showMinimap: true,
    showTypeHints: true,
    speedrunTimer: false,
  },
  berryPlots: {},
  berryHarvests: {},
  repelSteps: 0,
  battlePoints: 0,
  towerBestStreak: {},
  towerClears: {},
  gameClockMinutes: 480,
  speedrunSplits: [],
  gameStats: {},
  stepCount: 0,
  achievements: [],
};

export function parseArguments(argv) {
  const options = {
    actions: 120,
    attempts: 2,
    seeds: [42, 1337],
    scenarios: [...DEFAULT_SCENARIOS],
    profiles: [...DEFAULT_PROFILES],
    output: null,
    baseUrl: null,
    verify: null,
    headless: true,
  };
  let seedProvided = false;
  let scenarioProvided = false;
  let profileProvided = false;

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--headed') options.headless = false;
    else if (flag === '--actions') options.actions = Number(argv[(index += 1)]);
    else if (flag === '--attempts') options.attempts = Number(argv[(index += 1)]);
    else if (flag === '--output') options.output = argv[(index += 1)];
    else if (flag === '--base-url') options.baseUrl = argv[(index += 1)];
    else if (flag === '--verify') options.verify = argv[(index += 1)];
    else if (flag === '--seed') {
      if (!seedProvided) options.seeds = [];
      seedProvided = true;
      options.seeds.push(Number(argv[(index += 1)]));
    } else if (flag === '--scenario') {
      if (!scenarioProvided) options.scenarios = [];
      scenarioProvided = true;
      options.scenarios.push(argv[(index += 1)]);
    } else if (flag === '--profile') {
      if (!profileProvided) options.profiles = [];
      profileProvided = true;
      options.profiles.push(argv[(index += 1)]);
    } else {
      throw new Error(`Unknown playtest argument: ${flag}`);
    }
  }

  if (!Number.isInteger(options.actions) || options.actions < 1 || options.actions > 2000) {
    throw new Error('--actions must be an integer between 1 and 2000.');
  }
  if (!Number.isInteger(options.attempts) || options.attempts < 1 || options.attempts > 2) {
    throw new Error('--attempts must be either 1 or 2.');
  }
  if (options.seeds.length === 0 || options.seeds.some((seed) => !Number.isInteger(seed))) {
    throw new Error('--seed must be an integer and may be repeated.');
  }
  if (
    options.scenarios.length === 0 ||
    options.scenarios.some((scenario) => !VALID_SCENARIOS.has(scenario))
  ) {
    throw new Error(`--scenario must be one of: ${DEFAULT_SCENARIOS.join(', ')}.`);
  }
  if (
    options.profiles.length === 0 ||
    options.profiles.some((profile) => !VALID_PROFILES.has(profile))
  ) {
    throw new Error(`--profile must be one of: ${DEFAULT_PROFILES.join(', ')}.`);
  }
  if (options.verify) options.attempts = 1;

  return options;
}

function normalizedMessage(message) {
  return String(message ?? '')
    .replaceAll(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+/g, '<local-origin>')
    .replaceAll(/\b0x[0-9a-f]+\b/gi, '<address>')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function fingerprintFinding(finding) {
  const stable = [
    finding.kind,
    finding.scenario,
    finding.profile ?? 'desktop',
    normalizedMessage(finding.message),
  ].join('\n');
  return createHash('sha256').update(stable).digest('hex').slice(0, 8).toUpperCase();
}

function reproductionCommand(finding, actions = 120) {
  const profile = finding.profile ? ` --profile ${finding.profile}` : '';
  const seed = Number.isInteger(finding.seed) ? ` --seed ${finding.seed}` : '';
  const actionCount = finding.scenario === 'overworld-fuzz' ? ` --actions ${actions}` : '';
  return `npm run playtest:discover -- --scenario ${finding.scenario}${profile}${seed}${actionCount} --attempts 1`;
}

export function aggregateFindings(observations, attempts, actions = 120) {
  const grouped = new Map();

  for (const observation of observations) {
    const fingerprint = fingerprintFinding(observation);
    const existing = grouped.get(fingerprint) ?? {
      ...observation,
      id: `PT-${fingerprint}`,
      fingerprint,
      attemptsByProfileAndSeed: new Map(),
      evidence: [],
    };
    const runKey = `${observation.profile ?? 'desktop'}:${observation.seed}`;
    const attemptsForRun = existing.attemptsByProfileAndSeed.get(runKey) ?? new Set();
    attemptsForRun.add(observation.attempt);
    existing.attemptsByProfileAndSeed.set(runKey, attemptsForRun);
    existing.evidence.push({
      attempt: observation.attempt,
      profile: observation.profile ?? 'desktop',
      seed: observation.seed,
      actionIndex: observation.actionIndex,
      activeScenes: observation.activeScenes ?? [],
      screenshot: observation.screenshot ?? null,
    });
    grouped.set(fingerprint, existing);
  }

  return [...grouped.values()]
    .map(({ attemptsByProfileAndSeed, ...finding }) => {
      const runCoverage = [...attemptsByProfileAndSeed.entries()].sort(
        (left, right) => right[1].size - left[1].size,
      );
      const [runKey, attemptsSeen] = runCoverage[0];
      const separator = runKey.lastIndexOf(':');
      const profile = runKey.slice(0, separator);
      const seed = Number(runKey.slice(separator + 1));
      const normalizedFinding = {
        ...finding,
        profile,
        seed,
        message: normalizedMessage(finding.message),
        occurrences: attemptsSeen.size,
        reproducible: attemptsSeen.size === attempts,
      };
      return {
        ...normalizedFinding,
        reproductionCommand: reproductionCommand(normalizedFinding, actions),
      };
    })
    .sort((left, right) => {
      if (left.reproducible !== right.reproducible) return left.reproducible ? -1 : 1;
      return left.id.localeCompare(right.id);
    });
}

export function selectRepairCandidate(report, blockedIds) {
  return (
    report.findings.find((finding) => finding.reproducible && !blockedIds.has(finding.id)) ?? null
  );
}

export function verificationHasFailed(target, findings) {
  const baselineFingerprints = new Set(target.baselineFingerprints ?? [target.fingerprint]);
  return findings.some(
    (finding) =>
      finding.fingerprint === target.fingerprint ||
      (BLOCKING_KINDS.has(finding.kind) && !baselineFingerprints.has(finding.fingerprint)),
  );
}

export function formatMarkdownReport(report) {
  const reproducible = report.findings.filter((finding) => finding.reproducible);
  const intermittent = report.findings.filter((finding) => !finding.reproducible);
  const lines = [
    '# Playtest bug report',
    '',
    `Generated: ${report.generatedAt}`,
    `Reproducible bugs: ${reproducible.length}`,
    `Intermittent observations: ${intermittent.length}`,
    '',
  ];

  if (report.findings.length === 0) {
    lines.push('No bugs were observed in the selected journeys and seeds.', '');
    return `${lines.join('\n')}\n`;
  }

  for (const finding of report.findings) {
    lines.push(
      `## ${finding.id} - ${finding.kind}`,
      '',
      `- Status: ${finding.reproducible ? 'reproducible' : 'intermittent'}`,
      `- Scenario: \`${finding.scenario}\``,
      `- Profile: \`${finding.profile ?? 'desktop'}\``,
      `- Seed: \`${finding.seed ?? 'n/a'}\``,
      `- Action index: \`${finding.actionIndex ?? 'setup'}\``,
      `- Message: ${finding.message}`,
      `- Reproduce: \`${finding.reproductionCommand}\``,
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function mulberry32(initialSeed) {
  let seed = initialSeed;
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function profileContextOptions(profile) {
  if (profile === 'desktop') {
    const desktop = {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
    };
    delete desktop.defaultBrowserType;
    return desktop;
  }

  const mobile = { ...devices['Pixel 7'] };
  delete mobile.defaultBrowserType;
  const viewport =
    profile === 'mobile-portrait' ? { width: 390, height: 844 } : { width: 844, height: 390 };
  return {
    ...mobile,
    viewport,
    screen: viewport,
    isMobile: true,
    hasTouch: true,
  };
}

function boxesOverlap(left, right) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

export function analyzeMobileLayout(layout) {
  const messages = [];
  const { viewport, documentSize, boxes } = layout;
  if (documentSize.width > viewport.width + 1 || documentSize.height > viewport.height + 1) {
    messages.push(
      `Mobile document overflows the ${viewport.width}x${viewport.height} viewport (${documentSize.width}x${documentSize.height}).`,
    );
  }

  for (const [name, selector] of Object.entries(MOBILE_SELECTORS)) {
    const box = boxes[name];
    if (!box) {
      messages.push(`Mobile control ${selector} is not visible.`);
      continue;
    }
    if (name !== 'controls' && (box.width < 44 || box.height < 44)) {
      messages.push(
        `Mobile control ${selector} is smaller than 44x44 CSS pixels (${Math.round(box.width)}x${Math.round(box.height)}).`,
      );
    }
    if (
      box.x < -1 ||
      box.y < -1 ||
      box.x + box.width > viewport.width + 1 ||
      box.y + box.height > viewport.height + 1
    ) {
      messages.push(`Mobile control ${selector} extends outside the viewport.`);
    }
  }

  for (const [leftName, rightName] of [
    ['joystick', 'buttonA'],
    ['joystick', 'buttonB'],
    ['menu', 'buttonA'],
    ['menu', 'buttonB'],
  ]) {
    const left = boxes[leftName];
    const right = boxes[rightName];
    if (left && right && boxesOverlap(left, right)) {
      messages.push(
        `Mobile controls ${MOBILE_SELECTORS[leftName]} and ${MOBILE_SELECTORS[rightName]} overlap.`,
      );
    }
  }
  return messages;
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child && hasChildExited(child)) {
      throw new Error(`Vite exited before becoming ready (${child.signalCode ?? child.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`Timed out waiting for ${url}.`);
}

async function allocatePort() {
  const server = createServer();
  server.unref();
  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not allocate a local playtest port.');
  }
  const port = address.port;
  await new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => (error ? rejectPromise(error) : resolvePromise()));
  });
  return port;
}

async function startServer(baseUrl, onChild) {
  if (baseUrl) return { baseUrl, child: null };

  const port = await allocatePort();
  const child = spawn(
    process.execPath,
    [
      resolve(REPOSITORY_ROOT, 'node_modules/vite/bin/vite.js'),
      '--config',
      resolve(REPOSITORY_ROOT, 'frontend/vite.config.ts'),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: REPOSITORY_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  onChild?.(child);
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(url, child);
  } catch (error) {
    await stopServer(child);
    throw error;
  }
  return { baseUrl: url, child };
}

export function hasChildExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

export function exitCodeForSignal(signal) {
  return signal === 'SIGINT' ? 130 : 143;
}

async function stopServer(child) {
  if (!child || hasChildExited(child)) return;
  let exitPromise = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([
    exitPromise,
    new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000)),
  ]);
  if (!hasChildExited(child)) {
    exitPromise = once(child, 'exit');
    child.kill('SIGKILL');
    await exitPromise;
  }
}

async function activeScenes(page) {
  return page.evaluate(() => window.__pokemonPlaytest?.snapshot().activeScenes ?? []);
}

async function waitForScene(page, sceneKey, timeout = 15_000) {
  await page.waitForFunction(
    (expected) => window.__pokemonPlaytest?.snapshot().activeScenes.includes(expected) === true,
    sceneKey,
    { timeout },
  );
}

async function pressKey(page, key, duration = 80) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(40);
}

async function pressUntilScene(page, key, sceneKey, maxPresses) {
  for (let press = 0; press < maxPresses; press += 1) {
    await pressKey(page, key);
    await page.waitForTimeout(800);
    if ((await activeScenes(page)).includes(sceneKey)) return;
  }
  await waitForScene(page, sceneKey, 5_000);
}

async function bootToTitle(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15_000 });
  await waitForScene(page, 'TitleScene');
  await page.waitForTimeout(2_000);
}

async function reachOverworld(page, baseUrl) {
  await bootToTitle(page, baseUrl);
  await pressUntilScene(page, 'Enter', 'IntroScene', 5);
  await pressUntilScene(page, 'Enter', 'OverworldScene', 20);
}

async function reachSavedOverworld(page, baseUrl) {
  await page.addInitScript((save) => {
    localStorage.clear();
    localStorage.setItem('pokemon-web-save', JSON.stringify(save));
    localStorage.setItem('pokemon-web-portrait-ok', '1');
    localStorage.setItem('pokemon-web-ios-install-dismissed', '1');
    localStorage.setItem('pokemon-web-install-dismissed', '1');
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: () => Promise.resolve(),
    });
  }, OVERWORLD_SAVE);
  await bootToTitle(page, baseUrl);
  await pressUntilScene(page, 'Enter', 'OverworldScene', 5);
  await page.locator('#mobile-controls').waitFor({ state: 'visible', timeout: 10_000 });
}

async function getPlayerPosition(page) {
  return page.evaluate(async () => {
    const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
    const { GameManager } = await import(modulePath);
    return GameManager.getInstance().getPlayerPosition();
  });
}

async function waitForPlayerMovement(page, initialPosition) {
  const deadline = Date.now() + 6_000;
  while (Date.now() < deadline) {
    const position = await getPlayerPosition(page);
    if (position.x !== initialPosition.x || position.y !== initialPosition.y) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }
  throw new Error('Mobile joystick did not move the player within 6000ms.');
}

async function dragMobileJoystick(page, direction) {
  const start = await getPlayerPosition(page);
  const zone = await page.locator('#joystick-zone').boundingBox();
  if (!zone) throw new Error('Mobile joystick zone has no visible layout box.');
  const from = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
  const to =
    direction === 'right'
      ? { x: Math.min(zone.x + zone.width - 24, from.x + 72), y: from.y }
      : { x: from.x, y: Math.min(zone.y + zone.height - 24, from.y + 72) };
  const client = await page.context().newCDPSession(page);

  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...from, id: 1, radiusX: 4, radiusY: 4 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...to, id: 1, radiusX: 4, radiusY: 4 }],
    });
    await waitForPlayerMovement(page, start);
  } finally {
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  }
}

async function readMobileLayout(page) {
  return page.evaluate((selectors) => {
    const boxes = {};
    for (const [name, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector);
      const style = element ? getComputedStyle(element) : null;
      if (!element || style?.display === 'none' || style?.visibility === 'hidden') {
        boxes[name] = null;
        continue;
      }
      const rect = element.getBoundingClientRect();
      boxes[name] =
        rect.width > 0 && rect.height > 0
          ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          : null;
    }
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      boxes,
    };
  }, MOBILE_SELECTORS);
}

async function waitForMobileLayout(page, expectedLandscape) {
  await page.waitForFunction(
    (landscape) => {
      if (window.innerWidth > window.innerHeight !== landscape) return false;
      const controls = document.querySelector('#mobile-controls');
      if (!(controls instanceof HTMLElement)) return false;
      const rect = controls.getBoundingClientRect();
      if (getComputedStyle(controls).display === 'none' || rect.width === 0 || rect.height === 0) {
        return false;
      }
      return landscape
        ? Math.abs(rect.height - window.innerHeight) <= 1
        : rect.height >= 190 && rect.height <= 260;
    },
    expectedLandscape,
    { timeout: 10_000 },
  );
}

async function auditMobileLayout(page, context) {
  const messages = analyzeMobileLayout(await readMobileLayout(page));
  for (const message of messages) {
    context.observations.push({
      kind: 'visual-layout',
      message,
      scenario: context.scenario,
      profile: context.profile,
      seed: context.seed,
      actionIndex: context.actionIndex,
      activeScenes: context.lastActiveScenes,
      attempt: context.attempt,
    });
  }
}

function attachObservers(page, context) {
  const record = (kind, message) => {
    context.observations.push({
      kind,
      message,
      scenario: context.scenario,
      profile: context.profile,
      seed: context.seed,
      actionIndex: context.actionIndex,
      activeScenes: context.lastActiveScenes,
      attempt: context.attempt,
    });
  };

  page.on('pageerror', (error) => record('pageerror', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') record('console-error', message.text());
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'request failed';
    if (failure !== 'net::ERR_ABORTED') {
      record('requestfailed', `${request.method()} ${request.url()}: ${failure}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      record('http-error', `${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
}

async function takeEvidenceScreenshot(page, output, context) {
  const directory = resolve(output, 'screenshots');
  mkdirSync(directory, { recursive: true });
  const path = resolve(
    directory,
    `${context.scenario}-${context.profile}-seed-${context.seed}-attempt-${context.attempt}.png`,
  );
  await page.screenshot({ path });
  return path;
}

async function takeCheckpointScreenshot(page, output, context, label) {
  const directory = resolve(output, 'screenshots');
  mkdirSync(directory, { recursive: true });
  const path = resolve(
    directory,
    `${context.scenario}-${context.profile}-${label}-seed-${context.seed}-attempt-${context.attempt}.png`,
  );
  await page.screenshot({ path });
  context.checkpoints.push(path);
}

async function runScenario(browser, baseUrl, output, scenario, profile, seed, attempt, actions) {
  const browserContext = await browser.newContext(profileContextOptions(profile));
  const page = await browserContext.newPage();
  const context = {
    scenario,
    profile,
    seed,
    attempt,
    actionIndex: null,
    lastActiveScenes: [],
    observations: [],
    checkpoints: [],
  };
  attachObservers(page, context);

  try {
    if (scenario === 'boot') {
      await bootToTitle(page, baseUrl);
    } else if (scenario === 'new-game') {
      await reachOverworld(page, baseUrl);
    } else if (scenario === 'overworld-fuzz') {
      await reachOverworld(page, baseUrl);
      const random = mulberry32(seed);
      for (let index = 0; index < actions; index += 1) {
        context.actionIndex = index;
        const key = FUZZ_KEYS[Math.floor(random() * FUZZ_KEYS.length)];
        const duration = 40 + Math.floor(random() * 81);
        await pressKey(page, key, duration);

        if (index % 20 === 0) {
          context.lastActiveScenes = await activeScenes(page);
          if (context.lastActiveScenes.length === 0) {
            context.observations.push({
              kind: 'checkpoint',
              message: 'No active Phaser scene remained after input.',
              scenario,
              seed,
              actionIndex: index,
              activeScenes: [],
              attempt,
            });
          }
          await page.locator('canvas').waitFor({ state: 'visible', timeout: 5_000 });
        }
      }
    } else if (scenario === 'mobile-controls') {
      await reachSavedOverworld(page, baseUrl);
      await waitForMobileLayout(page, profile === 'mobile-landscape');
      context.lastActiveScenes = await activeScenes(page);
      await auditMobileLayout(page, context);
      await takeCheckpointScreenshot(page, output, context, 'controls');
      await dragMobileJoystick(page, profile === 'mobile-portrait' ? 'down' : 'right');
    } else {
      await reachSavedOverworld(page, baseUrl);
      await waitForMobileLayout(page, true);
      context.lastActiveScenes = await activeScenes(page);
      await auditMobileLayout(page, context);
      await takeCheckpointScreenshot(page, output, context, 'landscape');
      await page.setViewportSize({ width: 390, height: 844 });
      await waitForMobileLayout(page, false);
      await auditMobileLayout(page, context);
      await takeCheckpointScreenshot(page, output, context, 'portrait');
      await dragMobileJoystick(page, 'down');
      await page.setViewportSize({ width: 844, height: 390 });
      await waitForMobileLayout(page, true);
      await auditMobileLayout(page, context);
      await takeCheckpointScreenshot(page, output, context, 'landscape-restored');
    }
    context.lastActiveScenes = await activeScenes(page);
  } catch (error) {
    context.lastActiveScenes = await activeScenes(page).catch(() => []);
    context.observations.push({
      kind: 'scenario-failure',
      message: error instanceof Error ? error.message : String(error),
      scenario,
      profile,
      seed,
      actionIndex: context.actionIndex,
      activeScenes: context.lastActiveScenes,
      attempt,
    });
  }

  if (context.observations.length > 0) {
    const screenshot = await takeEvidenceScreenshot(page, output, context).catch(() => null);
    for (const observation of context.observations) observation.screenshot = screenshot;
  }
  await browserContext.close();
  return {
    scenario,
    profile,
    seed,
    attempt,
    activeScenes: context.lastActiveScenes,
    observations: context.observations,
    checkpoints: context.checkpoints,
  };
}

function loadVerificationFinding(path) {
  const parsed = JSON.parse(readFileSync(resolve(path), 'utf8'));
  const finding = parsed.finding ?? parsed;
  if (!finding.fingerprint || !finding.scenario) {
    throw new Error('--verify must point to a finding with fingerprint and scenario.');
  }
  return finding;
}

export async function runPlaytest(options) {
  const generatedAt = new Date().toISOString();
  const output = resolve(
    options.output ?? `temp/playtest-runs/${generatedAt.replaceAll(/[:.]/g, '-')}`,
  );
  mkdirSync(output, { recursive: true });

  const verificationFinding = options.verify ? loadVerificationFinding(options.verify) : null;
  const scenarios = verificationFinding ? [verificationFinding.scenario] : options.scenarios;
  const profiles = verificationFinding
    ? [verificationFinding.profile ?? 'desktop']
    : options.profiles;
  const seeds =
    verificationFinding && Number.isInteger(verificationFinding.seed)
      ? [verificationFinding.seed]
      : options.seeds;
  const actions = verificationFinding?.actions ?? options.actions;
  let browser = null;
  let serverChild = null;
  let cleanupPromise = null;
  const runs = [];
  const compatibleRunCount = scenarios.reduce(
    (total, scenario) =>
      total + SCENARIO_PROFILES[scenario].filter((profile) => profiles.includes(profile)).length,
    0,
  );
  if (compatibleRunCount === 0) {
    throw new Error('The selected scenario and profile combination has no compatible journey.');
  }
  const cleanup = () => {
    cleanupPromise ??= (async () => {
      try {
        await browser?.close();
      } finally {
        await stopServer(serverChild);
      }
    })();
    return cleanupPromise;
  };
  const handleSignal = (signal) => {
    void cleanup().finally(() => process.exit(exitCodeForSignal(signal)));
  };
  const onSigint = () => handleSignal('SIGINT');
  const onSigterm = () => handleSignal('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  try {
    const server = await startServer(options.baseUrl, (child) => {
      serverChild = child;
    });
    browser = await chromium.launch({ headless: options.headless });
    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      for (const scenario of scenarios) {
        const scenarioProfiles = SCENARIO_PROFILES[scenario].filter((profile) =>
          profiles.includes(profile),
        );
        for (const profile of scenarioProfiles) {
          const scenarioSeeds = scenario === 'overworld-fuzz' ? seeds : [seeds[0]];
          for (const seed of scenarioSeeds) {
            runs.push(
              await runScenario(
                browser,
                server.baseUrl,
                output,
                scenario,
                profile,
                seed,
                attempt,
                actions,
              ),
            );
          }
        }
      }
    }
  } finally {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);
    await cleanup();
  }

  const observations = runs.flatMap((run) => run.observations);
  const findings = aggregateFindings(observations, options.attempts, actions);
  const report = {
    generatedAt,
    options: {
      actions,
      attempts: options.attempts,
      seeds,
      scenarios,
      profiles,
      verify: verificationFinding?.id ?? null,
    },
    findings,
    runs,
  };
  writeFileSync(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(output, 'report.md'), formatMarkdownReport(report));
  writeFileSync(
    resolve(output, 'finding-summary.json'),
    `${JSON.stringify({ findings: findings.filter((finding) => finding.reproducible) }, null, 2)}\n`,
  );

  const verificationFailed = verificationFinding
    ? verificationHasFailed(verificationFinding, findings)
    : false;
  return { output, report, verificationFailed };
}

const isEntryPoint =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    const result = await runPlaytest(parseArguments(process.argv.slice(2)));
    console.log(`Playtest report: ${result.output}/report.md`);
    console.log(
      `${result.report.findings.filter((finding) => finding.reproducible).length} reproducible bug(s), ` +
        `${result.report.findings.filter((finding) => !finding.reproducible).length} intermittent observation(s).`,
    );
    if (result.verificationFailed) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
