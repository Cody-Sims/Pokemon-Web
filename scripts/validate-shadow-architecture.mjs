#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_SECTIONS = ['Context', 'Decision', 'Rationale', 'Consequences', 'Unknowns'];

function parseFrontmatter(content, path) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error(`${path}: missing YAML frontmatter.`);
  }
  const frontmatter = match[1];
  const scalar = (key) => {
    const value = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
    return value?.replace(/^['"]|['"]$/g, '');
  };
  const block = (key) => {
    const lines = frontmatter.split('\n');
    const start = lines.findIndex((line) => line === `${key}:`);
    if (start < 0) return [];
    const values = [];
    for (const line of lines.slice(start + 1)) {
      if (/^[a-z_]+:/i.test(line)) break;
      const value = line.match(/^  -\s+["']?([^"']+?)["']?\s*$/)?.[1];
      if (value) values.push(value);
    }
    return values;
  };
  const relations = [];
  const relationPattern = /^  - type:\s*(\S+)\n    target:\s*(\S+)/gm;
  for (const relation of frontmatter.matchAll(relationPattern)) {
    relations.push({ type: relation[1], target: relation[2] });
  }
  return {
    body: content.slice(match[0].length),
    id: scalar('id'),
    kind: scalar('kind'),
    title: scalar('title'),
    status: scalar('status'),
    date: scalar('date'),
    anchors: block('anchors'),
    evidence: block('evidence'),
    relations,
  };
}

function anchorBase(anchor) {
  const wildcard = anchor.search(/[?*[{]/);
  const prefix = wildcard >= 0 ? anchor.slice(0, wildcard) : anchor;
  return prefix.replace(/\/$/, '');
}

function assertPath(root, path, label) {
  const base = anchorBase(path);
  if (base && !existsSync(resolve(root, base))) {
    throw new Error(`${label} does not resolve: ${path}`);
  }
}

export function validateShadowArchitecture(root = REPOSITORY_ROOT) {
  const shadowRoot = resolve(root, '.shadow');
  const index = JSON.parse(readFileSync(resolve(shadowRoot, 'index.json'), 'utf8'));
  const features = JSON.parse(readFileSync(resolve(shadowRoot, 'features.json'), 'utf8'));
  if (index.schema_version !== 1 || features.schema_version !== 1) {
    throw new Error('Unsupported .shadow schema version.');
  }

  const indexedIds = new Set();
  const decisionEntries = readdirSync(resolve(shadowRoot, 'decisions'), {
    withFileTypes: true,
  });
  if (decisionEntries.some((entry) => !entry.isFile())) {
    throw new Error('Decision directory contains a non-file entry.');
  }
  const decisionDirectoryFiles = decisionEntries.map((entry) => entry.name);
  const recordFiles = decisionDirectoryFiles
    .filter((file) => /^DEC-\d{4}\.md$/.test(file))
    .sort();
  if (decisionDirectoryFiles.length !== recordFiles.length) {
    throw new Error('Decision directory contains a noncanonical file.');
  }
  if (recordFiles.length !== index.records.length) {
    throw new Error('Decision file count does not match index.json.');
  }
  const expectedRecordFiles = index.records.map((record) => `${record.id}.md`).sort();
  if (JSON.stringify(recordFiles) !== JSON.stringify(expectedRecordFiles)) {
    throw new Error('Decision files do not exactly match the indexed decision IDs.');
  }

  const parsedById = new Map();
  for (const indexed of index.records) {
    if (indexedIds.has(indexed.id)) throw new Error(`Duplicate decision ID: ${indexed.id}`);
    indexedIds.add(indexed.id);
    const canonicalPath = `.shadow/decisions/${indexed.id}.md`;
    if (indexed.path !== canonicalPath) {
      throw new Error(`${indexed.id}: record path must be ${canonicalPath}.`);
    }
    const recordPath = resolve(root, indexed.path);
    const parsed = parseFrontmatter(readFileSync(recordPath, 'utf8'), indexed.path);
    if (parsed.id !== indexed.id || parsed.title !== indexed.title
        || parsed.status !== indexed.status) {
      throw new Error(`${indexed.id}: index metadata does not match its record.`);
    }
    if (parsed.kind !== 'decision' || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date ?? '')) {
      throw new Error(`${indexed.id}: invalid kind or date.`);
    }
    if (!index.allowed_statuses.includes(parsed.status)) {
      throw new Error(`${indexed.id}: unsupported status ${parsed.status}.`);
    }
    if (!parsed.anchors.length || !parsed.evidence.length) {
      throw new Error(`${indexed.id}: anchors and evidence are required.`);
    }
    for (const anchor of parsed.anchors) assertPath(root, anchor, `${indexed.id} anchor`);
    for (const evidence of parsed.evidence) assertPath(root, evidence, `${indexed.id} evidence`);
    for (const section of REQUIRED_SECTIONS) {
      if (!parsed.body.includes(`## ${section}\n`)) {
        throw new Error(`${indexed.id}: missing ${section} section.`);
      }
    }
    parsedById.set(indexed.id, parsed);
  }

  for (const [id, record] of parsedById) {
    for (const relation of record.relations) {
      if (!index.allowed_relations.includes(relation.type)) {
        throw new Error(`${id}: unsupported relation ${relation.type}.`);
      }
      if (!parsedById.has(relation.target)) {
        throw new Error(`${id}: relation target does not exist: ${relation.target}.`);
      }
    }
  }

  const featureIds = new Set(features.nodes.map((node) => node.id));
  if (featureIds.size !== features.nodes.length || !featureIds.has(features.root)) {
    throw new Error('Feature IDs must be unique and include the declared root.');
  }
  const nodeById = new Map(features.nodes.map((node) => [node.id, node]));
  const reachable = new Set();
  const pending = [features.root];
  while (pending.length > 0) {
    const id = pending.pop();
    if (reachable.has(id)) continue;
    reachable.add(id);
    pending.push(...(nodeById.get(id)?.children ?? []));
  }
  if (reachable.size !== featureIds.size) {
    throw new Error('Every feature node must be reachable from the declared root.');
  }
  const mappedDecisions = new Set();
  for (const node of features.nodes) {
    for (const child of node.children ?? []) {
      if (!featureIds.has(child)) throw new Error(`${node.id}: missing child ${child}.`);
    }
    for (const decision of node.decisions ?? []) {
      if (!parsedById.has(decision)) throw new Error(`${node.id}: missing decision ${decision}.`);
      mappedDecisions.add(decision);
    }
    for (const path of node.paths ?? []) assertPath(root, path, `${node.id} path`);
  }
  for (const id of parsedById.keys()) {
    if (!mappedDecisions.has(id)) throw new Error(`${id}: decision is not mapped to a feature.`);
  }
}

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    validateShadowArchitecture();
    console.log('Shadow architecture is structurally valid.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}