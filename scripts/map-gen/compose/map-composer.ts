/**
 * Map Composer: places templates onto a canvas to build complete maps.
 * Operates at the character-grid level for maximum compatibility with parseMap().
 */
import * as path from 'node:path';
import { loadTemplate, loadTemplateDir, type MapTemplate } from './template-loader';

export interface Placement {
  template: string;    // template key (path relative to templates dir, without .txt)
  x: number;           // column offset on canvas
  y: number;           // row offset on canvas
  biome?: string;      // optional biome substitution for this placement
}

export interface PathSegment {
  from: { x: number; y: number };
  to: { x: number; y: number };
  char: string;        // character to use for path (default 'P')
  width?: number;      // path width in tiles (default 1)
}

export interface WarpDef {
  tileX: number;
  tileY: number;
  targetMap: string;
  targetSpawnId: string;
  requireFlag?: string;
}

export interface NpcDef {
  id: string;
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: 'up' | 'down' | 'left' | 'right';
  dialogue: string[];
}

export interface SpawnDef {
  id: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface MapComposition {
  name: string;
  width: number;
  height: number;
  fill: string;          // default fill character (e.g., '.' for grass)
  border: string;        // border character (e.g., 'T' for trees)
  borderWidth?: number;  // border thickness (default 1)
  placements: Placement[];
  paths: PathSegment[];
  warps: WarpDef[];
  npcs: NpcDef[];
  spawns: SpawnDef[];
  openBorders?: Array<{ side: 'north' | 'south' | 'east' | 'west'; from: number; to: number }>;
}

/**
 * Build a character grid from a MapComposition descriptor.
 */
export function composeMap(
  composition: MapComposition,
  templatesDir: string,
): string[] {
  const { width, height, fill, border, borderWidth = 1 } = composition;

  // 1. Initialize canvas with fill character
  const canvas: string[][] = [];
  for (let y = 0; y < height; y++) {
    canvas.push(new Array(width).fill(fill));
  }

  // 2. Draw border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder =
        x < borderWidth || x >= width - borderWidth ||
        y < borderWidth || y >= height - borderWidth;
      if (onBorder) canvas[y][x] = border;
    }
  }

  // 3. Open borders where specified (e.g., exits to adjacent maps)
  for (const ob of composition.openBorders ?? []) {
    for (let i = ob.from; i <= ob.to; i++) {
      switch (ob.side) {
        case 'north':
          for (let b = 0; b < borderWidth; b++) canvas[b][i] = fill;
          break;
        case 'south':
          for (let b = 0; b < borderWidth; b++) canvas[height - 1 - b][i] = fill;
          break;
        case 'west':
          for (let b = 0; b < borderWidth; b++) canvas[i][b] = fill;
          break;
        case 'east':
          for (let b = 0; b < borderWidth; b++) canvas[i][width - 1 - b] = fill;
          break;
      }
    }
  }

  // 4. Load templates and stamp placements
  const templates = loadTemplateDir(templatesDir);

  for (const placement of composition.placements) {
    let tmpl = templates.get(placement.template);
    if (!tmpl) {
      // Try loading directly as a file path
      const directPath = path.join(templatesDir, placement.template + '.txt');
      try {
        tmpl = loadTemplate(directPath);
      } catch {
        console.warn(`Template not found: ${placement.template}`);
        continue;
      }
    }
    stampTemplate(canvas, tmpl, placement.x, placement.y);
  }

  // 5. Draw paths
  for (const seg of composition.paths) {
    drawPath(canvas, seg);
  }

  // Convert to string rows
  return canvas.map(row => row.join(''));
}

/**
 * Stamp a template onto the canvas at the given offset.
 */
function stampTemplate(
  canvas: string[][],
  template: MapTemplate,
  ox: number,
  oy: number,
): void {
  for (let y = 0; y < template.grid.length; y++) {
    const chars = [...template.grid[y]];
    for (let x = 0; x < chars.length; x++) {
      const cy = oy + y;
      const cx = ox + x;
      if (cy >= 0 && cy < canvas.length && cx >= 0 && cx < canvas[0].length) {
        canvas[cy][cx] = chars[x];
      }
    }
  }
}

/**
 * Draw a path segment between two points using Bresenham-like stepping.
 * Supports multi-tile width paths.
 */
function drawPath(canvas: string[][], seg: PathSegment): void {
  const { from, to, char, width: pathWidth = 1 } = seg;
  const halfW = Math.floor(pathWidth / 2);

  // Use L-shaped path: horizontal first, then vertical
  const xDir = to.x > from.x ? 1 : to.x < from.x ? -1 : 0;
  const yDir = to.y > from.y ? 1 : to.y < from.y ? -1 : 0;

  // Horizontal segment
  let x = from.x;
  while (x !== to.x) {
    for (let w = -halfW; w <= halfW; w++) {
      setCell(canvas, x, from.y + w, char);
    }
    x += xDir;
  }

  // Vertical segment
  let y = from.y;
  while (y !== to.y + yDir) {
    for (let w = -halfW; w <= halfW; w++) {
      setCell(canvas, to.x + w, y, char);
    }
    y += yDir;
  }
}

function setCell(canvas: string[][], x: number, y: number, ch: string): void {
  if (y >= 0 && y < canvas.length && x >= 0 && x < canvas[0].length) {
    canvas[y][x] = ch;
  }
}
