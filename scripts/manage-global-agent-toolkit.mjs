#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOURCE_ROOT = resolve(REPOSITORY_ROOT, '.github/global-agent-toolkit');
const RECEIPT_NAME = '.pokemon-web-global-agent-toolkit.json';
const MODES = new Set(['install', 'check', 'uninstall']);

function resolveInside(root, candidate) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(resolvedRoot, candidate);
  if (resolvedCandidate !== resolvedRoot
      && !resolvedCandidate.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Path escapes managed root: ${candidate}`);
  }
  return resolvedCandidate;
}

function pathEntryExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function assertNoSymlinks(root, candidate) {
  const resolvedRoot = resolve(root);
  if (pathEntryExists(resolvedRoot) && lstatSync(resolvedRoot).isSymbolicLink()) {
    throw new Error(`Refusing a symlink as a managed root: ${resolvedRoot}`);
  }
  const resolvedCandidate = resolveInside(resolvedRoot, candidate);
  const parts = relative(resolvedRoot, resolvedCandidate).split(sep).filter(Boolean);
  let current = resolvedRoot;
  for (const part of parts) {
    current = resolve(current, part);
    if (pathEntryExists(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Refusing a symlink in a managed path: ${relative(resolvedRoot, current)}`);
    }
  }
  return resolvedCandidate;
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadManifest(sourceRoot) {
  const manifest = readJson(assertNoSymlinks(sourceRoot, 'manifest.json'));
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.resources)) {
    throw new Error('Unsupported global agent toolkit manifest.');
  }
  return manifest;
}

function loadReceipt(targetRoot) {
  const receiptPath = assertNoSymlinks(targetRoot, RECEIPT_NAME);
  return existsSync(receiptPath) ? readJson(receiptPath) : null;
}

function expectedResources(sourceRoot, targetRoot, manifest) {
  const destinations = new Set();
  return manifest.resources.map((resource) => {
    if (!resource.source || !resource.destination || !resource.kind) {
      throw new Error('Toolkit resources require kind, source, and destination.');
    }
    if (destinations.has(resource.destination)) {
      throw new Error(`Duplicate toolkit destination: ${resource.destination}`);
    }
    destinations.add(resource.destination);

    const sourcePath = assertNoSymlinks(sourceRoot, resource.source);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing toolkit source: ${resource.source}`);
    }
    const content = readFileSync(sourcePath);
    return {
      ...resource,
      content,
      sha256: sha256(content),
      destinationPath: assertNoSymlinks(targetRoot, resource.destination),
    };
  });
}

function receiptResourceMap(receipt) {
  return new Map((receipt?.resources ?? []).map((resource) => [
    resource.destination,
    resource,
  ]));
}

function removeEmptyParents(path, targetRoot) {
  let current = dirname(path);
  const stop = resolve(targetRoot);
  while (current !== stop && relative(stop, current) && current.startsWith(`${stop}${sep}`)) {
    try {
      rmdirSync(current);
    } catch {
      break;
    }
    current = dirname(current);
  }
}

export function manageGlobalAgentToolkit({
  mode,
  sourceRoot = DEFAULT_SOURCE_ROOT,
  targetRoot = resolve(homedir(), '.copilot'),
  log = console.log,
}) {
  if (!MODES.has(mode)) {
    throw new Error(`Mode must be one of: ${[...MODES].join(', ')}.`);
  }

  const manifest = loadManifest(sourceRoot);
  const receipt = loadReceipt(targetRoot);
  const resources = expectedResources(sourceRoot, targetRoot, manifest);
  const previousByDestination = receiptResourceMap(receipt);
  const receiptPath = assertNoSymlinks(targetRoot, RECEIPT_NAME);
  const currentDestinations = new Set(resources.map((resource) => resource.destination));
  const retiredResources = (receipt?.resources ?? [])
    .filter((resource) => !currentDestinations.has(resource.destination));

  if (mode === 'check') {
    if (!receipt) {
      throw new Error(`Global toolkit is not installed in ${targetRoot}.`);
    }
    if (retiredResources.length > 0 || receipt.resources.length !== resources.length) {
      throw new Error('Global toolkit is out of date: installed resource set differs from the manifest.');
    }
    for (const resource of resources) {
      const previous = previousByDestination.get(resource.destination);
      if (!previous || previous.sha256 !== resource.sha256) {
        throw new Error(`Global toolkit is out of date: ${resource.destination}`);
      }
      if (!existsSync(resource.destinationPath)) {
        throw new Error(`Managed global file is missing: ${resource.destination}`);
      }
      const installedHash = sha256(readFileSync(resource.destinationPath));
      if (installedHash !== resource.sha256) {
        throw new Error(`Managed global file was modified: ${resource.destination}`);
      }
    }
    log(`Global agent toolkit ${manifest.version} is installed and current.`);
    return;
  }

  if (mode === 'uninstall') {
    if (!receipt) {
      log('Global agent toolkit is not installed.');
      return;
    }
    for (const installed of receipt.resources ?? []) {
      const destinationPath = assertNoSymlinks(targetRoot, installed.destination);
      if (existsSync(destinationPath)
          && sha256(readFileSync(destinationPath)) !== installed.sha256) {
        throw new Error(`Refusing to remove modified global file: ${installed.destination}`);
      }
    }
    for (const installed of receipt.resources ?? []) {
      const destinationPath = assertNoSymlinks(targetRoot, installed.destination);
      rmSync(destinationPath, { force: true });
      removeEmptyParents(destinationPath, targetRoot);
    }
    rmSync(receiptPath, { force: true });
    log('Global agent toolkit uninstalled.');
    return;
  }

  for (const retired of retiredResources) {
    const destinationPath = assertNoSymlinks(targetRoot, retired.destination);
    if (existsSync(destinationPath)
        && sha256(readFileSync(destinationPath)) !== retired.sha256) {
      throw new Error(`Refusing to remove modified retired global file: ${retired.destination}`);
    }
  }
  for (const resource of resources) {
    if (!existsSync(resource.destinationPath)) {
      continue;
    }
    const installedHash = sha256(readFileSync(resource.destinationPath));
    const previous = previousByDestination.get(resource.destination);
    if (installedHash !== resource.sha256
        && (!previous || installedHash !== previous.sha256)) {
      throw new Error(`Refusing to overwrite unmanaged or modified global file: ${resource.destination}`);
    }
  }

  const current = receipt
    && receipt.toolkit_version === manifest.version
    && retiredResources.length === 0
    && receipt.resources.length === resources.length
    && resources.every((resource) => existsSync(resource.destinationPath)
      && sha256(readFileSync(resource.destinationPath)) === resource.sha256
      && previousByDestination.get(resource.destination)?.sha256 === resource.sha256);
  if (current) {
    log(`Global agent toolkit ${manifest.version} is already current.`);
    return;
  }

  for (const resource of resources) {
    mkdirSync(dirname(resource.destinationPath), { recursive: true });
    writeFileSync(resource.destinationPath, resource.content);
  }
  for (const retired of retiredResources) {
    const destinationPath = assertNoSymlinks(targetRoot, retired.destination);
    rmSync(destinationPath, { force: true });
    removeEmptyParents(destinationPath, targetRoot);
  }
  mkdirSync(targetRoot, { recursive: true });
  writeFileSync(receiptPath, `${JSON.stringify({
    schema_version: 1,
    toolkit: manifest.name,
    toolkit_version: manifest.version,
    installed_at: new Date().toISOString(),
    resources: resources.map(({ kind, source, destination, sha256: digest }) => ({
      kind,
      source,
      destination,
      sha256: digest,
    })),
  }, null, 2)}\n`);
  log(`Installed global agent toolkit ${manifest.version} in ${targetRoot}.`);
}

function parseArguments(args) {
  const mode = args[0] ?? 'check';
  const targetIndex = args.indexOf('--target');
  if (targetIndex >= 0 && !args[targetIndex + 1]) {
    throw new Error('--target requires a directory.');
  }
  return {
    mode,
    targetRoot: targetIndex >= 0 ? resolve(args[targetIndex + 1]) : undefined,
  };
}

async function main() {
  const { mode, targetRoot } = parseArguments(process.argv.slice(2));
  manageGlobalAgentToolkit({ mode, ...(targetRoot ? { targetRoot } : {}) });
}

const isEntryPoint = typeof process.argv[1] === 'string'
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}