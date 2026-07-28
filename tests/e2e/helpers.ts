import { expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared helpers for Pokemon-Web Playwright E2E tests.
// ---------------------------------------------------------------------------

type PlaytestSnapshot = {
  activeScenes: string[];
  loadedScenes: string[];
  visibleScenes: string[];
  sceneText: Record<string, string[]>;
  interactiveObjects: Array<{
    scene: string;
    type: string;
    width: number;
    height: number;
    visible: boolean;
  }>;
  textObjects: Array<{
    scene: string;
    text: string;
    fontSize: number;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  }>;
  canvas: { width: number; height: number };
  shell?: {
    blockingOverlays: string[];
    shellPaused: boolean;
    rotatePromptVisible: boolean;
    iosInstallVisible: boolean;
    installBannerVisible: boolean;
  };
};

type PlayerStateSnapshot = {
  currentMap: string;
  playerPosition: { x: number; y: number; direction: string };
};

/** Press a key for a given duration (simulate holding it down). */
export async function pressKey(page: Page, key: string, duration = 200): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await nextAnimationFrame(page);
}

/** Wait one browser animation frame without relying on an arbitrary sleep. */
export async function nextAnimationFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
}

/** Tap a point expressed as a fraction of the rendered game canvas. */
export async function tapCanvasFraction(page: Page, xFraction: number, yFraction: number): Promise<void> {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Cannot tap canvas before it has a layout box');
  await page.touchscreen.tap(box.x + box.width * xFraction, box.y + box.height * yFraction);
  await nextAnimationFrame(page);
}

/** Wait for the Phaser `<canvas>` to appear and be visible. */
export async function waitForCanvas(page: Page, timeout = 15_000): Promise<void> {
  await page.locator('canvas').waitFor({ state: 'visible', timeout });
  await waitForPlaytestSnapshot(page, timeout);
  await page.waitForFunction(() => {
    const snapshot = (window as any).__pokemonPlaytest?.snapshot?.();
    return Boolean(snapshot?.canvas?.width && snapshot?.canvas?.height);
  }, undefined, { timeout });
}

/** Wait until the localhost playtest hook is registered by `main.ts`. */
export async function waitForPlaytestSnapshot(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(() => Boolean((window as any).__pokemonPlaytest?.snapshot), undefined, { timeout });
}

/** Read the deterministic playtest snapshot exposed by the app on localhost. */
export async function getPlaytestSnapshot(page: Page): Promise<PlaytestSnapshot> {
  await waitForPlaytestSnapshot(page);
  return page.evaluate(() => (window as any).__pokemonPlaytest.snapshot());
}

/** Format the current browser/game state for loud E2E helper failures. */
async function getPlaytestDiagnostics(page: Page): Promise<string> {
  try {
    const diagnostics = await page.evaluate(() => {
      const snapshot = (window as any).__pokemonPlaytest?.snapshot?.();
      const activeElement = document.activeElement;
      return {
        url: location.href,
        snapshot,
        dom: {
          activeElement:
            activeElement instanceof HTMLElement
              ? {
                tagName: activeElement.tagName,
                id: activeElement.id,
                name: activeElement.getAttribute('name'),
              }
              : null,
          introNameInputPresent: Boolean(document.querySelector('input[name="nickname-disabled"]')),
          canvasCount: document.querySelectorAll('canvas').length,
        },
      };
    });
    return JSON.stringify(diagnostics);
  } catch (error) {
    return `unable to read diagnostics: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function isOpeningCutsceneSceneActive(page: Page): Promise<boolean> {
  const snapshot = await getPlaytestSnapshot(page);
  return snapshot.activeScenes.includes('OverworldScene') || snapshot.activeScenes.includes('DialogueScene');
}

async function waitForOpeningCutsceneScene(page: Page, timeout: number): Promise<void> {
  await waitForPlaytestSnapshot(page, timeout);
  try {
    await page.waitForFunction(() => {
      const activeScenes = (window as any).__pokemonPlaytest.snapshot().activeScenes;
      return activeScenes.includes('OverworldScene') || activeScenes.includes('DialogueScene');
    }, undefined, { timeout });
  } catch (error) {
    await timeoutWithDiagnostics(page, 'Waiting for opening cutscene scene', timeout, error);
  }
}

async function timeoutWithDiagnostics(
  page: Page,
  step: string,
  timeout: number,
  cause?: unknown,
): Promise<never> {
  const details = await getPlaytestDiagnostics(page);
  const causeMessage = cause instanceof Error ? ` Cause: ${cause.message}` : '';
  throw new Error(`${step} did not complete within ${timeout}ms.${causeMessage} State: ${details}`);
}

/** Wait for a Phaser scene to become active. */
export async function waitForScene(page: Page, sceneName: string, timeout = 15_000): Promise<void> {
  await waitForPlaytestSnapshot(page, timeout);
  try {
    await page.waitForFunction(
      scene => (window as any).__pokemonPlaytest.snapshot().activeScenes.includes(scene),
      sceneName,
      { timeout },
    );
  } catch (error) {
    await timeoutWithDiagnostics(page, `Waiting for active scene "${sceneName}"`, timeout, error);
  }
}

/** Wait for a Phaser scene to no longer be active. */
export async function waitForSceneInactive(page: Page, sceneName: string, timeout = 15_000): Promise<void> {
  await waitForPlaytestSnapshot(page, timeout);
  try {
    await page.waitForFunction(
      scene => !(window as any).__pokemonPlaytest.snapshot().activeScenes.includes(scene),
      sceneName,
      { timeout },
    );
  } catch (error) {
    await timeoutWithDiagnostics(page, `Waiting for inactive scene "${sceneName}"`, timeout, error);
  }
}

/** Return whether a scene is active in the current playtest snapshot. */
export async function isSceneActive(page: Page, sceneName: string): Promise<boolean> {
  const snapshot = await getPlaytestSnapshot(page);
  return snapshot.activeScenes.includes(sceneName);
}

/** Assert the portrait rotate gate has the expected shell visibility. */
export async function waitForRotateGate(
  page: Page,
  visibility: 'visible' | 'hidden',
  timeout = 5_000,
): Promise<void> {
  const gate = page.locator('#rotate-prompt');
  await gate.waitFor({ state: 'attached', timeout });
  if (visibility === 'visible') {
    await expect(gate).toBeVisible({ timeout });
  } else {
    await expect(gate).toBeHidden({ timeout });
  }
}

/** Dismiss the rotate gate if it is visible, then wait until it cannot intercept input. */
export async function dismissRotateGate(page: Page, timeout = 5_000): Promise<void> {
  const gate = page.locator('#rotate-prompt');
  await gate.waitFor({ state: 'attached', timeout });
  if (await gate.isVisible().catch(() => false)) {
    await page.locator('#rotate-dismiss').tap({ timeout });
  }
  await waitForRotateGate(page, 'hidden', timeout);
}

/** Ensure each browser context starts from a save-free, non-dismissed shell. */
export async function installCleanStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.removeItem('pokemon-web-rotate-dismissed');
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: () => Promise.resolve(),
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });
}

/** Start with a valid save that resumes directly into Littoral/Pallet Town. */
export async function installOverworldSave(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.removeItem('pokemon-web-rotate-dismissed');
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: () => Promise.resolve(),
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: () => Promise.resolve(),
    });
    localStorage.setItem('pokemon-web-save', JSON.stringify({
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
      playerName: 'Ash',
      playerGender: 'boy',
      currentMap: 'pallet-town',
      playerPosition: { x: 12, y: 14, direction: 'down' },
      bag: [],
      money: 3000,
      trainerId: '12345',
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
    }));
  });
}

/** Boot through Continue into an already-playable overworld save. */
export async function bootSavedGameToOverworld(page: Page): Promise<void> {
  await installOverworldSave(page);
  await page.goto('/');
  await waitForCanvas(page);
  await waitForScene(page, 'TitleScene');
  await dismissRotateGate(page);
  await pressKey(page, 'Enter', 75);
  await pressKey(page, 'Enter', 75);
  await waitForScene(page, 'OverworldScene', 30_000);
  await waitForRotateGate(page, 'hidden');
}

/** Read player state through the same Vite module singleton the game uses. */
export async function getPlayerState(page: Page): Promise<PlayerStateSnapshot> {
  return page.evaluate(async () => {
    const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
    const { GameManager } = await import(modulePath);
    const gm = GameManager.getInstance();
    return {
      currentMap: gm.getCurrentMap(),
      playerPosition: gm.getPlayerPosition(),
    };
  });
}

/** Read a GameManager flag from the browser-side singleton. */
export async function getGameFlag(page: Page, flag: string): Promise<boolean> {
  return page.evaluate(async flagName => {
    const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
    const { GameManager } = await import(modulePath);
    return GameManager.getInstance().getFlag(flagName);
  }, flag);
}

async function getPlayerName(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
    const { GameManager } = await import(modulePath);
    return GameManager.getInstance().getPlayerName();
  });
}

async function fillIntroNameIfAvailable(page: Page, playerName: string): Promise<void> {
  const filledDomInput = await page.evaluate(name => {
    const input = document.querySelector<HTMLInputElement>('input[name="nickname-disabled"]');
    if (!input) return false;
    input.focus();
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, playerName);

  if (!filledDomInput) {
    for (let i = 0; i < playerName.length + 10; i++) {
      await page.keyboard.press('Backspace');
    }
    await page.keyboard.type(playerName, { delay: 10 });
  }
}

async function hasIntroNameInput(page: Page): Promise<boolean> {
  return page.evaluate(() => Boolean(document.querySelector('input[name="nickname-disabled"]')));
}

async function driveUntil(
  page: Page,
  step: string,
  isDone: () => Promise<boolean>,
  action: (attempt: number) => Promise<void>,
  options: { timeout?: number; maxAttempts?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 15_000;
  const maxAttempts = options.maxAttempts ?? 80;
  const startedAt = Date.now();
  let attempts = 0;

  while (Date.now() - startedAt < timeout && attempts < maxAttempts) {
    if (await isDone()) return;
    await action(attempts);
    attempts += 1;
    await nextAnimationFrame(page);
    if (await isDone()) return;
  }

  await timeoutWithDiagnostics(
    page,
    `${step} after ${attempts} attempts`,
    Math.min(timeout, Date.now() - startedAt),
  );
}

/** Advance the automatic opening cutscene until the overworld is playable. */
export async function completeOpeningCutscene(page: Page): Promise<void> {
  await waitForOpeningCutsceneScene(page, 30_000);

  for (let i = 0; i < 20; i++) {
    const cutsceneDone = await getGameFlag(page, 'game_started');
    const dialogueActive = await isSceneActive(page, 'DialogueScene');
    if (cutsceneDone && !dialogueActive) {
      break;
    }
    await pressKey(page, 'Enter', 100);
    await nextAnimationFrame(page);
  }

  try {
    await page.waitForFunction(async () => {
      const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
      const { GameManager } = await import(modulePath);
      const activeScenes = (window as any).__pokemonPlaytest.snapshot().activeScenes;
      return GameManager.getInstance().getFlag('game_started') && !activeScenes.includes('DialogueScene');
    }, undefined, { timeout: 20_000 });
  } catch (error) {
    await timeoutWithDiagnostics(page, 'Completing opening cutscene', 20_000, error);
  }
}

/**
 * Navigate to the app, wait for the canvas, and dismiss the initial title
 * prompt so the title menu is visible.
 */
export async function bootToTitleMenu(
  page: Page,
  options: { cleanStorage?: boolean; dismissShellOverlays?: boolean } = {},
): Promise<void> {
  const { cleanStorage = true, dismissShellOverlays = true } = options;
  if (cleanStorage) {
    await installCleanStorage(page);
  }
  await page.goto('/');
  await waitForCanvas(page);
  await waitForScene(page, 'TitleScene');
  if (dismissShellOverlays) {
    await dismissRotateGate(page);
  }
  // Dismiss the initial title prompt.
  await pressKey(page, 'Enter', 75);
  await waitForScene(page, 'TitleScene');
}

/**
 * From the title menu, select "New Game" and choose Classic difficulty.
 * Returns once the IntroScene has started.
 */
export async function startNewGame(page: Page): Promise<void> {
  // "New Game" is the first (and only) option when there is no save.
  await pressKey(page, 'Enter', 75);
  // Classic difficulty is pre-selected — confirm it.
  await pressKey(page, 'Enter', 75);
  // Challenge modes are optional; begin immediately with none selected.
  await pressKey(page, 'Enter', 75);
  await waitForScene(page, 'IntroScene', 15_000);
}

/**
 * Skip through the IntroScene slides, type a player name, select an
 * appearance, and confirm — arriving at the opening overworld cutscene.
 */
export async function skipIntro(page: Page, playerName = 'Ash'): Promise<void> {
  await waitForScene(page, 'IntroScene', 15_000);

  await driveUntil(
    page,
    'Reaching intro name entry',
    async () => await hasIntroNameInput(page),
    async () => {
      await pressKey(page, 'Enter', 75);
    },
    { timeout: 25_000, maxAttempts: 120 },
  );
  await driveUntil(
    page,
    `Confirming intro player name "${playerName}"`,
    async () => await getPlayerName(page) === playerName,
    async () => {
      await fillIntroNameIfAvailable(page, playerName);
      await pressKey(page, 'Enter', 75);
    },
    { timeout: 5_000, maxAttempts: 20 },
  );

  await driveUntil(
    page,
    'Confirming intro appearance and final prompt',
    async () => await isOpeningCutsceneSceneActive(page),
    async () => {
      await pressKey(page, 'Enter', 75);
    },
    { timeout: 20_000, maxAttempts: 120 },
  );
  await waitForOpeningCutsceneScene(page, 5_000);
}

/**
 * Select the first starter Pokemon (Bulbasaur) and wait for the
 * OverworldScene to load.
 */
export async function selectStarter(page: Page): Promise<void> {
  await completeOpeningCutscene(page);
  if (!await isSceneActive(page, 'StarterSelectScene')) {
    return;
  }

  // StarterSelectScene: first card is already highlighted.
  await pressKey(page, 'Enter', 100);
  // Confirmation prompt — press Enter again.
  await pressKey(page, 'Enter', 100);
  await completeOpeningCutscene(page);
  try {
    await page.waitForFunction(async () => {
      const modulePath = `${location.origin}/Pokemon-Web/src/managers/GameManager.ts`;
      const { GameManager } = await import(modulePath);
      return GameManager.getInstance().getCurrentMap() === 'pallet-town';
    }, undefined, { timeout: 10_000 });
  } catch (error) {
    await timeoutWithDiagnostics(page, 'Waiting for starter selection to return to Pallet Town', 10_000, error);
  }
}
