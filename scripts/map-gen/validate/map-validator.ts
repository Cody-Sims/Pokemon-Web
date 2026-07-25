#!/usr/bin/env npx tsx
/**
 * Map Validator — comprehensive validation for all map files.
 *
 * Usage:
 *   npx tsx scripts/map-gen/validate/map-validator.ts          # validate all maps
 *   npx tsx scripts/map-gen/validate/map-validator.ts route-1  # validate one map
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── ANSI helpers ──
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ── Valid characters (from CHAR_TO_TILE in map-parser.ts) ──
const VALID_CHARS = new Set([
  '.', 'P', 'G', 'T', 'W', 'H', 'R', 'D', 'F', 'f', 'S', 'L', 'B', 'E',
  'J', 'c', 'C', 'e', 'm', 'M', 'n', 'g', 'A', 'a', 'X', '_', '#', 'k',
  't', 'b', 'r', 'v', 'p', 'h', 'w', 'i', 'o', 'y', 'z', 'V', 'Z', 'N',
  'U', 'O', 'K', 'I', 'Y', 'l', 'x', 'd', 'j', 'u', 'q', 'Q', 's', '~',
  '%', '^', ',', ';', '&', '@', '$', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', 'Ø', 'µ', 'Þ', '=', '|', 'Ʃ', 'Ɯ', 'π', 'Ω', '¡', '¢',
  '£', '¤', '¥', '¦', '§', '†', '‡', '®', '©', '°', 'Ð', 'ð', 'Æ',
  '«', '»', '±', 'Ŧ', 'Ħ', 'Đ', 'Ŋ', 'Ɖ', 'ƫ', '¬', '÷', '×', 'Ł', 'Ý',
  // Phase 0 of Map-improvements.md: field-ability target tiles
  '>', '*', '+',
]);

// ── Char → tile-id mapping (mirrors CHAR_TO_TILE) ──
const CHAR_TO_TILE: Record<string, number> = {
  '.': 0, P: 1, G: 2, T: 3, W: 4, H: 5, R: 6, D: 7, F: 8, f: 9,
  S: 10, L: 11, B: 12, E: 13, J: 14, c: 15, C: 16, e: 17, m: 18,
  M: 19, n: 20, g: 21, A: 22, a: 23, X: 24, _: 25, '#': 26, k: 27,
  t: 28, b: 29, r: 30, v: 31, p: 32, h: 33, w: 34, i: 35, o: 36,
  y: 37, z: 38, V: 39, Z: 40, N: 41, U: 42, O: 43, K: 44, I: 45,
  Y: 46, l: 47, x: 48, d: 49, j: 50, u: 51, q: 52, Q: 53, s: 54,
  '~': 55, '%': 56, '^': 57, ',': 58, ';': 59,
  '&': 60, '@': 61, '$': 62,
  '1': 63, '2': 64, '3': 65, '4': 66, '5': 67,
  '6': 68, '7': 69, '8': 70, '9': 71,
  'Ø': 72, 'µ': 73, 'Þ': 74, '=': 75, '|': 76,
  'Ʃ': 77, 'Ɯ': 78, 'π': 79, 'Ω': 80,
  '¡': 81, '¢': 82, '£': 83, '¤': 84, '¥': 85, '¦': 86, '§': 87,
  '†': 88, '‡': 89, '®': 90, '©': 91, '°': 92,
  'Ð': 93, 'ð': 94, 'Æ': 95,
  '«': 96, '»': 97, '±': 98,
  'Ŧ': 99, 'Ħ': 100, 'Đ': 101, 'Ŋ': 102, 'Ɖ': 103, 'ƫ': 104,
  '¬': 105, '÷': 106, '×': 107, 'Ł': 108, 'Ý': 109,
  // Phase 0: field-ability targets
  '>': 110, '*': 111, '+': 112,
};

// Tile IDs for the field-ability target tiles (mirrors Tile.* constants).
const CUT_TREE_ID = 110;
const CRACKED_ROCK_ID = 111;
const STRENGTH_BOULDER_ID = 112;
const FIELD_ABILITY_TILES = new Set<number>([CUT_TREE_ID, CRACKED_ROCK_ID, STRENGTH_BOULDER_ID]);

// ── Solid (non-walkable) tile IDs ──
const SOLID_TILES = new Set<number>([
  3, 4, 5, 6, 8, 10, 11, 12, 15, 16, 18, 19, 21, 22, 24,
  26, 27, 28, 29, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42,
  44, 46, 48, 49, 50, 52, 55, 56, 57, 59,
  60, 61, 62, 63, 64, 65,
  71, 73, 74, 76, 78, 79, 80,
  82, 83, 84, 86,
  88, 90, 91, 94, 95, 97, 98,
  100, 102, 103, 104, 106, 108, 109,
  110, 111, 112,
]);

// ── Types ──
interface Issue {
  type: 'error' | 'warning';
  check: string;
  message: string;
}

interface MapResult {
  name: string;
  file: string;
  category: string;
  mapKey?: string;
  spawnIds: Set<string>;
  warps: WarpDef[];
  issues: Issue[];
}

// ── Paths ──
const MAPS_DIR = path.resolve(__dirname, '../../../frontend/src/data/maps');
const SUBDIRS = ['cities', 'routes', 'dungeons', 'interiors'];

// ── Source parsing helpers ──

function extractParseMapRows(content: string): string[] | null {
  // Match parseMap([ ... ]) — capture the inner block
  const m = content.match(/parseMap\(\[\s*([\s\S]*?)\]\s*\)/);
  if (!m) return null;
  const block = m[1];
  // Extract each quoted string (single or backtick)
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

interface WarpDef {
  tileX: number;
  tileY: number;
  targetMap?: string;
  targetSpawn?: string;
}
function extractWarps(content: string): WarpDef[] {
  const warps: WarpDef[] = [];
  // Find the warps: [ ... ] block
  const warpBlock = content.match(/warps\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?:spawnPoints|$)/);
  if (!warpBlock) return warps;
  // Iterate object literals one at a time so we can pair tileX/tileY with their targetMap/targetSpawn.
  const objRe = /\{([^{}]*)\}/g;
  let obj: RegExpExecArray | null;
  while ((obj = objRe.exec(warpBlock[1])) !== null) {
    const body = obj[1];
    const xMatch = body.match(/tileX\s*:\s*(\d+)/);
    const yMatch = body.match(/tileY\s*:\s*(\d+)/);
    if (!xMatch || !yMatch) continue;
    const tMap = body.match(/targetMap\s*:\s*['"]([^'"]+)['"]/);
    const tSpawn = body.match(/targetSpawn\s*:\s*['"]([^'"]+)['"]/);
    warps.push({
      tileX: Number(xMatch[1]),
      tileY: Number(yMatch[1]),
      targetMap: tMap?.[1],
      targetSpawn: tSpawn?.[1],
    });
  }
  return warps;
}

interface Placement { id: string; tileX: number; tileY: number; }
function extractPlacements(content: string, section: 'npcs' | 'trainers' | 'objects'): Placement[] {
  const placements: NpcPlacement[] = [];
  // Find section array block — look for npcs: [ ... ] or trainers: [ ... ]
  // We use a broad regex that finds the section and captures objects within
  const sectionIdx = content.indexOf(`${section}:`);
  if (sectionIdx === -1) return placements;
  // Find balanced bracket extent
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

interface SpawnPt { id: string; x: number; y: number; }
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

// ── Connectivity via flood-fill ──
function countConnectedRegions(grid: number[][], width: number, height: number): number {
  const visited = Array.from({ length: height }, () => new Uint8Array(width));
  let regions = 0;

  function flood(startR: number, startC: number): void {
    const stack: [number, number][] = [[startR, startC]];
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (r < 0 || r >= height || c < 0 || c >= width) continue;
      if (visited[r][c]) continue;
      if (SOLID_TILES.has(grid[r][c])) continue;
      visited[r][c] = 1;
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!visited[r][c] && !SOLID_TILES.has(grid[r][c])) {
        flood(r, c);
        regions++;
      }
    }
  }
  return regions;
}

// ── Build tile grid from rows ──
function buildGrid(rows: string[]): number[][] {
  return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? 0));
}

// ── Validate a single map ──
function validateMap(filePath: string, category: string): MapResult {
  const name = path.basename(filePath, '.ts');
  const result: MapResult = {
    name,
    file: filePath,
    category,
    spawnIds: new Set(),
    warps: [],
    issues: [],
  };
  const add = (type: Issue['type'], check: string, message: string) =>
    result.issues.push({ type, check, message });

  const content = fs.readFileSync(filePath, 'utf8');

  // Extract data
  const rows = extractParseMapRows(content);
  if (!rows) {
    add('error', 'parse', 'Could not find parseMap([...]) block');
    return result;
  }
  const dims = extractDimensions(content);
  if (!dims) {
    add('error', 'parse', 'Could not extract width/height from MapDefinition');
    return result;
  }

  const { width, height } = dims;
  const warps = extractWarps(content);
  const npcs = extractPlacements(content, 'npcs');
  const trainers = extractPlacements(content, 'trainers');
  const objects = extractPlacements(content, 'objects');
  const spawns = extractSpawnPoints(content);
  const grid = buildGrid(rows);

  // Surface details for cross-map checks done in main()
  result.warps = warps;
  result.spawnIds = new Set(spawns.map(s => s.id));
  const keyMatch = content.match(/key\s*:\s*['"]([^'"]+)['"]/);
  if (keyMatch) result.mapKey = keyMatch[1];

  // Warp positions set for border check exceptions
  const warpPositions = new Set(warps.map(w => `${w.tileX},${w.tileY}`));

  // ── Check 1: Dimension consistency (row widths) ──
  for (let i = 0; i < rows.length; i++) {
    const rowLen = [...rows[i]].length;
    if (rowLen !== width) {
      add('error', 'dimensions', `Row ${i} width=${rowLen}, expected ${width}  →  "${rows[i]}"`);
    }
  }

  // ── Check 2: Character validity ──
  for (let i = 0; i < rows.length; i++) {
    const chars = [...rows[i]];
    for (let j = 0; j < chars.length; j++) {
      if (!VALID_CHARS.has(chars[j])) {
        add('error', 'characters', `Invalid char '${chars[j]}' (U+${chars[j].codePointAt(0)!.toString(16).toUpperCase()}) at row ${i}, col ${j}`);
      }
    }
  }

  // ── Check 3: Height match ──
  if (rows.length !== height) {
    add('error', 'height', `Row count=${rows.length}, declared height=${height}`);
  }

  // ── Check 4: Border integrity ──
  // Top and bottom rows
  for (let c = 0; c < width; c++) {
    if (grid[0] && !SOLID_TILES.has(grid[0][c]) && !warpPositions.has(`${c},0`)) {
      add('warning', 'border', `Top border tile (${c},0) is walkable: '${[...rows[0]][c]}'`);
    }
    const lastRow = rows.length - 1;
    if (grid[lastRow] && !SOLID_TILES.has(grid[lastRow][c]) && !warpPositions.has(`${c},${lastRow}`)) {
      add('warning', 'border', `Bottom border tile (${c},${lastRow}) is walkable: '${[...rows[lastRow]][c]}'`);
    }
  }
  // Left and right columns
  for (let r = 1; r < rows.length - 1; r++) {
    if (grid[r] && grid[r][0] !== undefined && !SOLID_TILES.has(grid[r][0]) && !warpPositions.has(`0,${r}`)) {
      add('warning', 'border', `Left border tile (0,${r}) is walkable: '${[...rows[r]][0]}'`);
    }
    const lastCol = width - 1;
    if (grid[r] && grid[r][lastCol] !== undefined && !SOLID_TILES.has(grid[r][lastCol]) && !warpPositions.has(`${lastCol},${r}`)) {
      add('warning', 'border', `Right border tile (${lastCol},${r}) is walkable: '${[...rows[r]][lastCol]}'`);
    }
  }

  // ── Check 5: Warp reachability ──
  for (const warp of warps) {
    const { tileX, tileY } = warp;
    if (tileY < 0 || tileY >= grid.length || tileX < 0 || tileX >= (grid[tileY]?.length ?? 0)) {
      add('error', 'warps', `Warp at (${tileX},${tileY}) is out of bounds`);
    } else if (SOLID_TILES.has(grid[tileY][tileX])) {
      add('warning', 'warps', `Warp at (${tileX},${tileY}) is on a solid tile (tile id ${grid[tileY][tileX]})`);
    }
  }

  // ── Check 6: NPC/trainer placement ──
  for (const npc of npcs) {
    if (npc.tileY < 0 || npc.tileY >= grid.length || npc.tileX < 0 || npc.tileX >= (grid[npc.tileY]?.length ?? 0)) {
      add('error', 'npcs', `NPC '${npc.id}' at (${npc.tileX},${npc.tileY}) is out of bounds`);
    } else if (SOLID_TILES.has(grid[npc.tileY][npc.tileX])) {
      add('warning', 'npcs', `NPC '${npc.id}' at (${npc.tileX},${npc.tileY}) is on a solid tile (tile id ${grid[npc.tileY][npc.tileX]})`);
    }
  }
  for (const tr of trainers) {
    if (tr.tileY < 0 || tr.tileY >= grid.length || tr.tileX < 0 || tr.tileX >= (grid[tr.tileY]?.length ?? 0)) {
      add('error', 'trainers', `Trainer '${tr.id}' at (${tr.tileX},${tr.tileY}) is out of bounds`);
    } else if (SOLID_TILES.has(grid[tr.tileY][tr.tileX])) {
      add('warning', 'trainers', `Trainer '${tr.id}' at (${tr.tileX},${tr.tileY}) is on a solid tile (tile id ${grid[tr.tileY][tr.tileX]})`);
    }
  }

  // ── Check 6b: Object placement and overlap ──
  // NPCs and trainers share collision space with map objects in-game. Warn on
  // duplicate coordinates so an item ball/sign/door cannot be hidden under a
  // character spawn.
  const objectPositions = new Map<string, string[]>();
  for (const object of objects) {
    const key = `${object.tileX},${object.tileY}`;
    const ids = objectPositions.get(key) ?? [];
    ids.push(object.id);
    objectPositions.set(key, ids);

    if (object.tileY < 0 || object.tileY >= grid.length || object.tileX < 0 || object.tileX >= (grid[object.tileY]?.length ?? 0)) {
      add('error', 'objects', `Object '${object.id}' at (${object.tileX},${object.tileY}) is out of bounds`);
    } else if (SOLID_TILES.has(grid[object.tileY][object.tileX])) {
      add('warning', 'objects', `Object '${object.id}' at (${object.tileX},${object.tileY}) is on a solid tile (tile id ${grid[object.tileY][object.tileX]})`);
    }
  }
  for (const [key, ids] of objectPositions) {
    if (ids.length > 1) {
      add('warning', 'overlap', `Objects ${ids.map(id => `'${id}'`).join(', ')} share tile (${key})`);
    }
  }
  for (const npc of npcs) {
    const ids = objectPositions.get(`${npc.tileX},${npc.tileY}`);
    if (ids) add('warning', 'overlap', `NPC '${npc.id}' overlaps object(s) ${ids.map(id => `'${id}'`).join(', ')} at (${npc.tileX},${npc.tileY})`);
  }
  for (const tr of trainers) {
    const ids = objectPositions.get(`${tr.tileX},${tr.tileY}`);
    if (ids) add('warning', 'overlap', `Trainer '${tr.id}' overlaps object(s) ${ids.map(id => `'${id}'`).join(', ')} at (${tr.tileX},${tr.tileY})`);
  }

  // ── Check 7: Spawn validity ──
  if (spawns.length === 0) {
    add('error', 'spawns', 'No spawn points defined');
  }
  for (const sp of spawns) {
    if (sp.y < 0 || sp.y >= grid.length || sp.x < 0 || sp.x >= (grid[sp.y]?.length ?? 0)) {
      add('error', 'spawns', `Spawn '${sp.id}' at (${sp.x},${sp.y}) is out of bounds`);
    } else if (SOLID_TILES.has(grid[sp.y][sp.x])) {
      add('warning', 'spawns', `Spawn '${sp.id}' at (${sp.x},${sp.y}) is on a solid tile (tile id ${grid[sp.y][sp.x]})`);
    }
  }

  // ── Check 8: Connectivity ──
  const regions = countConnectedRegions(grid, width, Math.min(rows.length, height));
  if (regions === 0) {
    add('warning', 'connectivity', 'No walkable tiles found');
  } else if (regions > 1) {
    add('warning', 'connectivity', `${regions} disconnected walkable regions (expected 1)`);
  }

  // ── Check 9: Exploration heuristic (routes & dungeons only) ──
  // Per docs/Map-improvements.md: routes and dungeons should be more than
  // open rectangles — surface a soft warning when interior tile variety is
  // too low or no field-ability gates exist on the map.
  if (category === 'routes' || category === 'dungeons') {
    const interiorSolidTypes = new Set<number>();
    let interiorWalkable = 0;
    let interiorSolids = 0;
    let fieldAbilityTiles = 0;
    const innerYMax = Math.min(rows.length, height) - 1;
    for (let r = 1; r < innerYMax; r++) {
      const rowTiles = grid[r];
      if (!rowTiles) continue;
      for (let c = 1; c < width - 1; c++) {
        const t = rowTiles[c];
        if (t === undefined) continue;
        if (FIELD_ABILITY_TILES.has(t)) fieldAbilityTiles++;
        if (SOLID_TILES.has(t)) {
          interiorSolids++;
          interiorSolidTypes.add(t);
        } else {
          interiorWalkable++;
        }
      }
    }
    const interiorTotal = interiorWalkable + interiorSolids;
    if (interiorTotal > 0 && interiorSolidTypes.size < 3) {
      add(
        'warning',
        'exploration',
        `Interior uses only ${interiorSolidTypes.size} solid tile type(s) — map may feel like a uniform rectangle (see docs/Map-improvements.md)`,
      );
    }
    if (interiorTotal > 0 && fieldAbilityTiles === 0) {
      add(
        'warning',
        'exploration',
        'No field-ability gates (CUT_TREE/CRACKED_ROCK/STRENGTH_BOULDER) — consider adding hidden detours per docs/Map-improvements.md',
      );
    }
  }

  return result;
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

// ── Format & print ──
function printResult(r: MapResult): void {
  const errors = r.issues.filter(i => i.type === 'error');
  const warnings = r.issues.filter(i => i.type === 'warning');
  const status =
    errors.length > 0 ? `${RED}FAIL${RESET}` :
    warnings.length > 0 ? `${YELLOW}WARN${RESET}` :
    `${GREEN}PASS${RESET}`;

  console.log(`\n${BOLD}${CYAN}━━━ ${r.name}${RESET} ${DIM}(${path.relative(MAPS_DIR, r.file)})${RESET}  ${status}`);

  if (r.issues.length === 0) {
    console.log(`  ${GREEN}✓ All checks passed${RESET}`);
    return;
  }
  for (const issue of r.issues) {
    const color = issue.type === 'error' ? RED : YELLOW;
    const icon = issue.type === 'error' ? '✗' : '⚠';
    console.log(`  ${color}${icon} [${issue.check}]${RESET} ${issue.message}`);
  }
}

// ── Main ──
function main(): void {
  const filterKey = process.argv[2]; // optional map key filter

  const mapFiles = discoverMapFiles();
  if (mapFiles.length === 0) {
    console.error(`${RED}No map files found in ${MAPS_DIR}${RESET}`);
    process.exit(1);
  }

  const toValidate = filterKey
    ? mapFiles.filter(f => path.basename(f.filePath, '.ts') === filterKey)
    : mapFiles;

  if (toValidate.length === 0) {
    console.error(`${RED}No map matching '${filterKey}' found. Available maps:${RESET}`);
    for (const f of mapFiles) console.log(`  ${path.basename(f.filePath, '.ts')}`);
    process.exit(1);
  }

  console.log(`${BOLD}Map Validator${RESET} — checking ${toValidate.length} map(s)...\n`);

  const results: MapResult[] = [];
  for (const { filePath, subdir } of toValidate) {
    results.push(validateMap(filePath, subdir));
  }

  // ── Cross-map: warp pair audit ──
  // Build a {mapKey → spawnIds} index from EVERY discovered map (so partial
  // runs with --map still resolve targets). Then warn for any warp whose
  // targetMap doesn't exist or whose targetSpawn isn't on the destination.
  // Some files (interiors/generic-house.ts, interiors/pokemon-league.ts)
  // export multiple MapDefinitions, each with its own `key:` and
  // `spawnPoints` block. We collect every `key:` literal in a file and pair
  // it with the union of every spawn id in the same file — sufficient to
  // answer "does this map key exist?" and "is this a known spawn id?".
  const mapIndex = new Map<string, Set<string>>();
  for (const { filePath } of mapFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileKeys: string[] = [];
    const keyRe = /key\s*:\s*['"]([^'"]+)['"]/g;
    let km: RegExpExecArray | null;
    while ((km = keyRe.exec(content)) !== null) {
      fileKeys.push(km[1]);
    }
    if (fileKeys.length === 0) continue;

    // Gather every spawn id across every spawnPoints: { ... } block in this file.
    const spawnIds = new Set<string>();
    const spawnBlockRe = /spawnPoints\s*:\s*\{([\s\S]*?)\}/g;
    let sb: RegExpExecArray | null;
    while ((sb = spawnBlockRe.exec(content)) !== null) {
      const idRe = /['"]([^'"]+)['"]\s*:\s*\{\s*x\s*:\s*\d+/g;
      let im: RegExpExecArray | null;
      while ((im = idRe.exec(sb[1])) !== null) {
        spawnIds.add(im[1]);
      }
    }
    for (const k of fileKeys) mapIndex.set(k, spawnIds);
  }

  // Generic-house factories (interiors/generic-house.ts) build keys like
  // `${cityKey}-house-${index}` at runtime via template strings, so the
  // static `key:` scan above misses them. Read the canonical mapRegistry
  // listing in interiors/../index.ts and add every registered key with
  // a fallback spawn-id set ('default' is universal for these factories).
  const registryFile = path.join(MAPS_DIR, 'index.ts');
  if (fs.existsSync(registryFile)) {
    const registrySrc = fs.readFileSync(registryFile, 'utf8');
    const registryRe = /['"]([\w-]+)['"]\s*:\s*\w+\s*[,}]/g;
    let rm: RegExpExecArray | null;
    while ((rm = registryRe.exec(registrySrc)) !== null) {
      if (!mapIndex.has(rm[1])) {
        mapIndex.set(rm[1], new Set(['default']));
      }
    }
  }
  for (const r of results) {
    for (const w of r.warps) {
      if (!w.targetMap) continue;
      const targetSpawns = mapIndex.get(w.targetMap);
      if (!targetSpawns) {
        r.issues.push({
          type: 'error',
          check: 'warp-pairs',
          message: `Warp at (${w.tileX},${w.tileY}) points to unknown map '${w.targetMap}'`,
        });
        continue;
      }
      if (w.targetSpawn && !targetSpawns.has(w.targetSpawn)) {
        r.issues.push({
          type: 'error',
          check: 'warp-pairs',
          message: `Warp at (${w.tileX},${w.tileY}) targets '${w.targetMap}#${w.targetSpawn}' but that spawn point doesn't exist`,
        });
      }
    }
  }

  for (const r of results) printResult(r);

  // ── Summary ──
  const totalErrors = results.reduce((n, r) => n + r.issues.filter(i => i.type === 'error').length, 0);
  const totalWarnings = results.reduce((n, r) => n + r.issues.filter(i => i.type === 'warning').length, 0);
  const passing = results.filter(r => r.issues.filter(i => i.type === 'error').length === 0).length;
  const failing = results.length - passing;

  console.log(`\n${BOLD}════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}Summary${RESET}  ${results.length} maps checked`);
  console.log(`  ${GREEN}✓ Passing: ${passing}${RESET}`);
  if (failing > 0) console.log(`  ${RED}✗ Failing: ${failing}${RESET}`);
  if (totalErrors > 0) console.log(`  ${RED}  Errors:   ${totalErrors}${RESET}`);
  if (totalWarnings > 0) console.log(`  ${YELLOW}  Warnings: ${totalWarnings}${RESET}`);
  console.log(`${BOLD}════════════════════════════════════════${RESET}`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
