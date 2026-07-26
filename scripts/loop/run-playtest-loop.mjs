#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { prepareWorktreeDependencies } from './dependencies.mjs';
import { registerInterruptCleanup } from './interrupt-cleanup.mjs';
import {
  assertLoopInputsCommitted,
  parseArguments as parseLoopArguments,
  runLoop,
} from './run-loop.mjs';
import { selectRepairCandidate } from '../playtest/discover.mjs';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function git(args) {
  return execFileSync('git', args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

export function discoveryWorktreePath(runId, cycle) {
  return resolve(tmpdir(), `pokemon-web-playtest-${runId}-${cycle}`);
}

async function discoverAgainstBase({ base, output, actions, runId, cycle }) {
  const worktree = discoveryWorktreePath(runId, cycle);
  const baseSha = git(['rev-parse', base]).trim();
  git(['worktree', 'add', '--detach', worktree, baseSha]);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    git(['worktree', 'remove', '--force', worktree]);
  };
  const unregisterCleanup = registerInterruptCleanup(cleanup);

  try {
    prepareWorktreeDependencies(worktree);
    execFileSync(
      process.execPath,
      ['scripts/playtest/discover.mjs', '--actions', String(actions), '--output', output],
      {
        cwd: worktree,
        encoding: 'utf8',
        stdio: 'inherit',
        timeout: 30 * 60 * 1000,
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    return {
      output,
      report: JSON.parse(readFileSync(resolve(output, 'report.json'), 'utf8')),
    };
  } finally {
    unregisterCleanup();
    cleanup();
  }
}

export function parseArguments(argv) {
  const options = {
    cycles: 3,
    base: 'develop',
    actions: 120,
    maxCredits: 400,
    deadlineMinutes: 240,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--dry-run') options.dryRun = true;
    else if (flag === '--cycles') options.cycles = Number(argv[(index += 1)]);
    else if (flag === '--base') options.base = argv[(index += 1)];
    else if (flag === '--actions') options.actions = Number(argv[(index += 1)]);
    else if (flag === '--max-credits') options.maxCredits = Number(argv[(index += 1)]);
    else if (flag === '--deadline-minutes') options.deadlineMinutes = Number(argv[(index += 1)]);
    else throw new Error(`Unknown playtest loop argument: ${flag}`);
  }

  if (!Number.isInteger(options.cycles) || options.cycles < 1 || options.cycles > 20) {
    throw new Error('--cycles must be an integer between 1 and 20.');
  }
  if (!Number.isInteger(options.actions) || options.actions < 1 || options.actions > 2000) {
    throw new Error('--actions must be an integer between 1 and 2000.');
  }
  return options;
}

export async function runPlaytestLoop(options) {
  assertLoopInputsCommitted();
  const startedAt = new Date().toISOString();
  const runDirectory = resolve(
    REPOSITORY_ROOT,
    'temp/playtest-loop-runs',
    startedAt.replaceAll(/[:.]/g, '-'),
  );
  mkdirSync(runDirectory, { recursive: true });
  const runId = basename(runDirectory);

  const deadline = Date.now() + options.deadlineMinutes * 60 * 1000;
  const blockedIds = new Set();
  const results = [];

  for (let cycle = 1; cycle <= options.cycles; cycle += 1) {
    if (Date.now() > deadline) {
      results.push({ cycle, status: 'deadline-reached' });
      break;
    }

    const discovery = await discoverAgainstBase({
      base: options.base,
      output: resolve(runDirectory, `discovery-${cycle}`),
      actions: options.actions,
      runId,
      cycle,
    });
    const finding = selectRepairCandidate(discovery.report, blockedIds);

    if (!finding) {
      results.push({
        cycle,
        status: discovery.report.findings.length === 0 ? 'clean' : 'no-repairable-findings',
        report: `${discovery.output}/report.md`,
      });
      break;
    }

    const findingFile = resolve(runDirectory, `finding-${cycle}.json`);
    writeFileSync(
      findingFile,
      `${JSON.stringify(
        {
          finding: {
            ...finding,
            actions: options.actions,
            baselineFingerprints: discovery.report.findings
              .filter(
                (candidate) =>
                  candidate.scenario === finding.scenario && candidate.profile === finding.profile,
              )
              .map((candidate) => candidate.fingerprint),
          },
        },
        null,
        2,
      )}\n`,
    );

    const loopArgs = [
      '--iterations',
      '1',
      '--base',
      options.base,
      '--max-credits',
      String(options.maxCredits),
      '--deadline-minutes',
      String(options.deadlineMinutes),
      '--finding-file',
      findingFile,
      ...(options.dryRun ? ['--dry-run'] : []),
    ];
    const repair = runLoop(parseLoopArguments(loopArgs));
    const iteration = repair.results[0];
    results.push({
      cycle,
      finding: finding.id,
      status: iteration?.status ?? 'not-run',
      merged: iteration?.merged ?? false,
      discoveryReport: `${discovery.output}/report.md`,
      loopSummary: `${repair.runDirectory}/summary.json`,
    });

    if (iteration?.status !== 'passed' || !iteration.merged) {
      blockedIds.add(finding.id);
      if (iteration?.status === 'dry-run') break;
    }
  }

  const summary = { startedAt, options, results };
  writeFileSync(resolve(runDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Playtest loop summary: ${runDirectory}/summary.json`);
  return { runDirectory, results };
}

const isEntryPoint =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    await runPlaytestLoop(parseArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
