/**
 * Template loader: reads .txt map template files and parses metadata + character grid.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface TemplateMetadata {
  name: string;
  width: number;
  height: number;
  anchor?: { x: number; y: number; label: string };
  description?: string;
}

export interface MapTemplate {
  meta: TemplateMetadata;
  grid: string[];   // character rows
}

/**
 * Parse a template file's metadata comments.
 * Expected comment format:
 *   # dim: WxH
 *   # anchor: label at (X,Y)
 *   # desc: Description text
 */
function parseMetadata(lines: string[], fileName: string): TemplateMetadata {
  const meta: TemplateMetadata = {
    name: path.basename(fileName, '.txt'),
    width: 0,
    height: 0,
  };

  for (const line of lines) {
    if (!line.startsWith('#')) continue;
    const content = line.slice(1).trim();

    const dimMatch = content.match(/^dim:\s*(\d+)x(\d+)/i);
    if (dimMatch) {
      meta.width = parseInt(dimMatch[1], 10);
      meta.height = parseInt(dimMatch[2], 10);
    }

    const anchorMatch = content.match(/^anchor:\s*(.+?)\s+at\s+\((\d+),(\d+)\)/i);
    if (anchorMatch) {
      meta.anchor = {
        label: anchorMatch[1],
        x: parseInt(anchorMatch[2], 10),
        y: parseInt(anchorMatch[3], 10),
      };
    }

    const descMatch = content.match(/^desc:\s*(.+)/i);
    if (descMatch) {
      meta.description = descMatch[1];
    }
  }

  return meta;
}

/**
 * Load a single template file.
 */
export function loadTemplate(filePath: string): MapTemplate {
  const content = fs.readFileSync(filePath, 'utf-8');
  const allLines = content.split('\n').map(l => l.trimEnd());

  // Separate metadata lines (# comments) from grid lines
  const metaLines = allLines.filter(l => l.startsWith('#'));
  const gridLines = allLines.filter(l => l.length > 0 && !l.startsWith('#'));

  const meta = parseMetadata(metaLines, filePath);

  // Auto-detect dimensions from the grid if not declared
  if (meta.height === 0) meta.height = gridLines.length;
  if (meta.width === 0 && gridLines.length > 0) {
    meta.width = Math.max(...gridLines.map(r => [...r].length));
  }

  return { meta, grid: gridLines };
}

/**
 * Load all templates from a directory (recursively).
 */
export function loadTemplateDir(dirPath: string): Map<string, MapTemplate> {
  const templates = new Map<string, MapTemplate>();

  function scanDir(dir: string, prefix: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.txt')) {
        const key = prefix
          ? `${prefix}/${entry.name.replace('.txt', '')}`
          : entry.name.replace('.txt', '');
        templates.set(key, loadTemplate(fullPath));
      }
    }
  }

  scanDir(dirPath, '');
  return templates;
}
