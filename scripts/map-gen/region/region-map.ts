#!/usr/bin/env npx tsx
/**
 * Region Overview Map Renderer — generates a single PPM image showing
 * every map in the Aurum Region as a labelled node connected by warp edges.
 *
 * The script introspects every map source file, extracts:
 *   - displayName + width/height
 *   - warps[] with targetMap → builds the directed warp graph
 *
 * It then runs a deterministic force-directed layout (seeded) on the warp graph
 * so the output is stable across runs, and writes a labelled PPM
 * to `temp/region-map.ppm`.
 *
 * Usage:
 *   npx tsx scripts/map-gen/region/region-map.ts
 *   npx tsx scripts/map-gen/region/region-map.ts --width 1600 --height 1200
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──
const MAPS_DIR = path.resolve(__dirname, '../../../frontend/src/data/maps');
const OUTPUT_PATH = path.resolve(__dirname, '../../../temp/region-map.ppm');
const SUBDIRS = ['cities', 'routes', 'dungeons', 'interiors'] as const;

// ── CLI args ──
const args = process.argv.slice(2);
function getOpt(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
const IMG_W = Number(getOpt('width') ?? 1600);
const IMG_H = Number(getOpt('height') ?? 1200);
const INCLUDE_INTERIORS = args.includes('--interiors');

// ── ANSI helpers ──
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── Map source parsing ──

type Category = 'cities' | 'routes' | 'dungeons' | 'interiors';

interface Warp {
  targetMap: string;
}

interface MapNode {
  key: string;          // map registry key (e.g. 'pallet-town')
  category: Category;
  displayName: string;
  width: number;
  height: number;
  warps: Warp[];
  /** Layout x in [0, IMG_W] */
  x: number;
  /** Layout y in [0, IMG_H] */
  y: number;
}

/**
 * Convert a kebab-case file basename to the camelCase identifier used by the
 * map registry, then map back to the registry key. Most files exporting
 * `export const palletTown` register as `'pallet-town'`. We scan map files
 * directly and extract the key from the `key:` field instead — much more
 * robust than guessing the identifier.
 */
function extractField(content: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
  const m = content.match(re);
  return m ? m[1] : null;
}

function extractNumberField(content: string, name: string): number | null {
  const re = new RegExp(`${name}\\s*:\\s*(\\d+)`);
  const m = content.match(re);
  return m ? Number(m[1]) : null;
}

function extractWarps(content: string): Warp[] {
  const warps: Warp[] = [];
  const block = content.match(/warps\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?:spawnPoints|trainers|npcs|objects|encounters|encounterTableKey|isInterior|displayName|$)/);
  if (!block) return warps;
  const re = /targetMap\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1])) !== null) {
    warps.push({ targetMap: m[1] });
  }
  return warps;
}

function loadAllNodes(): MapNode[] {
  const nodes: MapNode[] = [];
  for (const sub of SUBDIRS) {
    if (sub === 'interiors' && !INCLUDE_INTERIORS) continue;

    const dir = path.join(MAPS_DIR, sub);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.ts')) continue;
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf8');

      // generic-house exports many maps via factory; skip the factory file
      // (its individual outputs are referenced from map registry but live
      // inline rather than as their own files).
      if (file === 'generic-house.ts') continue;
      // pokemon-league file exports several maps; we handle each export below
      if (file === 'pokemon-league.ts') {
        for (const block of splitMultiExports(content)) {
          const key = extractField(block, 'key');
          if (!key) continue;
          nodes.push(buildNode(block, key, sub));
        }
        continue;
      }

      const key = extractField(content, 'key');
      if (!key) continue;
      nodes.push(buildNode(content, key, sub));
    }
  }
  return nodes;
}

function splitMultiExports(content: string): string[] {
  // Each MapDefinition block starts at `export const xxx: MapDefinition = {`
  // and ends at the matching closing brace + `};` at column 0. Splitting
  // on the export keyword and re-prefixing the key extraction is enough.
  const blocks: string[] = [];
  const re = /export\s+const\s+\w+\s*:\s*MapDefinition\s*=\s*\{[\s\S]*?\n\}\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    blocks.push(m[0]);
  }
  return blocks;
}

function buildNode(content: string, key: string, category: Category): MapNode {
  return {
    key,
    category,
    displayName: extractField(content, 'displayName') ?? key,
    width: extractNumberField(content, 'width') ?? 16,
    height: extractNumberField(content, 'height') ?? 16,
    warps: extractWarps(content),
    x: 0,
    y: 0,
  };
}

// ── Layout: deterministic seeded force-directed ──

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

interface Edge {
  fromIdx: number;
  toIdx: number;
}

function layoutNodes(nodes: MapNode[], iterations = 400): Edge[] {
  const rand = seededRandom(0xa1b2c3d4);
  const indexByKey = new Map<string, number>();
  nodes.forEach((n, i) => indexByKey.set(n.key, i));

  // Build undirected unique edges (warps are usually bidirectional).
  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (const w of nodes[i].warps) {
      const j = indexByKey.get(w.targetMap);
      if (j == null || j === i) continue;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const k = `${a},${b}`;
      if (edgeSet.has(k)) continue;
      edgeSet.add(k);
      edges.push({ fromIdx: a, toIdx: b });
    }
  }

  // Initialise with a circular layout so the simulation starts spread out.
  const cx = IMG_W / 2;
  const cy = IMG_H / 2;
  const radius = Math.min(IMG_W, IMG_H) * 0.42;
  for (let i = 0; i < nodes.length; i++) {
    const angle = (2 * Math.PI * i) / nodes.length + rand() * 0.05;
    nodes[i].x = cx + radius * Math.cos(angle);
    nodes[i].y = cy + radius * Math.sin(angle);
  }

  // Force-directed simulation parameters.
  const k = Math.sqrt((IMG_W * IMG_H) / Math.max(1, nodes.length));
  const repulsion = k * k;
  const attraction = 1 / k;
  let temperature = Math.min(IMG_W, IMG_H) * 0.08;
  const cooling = temperature / iterations;

  for (let iter = 0; iter < iterations; iter++) {
    const dx = new Array(nodes.length).fill(0);
    const dy = new Array(nodes.length).fill(0);

    // Repulsion between every pair.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ddx = nodes[i].x - nodes[j].x;
        const ddy = nodes[i].y - nodes[j].y;
        const dist = Math.max(0.01, Math.hypot(ddx, ddy));
        const force = repulsion / dist;
        const ux = ddx / dist;
        const uy = ddy / dist;
        dx[i] += ux * force; dy[i] += uy * force;
        dx[j] -= ux * force; dy[j] -= uy * force;
      }
    }

    // Attraction along edges.
    for (const e of edges) {
      const ddx = nodes[e.fromIdx].x - nodes[e.toIdx].x;
      const ddy = nodes[e.fromIdx].y - nodes[e.toIdx].y;
      const dist = Math.max(0.01, Math.hypot(ddx, ddy));
      const force = (dist * dist) * attraction;
      const ux = ddx / dist;
      const uy = ddy / dist;
      dx[e.fromIdx] -= ux * force; dy[e.fromIdx] -= uy * force;
      dx[e.toIdx]   += ux * force; dy[e.toIdx]   += uy * force;
    }

    // Apply displacements, capped by temperature; keep nodes inside the canvas
    // with a generous margin so labels (drawn below the node) stay in-frame.
    for (let i = 0; i < nodes.length; i++) {
      const disp = Math.max(0.01, Math.hypot(dx[i], dy[i]));
      const move = Math.min(disp, temperature);
      nodes[i].x += (dx[i] / disp) * move;
      nodes[i].y += (dy[i] / disp) * move;
      nodes[i].x = Math.max(180, Math.min(IMG_W - 180, nodes[i].x));
      nodes[i].y = Math.max(60, Math.min(IMG_H - 80, nodes[i].y));
    }

    temperature = Math.max(0.5, temperature - cooling);
  }

  return edges;
}

// ── PPM rendering ──

type RGB = [number, number, number];

const BG_COLOR: RGB = [18, 22, 32];
const EDGE_COLOR: RGB = [80, 90, 110];
const TEXT_COLOR: RGB = [240, 240, 245];

const CATEGORY_COLOR: Record<Category, RGB> = {
  cities:    [110, 200, 110], // green
  routes:    [220, 200,  90], // gold
  dungeons:  [200, 100, 100], // red
  interiors: [120, 140, 200], // blue
};

const CATEGORY_RADIUS: Record<Category, number> = {
  cities: 18,
  routes: 12,
  dungeons: 14,
  interiors: 8,
};

function setPixel(buf: Buffer, x: number, y: number, c: RGB): void {
  if (x < 0 || x >= IMG_W || y < 0 || y >= IMG_H) return;
  const idx = (y * IMG_W + x) * 3;
  buf[idx] = c[0]; buf[idx + 1] = c[1]; buf[idx + 2] = c[2];
}

function fillRect(buf: Buffer, x: number, y: number, w: number, h: number, c: RGB): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(buf, x + dx, y + dy, c);
    }
  }
}

function drawCircle(buf: Buffer, cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(buf, Math.round(cx + dx), Math.round(cy + dy), c);
      }
    }
  }
}

function drawCircleOutline(buf: Buffer, cx: number, cy: number, r: number, c: RGB, thickness = 2): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= r * r && d2 >= (r - thickness) * (r - thickness)) {
        setPixel(buf, Math.round(cx + dx), Math.round(cy + dy), c);
      }
    }
  }
}

function drawLine(buf: Buffer, x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  // Bresenham
  let xa = Math.round(x0), ya = Math.round(y0);
  const xb = Math.round(x1), yb = Math.round(y1);
  const dx = Math.abs(xb - xa);
  const sx = xa < xb ? 1 : -1;
  const dy = -Math.abs(yb - ya);
  const sy = ya < yb ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(buf, xa, ya, c);
    if (xa === xb && ya === yb) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; xa += sx; }
    if (e2 <= dx) { err += dx; ya += sy; }
  }
}

// ── 5x7 bitmap font (ASCII printable subset, sufficient for map names). ──
//
// Each glyph is a 5-column × 7-row bitmap encoded as a string of 5 chars per row,
// 7 rows total. '#' = pixel on, '.' = pixel off. Only the characters that appear
// in map display names are required (letters, digits, space, dash, apostrophe,
// parentheses, comma, period, em-dash, slash, colon).
// Font derived from the public-domain "5x7 font" used in early Atari/EGA hardware.

const FONT_W = 5;
const FONT_H = 7;
const FONT: Record<string, string[]> = {
  ' ': ['.....','.....','.....','.....','.....','.....','.....'],
  '!': ['..#..','..#..','..#..','..#..','..#..','.....','..#..'],
  "'": ['..#..','..#..','..#..','.....','.....','.....','.....'],
  '(': ['...#.','..#..','..#..','..#..','..#..','..#..','...#.'],
  ')': ['.#...','..#..','..#..','..#..','..#..','..#..','.#...'],
  ',': ['.....','.....','.....','.....','.....','..#..','.#...'],
  '-': ['.....','.....','.....','.###.','.....','.....','.....'],
  '.': ['.....','.....','.....','.....','.....','.....','..#..'],
  '/': ['....#','....#','...#.','..#..','.#...','#....','#....'],
  ':': ['.....','.....','..#..','.....','..#..','.....','.....'],
  '0': ['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
  '1': ['..#..','.##..','..#..','..#..','..#..','..#..','.###.'],
  '2': ['.###.','#...#','....#','...#.','..#..','.#...','#####'],
  '3': ['#####','...#.','..#..','...#.','....#','#...#','.###.'],
  '4': ['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
  '5': ['#####','#....','####.','....#','....#','#...#','.###.'],
  '6': ['..##.','.#...','#....','####.','#...#','#...#','.###.'],
  '7': ['#####','....#','...#.','..#..','.#...','.#...','.#...'],
  '8': ['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
  '9': ['.###.','#...#','#...#','.####','....#','...#.','.##..'],
  'A': ['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
  'B': ['####.','#...#','#...#','####.','#...#','#...#','####.'],
  'C': ['.###.','#...#','#....','#....','#....','#...#','.###.'],
  'D': ['####.','#...#','#...#','#...#','#...#','#...#','####.'],
  'E': ['#####','#....','#....','####.','#....','#....','#####'],
  'F': ['#####','#....','#....','####.','#....','#....','#....'],
  'G': ['.###.','#...#','#....','#..##','#...#','#...#','.###.'],
  'H': ['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
  'I': ['.###.','..#..','..#..','..#..','..#..','..#..','.###.'],
  'J': ['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
  'K': ['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
  'L': ['#....','#....','#....','#....','#....','#....','#####'],
  'M': ['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
  'N': ['#...#','##..#','#.#.#','#.#.#','#..##','#...#','#...#'],
  'O': ['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
  'P': ['####.','#...#','#...#','####.','#....','#....','#....'],
  'Q': ['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
  'R': ['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
  'S': ['.###.','#...#','#....','.###.','....#','#...#','.###.'],
  'T': ['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
  'U': ['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
  'V': ['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
  'W': ['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
  'X': ['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
  'Y': ['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
  'Z': ['#####','....#','...#.','..#..','.#...','#....','#####'],
  '—': ['.....','.....','.....','#####','.....','.....','.....'],
};

function drawText(buf: Buffer, x: number, y: number, text: string, c: RGB, scale = 1): void {
  let cursor = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[' '];
    for (let row = 0; row < FONT_H; row++) {
      const line = glyph[row];
      for (let col = 0; col < FONT_W; col++) {
        if (line[col] === '#') {
          fillRect(buf, cursor + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cursor += (FONT_W + 1) * scale;
  }
}

function textWidth(text: string, scale = 1): number {
  return text.length * (FONT_W + 1) * scale;
}

// ── Render ──

function render(nodes: MapNode[], edges: Edge[]): Buffer {
  const buf = Buffer.alloc(IMG_W * IMG_H * 3);
  // Background fill
  for (let i = 0; i < buf.length; i += 3) {
    buf[i] = BG_COLOR[0]; buf[i + 1] = BG_COLOR[1]; buf[i + 2] = BG_COLOR[2];
  }

  // Draw subtle grid for reference
  const gridStep = 100;
  const gridColor: RGB = [28, 32, 44];
  for (let gx = 0; gx < IMG_W; gx += gridStep) {
    for (let gy = 0; gy < IMG_H; gy++) setPixel(buf, gx, gy, gridColor);
  }
  for (let gy = 0; gy < IMG_H; gy += gridStep) {
    for (let gx = 0; gx < IMG_W; gx++) setPixel(buf, gx, gy, gridColor);
  }

  // Draw edges first so nodes overlay them
  for (const e of edges) {
    const a = nodes[e.fromIdx];
    const b = nodes[e.toIdx];
    drawLine(buf, a.x, a.y, b.x, b.y, EDGE_COLOR);
  }

  // Draw nodes
  for (const n of nodes) {
    const color = CATEGORY_COLOR[n.category];
    const r = CATEGORY_RADIUS[n.category];
    drawCircle(buf, n.x, n.y, r, color);
    drawCircleOutline(buf, n.x, n.y, r + 2, [0, 0, 0], 2);

    // Label below the node
    const label = n.displayName.replace(/[^A-Za-z0-9 \-—'.():,/]/g, '');
    const tw = textWidth(label, 1);
    const tx = Math.round(n.x - tw / 2);
    const ty = Math.round(n.y + r + 6);
    // Background plate for legibility
    fillRect(buf, tx - 2, ty - 2, tw + 4, FONT_H + 4, [12, 16, 24]);
    drawText(buf, tx, ty, label, TEXT_COLOR, 1);
  }

  // Title + legend
  drawText(buf, 16, 16, 'AURUM REGION OVERVIEW', TEXT_COLOR, 2);
  drawText(buf, 16, IMG_H - 110, 'LEGEND', TEXT_COLOR, 1);
  let ly = IMG_H - 90;
  for (const cat of ['cities', 'routes', 'dungeons', 'interiors'] as const) {
    if (cat === 'interiors' && !INCLUDE_INTERIORS) continue;
    drawCircle(buf, 24, ly + 3, 8, CATEGORY_COLOR[cat]);
    drawCircleOutline(buf, 24, ly + 3, 10, [0, 0, 0], 2);
    drawText(buf, 42, ly, cat.toUpperCase(), TEXT_COLOR, 1);
    ly += 18;
  }
  drawText(buf, 16, IMG_H - 16,
    `${nodes.length} MAPS  ${edges.length} WARP CONNECTIONS`,
    TEXT_COLOR, 1);

  // Build PPM P6 binary
  const header = Buffer.from(`P6\n${IMG_W} ${IMG_H}\n255\n`, 'ascii');
  return Buffer.concat([header, buf]);
}

// ── Main ──

function main(): void {
  console.log(`${BOLD}Region Overview Map Renderer${RESET}\n`);
  const allNodes = loadAllNodes();
  console.log(`${CYAN}Loaded ${allNodes.length} map(s)${RESET}`);

  // Drop nodes with no warp connections at all when interiors are excluded
  // — they would clutter the canvas with isolated dots.
  const nodes = allNodes.filter(n => n.warps.length > 0
    || allNodes.some(o => o.warps.some(w => w.targetMap === n.key)));
  console.log(`${CYAN}Rendering ${nodes.length} connected node(s)${RESET}`);

  const edges = layoutNodes(nodes);
  console.log(`${CYAN}Layout complete: ${edges.length} unique warp edge(s)${RESET}`);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const ppm = render(nodes, edges);
  fs.writeFileSync(OUTPUT_PATH, ppm);

  const sizeKB = (ppm.length / 1024).toFixed(1);
  console.log(`${GREEN}✓ Wrote ${OUTPUT_PATH}${RESET} (${sizeKB} KB, ${IMG_W}×${IMG_H})`);
  console.log(`\n${YELLOW}Tip:${RESET} convert to PNG with`);
  console.log(`  ${BOLD}magick ${OUTPUT_PATH} ${OUTPUT_PATH.replace(/\.ppm$/, '.png')}${RESET}`);
}

main();
