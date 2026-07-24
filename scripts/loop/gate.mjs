#!/usr/bin/env node

/**
 * Deterministic gate for one improvement-loop iteration.
 *
 * Runs outside the agent process, after the agent has exited, against the
 * worktree it produced. The agent can never edit this file in a way that
 * affects its own grade: `scripts/` is a protected path, and the gate restores
 * protected paths from the base ref before running any check.
 *
 * Usage:
 *   node scripts/loop/gate.mjs --worktree <path> --base <ref> [--type impl|test]
 *                              [--report <path>] [--skip-build]
 *
 * Exits 0 when every blocker check passes, 1 otherwise.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

import { ITERATION_SCOPES, evaluateDiff } from './diff-hygiene.mjs';

const COMMAND_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_BUFFER_BYTES = 32 * 1024 * 1024;

export function parseArguments(argv) {
  const options = { type: 'impl', skipBuild: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--skip-build') options.skipBuild = true;
    else if (flag === '--worktree') options.worktree = argv[index += 1];
    else if (flag === '--base') options.base = argv[index += 1];
    else if (flag === '--type') options.type = argv[index += 1];
    else if (flag === '--report') options.report = argv[index += 1];
    else throw new Error(`Unknown gate argument: ${flag}`);
  }
  if (!options.worktree) throw new Error('Gate requires --worktree.');
  if (!options.base) throw new Error('Gate requires --base.');
  if (options.base === 'HEAD') {
    throw new Error('--base HEAD is ambiguous inside a worktree; pass a branch or SHA.');
  }
  if (!ITERATION_SCOPES[options.type]) throw new Error(`Unknown iteration type: ${options.type}`);
  return options;
}

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });
}

function tryRun(command, args, cwd) {
  try {
    return { ok: true, output: run(command, args, cwd) };
  } catch (error) {
    const output = [error?.stdout, error?.stderr, error?.message]
      .filter(Boolean)
      .join('\n');
    return { ok: false, output };
  }
}

function tail(text, lines = 40) {
  return String(text ?? '').split('\n').slice(-lines).join('\n');
}

function countTests(worktree) {
  const outputFile = resolve(tmpdir(), `pokemon-web-loop-vitest-${process.pid}.json`);
  const result = tryRun(
    'npm',
    ['run', 'test', '--', '--reporter=json', `--outputFile=${outputFile}`],
    worktree,
  );

  let total = null;
  let failed = null;
  try {
    const report = JSON.parse(readFileSync(outputFile, 'utf8'));
    total = report.numTotalTests ?? null;
    failed = report.numFailedTests ?? null;
  } catch {
    // A crashed run leaves no parseable report; the exit status still decides.
  } finally {
    rmSync(outputFile, { force: true });
  }

  return { ...result, total, failed };
}

export function runGate(options) {
  const { worktree, base, type, skipBuild } = options;
  const scope = ITERATION_SCOPES[type];
  const blockers = [];
  const checks = [];

  const range = `${base}..HEAD`;
  const paths = run('git', ['diff', '--name-only', range], worktree)
    .split('\n')
    .filter(Boolean);
  const diffText = run('git', ['diff', '--unified=0', range], worktree);
  const numstatText = run('git', ['diff', '--numstat', range], worktree);

  const diff = evaluateDiff({ paths, diffText, numstatText, iterationType: type });
  blockers.push(...diff.blockers);
  checks.push({
    name: 'diff-hygiene',
    passed: diff.blockers.length === 0,
    detail: diff.blockers.join('; ') || 'scope, suppressions, and size within limits',
  });

  // Defense in depth. Even if a path slipped past classification, the checks
  // below must run against a pristine copy of everything the agent may not own.
  run('git', ['checkout', base, '--', ...scope.restore], worktree);

  const tests = countTests(worktree);
  if (!tests.ok) blockers.push('npm run test failed');
  checks.push({
    name: 'npm run test',
    passed: tests.ok,
    detail: `total=${tests.total ?? 'unknown'} failed=${tests.failed ?? 'unknown'}`,
    output: tests.ok ? undefined : tail(tests.output),
  });

  if (!skipBuild) {
    const build = tryRun('npm', ['run', 'build'], worktree);
    if (!build.ok) blockers.push('npm run build failed');
    checks.push({
      name: 'npm run build',
      passed: build.ok,
      detail: build.ok ? 'type-check and bundle succeeded' : 'see output',
      output: build.ok ? undefined : tail(build.output),
    });

    // The build runs three asset generators before `tsc`, so it dirties tracked
    // files under frontend/public/assets/. Discard that churn so it can never
    // reach a commit or distort the next iteration's diff.
    tryRun('git', ['checkout', '--', 'frontend/public/assets'], worktree);
  }

  const changelogTouched = diff.allowed.includes('docs/CHANGELOG.md');
  if (!changelogTouched) blockers.push('docs/CHANGELOG.md was not updated');
  checks.push({
    name: 'changelog',
    passed: changelogTouched,
    detail: changelogTouched ? 'entry present' : 'required by AGENTS.md',
  });

  return {
    passed: blockers.length === 0,
    base,
    type,
    changedFiles: diff.allowed,
    violations: diff.violations,
    suppressions: diff.suppressions,
    size: diff.size,
    blockers,
    checks,
  };
}

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const report = runGate(options);

    if (options.report) {
      mkdirSync(dirname(resolve(options.report)), { recursive: true });
      writeFileSync(resolve(options.report), `${JSON.stringify(report, null, 2)}\n`);
    }

    for (const check of report.checks) {
      console.log(`${check.passed ? 'pass' : 'FAIL'}  ${check.name}: ${check.detail}`);
      if (check.output) console.log(check.output);
    }
    console.log(report.passed ? 'Gate passed.' : `Gate failed: ${report.blockers.join('; ')}`);
    process.exitCode = report.passed ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
