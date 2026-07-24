#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const GIT_COMMAND = String.raw`\bgit(?:\s+(?:(?:-C|-c)\s+\S+|(?:--git-dir|--work-tree)(?:=\S+|\s+\S+)|--(?:no-pager|bare)))*`;
const BLOCKED_COMMANDS = [
  {
    pattern: new RegExp(`${GIT_COMMAND}\\s+push(?:\\s|$)`, 'i'),
    reason: 'Use the repository-approved progress or pull-request tooling instead of git push.',
  },
  {
    pattern: new RegExp(`${GIT_COMMAND}\\s+add\\s+(?:-A|--all|\\.)(?:\\s|$)`, 'i'),
    reason: 'Stage explicit paths only; git add -A, --all, and . can include unrelated files.',
  },
  {
    pattern: new RegExp(`${GIT_COMMAND}\\s+reset\\s+--hard(?:\\s|$)`, 'i'),
    reason: 'git reset --hard can destroy uncommitted work.',
  },
  {
    pattern: new RegExp(`${GIT_COMMAND}\\s+clean\\s+(?:-(?=[a-z]*f)[a-z]+|--force)(?:\\s|$)`, 'i'),
    reason: 'git clean with force can destroy untracked work.',
  },
  {
    pattern: /\brm(?=[^;&|\n]*\s+(?:-[a-z]*r[a-z]*|--recursive)(?:\s|$))(?=[^;&|\n]*\s+(?:-[a-z]*f[a-z]*|--force)(?:\s|$))(?:\s+--?[a-z-]+)+\s+(?:\/|~|\$HOME)(?:\s|$)/i,
    reason: 'Refusing a recursive forced deletion of a root or home directory.',
  },
];

export function createSessionContext(input = {}, environment = {}) {
  const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
  const packagePresent = existsSync(resolve(cwd, 'package.json'));
  const dependenciesPresent = existsSync(resolve(cwd, 'node_modules'));
  const nodeVersion = environment.nodeVersion ?? process.version;
  const setup = dependenciesPresent
    ? 'Dependencies are present.'
    : 'Dependencies are not present; run npm install before other npm commands.';

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        'Pokémon Web is a frontend-only Phaser + TypeScript + Vite application.',
        'Read AGENTS.md, the nearest CONTEXT.md, and matching .github/instructions files before editing.',
        `${setup} Required final checks are npm run test and npm run build.`,
        `Environment: Node ${nodeVersion}; package.json ${packagePresent ? 'found' : 'not found'} in ${cwd}.`,
        'Load a matching skill from .github/skills for frontend, backend, validation, tile/sprite, or shadow architecture work.',
      ].join(' '),
    },
  };
}

export function extractCommand(input = {}) {
  if (!input || typeof input !== 'object') {
    return '';
  }
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
  if (!input || typeof input !== 'object' || input.__malformedHookInput === true) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Refusing a tool call because the hook input was missing or malformed.',
      },
    };
  }

  const command = extractCommand(input).replace(/\\\r?\n/g, ' ').trim();
  const toolName = typeof input.tool_name === 'string' ? input.tool_name : '';
  const hasToolPayload = Object.hasOwn(input, 'toolArgs') || Object.hasOwn(input, 'tool_input');
  const isCommandTool = /terminal|shell|bash|powershell|command/i.test(toolName)
    || Object.hasOwn(input, 'toolArgs');
  if (!toolName && !hasToolPayload || isCommandTool && !command) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Refusing a tool call because the hook input shape is invalid.',
      },
    };
  }
  const blocked = BLOCKED_COMMANDS.find(({ pattern }) => pattern.test(command));

  if (!blocked) {
    return {};
  }

  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: blocked.reason,
    },
  };
}

async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
  if (!raw.trim()) {
    return { __malformedHookInput: true };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { __malformedHookInput: true };
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

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  await main();
}
