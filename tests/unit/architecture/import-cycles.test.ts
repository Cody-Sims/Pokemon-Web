import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

interface AliasMapping {
  specifierPrefix: string;
  targetPrefix: string;
}

type ImportGraph = Map<string, string[]>;

const repoRoot = process.cwd();
const frontendRoot = path.join(repoRoot, 'frontend');
const sourceRoot = path.join(frontendRoot, 'src');
const extensions = ['.ts', '.tsx'];

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function collectSourceFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = entries.flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    if (entry.isFile() && extensions.some(extension => entry.name.endsWith(extension)) && !entry.name.endsWith('.d.ts')) {
      return [path.normalize(fullPath)];
    }
    return [];
  });
  return files.sort();
}

function readAliasMappings(): AliasMapping[] {
  const tsconfigPath = path.join(frontendRoot, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8')) as TsConfig;
  const baseUrl = path.resolve(frontendRoot, tsconfig.compilerOptions?.baseUrl ?? '.');
  const paths = tsconfig.compilerOptions?.paths ?? {};

  return Object.entries(paths).flatMap(([specifierPattern, targetPatterns]) => {
    const firstTarget = targetPatterns[0];
    if (!firstTarget) return [];
    return [{
      specifierPrefix: specifierPattern.replace(/\*$/, ''),
      targetPrefix: path.resolve(baseUrl, firstTarget.replace(/\*$/, '')),
    }];
  });
}

function resolveImport(specifier: string, importer: string, sourceFiles: ReadonlySet<string>, aliases: AliasMapping[]): string | undefined {
  const basePath = resolveBasePath(specifier, importer, aliases);
  if (!basePath) return undefined;

  for (const candidate of candidatePaths(basePath)) {
    const normalized = path.normalize(candidate);
    if (sourceFiles.has(normalized)) return normalized;
  }

  return undefined;
}

function resolveBasePath(specifier: string, importer: string, aliases: AliasMapping[]): string | undefined {
  if (specifier.startsWith('.')) return path.resolve(path.dirname(importer), specifier);

  for (const alias of aliases) {
    const bareSpecifier = alias.specifierPrefix.endsWith('/')
      ? alias.specifierPrefix.slice(0, -1)
      : alias.specifierPrefix;
    if (specifier === bareSpecifier) return alias.targetPrefix;
    if (specifier.startsWith(alias.specifierPrefix)) {
      return path.join(alias.targetPrefix, specifier.slice(alias.specifierPrefix.length));
    }
  }

  return undefined;
}

function candidatePaths(basePath: string): string[] {
  if (extensions.some(extension => basePath.endsWith(extension))) {
    return [basePath];
  }

  return [
    ...extensions.map(extension => `${basePath}${extension}`),
    ...extensions.map(extension => path.join(basePath, `index${extension}`)),
  ];
}

function importDeclarationHasRuntimeBinding(node: ts.ImportDeclaration): boolean {
  const importClause = node.importClause;
  if (!importClause) return true;
  if (importClause.isTypeOnly) return false;
  if (importClause.name) return true;

  const namedBindings = importClause.namedBindings;
  if (!namedBindings) return false;
  if (ts.isNamespaceImport(namedBindings)) return true;
  return namedBindings.elements.some(element => !element.isTypeOnly);
}

function exportDeclarationHasRuntimeBinding(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) return false;
  const exportClause = node.exportClause;
  if (!exportClause) return true;
  if (ts.isNamespaceExport(exportClause)) return true;
  return exportClause.elements.some(element => !element.isTypeOnly);
}

function getRuntimeImportSpecifiers(filePath: string): string[] {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node)
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
      && importDeclarationHasRuntimeBinding(node)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node)
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
      && exportDeclarationHasRuntimeBinding(node)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [firstArgument] = node.arguments;
      if (firstArgument && ts.isStringLiteral(firstArgument)) {
        specifiers.push(firstArgument.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function buildImportGraph(): ImportGraph {
  const sourceFiles = collectSourceFiles(sourceRoot);
  const sourceFileSet = new Set(sourceFiles);
  const aliases = readAliasMappings();

  return new Map(sourceFiles.map(filePath => {
    const imports = getRuntimeImportSpecifiers(filePath)
      .map(specifier => resolveImport(specifier, filePath, sourceFileSet, aliases))
      .filter((resolved): resolved is string => resolved !== undefined)
      .sort();
    return [filePath, imports];
  }));
}

function findCycles(graph: ImportGraph): string[][] {
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (filePath: string): void => {
    state.set(filePath, 'visiting');
    stack.push(filePath);

    for (const dependency of graph.get(filePath) ?? []) {
      const dependencyState = state.get(dependency);
      if (!dependencyState) {
        visit(dependency);
      } else if (dependencyState === 'visiting') {
        const cycleStart = stack.indexOf(dependency);
        if (cycleStart >= 0) {
          cycles.push([...stack.slice(cycleStart), dependency]);
        }
      }
    }

    stack.pop();
    state.set(filePath, 'visited');
  };

  for (const filePath of graph.keys()) {
    if (!state.has(filePath)) visit(filePath);
  }

  return cycles;
}

function formatCycle(cycle: string[]): string {
  return cycle.map(filePath => toPosix(path.relative(repoRoot, filePath))).join(' -> ');
}

describe('frontend production import graph', () => {
  it('does not contain runtime import cycles', () => {
    const cycles = findCycles(buildImportGraph());
    const formattedCycles = cycles.map(formatCycle).join('\n');

    expect(cycles, `Expected zero production import cycles. Found:\n${formattedCycles}`).toEqual([]);
  });
});
