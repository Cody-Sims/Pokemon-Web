import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMITS,
  classifyPaths,
  evaluateDiff,
  findSuppressions,
  measureDiff,
} from '../../../scripts/loop/diff-hygiene.mjs';
import {
  GATE_PROTECTED_RESTORE_PATHS,
  ignoredPathsFromStatus,
  parseArguments as parseGateArguments,
} from '../../../scripts/loop/gate.mjs';
import {
  COPILOT_TOOL_FLAGS,
  LOOP_CRITICAL_PATHS,
  WORKTREE_DEPENDENCIES,
  backlogItemFromSubject,
  buildCopilotArguments,
  buildFindingPrompt,
  worktreePathForIteration,
  markBacklogItem,
  parseArguments as parseLoopArguments,
} from '../../../scripts/loop/run-loop.mjs';

function diffWith(file: string, addedLines: string[]): string {
  return [
    `--- a/${file}`,
    `+++ b/${file}`,
    '@@ -1,0 +1,1 @@',
    ...addedLines.map((line) => `+${line}`),
  ].join('\n');
}

describe('loop diff hygiene', () => {
  it.each([
    ['// @ts-ignore', 'ts-ignore'],
    ['// @ts-expect-error suppressing', 'ts-expect-error'],
    ['/* eslint-disable no-console */', 'eslint-disable'],
    ['const value = payload as any;', 'cast-any'],
    ['const value = payload as unknown as Foo;', 'cast-unknown'],
    ["  it.skip('is broken', () => {", 'skipped-test'],
    ["  describe.only('focus', () => {", 'focused-test'],
    ["  test.todo('later');", 'todo-test'],
    ["  xit('legacy skip', () => {", 'legacy-skipped-test'],
  ])('flags %s as a suppression', (line, rule) => {
    const findings = findSuppressions(diffWith('frontend/src/managers/GameManager.ts', [line]));
    expect(findings.map((finding) => finding.rule)).toContain(rule);
  });

  it('ignores suppressions that are being removed rather than added', () => {
    const diff = [
      '--- a/frontend/src/utils/constants.ts',
      '+++ b/frontend/src/utils/constants.ts',
      '@@ -1,1 +1,0 @@',
      '-// @ts-ignore',
    ].join('\n');
    expect(findSuppressions(diff)).toEqual([]);
  });

  it.each([
    '.github/workflows/ci.yml',
    'scripts/loop/gate.mjs',
    'frontend/tsconfig.json',
    'package.json',
    'tests/vitest.config.ts',
    'frontend/public/assets/asset-manifest.json',
  ])('treats %s as protected for every iteration type', (path) => {
    expect(classifyPaths([path], 'impl').violations[0]).toMatchObject({
      path,
      reason: 'protected',
    });
    expect(classifyPaths([path], 'test').violations[0]).toMatchObject({
      path,
      reason: 'protected',
    });
  });

  it('refuses test edits during an implementation iteration', () => {
    const { violations } = classifyPaths(['tests/unit/battle/damage.test.ts'], 'impl');
    expect(violations[0]).toMatchObject({ reason: 'out-of-scope' });
  });

  it('rejects map grid edits because neither test nor build validates them', () => {
    const { violations } = classifyPaths(['frontend/src/data/maps/routes/route-1.ts'], 'impl');
    expect(violations[0]).toMatchObject({ reason: 'out-of-scope' });
  });

  it('allows in-scope source and changelog edits', () => {
    const { allowed, violations } = classifyPaths(
      ['frontend/src/managers/EventManager.ts', 'docs/CHANGELOG.md'],
      'impl',
    );
    expect(allowed).toHaveLength(2);
    expect(violations).toEqual([]);
  });

  it('inverts ownership for a test iteration', () => {
    expect(classifyPaths(['tests/unit/battle/tower.test.ts'], 'test').violations).toEqual([]);
    expect(
      classifyPaths(['frontend/src/managers/GameManager.ts'], 'test').violations[0],
    ).toMatchObject({
      reason: 'out-of-scope',
    });
  });

  it('excludes build-generated paths from size accounting', () => {
    const numstat = [
      '4000\t0\tfrontend/public/assets/asset-manifest.json',
      '10\t2\tfrontend/src/utils/constants.ts',
    ].join('\n');
    expect(measureDiff(numstat)).toEqual({ files: 1, lines: 12 });
  });

  it('blocks an oversized diff', () => {
    const numstat = Array.from(
      { length: DEFAULT_LIMITS.maxFiles + 1 },
      (_unused, index) => `5\t5\tfrontend/src/file-${index}.ts`,
    ).join('\n');
    const result = evaluateDiff({
      paths: ['frontend/src/file-0.ts', 'docs/CHANGELOG.md'],
      diffText: '',
      numstatText: numstat,
      iterationType: 'impl',
    });
    expect(result.blockers.some((blocker) => blocker.includes('files'))).toBe(true);
  });

  it('passes a clean, in-scope, appropriately sized change', () => {
    const result = evaluateDiff({
      paths: ['frontend/src/utils/constants.ts', 'docs/CHANGELOG.md'],
      diffText: diffWith('frontend/src/utils/constants.ts', ['export const TILE_SIZE = 16;']),
      numstatText: '3\t1\tfrontend/src/utils/constants.ts\n2\t0\tdocs/CHANGELOG.md',
      iterationType: 'impl',
    });
    expect(result.blockers).toEqual([]);
  });

  it('blocks a change that touches nothing in scope', () => {
    const result = evaluateDiff({
      paths: [],
      diffText: '',
      numstatText: '',
      iterationType: 'impl',
    });
    expect(result.blockers).toContain('no in-scope files changed');
  });
});

describe('loop gate arguments', () => {
  it('requires a worktree and a base ref', () => {
    expect(() => parseGateArguments(['--base', 'main'])).toThrow(/worktree/);
    expect(() => parseGateArguments(['--worktree', '/tmp/wt'])).toThrow(/base/);
  });

  it('rejects an unknown iteration type', () => {
    expect(() =>
      parseGateArguments(['--worktree', '/tmp/wt', '--base', 'main', '--type', 'yolo']),
    ).toThrow(/Unknown iteration type/);
  });

  it('rejects HEAD as a base because it self-resolves inside a worktree', () => {
    expect(() => parseGateArguments(['--worktree', '/tmp/wt', '--base', 'HEAD'])).toThrow(
      /ambiguous/,
    );
  });

  it('accepts a playtest finding for post-fix verification', () => {
    expect(
      parseGateArguments([
        '--worktree',
        '/tmp/wt',
        '--base',
        'main',
        '--playtest-case',
        '/tmp/finding.json',
      ]),
    ).toMatchObject({ playtestCase: '/tmp/finding.json' });
  });

  it('restores every protected workflow input before executing checks', () => {
    expect(GATE_PROTECTED_RESTORE_PATHS).toEqual(
      expect.arrayContaining(['.github', 'scripts', 'package.json', 'frontend/public/assets']),
    );
  });

  it('parses ignored artifacts for removal before verification', () => {
    expect(ignoredPathsFromStatus('!! node_modules/\0!! temp/helper.ts\0 M tracked.ts\0')).toEqual([
      'node_modules/',
      'temp/helper.ts',
    ]);
  });
});

describe('loop driver arguments', () => {
  it('bounds the iteration count', () => {
    expect(() => parseLoopArguments(['--iterations', '0'])).toThrow(/between 1 and 50/);
    expect(() => parseLoopArguments(['--iterations', '999'])).toThrow(/between 1 and 50/);
    expect(parseLoopArguments(['--iterations', '5']).iterations).toBe(5);
  });

  it('defaults to a small supervised run on the integration branch', () => {
    const options = parseLoopArguments([]);
    expect(options).toMatchObject({ iterations: 3, base: 'develop', type: 'impl', dryRun: false });
  });

  it('accepts one external playtest finding as the iteration task', () => {
    expect(parseLoopArguments(['--finding-file', 'temp/finding.json'])).toMatchObject({
      findingFile: 'temp/finding.json',
      iterations: 1,
    });
  });

  it.each([
    'shell(git push)',
    'shell(git reset)',
    'shell(git clean)',
    'shell(rm)',
    'shell(sudo)',
    'shell(npm install)',
    'shell(curl)',
  ])('denies %s to the agent', (tool) => {
    expect(COPILOT_TOOL_FLAGS).toContain(`--deny-tool=${tool}`);
  });

  it('withholds network access and subagents from the agent', () => {
    const available = COPILOT_TOOL_FLAGS.find((flag) => flag.startsWith('--available-tools='));
    expect(available).toBeDefined();
    expect(available).not.toContain('web_fetch');
    expect(available).not.toContain('task');
  });

  it('keeps file path verification on', () => {
    // --allow-all-tools grants execution only. --allow-all-paths and --allow-all
    // would additionally disable path verification, which is what keeps writes
    // scoped to the worktree.
    expect(COPILOT_TOOL_FLAGS).toContain('--allow-all-tools');
    expect(COPILOT_TOOL_FLAGS).not.toContain('--allow-all-paths');
    expect(COPILOT_TOOL_FLAGS).not.toContain('--allow-all');
    expect(COPILOT_TOOL_FLAGS).not.toContain('--allow-all-urls');
  });

  it('never asks a question no human will answer', () => {
    expect(COPILOT_TOOL_FLAGS).toContain('--no-ask-user');
  });

  it('caps spend and scopes the agent to the worktree', () => {
    const args = buildCopilotArguments({
      worktree: '/tmp/wt',
      prompt: 'do the thing',
      logDirectory: '/tmp/logs',
      maxCredits: 400,
    });
    expect(args.slice(0, 2)).toEqual(['-C', '/tmp/wt']);
    expect(args).toContain('--max-ai-credits');
    expect(args[args.indexOf('--max-ai-credits') + 1]).toBe('400');
  });

  it('builds a focused playtest repair prompt with the exact reproduction', () => {
    const prompt = buildFindingPrompt('base prompt', {
      id: 'PT-ABC12345',
      kind: 'pageerror',
      message: 'Cannot read properties of undefined',
      scenario: 'overworld-fuzz',
      seed: 42,
      actionIndex: 17,
      reproductionCommand: 'npm run playtest:discover -- --scenario overworld-fuzz --seed 42',
    });

    expect(prompt).toContain('PT-ABC12345');
    expect(prompt).toContain('Cannot read properties of undefined');
    expect(prompt).toContain('npm run playtest:discover');
    expect(prompt).toContain('Fix this finding only');
  });

  it('resolves dependencies from the repository without a writable worktree link', () => {
    expect(WORKTREE_DEPENDENCIES.installArguments).toEqual(
      expect.arrayContaining(['ci', '--ignore-scripts']),
    );
    expect(WORKTREE_DEPENDENCIES.isolated).toBe(true);
    expect(WORKTREE_DEPENDENCIES.linkedIntoWorktree).toBe(false);
  });

  it('places agent worktrees outside repository dependency ancestry', () => {
    const path = worktreePathForIteration('run-123', 2);
    expect(path).not.toContain('/Pokemon-Web/temp/');
    expect(path).toMatch(/pokemon-web-loop-run-123-2$/);
  });

  it('guards only the loop configuration it reads from the checked-out tree', () => {
    expect(LOOP_CRITICAL_PATHS).toEqual(['.github/loop', 'scripts/loop', 'scripts/playtest']);
  });
});

describe('loop backlog bookkeeping', () => {
  const backlog = [
    '| ID | State | Signal | Task |',
    '|---|---|---|---|',
    '| L-001 | todo | tsc | Delete the unused helper. |',
    '| L-002 | todo | test | Add the missing event. |',
  ].join('\n');

  it.each([
    ['L-001: remove the unused helper', 'L-001'],
    ['L-012: tighten the event map', 'L-012'],
    ['PT-ABC12345: prevent the overworld crash', 'PT-ABC12345'],
    ['fix(loop): unrelated commit', null],
    ['', null],
  ])('reads the item id from commit subject %s', (subject, expected) => {
    expect(backlogItemFromSubject(subject)).toBe(expected);
  });

  it('marks only the claimed row done', () => {
    const updated = markBacklogItem(backlog, 'L-001', 'done');
    expect(updated).toContain('| L-001 | done |');
    expect(updated).toContain('| L-002 | todo |');
  });

  it('leaves the backlog untouched for an unknown id', () => {
    expect(markBacklogItem(backlog, 'L-999', 'done')).toBe(backlog);
  });
});
