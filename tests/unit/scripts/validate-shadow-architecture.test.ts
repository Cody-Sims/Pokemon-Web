import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateShadowArchitecture } from '../../../scripts/validate-shadow-architecture.mjs';

describe('shadow architecture validator', () => {
  function shadowFixture(materializeReferences = false): string {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'pokemon-web-shadow-'));
    const repositoryRoot = resolve(__dirname, '../../..');
    cpSync(resolve(repositoryRoot, '.shadow'), resolve(fixtureRoot, '.shadow'), {
      recursive: true,
    });
    if (materializeReferences) {
      const values = new Set<string>();
      for (const file of ['features.json', ...Array.from(
        { length: 8 },
        (_, index) => `decisions/DEC-${String(index + 1).padStart(4, '0')}.md`,
      )]) {
        const content = readFileSync(resolve(fixtureRoot, '.shadow', file), 'utf8');
        for (const match of content.matchAll(/"([^"\n]+)"/g)) {
          if (match[1].includes('/') || match[1].endsWith('.md') || match[1].endsWith('.json')) {
            values.add(match[1]);
          }
        }
      }
      for (const value of values) {
        const base = value.slice(0, value.search(/[?*[{]/) >= 0
          ? value.search(/[?*[{]/)
          : undefined).replace(/\/$/, '');
        if (!base || base.startsWith('DEC-')) continue;
        const path = resolve(fixtureRoot, base);
        if (/\.[a-z]+$/i.test(base)) {
          mkdirSync(resolve(path, '..'), { recursive: true });
          writeFileSync(path, '');
        } else {
          mkdirSync(path, { recursive: true });
        }
      }
    }
    return fixtureRoot;
  }

  it('accepts the repository decision graph', () => {
    expect(() => validateShadowArchitecture(resolve(__dirname, '../../..'))).not.toThrow();
  });

  it('rejects a noncanonical indexed decision path', () => {
    const fixtureRoot = shadowFixture();
    const indexPath = resolve(fixtureRoot, '.shadow/index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    index.records[0].path = '.shadow/DEC-0001.md';
    writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

    expect(() => validateShadowArchitecture(fixtureRoot)).toThrow(
      'record path must be .shadow/decisions/DEC-0001.md',
    );
  });

  it('rejects noncanonical files in the decision directory', () => {
    const fixtureRoot = shadowFixture();
    writeFileSync(resolve(fixtureRoot, '.shadow/decisions/notes.md'), 'notes\n');
    expect(() => validateShadowArchitecture(fixtureRoot)).toThrow(
      'Decision directory contains a noncanonical file',
    );
  });

  it('rejects directories and symlinks in the decision directory', () => {
    const directoryFixture = shadowFixture();
    mkdirSync(resolve(directoryFixture, '.shadow/decisions/nested'));
    expect(() => validateShadowArchitecture(directoryFixture)).toThrow(
      'Decision directory contains a non-file entry',
    );

    const symlinkFixture = shadowFixture();
    symlinkSync(
      resolve(symlinkFixture, '.shadow/README.md'),
      resolve(symlinkFixture, '.shadow/decisions/linked.md'),
    );
    expect(() => validateShadowArchitecture(symlinkFixture)).toThrow(
      'Decision directory contains a non-file entry',
    );
  });

  it('requires every feature to be reachable and every decision to be mapped', () => {
    const fixtureRoot = shadowFixture(true);
    const featuresPath = resolve(fixtureRoot, '.shadow/features.json');
    const features = JSON.parse(readFileSync(featuresPath, 'utf8'));
    features.nodes.push({ id: 'F99', name: 'Orphan', paths: [] });
    writeFileSync(featuresPath, `${JSON.stringify(features, null, 2)}\n`);
    expect(() => validateShadowArchitecture(fixtureRoot)).toThrow(
      'Every feature node must be reachable',
    );

    features.nodes.pop();
    for (const node of features.nodes) {
      node.decisions = (node.decisions ?? []).filter((id: string) => id !== 'DEC-0008');
    }
    writeFileSync(featuresPath, `${JSON.stringify(features, null, 2)}\n`);
    expect(() => validateShadowArchitecture(fixtureRoot)).toThrow(
      'DEC-0008: decision is not mapped to a feature',
    );
  });
});