import { describe, expect, it } from 'vitest';
import {
  createSessionContext,
  evaluateToolUse,
  extractCommand,
} from '../../../scripts/copilot-hooks.mjs';

describe('Copilot workflow hooks', () => {
  it('extracts commands from native and compatible hook payloads', () => {
    expect(extractCommand({ toolArgs: { command: 'npm run test' } })).toBe('npm run test');
    expect(extractCommand({ tool_input: '{"command":"npm run build"}' })).toBe('npm run build');
  });

  it.each([
    'git push origin main',
    '  git push origin main',
    'git -C . push origin main',
    'git --git-dir=.git push origin main',
    'sh -c "git push origin main"',
    'npm test && git add .',
    'git add --all',
    'git reset --hard HEAD',
    'git clean -fd',
    'git clean --force',
    'rm -rf /',
    'rm -fr ~',
    'rm -r -f /',
    'rm --recursive --force $HOME',
  ])('denies destructive or repository-unsafe command: %s', (command) => {
    expect(evaluateToolUse({ toolArgs: { command } })).toMatchObject({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
      },
    });
  });

  it.each([
    'npm run test',
    'git add AGENTS.md docs/CHANGELOG.md',
    'rm -rf temp/generated-preview',
    'git status --short',
  ])('does not override normal permission handling for: %s', (command) => {
    expect(evaluateToolUse({ toolArgs: { command } })).toEqual({});
  });

  it.each([
    'git push origin develop',
    'git push -u origin develop',
    'git push origin agent/iter-1',
    'git push origin HEAD:develop',
  ])('allows publishing a reviewable branch: %s', (command) => {
    expect(evaluateToolUse({ toolArgs: { command } })).toEqual({});
  });

  it.each([
    'git push origin master',
    'git push origin develop:main',
    'git push origin HEAD:refs/heads/main',
    'git push --force origin develop',
    'git push -f origin develop',
    'git push --force-with-lease origin develop',
    'git push origin +develop',
    'git push origin --delete develop',
    'git push origin :develop',
    'npm run build && git push origin main',
  ])('still denies unreviewable or destructive push: %s', (command) => {
    expect(evaluateToolUse({ toolArgs: { command } })).toMatchObject({
      hookSpecificOutput: { permissionDecision: 'deny' },
    });
  });

  it('denies tool use when the hook payload is malformed', () => {
    expect(evaluateToolUse({ __malformedHookInput: true })).toMatchObject({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
      },
    });
    expect(evaluateToolUse(null)).toMatchObject({
      hookSpecificOutput: { permissionDecision: 'deny' },
    });
    expect(evaluateToolUse({})).toMatchObject({
      hookSpecificOutput: { permissionDecision: 'deny' },
    });
    expect(evaluateToolUse({
      tool_name: 'run_in_terminal',
      tool_input: { explanation: 'missing command' },
    })).toMatchObject({
      hookSpecificOutput: { permissionDecision: 'deny' },
    });
  });

  it('allows a valid non-command tool payload', () => {
    expect(evaluateToolUse({
      tool_name: 'read_file',
      tool_input: { filePath: 'AGENTS.md' },
    })).toEqual({});
  });

  it('provides concise repository setup context', () => {
    const result = createSessionContext(
      { cwd: process.cwd() },
      { nodeVersion: 'v22.0.0' },
    );

    expect(result.hookSpecificOutput.hookEventName).toBe('SessionStart');
    expect(result.hookSpecificOutput.additionalContext).toContain('frontend-only');
    expect(result.hookSpecificOutput.additionalContext).toContain('AGENTS.md');
    expect(result.hookSpecificOutput.additionalContext).toContain('npm run test');
    expect(result.hookSpecificOutput.additionalContext).toContain('Node v22.0.0');
  });
});
