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
    'npm test && git add .',
    'git add --all',
    'git reset --hard HEAD',
    'git clean -fd',
    'rm -rf /',
  ])('denies destructive or repository-unsafe command: %s', (command) => {
    expect(evaluateToolUse({ toolArgs: { command } })).toMatchObject({
      permissionDecision: 'deny',
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

  it('provides concise repository setup context', () => {
    const result = createSessionContext(
      { cwd: process.cwd() },
      { nodeVersion: 'v22.0.0' },
    );

    expect(result.additionalContext).toContain('frontend-only');
    expect(result.additionalContext).toContain('AGENTS.md');
    expect(result.additionalContext).toContain('npm run test');
    expect(result.additionalContext).toContain('Node v22.0.0');
  });
});
