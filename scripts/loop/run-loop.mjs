#!/usr/bin/env node

/**
 * Bounded driver for the improvement loop.
 *
 * Each iteration gets a fresh git worktree, a fresh branch, and a fresh agent
 * process. Nothing runs on the checked-out branch, nothing is merged, and
 * nothing is pushed. A passing iteration leaves a branch for human review; a
 * failing iteration is discarded with its reason recorded.
 *
 * Usage:
 *   node scripts/loop/run-loop.mjs [--iterations 3] [--base main] [--type impl]
 *                                  [--dry-run] [--deadline-minutes 240]
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const AGENT_TIMEOUT_MS = 20 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

const DEFAULTS = {
  iterations: 3,
  base: 'main',
  type: 'impl',
  deadlineMinutes: 240,
  maxCredits: 400,
  dryRun: false,
};

/**
 * Least-privilege permissions for `copilot -p`.
 *
 * `--available-tools` omits `web_fetch` and `task`, which removes network
 * access and subagent spawning. `--deny-tool` wins over every allow rule, so
 * the deny list is the durable rail even if an allow pattern is too broad.
 */
export const COPILOT_TOOL_FLAGS = [
  '--available-tools=bash,view,edit,create,apply_patch,grep,glob,skill',
  '--allow-tool=shell(npm run test)',
  '--allow-tool=shell(npm run test:unit)',
  '--allow-tool=shell(npm run build)',
  '--allow-tool=shell(git status)',
  '--allow-tool=shell(git diff)',
  '--allow-tool=shell(git add)',
  '--allow-tool=shell(git commit)',
  '--allow-tool=shell(git log)',
  '--allow-tool=write',
  '--deny-tool=shell(git push)',
  '--deny-tool=shell(git reset)',
  '--deny-tool=shell(git clean)',
  '--deny-tool=shell(git worktree)',
  '--deny-tool=shell(rm)',
  '--deny-tool=shell(npm install)',
  '--deny-tool=shell(npx)',
  '--deny-tool=shell(curl)',
  '--deny-tool=shell(wget)',
  '--no-ask-user',
];

export function parseArguments(argv) {
  const options = { ...DEFAULTS };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--dry-run') options.dryRun = true;
    else if (flag === '--iterations') options.iterations = Number(argv[index += 1]);
    else if (flag === '--base') options.base = argv[index += 1];
    else if (flag === '--type') options.type = argv[index += 1];
    else if (flag === '--deadline-minutes') options.deadlineMinutes = Number(argv[index += 1]);
    else if (flag === '--max-credits') options.maxCredits = Number(argv[index += 1]);
    else throw new Error(`Unknown loop argument: ${flag}`);
  }
  if (!Number.isInteger(options.iterations) || options.iterations < 1 || options.iterations > 50) {
    throw new Error('--iterations must be an integer between 1 and 50.');
  }
  return options;
}

/**
 * Builds the full `copilot` argument vector for one iteration.
 * Exported so the flag set can be asserted without spending AI credits.
 */
export function buildCopilotArguments({ worktree, prompt, logDirectory, maxCredits }) {
  return [
    '-C', worktree,
    '-p', prompt,
    ...COPILOT_TOOL_FLAGS,
    '--output-format=json',
    '--log-dir', logDirectory,
    '--max-ai-credits', String(maxCredits),
  ];
}

function git(args, cwd = REPOSITORY_ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function assertCleanTree() {
  if (git(['status', '--porcelain']).trim()) {
    throw new Error('Working tree is dirty. Commit or stash before running the loop.');
  }
}

function readPrompt(type) {
  const path = resolve(REPOSITORY_ROOT, `.github/loop/PROMPT.${type}.md`);
  if (!existsSync(path)) throw new Error(`Missing prompt file: ${path}`);
  return readFileSync(path, 'utf8');
}

function hasPendingWork() {
  const backlog = resolve(REPOSITORY_ROOT, '.github/loop/backlog.md');
  return existsSync(backlog) && /\|\s*todo\s*\|/.test(readFileSync(backlog, 'utf8'));
}

/**
 * A fresh worktree has no `node_modules`, so `npm run test` and `npm run build`
 * would both fail there. Symlink the repository's install rather than paying for
 * an `npm ci` per iteration. The link is relative to the worktree and is removed
 * with it.
 */
function linkDependencies(worktree) {
  const source = resolve(REPOSITORY_ROOT, 'node_modules');
  if (!existsSync(source)) {
    throw new Error('node_modules is missing. Run npm install before the loop.');
  }
  symlinkSync(source, resolve(worktree, 'node_modules'), 'dir');
}

function runIteration({ index, runDirectory, options, prompt }) {
  const branch = `agent/iter-${Date.now()}-${index}`;
  const worktree = resolve(runDirectory, `worktree-${index}`);
  const logDirectory = resolve(runDirectory, `logs-${index}`);
  mkdirSync(logDirectory, { recursive: true });

  git(['worktree', 'add', '-b', branch, worktree, options.base]);
  linkDependencies(worktree);

  try {
    // The repository guardrail hook is gated behind an opt-in in prompt mode.
    // Without this the git push and git add -A blocks silently do not load.
    const environment = {
      ...process.env,
      GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS: 'true',
      COPILOT_TASK_WAIT_TIMEOUT_SECONDS: '120',
    };
    const copilotArguments = buildCopilotArguments({
      worktree,
      prompt,
      logDirectory,
      maxCredits: options.maxCredits,
    });

    if (options.dryRun) {
      writeFileSync(
        resolve(runDirectory, `iter-${index}-dry-run.json`),
        `${JSON.stringify({ branch, worktree, copilotArguments }, null, 2)}\n`,
      );
      console.log(`Iteration ${index}: dry run, agent not invoked.`);
      return { index, branch, status: 'dry-run' };
    }

    const agent = spawnSync(process.env.COPILOT_BIN ?? 'copilot', copilotArguments, {
      cwd: worktree,
      env: environment,
      encoding: 'utf8',
      timeout: AGENT_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(resolve(runDirectory, `iter-${index}.jsonl`), agent.stdout ?? '');
    if (agent.error) throw agent.error;

    const gate = spawnSync(process.execPath, [
      resolve(REPOSITORY_ROOT, 'scripts/loop/gate.mjs'),
      '--worktree', worktree,
      '--base', options.base,
      '--type', options.type,
      '--report', resolve(runDirectory, `iter-${index}-gate.json`),
    ], { cwd: REPOSITORY_ROOT, encoding: 'utf8', stdio: 'inherit' });

    if (gate.status === 0) {
      console.log(`Iteration ${index}: gate passed, kept branch ${branch}.`);
      return { index, branch, status: 'passed' };
    }

    console.log(`Iteration ${index}: gate failed, discarding ${branch}.`);
    return { index, branch, status: 'failed' };
  } finally {
    const kept = existsSync(resolve(runDirectory, `iter-${index}-gate.json`));
    git(['worktree', 'remove', '--force', worktree]);
    if (!kept) git(['branch', '-D', branch]);
  }
}

export function runLoop(options) {
  assertCleanTree();
  const prompt = readPrompt(options.type);
  // Pin the base to an immutable SHA. A symbolic ref would resolve against each
  // worktree's own HEAD, which makes the authored diff come out empty.
  const base = git(['rev-parse', options.base]).trim();
  const runDirectory = resolve(REPOSITORY_ROOT, 'temp/loop-runs', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(runDirectory, { recursive: true });

  const deadline = Date.now() + options.deadlineMinutes * 60 * 1000;
  const results = [];
  let consecutiveFailures = 0;

  for (let index = 1; index <= options.iterations; index += 1) {
    if (Date.now() > deadline) {
      console.log('Run deadline reached; stopping.');
      break;
    }
    if (!hasPendingWork()) {
      console.log('No todo items remain in the backlog; stopping.');
      break;
    }

    const result = runIteration({ index, runDirectory, options: { ...options, base }, prompt });
    results.push(result);

    consecutiveFailures = result.status === 'failed' ? consecutiveFailures + 1 : 0;
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`Stopping after ${MAX_CONSECUTIVE_FAILURES} consecutive gate failures.`);
      break;
    }
  }

  writeFileSync(
    resolve(runDirectory, 'summary.json'),
    `${JSON.stringify({ options: { ...options, base }, results }, null, 2)}\n`,
  );
  console.log(`Run summary: ${runDirectory}/summary.json`);
  return { runDirectory, results };
}

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    runLoop(parseArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
