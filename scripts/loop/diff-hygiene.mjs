#!/usr/bin/env node

/**
 * Pure diff-inspection helpers for the improvement loop gate.
 *
 * Nothing here touches the filesystem, git, or the network. The gate runner
 * feeds it raw `git diff` output so every rule stays unit-testable and the
 * agent under test can never influence the outcome by editing this module:
 * the gate restores `scripts/**` from the base ref before evaluating.
 */

/** Suppressions an agent adds to silence a gate rather than satisfy it. */
export const SUPPRESSION_RULES = [
  { id: 'ts-ignore', pattern: /@ts-ignore/ },
  { id: 'ts-expect-error', pattern: /@ts-expect-error/ },
  { id: 'ts-nocheck', pattern: /@ts-nocheck/ },
  { id: 'eslint-disable', pattern: /eslint-disable/ },
  { id: 'cast-any', pattern: /\bas\s+any\b/ },
  { id: 'cast-unknown', pattern: /\bas\s+unknown\s+as\b/ },
  { id: 'skipped-test', pattern: /\b(?:describe|it|test|suite)\s*\.\s*skip\s*\(/ },
  { id: 'focused-test', pattern: /\b(?:describe|it|test|suite)\s*\.\s*only\s*\(/ },
  { id: 'todo-test', pattern: /\b(?:it|test)\s*\.\s*todo\s*\(/ },
  { id: 'legacy-skipped-test', pattern: /\b(?:xit|xdescribe)\s*\(/ },
];

/** Paths no iteration type may ever change. */
export const PROTECTED_PATHS = [
  '.github/',
  '.shadow/',
  'scripts/',
  'package.json',
  'package-lock.json',
  'frontend/tsconfig.json',
  'frontend/vite.config.ts',
  'frontend/public/assets/',
  'tests/vitest.config.ts',
  'tests/e2e/playwright.config.ts',
];

/**
 * Paths excluded from size accounting because `npm run build` rewrites them.
 * The three asset generators run before `tsc`, so a build alone dirties them.
 */
export const GENERATED_PATHS = ['frontend/public/assets/', 'package-lock.json'];

export const ITERATION_SCOPES = {
  impl: {
    allow: ['frontend/src/', 'docs/CHANGELOG.md'],
    // Map grids are positional strings that only `npm run map:validate`
    // checks, and that command is absent from both `test` and `build`.
    deny: ['frontend/src/data/maps/', 'tests/'],
    restore: ['tests', 'frontend/tsconfig.json', 'frontend/vite.config.ts'],
  },
  test: {
    allow: ['tests/unit/', 'tests/integration/', 'docs/CHANGELOG.md'],
    deny: ['frontend/'],
    restore: ['frontend/src'],
  },
};

export const DEFAULT_LIMITS = { maxFiles: 12, maxLines: 400 };

function hasPrefix(path, prefixes) {
  return prefixes.some((prefix) => (prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix));
}

/**
 * Walks unified diff text and reports suppressions introduced by added lines.
 * Removed lines are ignored: deleting an existing `@ts-ignore` is a good thing.
 *
 * @param {string} diffText Output of `git diff --unified=0`.
 * @returns {{file: string, rule: string, text: string}[]}
 */
export function findSuppressions(diffText) {
  const findings = [];
  let file = 'unknown';

  for (const line of String(diffText).split('\n')) {
    const renamed = line.match(/^\+\+\+ b\/(.+)$/);
    if (renamed) {
      file = renamed[1];
      continue;
    }
    if (!line.startsWith('+') || line.startsWith('+++')) continue;

    const added = line.slice(1);
    for (const { id, pattern } of SUPPRESSION_RULES) {
      if (pattern.test(added)) findings.push({ file, rule: id, text: added.trim() });
    }
  }

  return findings;
}

/**
 * Splits changed paths into allowed, denied, and protected buckets.
 *
 * @param {string[]} paths Output of `git diff --name-only`.
 * @param {'impl'|'test'} iterationType
 */
export function classifyPaths(paths, iterationType) {
  const scope = ITERATION_SCOPES[iterationType];
  if (!scope) throw new Error(`Unknown iteration type: ${iterationType}`);

  const allowed = [];
  const violations = [];

  for (const path of paths) {
    if (hasPrefix(path, PROTECTED_PATHS)) {
      violations.push({ path, reason: 'protected' });
    } else if (hasPrefix(path, scope.deny)) {
      violations.push({ path, reason: 'out-of-scope' });
    } else if (hasPrefix(path, scope.allow)) {
      allowed.push(path);
    } else {
      violations.push({ path, reason: 'unlisted' });
    }
  }

  return { allowed, violations };
}

/**
 * Totals a `git diff --numstat` report, ignoring build-generated paths.
 *
 * @param {string} numstatText
 */
export function measureDiff(numstatText) {
  let files = 0;
  let lines = 0;

  for (const row of String(numstatText).split('\n')) {
    if (!row.trim()) continue;
    const [insertions, deletions, path] = row.split('\t');
    if (!path || hasPrefix(path, GENERATED_PATHS)) continue;
    files += 1;
    lines += Number.parseInt(insertions, 10) || 0;
    lines += Number.parseInt(deletions, 10) || 0;
  }

  return { files, lines };
}

/**
 * Runs every pure check and returns a blocker list. An empty list means pass.
 *
 * @param {{paths: string[], diffText: string, numstatText: string,
 *          iterationType: 'impl'|'test', limits?: {maxFiles: number, maxLines: number}}} input
 */
export function evaluateDiff({ paths, diffText, numstatText, iterationType, limits = DEFAULT_LIMITS }) {
  const { allowed, violations } = classifyPaths(paths, iterationType);
  const suppressions = findSuppressions(diffText);
  const size = measureDiff(numstatText);
  const blockers = [];

  for (const { path, reason } of violations) {
    blockers.push(`${reason} path changed: ${path}`);
  }
  for (const { file, rule, text } of suppressions) {
    blockers.push(`suppression ${rule} added in ${file}: ${text}`);
  }
  if (size.files > limits.maxFiles) {
    blockers.push(`diff touches ${size.files} files, limit is ${limits.maxFiles}`);
  }
  if (size.lines > limits.maxLines) {
    blockers.push(`diff changes ${size.lines} lines, limit is ${limits.maxLines}`);
  }
  if (allowed.length === 0) {
    blockers.push('no in-scope files changed');
  }

  return { blockers, allowed, violations, suppressions, size };
}
