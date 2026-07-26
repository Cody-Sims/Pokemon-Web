import { describe, expect, it } from 'vitest';
import {
  aggregateFindings,
  exitCodeForSignal,
  fingerprintFinding,
  formatMarkdownReport,
  hasChildExited,
  parseArguments,
  selectRepairCandidate,
  verificationHasFailed,
} from '../../../scripts/playtest/discover.mjs';
import {
  discoveryWorktreePath,
  parseArguments as parsePlaytestLoopArguments,
} from '../../../scripts/loop/run-playtest-loop.mjs';

describe('playtest discovery arguments', () => {
  it('uses bounded deterministic defaults', () => {
    expect(parseArguments([])).toMatchObject({
      actions: 120,
      attempts: 2,
      seeds: [42, 1337],
      scenarios: ['boot', 'new-game', 'overworld-fuzz', 'mobile-controls', 'mobile-rotation'],
      profiles: ['desktop', 'mobile-landscape', 'mobile-portrait'],
      verify: null,
    });
  });

  it('accepts focused reproduction options', () => {
    expect(
      parseArguments([
        '--scenario',
        'overworld-fuzz',
        '--profile',
        'desktop',
        '--seed',
        '99',
        '--actions',
        '25',
        '--attempts',
        '1',
        '--output',
        'temp/report',
      ]),
    ).toMatchObject({
      actions: 25,
      attempts: 1,
      seeds: [99],
      scenarios: ['overworld-fuzz'],
      profiles: ['desktop'],
      output: 'temp/report',
    });
  });

  it.each([
    ['--actions', '0'],
    ['--attempts', '3'],
    ['--scenario', 'unknown'],
    ['--profile', 'unknown'],
    ['--seed', 'not-a-number'],
  ])('rejects invalid bounded input %s %s', (...args) => {
    expect(() => parseArguments(args)).toThrow();
  });
});

describe('playtest process lifecycle', () => {
  it('treats signal-terminated children as exited', () => {
    expect(hasChildExited({ exitCode: null, signalCode: 'SIGKILL' })).toBe(true);
    expect(hasChildExited({ exitCode: null, signalCode: null })).toBe(false);
  });

  it('uses conventional exit codes after signal cleanup', () => {
    expect(exitCodeForSignal('SIGINT')).toBe(130);
    expect(exitCodeForSignal('SIGTERM')).toBe(143);
  });
});

describe('playtest repair loop arguments', () => {
  it('uses conservative autonomous defaults', () => {
    expect(parsePlaytestLoopArguments([])).toMatchObject({
      cycles: 3,
      base: 'develop',
      actions: 120,
      deadlineMinutes: 240,
      dryRun: false,
    });
  });

  it('bounds background cycles and fuzz actions', () => {
    expect(() => parsePlaytestLoopArguments(['--cycles', '21'])).toThrow(/cycles/);
    expect(() => parsePlaytestLoopArguments(['--actions', '0'])).toThrow(/actions/);
  });

  it('isolates discovery from the current checkout and repository dependencies', () => {
    const path = discoveryWorktreePath('run-123', 2);
    expect(path).not.toContain('/Pokemon-Web/');
    expect(path).toMatch(/pokemon-web-playtest-run-123-2$/);
  });
});

describe('playtest finding evidence', () => {
  const crash = {
    kind: 'pageerror',
    message: 'Cannot read properties of undefined',
    scenario: 'overworld-fuzz',
    profile: 'desktop',
    seed: 42,
    actionIndex: 17,
  };

  it('creates stable fingerprints without depending on action position', () => {
    expect(fingerprintFinding(crash)).toBe(
      fingerprintFinding({
        ...crash,
        seed: 1337,
        actionIndex: 99,
      }),
    );
  });

  it('keeps device-specific findings separate', () => {
    expect(fingerprintFinding(crash)).not.toBe(
      fingerprintFinding({
        ...crash,
        profile: 'mobile-portrait',
      }),
    );
  });

  it('retains only findings reproduced in every attempt as repair candidates', () => {
    const findings = aggregateFindings(
      [
        { ...crash, attempt: 1 },
        { ...crash, attempt: 2, actionIndex: 18 },
        {
          kind: 'requestfailed',
          message: 'one-off.png',
          scenario: 'boot',
          seed: 42,
          actionIndex: null,
          attempt: 1,
        },
      ],
      2,
    );

    expect(findings).toHaveLength(2);
    expect(findings.find((finding) => finding.kind === 'pageerror')).toMatchObject({
      occurrences: 2,
      reproducible: true,
    });
    expect(findings.find((finding) => finding.kind === 'requestfailed')).toMatchObject({
      occurrences: 1,
      reproducible: false,
    });
  });

  it('does not combine different seeds into a false reproduction', () => {
    const findings = aggregateFindings(
      [
        { ...crash, seed: 42, attempt: 1 },
        { ...crash, seed: 1337, attempt: 2 },
      ],
      2,
    );

    expect(findings[0]).toMatchObject({
      occurrences: 1,
      reproducible: false,
    });
  });

  it('selects the first reproducible unblocked finding', () => {
    const findings = aggregateFindings(
      [
        { ...crash, attempt: 1 },
        { ...crash, attempt: 2 },
        {
          kind: 'console-error',
          message: 'second bug',
          scenario: 'boot',
          seed: 42,
          actionIndex: null,
          attempt: 1,
        },
        {
          kind: 'console-error',
          message: 'second bug',
          scenario: 'boot',
          seed: 42,
          actionIndex: null,
          attempt: 2,
        },
      ],
      2,
    );
    const first = selectRepairCandidate({ findings }, new Set());
    const second = selectRepairCandidate({ findings }, new Set([first.id]));

    expect(first.reproducible).toBe(true);
    expect(second.id).not.toBe(first.id);
  });

  it('formats a concise bug list with an exact reproduction command', () => {
    const finding = aggregateFindings(
      [
        { ...crash, attempt: 1 },
        { ...crash, attempt: 2 },
      ],
      2,
    )[0];
    const markdown = formatMarkdownReport({
      generatedAt: '2026-07-24T20:00:00.000Z',
      options: { attempts: 2 },
      findings: [finding],
      runs: [],
    });

    expect(markdown).toContain(`# Playtest bug report`);
    expect(markdown).toContain(finding.id);
    expect(markdown).toContain('--scenario overworld-fuzz --profile desktop --seed 42');
    expect(markdown).toContain('- Profile: `desktop`');
    expect(markdown).toContain('Cannot read properties of undefined');
  });

  it('allows known sibling findings while rejecting the target or a new failure', () => {
    const target = {
      fingerprint: 'TARGET',
      baselineFingerprints: ['TARGET', 'KNOWN'],
    };

    expect(verificationHasFailed(target, [{ fingerprint: 'KNOWN', kind: 'console-error' }])).toBe(
      false,
    );
    expect(verificationHasFailed(target, [{ fingerprint: 'TARGET', kind: 'pageerror' }])).toBe(
      true,
    );
    expect(verificationHasFailed(target, [{ fingerprint: 'NEW', kind: 'pageerror' }])).toBe(true);
  });
});
