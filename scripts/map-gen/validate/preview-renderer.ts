#!/usr/bin/env npx tsx
/**
 * Map Preview Renderer — generates PPM images from map source files.
 *
 * Usage:
 *   npx tsx scripts/map-gen/validate/preview-renderer.ts [mapKey]  — render one map
 *   npx tsx scripts/map-gen/validate/preview-renderer.ts --all     — render all maps
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TILE_SIZE = 8; // pixels per tile

// ── Paths ──
const MAPS_DIR = path.resolve(__dirname, '../../../frontend/src/data/maps');
const TILES_FILE = path.join(MAPS_DIR, 'tiles.ts');
const PARSER_FILE = path.join(MAPS_DIR, 'map-parser.ts');
const METADATA_FILE = path.join(MAPS_DIR, 'tile-metadata.ts');
const OUTPUT_DIR = path.resolve(__dirname, '../../../temp/map-previews');
const SUBDIRS = ['cities', 'routes', 'dungeons', 'interiors'];

// ── ANSI helpers ──
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ── Parse Tile enum from tiles.ts ──
function parseTileEnum(): Record<string, number> {
  const src = fs.readFileSync(TILES_FILE, 'utf8');
  const tileEnum: Record<string, number> = {};
  // Match lines like `  GRASS:       0,` or `  GRASS: 0,`
  const re = /(\w+)\s*:\s*(\d+)/g;
  // Only parse inside the Tile object literal
  const objStart = src.indexOf('const Tile');
  if (objStart === -1) return tileEnum;
  const objBlock = src.slice(objStart);
  let m: RegExpExecArray | null;
  while ((m = re.exec(objBlock)) !== null) {
    tileEnum[m[1]] = Number(m[2]);
  }
  return tileEnum;
}

// ── Parse CHAR_TO_TILE from map-parser.ts ──
function parseCharToTile(tileEnum: Record<string, number>): Record<string, number> {
  const src = fs.readFileSync(PARSER_FILE, 'utf8');
  const mapping: Record<string, number> = {};
  // Match lines like `  '.': Tile.GRASS,` or `  'T': Tile.TREE,`
  const re = /['"](.)['"]\s*:\s*Tile\.(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const ch = m[1];
    const tileName = m[2];
    if (tileName in tileEnum) {
      mapping[ch] = tileEnum[tileName];
    }
  }
  return mapping;
}

// ── Parse TILE_COLORS from tile-metadata.ts ──
function parseTileColors(tileEnum: Record<string, number>): Record<number, number> {
  const src = fs.readFileSync(METADATA_FILE, 'utf8');
  const colors: Record<number, number> = {};
  // Match lines like `  [Tile.GRASS]:      0x5a9e3e,`
  const re = /\[Tile\.(\w+)\]\s*:\s*(0x[0-9a-fA-F]+)/g;
  // Scope to the TILE_COLORS block
  const blockStart = src.indexOf('TILE_COLORS');
  if (blockStart === -1) return colors;
  const block = src.slice(blockStart);
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const tileName = m[1];
    const hex = parseInt(m[2], 16);
    if (tileName in tileEnum) {
      colors[tileEnum[tileName]] = hex;
    }
  }
  return colors;
}

// ── Map source parsing helpers (same approach as map-validator.ts) ──

function extractParseMapRows(content: string): string[] | null {
  const m = content.match(/parseMap\(\[\s*([\s\S]*?)\]\s*\)/);
  if (!m) return null;
  const block = m[1];
  const rowMatches = block.match(/['`]([^'`]+)['`]/g);
  if (!rowMatches) return null;
  return rowMatches.map(r => r.slice(1, -1));
}

function extractDimensions(content: string): { width: number; height: number } | null {
  const wm = content.match(/width\s*:\s*(\d+)/);
  const hm = content.match(/height\s*:\s*(\d+)/);
  if (!wm || !hm) return null;
  return { width: Number(wm[1]), height: Number(hm[1]) };
}

interface WarpDef { tileX: number; tileY: number }
function extractWarps(content: string): WarpDef[] {
  const warps: WarpDef[] = [];
  const warpBlock = content.match(/warps\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?:spawnPoints|$)/);
  if (!warpBlock) return warps;
  const re = /tileX\s*:\s*(\d+)\s*,\s*tileY\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(warpBlock[1])) !== null) {
    warps.push({ tileX: Number(m[1]), tileY: Number(m[2]) });
  }
  return warps;
}

interface Placement { id: string; tileX: number; tileY: number }
function extractPlacements(content: string, section: 'npcs' | 'trainers'): Placement[] {
  const placements: Placement[] = [];
  const sectionIdx = content.indexOf(`${section}:`);
  if (sectionIdx === -1) return placements;
  const startBracket = content.indexOf('[', sectionIdx);
  if (startBracket === -1) return placements;
  let depth = 0;
  let endBracket = -1;
  for (let i = startBracket; i < content.length; i++) {
    if (content[i] === '[') depth++;
    else if (content[i] === ']') { depth--; if (depth === 0) { endBracket = i; break; } }
  }
  if (endBracket === -1) return placements;
  const block = content.slice(startBracket, endBracket + 1);
  const re = /id\s*:\s*['"]([^'"]+)['"]\s*,[\s\S]*?tileX\s*:\s*(\d+)\s*,\s*tileY\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    placements.push({ id: m[1], tileX: Number(m[2]), tileY: Number(m[3]) });
  }
  return placements;
}

interface SpawnPt { id: string; x: number; y: number }
function extractSpawnPoints(content: string): SpawnPt[] {
  const spawns: SpawnPt[] = [];
  const spBlock = content.match(/spawnPoints\s*:\s*\{([\s\S]*?)\}\s*,?\s*\}/);
  if (!spBlock) return spawns;
  const re = /['"]([^'"]+)['"]\s*:\s*\{\s*x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(spBlock[1])) !== null) {
    spawns.push({ id: m[1], x: Number(m[2]), y: Number(m[3]) });
  }
  return spawns;
}

// ── PPM rendering ──

type RGB = [number, number, number];

function hexToRgb(hex: number): RGB {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

const DEFAULT_COLOR: RGB = [128, 128, 128]; // gray fallback for unknown tiles
const WARP_COLOR: RGB = [0xff, 0x00, 0xff];     // magenta
const NPC_COLOR: RGB = [0x00, 0xff, 0xff];      // cyan
const TRAINER_COLOR: RGB = [0xff, 0x00, 0x00];  // red
const SPAWN_COLOR: RGB = [0x00, 0xff, 0x00];    // green
const GRID_COLOR: RGB = [0, 0, 0];              // black

function renderMap(
  grid: number[][],
  width: number,
  height: number,
  tileColors: Record<number, number>,
  warps: WarpDef[],
  npcs: Placement[],
  trainers: Placement[],
  spawns: SpawnPt[],
  drawGrid: boolean,
): Buffer {
  const imgW = width * TILE_SIZE;
  const imgH = height * TILE_SIZE;
  const pixels = Buffer.alloc(imgW * imgH * 3);

  // Build lookup sets for feature positions
  const warpSet = new Set(warps.map(w => `${w.tileX},${w.tileY}`));
  const npcSet = new Set(npcs.map(n => `${n.tileX},${n.tileY}`));
  const trainerSet = new Set(trainers.map(t => `${t.tileX},${t.tileY}`));
  const spawnSet = new Set(spawns.map(s => `${s.x},${s.y}`));

  // Fill tile colors
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const tileId = grid[ty]?.[tx] ?? 0;
      const rgb = tileId in tileColors ? hexToRgb(tileColors[tileId]) : DEFAULT_COLOR;
      const px0 = tx * TILE_SIZE;
      const py0 = ty * TILE_SIZE;

      for (let dy = 0; dy < TILE_SIZE; dy++) {
        for (let dx = 0; dx < TILE_SIZE; dx++) {
          const idx = ((py0 + dy) * imgW + (px0 + dx)) * 3;
          pixels[idx] = rgb[0];
          pixels[idx + 1] = rgb[1];
          pixels[idx + 2] = rgb[2];
        }
      }
    }
  }

  // Draw grid overlay (1px black lines on the right and bottom edges of each tile)
  if (drawGrid) {
    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const px0 = tx * TILE_SIZE;
        const py0 = ty * TILE_SIZE;
        // Right edge
        if (tx < width - 1) {
          const dx = TILE_SIZE - 1;
          for (let dy = 0; dy < TILE_SIZE; dy++) {
            const idx = ((py0 + dy) * imgW + (px0 + dx)) * 3;
            pixels[idx] = GRID_COLOR[0];
            pixels[idx + 1] = GRID_COLOR[1];
            pixels[idx + 2] = GRID_COLOR[2];
          }
        }
        // Bottom edge
        if (ty < height - 1) {
          const dy = TILE_SIZE - 1;
          for (let dx = 0; dx < TILE_SIZE; dx++) {
            const idx = ((py0 + dy) * imgW + (px0 + dx)) * 3;
            pixels[idx] = GRID_COLOR[0];
            pixels[idx + 1] = GRID_COLOR[1];
            pixels[idx + 2] = GRID_COLOR[2];
          }
        }
      }
    }
  }

  // Helper: draw a 1px border around a tile
  function drawBorder(tx: number, ty: number, color: RGB): void {
    const px0 = tx * TILE_SIZE;
    const py0 = ty * TILE_SIZE;
    for (let d = 0; d < TILE_SIZE; d++) {
      // Top & bottom
      for (const dy of [0, TILE_SIZE - 1]) {
        const idx = ((py0 + dy) * imgW + (px0 + d)) * 3;
        pixels[idx] = color[0]; pixels[idx + 1] = color[1]; pixels[idx + 2] = color[2];
      }
      // Left & right
      for (const dx of [0, TILE_SIZE - 1]) {
        const idx = ((py0 + d) * imgW + (px0 + dx)) * 3;
        pixels[idx] = color[0]; pixels[idx + 1] = color[1]; pixels[idx + 2] = color[2];
      }
    }
  }

  // Helper: draw a 3x3 centered dot on a tile
  function drawDot(tx: number, ty: number, color: RGB): void {
    const cx = tx * TILE_SIZE + Math.floor(TILE_SIZE / 2);
    const cy = ty * TILE_SIZE + Math.floor(TILE_SIZE / 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
          const idx = (py * imgW + px) * 3;
          pixels[idx] = color[0]; pixels[idx + 1] = color[1]; pixels[idx + 2] = color[2];
        }
      }
    }
  }

  // Mark warps (border)
  for (const w of warps) {
    if (w.tileX >= 0 && w.tileX < width && w.tileY >= 0 && w.tileY < height) {
      drawBorder(w.tileX, w.tileY, WARP_COLOR);
    }
  }

  // Mark NPCs (dot)
  for (const n of npcs) {
    if (n.tileX >= 0 && n.tileX < width && n.tileY >= 0 && n.tileY < height) {
      drawDot(n.tileX, n.tileY, NPC_COLOR);
    }
  }

  // Mark trainers (dot)
  for (const t of trainers) {
    if (t.tileX >= 0 && t.tileX < width && t.tileY >= 0 && t.tileY < height) {
      drawDot(t.tileX, t.tileY, TRAINER_COLOR);
    }
  }

  // Mark spawn points (dot)
  for (const s of spawns) {
    if (s.x >= 0 && s.x < width && s.y >= 0 && s.y < height) {
      drawDot(s.x, s.y, SPAWN_COLOR);
    }
  }

  // Build PPM P6 binary
  const header = `P6\n${imgW} ${imgH}\n255\n`;
  const headerBuf = Buffer.from(header, 'ascii');
  return Buffer.concat([headerBuf, pixels]);
}

// ── Discover map files ──
function discoverMapFiles(): { subdir: string; filePath: string }[] {
  const files: { subdir: string; filePath: string }[] = [];
  for (const sub of SUBDIRS) {
    const dir = path.join(MAPS_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.ts') && !f.startsWith('index')) {
        files.push({ subdir: sub, filePath: path.join(dir, f) });
      }
    }
  }
  return files;
}

// ── Process a single map ──
function processMap(
  filePath: string,
  charToTile: Record<string, number>,
  tileColors: Record<number, number>,
  drawGrid: boolean,
): boolean {
  const name = path.basename(filePath, '.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  const rows = extractParseMapRows(content);
  if (!rows) {
    console.log(`  ${YELLOW}⚠ ${name}: no parseMap block found, skipping${RESET}`);
    return false;
  }
  const dims = extractDimensions(content);
  if (!dims) {
    console.log(`  ${YELLOW}⚠ ${name}: no width/height found, skipping${RESET}`);
    return false;
  }

  const { width, height } = dims;
  const grid = rows.map(row => [...row].map(ch => charToTile[ch] ?? 0));
  const warps = extractWarps(content);
  const npcs = extractPlacements(content, 'npcs');
  const trainers = extractPlacements(content, 'trainers');
  const spawns = extractSpawnPoints(content);

  const ppm = renderMap(grid, width, height, tileColors, warps, npcs, trainers, spawns, drawGrid);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `${name}.ppm`);
  fs.writeFileSync(outPath, ppm);

  const features: string[] = [];
  if (warps.length) features.push(`${warps.length} warps`);
  if (npcs.length) features.push(`${npcs.length} NPCs`);
  if (trainers.length) features.push(`${trainers.length} trainers`);
  if (spawns.length) features.push(`${spawns.length} spawns`);
  const featureStr = features.length ? ` (${features.join(', ')})` : '';

  console.log(`  ${GREEN}✓${RESET} ${name} ${DIM}${width}×${height}${RESET}${featureStr} → ${DIM}${path.relative(process.cwd(), outPath)}${RESET}`);
  return true;
}

// ── Main ──
function main(): void {
  const arg = process.argv[2];
  const drawGrid = process.argv.includes('--grid');

  if (!arg || (arg !== '--all' && arg.startsWith('-') && arg !== '--grid')) {
    console.log(`${BOLD}Map Preview Renderer${RESET}`);
    console.log(`Usage:`);
    console.log(`  npx tsx preview-renderer.ts <mapKey>       render one map`);
    console.log(`  npx tsx preview-renderer.ts --all          render all maps`);
    console.log(`  Add --grid for tile grid overlay`);
    console.log(`\nOutput: temp/map-previews/<mapKey>.ppm`);
    process.exit(0);
  }

  // Parse mappings from source files
  console.log(`${BOLD}Map Preview Renderer${RESET}\n`);
  console.log(`${DIM}Parsing tile definitions...${RESET}`);

  const tileEnum = parseTileEnum();
  const tileCount = Object.keys(tileEnum).length;
  if (tileCount === 0) {
    console.error(`${RED}Failed to parse Tile enum from ${TILES_FILE}${RESET}`);
    process.exit(1);
  }

  const charToTile = parseCharToTile(tileEnum);
  const charCount = Object.keys(charToTile).length;
  if (charCount === 0) {
    console.error(`${RED}Failed to parse CHAR_TO_TILE from ${PARSER_FILE}${RESET}`);
    process.exit(1);
  }

  const tileColors = parseTileColors(tileEnum);
  const colorCount = Object.keys(tileColors).length;

  console.log(`  ${DIM}Tiles: ${tileCount}  Chars: ${charCount}  Colors: ${colorCount}${RESET}\n`);

  // Discover maps
  const mapFiles = discoverMapFiles();
  if (mapFiles.length === 0) {
    console.error(`${RED}No map files found in ${MAPS_DIR}${RESET}`);
    process.exit(1);
  }

  const filterKey = arg === '--all' ? null : arg;
  const toRender = filterKey
    ? mapFiles.filter(f => path.basename(f.filePath, '.ts') === filterKey)
    : mapFiles;

  if (toRender.length === 0) {
    console.error(`${RED}No map matching '${filterKey}'. Available maps:${RESET}`);
    for (const f of mapFiles) console.log(`  ${path.basename(f.filePath, '.ts')}`);
    process.exit(1);
  }

  console.log(`Rendering ${toRender.length} map(s)...`);
  if (drawGrid) console.log(`${DIM}Grid overlay enabled${RESET}`);
  console.log();

  let rendered = 0;
  for (const { filePath } of toRender) {
    if (processMap(filePath, charToTile, tileColors, drawGrid)) rendered++;
  }

  console.log(`\n${BOLD}Done.${RESET} ${rendered}/${toRender.length} maps rendered to ${DIM}${path.relative(process.cwd(), OUTPUT_DIR)}/${RESET}`);
}

main();
