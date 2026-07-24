import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { manageGlobalAgentToolkit } from '../../../scripts/manage-global-agent-toolkit.mjs';

const temporaryDirectories: string[] = [];

function temporaryTarget(): string {
  const target = mkdtempSync(resolve(tmpdir(), 'pokemon-web-agent-toolkit-'));
  temporaryDirectories.push(target);
  return target;
}

function toolkitFixture(resources: Array<{ source: string; destination: string }>): string {
  const sourceRoot = temporaryTarget();
  for (const resource of resources) {
    const sourcePath = resolve(sourceRoot, resource.source);
    mkdirSync(resolve(sourcePath, '..'), { recursive: true });
    writeFileSync(sourcePath, `${resource.source}\n`);
  }
  writeFileSync(resolve(sourceRoot, 'manifest.json'), `${JSON.stringify({
    schema_version: 1,
    name: 'test-toolkit',
    version: '1.0.0',
    resources: resources.map((resource) => ({ kind: 'skill', ...resource })),
  })}\n`);
  return sourceRoot;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    try {
      manageGlobalAgentToolkit({ mode: 'uninstall', targetRoot: directory, log: () => {} });
    } catch {
      // Drift tests intentionally leave modified managed files behind.
    }
  }
});

describe('global agent toolkit manager', () => {
  it('installs, checks, and uninstalls managed resources', () => {
    const targetRoot = temporaryTarget();

    manageGlobalAgentToolkit({ mode: 'install', targetRoot, log: () => {} });
    expect(() => manageGlobalAgentToolkit({
      mode: 'check',
      targetRoot,
      log: () => {},
    })).not.toThrow();
    expect(readFileSync(resolve(
      targetRoot,
      'agents/workspace-researcher.agent.md',
    ), 'utf8')).toContain('name: Workspace Researcher');

    manageGlobalAgentToolkit({ mode: 'uninstall', targetRoot, log: () => {} });
    expect(() => manageGlobalAgentToolkit({
      mode: 'check',
      targetRoot,
      log: () => {},
    })).toThrow('not installed');
  });

  it('is idempotent and detects modified managed files', () => {
    const targetRoot = temporaryTarget();
    manageGlobalAgentToolkit({ mode: 'install', targetRoot, log: () => {} });
    manageGlobalAgentToolkit({ mode: 'install', targetRoot, log: () => {} });

    const managedFile = resolve(targetRoot, 'skills/shadow-architecture/SKILL.md');
    writeFileSync(managedFile, `${readFileSync(managedFile, 'utf8')}modified\n`);

    expect(() => manageGlobalAgentToolkit({
      mode: 'check',
      targetRoot,
      log: () => {},
    })).toThrow('was modified');
    expect(() => manageGlobalAgentToolkit({
      mode: 'install',
      targetRoot,
      log: () => {},
    })).toThrow('Refusing to overwrite');
    expect(() => manageGlobalAgentToolkit({
      mode: 'uninstall',
      targetRoot,
      log: () => {},
    })).toThrow('Refusing to remove');
  });

  it('removes unchanged resources retired from the manifest', () => {
    const targetRoot = temporaryTarget();
    const sourceRoot = toolkitFixture([
      { source: 'skills/keep/SKILL.md', destination: 'skills/keep/SKILL.md' },
      { source: 'skills/retire/SKILL.md', destination: 'skills/retire/SKILL.md' },
    ]);
    manageGlobalAgentToolkit({ mode: 'install', sourceRoot, targetRoot, log: () => {} });

    writeFileSync(resolve(sourceRoot, 'manifest.json'), `${JSON.stringify({
      schema_version: 1,
      name: 'test-toolkit',
      version: '1.0.0',
      resources: [{
        kind: 'skill',
        source: 'skills/keep/SKILL.md',
        destination: 'skills/keep/SKILL.md',
      }],
    })}\n`);

    manageGlobalAgentToolkit({ mode: 'install', sourceRoot, targetRoot, log: () => {} });
    expect(() => readFileSync(resolve(targetRoot, 'skills/retire/SKILL.md'))).toThrow();
    expect(() => manageGlobalAgentToolkit({
      mode: 'check', sourceRoot, targetRoot, log: () => {},
    })).not.toThrow();
  });

  it('rejects symlinks in managed destinations', () => {
    const targetRoot = temporaryTarget();
    manageGlobalAgentToolkit({ mode: 'install', targetRoot, log: () => {} });
    const managedFile = resolve(targetRoot, 'skills/shadow-architecture/SKILL.md');
    const externalFile = resolve(temporaryTarget(), 'missing-external.md');
    unlinkSync(managedFile);
    symlinkSync(externalFile, managedFile);

    expect(() => manageGlobalAgentToolkit({
      mode: 'check', targetRoot, log: () => {},
    })).toThrow('Refusing a symlink');
  });

  it('rejects symlinks in sources and managed roots', () => {
    const sourceRoot = toolkitFixture([
      { source: 'skills/example/SKILL.md', destination: 'skills/example/SKILL.md' },
    ]);
    const sourceFile = resolve(sourceRoot, 'skills/example/SKILL.md');
    const externalFile = resolve(temporaryTarget(), 'external.md');
    writeFileSync(externalFile, 'external\n');
    unlinkSync(sourceFile);
    symlinkSync(externalFile, sourceFile);
    expect(() => manageGlobalAgentToolkit({
      mode: 'install', sourceRoot, targetRoot: temporaryTarget(), log: () => {},
    })).toThrow('Refusing a symlink');

    const rootContainer = temporaryTarget();
    const realRoot = resolve(rootContainer, 'real');
    const linkedRoot = resolve(rootContainer, 'linked');
    mkdirSync(realRoot);
    symlinkSync(realRoot, linkedRoot);
    expect(() => manageGlobalAgentToolkit({
      mode: 'check', targetRoot: linkedRoot, log: () => {},
    })).toThrow('Refusing a symlink as a managed root');
  });
});