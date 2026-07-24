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
 * Permissions for `copilot -p`.
 *
 * The first design used a fine-grained `--allow-tool` list. It failed in
 * practice: shell permission patterns match a command stem, but the agent
 * naturally writes `cd <dir> && npm run test 2>&1 | tail -20`, which matches
 * nothing. Every command was denied and the iteration accomplished nothing.
 *
 * So execution permission comes from `--allow-all-tools`, which GitHub
 * documents as required for programmatic use, and containment comes from
 * layers that do not depend on string matching:
 *
 * - `--available-tools` omits `web_fetch` and `task`, removing network access
 *   and subagent spawning at the tool level rather than the pattern level.
 * - `--allow-all-tools` deliberately does NOT include `--allow-all-paths`, so
 *   file path verification stays on and writes stay scoped to the worktree.
 * - `--deny-tool` still wins over every allow rule. Stem matching makes it
 *   unreliable against compound commands, so treat it as defense in depth.
 * - The repository hook matches anywhere in a command string, including
 *   compound forms, and is the robust command interceptor.
 * - The gate is the actual contract, and runs after the agent has exited.
 */
export const COPILOT_TOOL_FLAGS = [
  '--available-tools=bash,view,edit,create,apply_patch,grep,glob,skill',
  '--allow-all-tools',
  '--deny-tool=shell(git push)',
  '--deny-tool=shell(git reset)',
  '--deny-tool=shell(git clean)',
  '--deny-tool=shell(git worktree)',
  '--deny-tool=shell(rm)',
  '--deny-tool=shell(sudo)',
  '--deny-tool=shell(npm install)',
  '--deny-tool=shell(curl)',
  '--deny-tool=shell(wget)',
  '--deny-tool=shell(ssh)',
  '--disallow-temp-dir',
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

/**
 * Paths the driver reads from the checked-out tree rather than from the base
 * ref. Uncommitted edits here would mean the loop plans against one version of
 * the queue while each worktree receives another, so they must be committed.
 */
export const LOOP_CRITICAL_PATHS = ['.github/loop', 'scripts/loop'];

/**
 * Guard the loop's own inputs, not the whole tree. Worktrees are built from a
 * committed base ref, so unrelated work in progress elsewhere cannot leak into
 * an iteration and should not block a run.
 */
function assertLoopInputsCommitted() {
  const dirty = git(['status', '--porcelain', '--', ...LOOP_CRITICAL_PATHS]).trim();
  if (dirty) {
    throw new Error(
      `Commit the loop's own configuration before running it:\n${dirty}`,
    );
  }

  const elsewhere = git(['status', '--porcelain']).trim();
  if (elsewhere) {
    console.log('Note: uncommitted changes exist outside the loop configuration.');
    console.log('They are ignored; every worktree is built from the base ref.');
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
 * Rewrites one backlog row's state.
 *
 * The driver owns this file, not the agent. `.github/` is a protected path in
 * the gate, so an agent that edited its own queue would fail its own iteration.
 * More importantly, an agent able to edit its queue could quietly rewrite its
 * own priorities.
 */
export function markBacklogItem(markdown, id, state) {
  const row = new RegExp(`^(\\|\\s*${id}\\s*\\|\\s*)todo(\\s*\\|)`, 'm');
  return markdown.replace(row, `$1${state}$2`);
}

/** Reads the backlog item ID an iteration claimed from its commit subject. */
export function backlogItemFromSubject(subject) {
  return String(subject ?? '').match(/^([A-Z]+-\d+)\b/)?.[1] ?? null;
}

function recordCompletedItem(worktree, base) {
  const subject = git(['log', '-1', '--format=%s', `${base}..HEAD`], worktree).trim();
  const id = backlogItemFromSubject(subject);
  if (!id) return null;

  const path = resolve(REPOSITORY_ROOT, '.github/loop/backlog.md');
  writeFileSync(path, markBacklogItem(readFileSync(path, 'utf8'), id, 'done'));
  return id;
}

/**
 * Gitignored paths a worktree needs before any npm script can run.
 *
 * `node_modules` is required: without it nothing executes. `temp/scripts` is
 * optional because it holds the map toolchain that `.shadow/DEC-0007` anchors,
 * and repository plan item B4 moves it to `scripts/map-gen/`. Treating it as
 * optional keeps the loop working both before and after that move.
 *
 * Only `temp/scripts` is linked, never `temp/` itself: run artifacts live in
 * `temp/loop-runs/`, so linking the parent would nest a worktree inside itself.
 */
export const WORKTREE_LINKS = [
  { path: 'node_modules', required: true },
  { path: 'temp/scripts', required: false },
];

function linkUntrackedDependencies(worktree) {
  const linked = [];

  for (const { path, required } of WORKTREE_LINKS) {
    const source = resolve(REPOSITORY_ROOT, path);
    if (!existsSync(source)) {
      if (required) {
        throw new Error(`${path} is missing; the loop cannot produce a runnable worktree.`);
      }
      continue;
    }
    const target = resolve(worktree, path);
    if (existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(source, target, 'dir');
    linked.push(path);
  }

  return linked;
}

function runIteration({ index, runDirectory, options, prompt }) {
  const branch = `agent/iter-${Date.now()}-${index}`;
  const worktree = resolve(runDirectory, `worktree-${index}`);
  const logDirectory = resolve(runDirectory, `logs-${index}`);
  mkdirSync(logDirectory, { recursive: true });

  git(['worktree', 'add', '-b', branch, worktree, options.base]);
  linkUntrackedDependencies(worktree);

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
      const item = recordCompletedItem(worktree, options.base);
      console.log(`Iteration ${index}: gate passed, kept branch ${branch}.`);
      if (item) console.log(`Iteration ${index}: marked backlog item ${item} done.`);
      return { index, branch, status: 'passed', item };
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
  assertLoopInputsCommitted();
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
