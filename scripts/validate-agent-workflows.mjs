#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function frontmatterValue(path, key) {
  const content = readFileSync(path, 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!frontmatter) throw new Error(`${path}: missing YAML frontmatter.`);
  const value = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  return value?.replace(/^['"]|['"]$/g, '');
}

function skillPaths(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(root, entry.name, 'SKILL.md'))
    .filter(existsSync);
}

export function validateAgentWorkflows(root = REPOSITORY_ROOT) {
  const localSkillsRoot = resolve(root, '.github/skills');
  const toolkitRoot = resolve(root, '.github/global-agent-toolkit');
  const globalSkillsRoot = resolve(toolkitRoot, 'skills');
  const namesByScope = new Map();

  for (const [scope, paths] of [
    ['workspace', skillPaths(localSkillsRoot)],
    ['global', skillPaths(globalSkillsRoot)],
  ]) {
    const names = new Set();
    for (const path of paths) {
      const directoryName = dirname(path).split('/').at(-1);
      const name = frontmatterValue(path, 'name');
      const description = frontmatterValue(path, 'description');
      if (name !== directoryName || !/^[a-z0-9-]{1,64}$/.test(name ?? '')) {
        throw new Error(`${path}: skill name must match its directory.`);
      }
      if (!description) throw new Error(`${path}: skill description is required.`);
      if (names.has(name)) throw new Error(`${scope}: duplicate skill name ${name}.`);
      names.add(name);
    }
    namesByScope.set(scope, names);
  }
  for (const name of namesByScope.get('workspace')) {
    if (namesByScope.get('global').has(name)) {
      throw new Error(`Global and workspace skill names collide: ${name}.`);
    }
  }

  const manifest = JSON.parse(readFileSync(resolve(toolkitRoot, 'manifest.json'), 'utf8'));
  const destinations = new Set();
  for (const resource of manifest.resources ?? []) {
    if (!resource.source || !resource.destination || destinations.has(resource.destination)) {
      throw new Error('Global toolkit manifest has an invalid or duplicate resource.');
    }
    destinations.add(resource.destination);
    if (!existsSync(resolve(toolkitRoot, resource.source))) {
      throw new Error(`Global toolkit source is missing: ${resource.source}`);
    }
  }

  const agentRoot = resolve(toolkitRoot, 'agents');
  for (const file of readdirSync(agentRoot).filter((name) => name.endsWith('.agent.md'))) {
    const path = resolve(agentRoot, file);
    if (!frontmatterValue(path, 'name') || !frontmatterValue(path, 'description')) {
      throw new Error(`${path}: agent name and description are required.`);
    }
  }

  const hookConfig = JSON.parse(readFileSync(
    resolve(root, '.github/hooks/agent-guardrails.json'),
    'utf8',
  ));
  for (const [event, hooks] of Object.entries(hookConfig.hooks ?? {})) {
    if (!/^[A-Z][A-Za-z]+$/.test(event) || !Array.isArray(hooks)) {
      throw new Error(`Invalid hook event: ${event}.`);
    }
    for (const hook of hooks) {
      if (hook.type !== 'command' || !hook.command || hook.timeout <= 0) {
        throw new Error(`${event}: invalid command hook.`);
      }
    }
  }
}

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    validateAgentWorkflows();
    console.log('Agent workflow customizations are structurally valid.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}