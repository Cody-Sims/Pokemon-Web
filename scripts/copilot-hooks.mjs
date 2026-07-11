#!/usr/bin/env node

import { existsSync } from 'node:fs';

const BLOCKED_COMMANDS = [
  {
    pattern: /(?:^|[;&|]\s*)git\s+push(?:\s|$)/i,
    reason: 'Use the repository-approved progress or pull-request tooling instead of git push.',
  },
  {
    pattern: /(?:^|[;&|]\s*)git\s+add\s+(?:-A|--all|\.)(?:\s|$)/i,
    reason: 'Stage explicit paths only; git add -A, --all, and . can include unrelated files.',
  },
  {
    pattern: /(?:^|[;&|]\s*)git\s+reset\s+--hard(?:\s|$)/i,
    reason: 'git reset --hard can destroy uncommitted work.',
  },
  {
    pattern: /(?:^|[;&|]\s*)git\s+clean\s+-[a-z]*f[a-z]*(?:\s|$)/i,
    reason: 'git clean with force can destroy untracked work.',
  },
  {
    pattern: /(?:^|[;&|]\s*)rm\s+-rf\s+(?:\/|~|\$HOME)(?:\s|$)/i,
    reason: 'Refusing a recursive forced deletion of a root or home directory.',
  },
];

export function createSessionContext(input = {}, environment = {}) {
  const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
  const packagePresent = existsSync(`${cwd}/package.json`);
  const dependenciesPresent = existsSync(`${cwd}/node_modules`);
  const nodeVersion = environment.nodeVersion ?? process.version;
  const setup = dependenciesPresent
    ? 'Dependencies are present.'
    : 'Dependencies are not present; run npm install before other npm commands.';

  return {
    additionalContext: [
      'Pokemon Web is a frontend-only Phaser + TypeScript + Vite application.',
      'Read AGENTS.md, the nearest CONTEXT.md, and matching .github/instructions files before editing.',
      `${setup} Required final checks are npm run test and npm run build.`,
      `Environment: Node ${nodeVersion}; package.json ${packagePresent ? 'found' : 'not found'} in ${cwd}.`,
      'Load a matching skill from .github/skills for frontend, backend, validation, or tile/sprite work.',
    ].join(' '),
  };
}

export function extractCommand(input = {}) {
  const args = input.toolArgs ?? input.tool_input;
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return typeof parsed?.command === 'string' ? parsed.command : '';
    } catch {
      return args;
    }
  }
  return typeof args?.command === 'string' ? args.command : '';
}

export function evaluateToolUse(input = {}) {
  const command = extractCommand(input);
  const blocked = BLOCKED_COMMANDS.find(({ pattern }) => pattern.test(command));

  if (!blocked) {
    return {};
  }

  return {
    permissionDecision: 'deny',
    permissionDecisionReason: blocked.reason,
  };
}

async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function main() {
  const input = await readInput();
  const mode = process.argv[2];
  const output = mode === 'session-start'
    ? createSessionContext(input)
    : mode === 'pre-tool-use'
      ? evaluateToolUse(input)
      : {};
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1]?.endsWith('copilot-hooks.mjs')) {
  await main();
}
