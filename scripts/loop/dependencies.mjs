import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEPENDENCY_INSTALL_ARGUMENTS = [
  'ci',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  '--prefer-offline',
];

export function prepareWorktreeDependencies(worktree, { reset = false } = {}) {
  if (reset) {
    rmSync(resolve(worktree, 'node_modules'), { recursive: true, force: true });
  }
  return execFileSync('npm', DEPENDENCY_INSTALL_ARGUMENTS, {
    cwd: worktree,
    encoding: 'utf8',
    timeout: 5 * 60 * 1000,
    maxBuffer: 16 * 1024 * 1024,
  });
}
