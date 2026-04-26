#!/usr/bin/env node
/**
 * Generate the Aurum pixel font (BMFont format) from an embedded 5x7 glyph
 * source. Outputs:
 *   - frontend/public/assets/fonts/aurum-pixel.png   PNG glyph atlas (RGBA)
 *   - frontend/public/assets/fonts/aurum-pixel.xml   BMFont XML descriptor
 *
 * Phaser loads BMFonts via `scene.load.bitmapFont(key, pngPath, xmlPath)`.
 * Once registered, scenes opt-in by calling
 * `scene.add.bitmapText(x, y, 'aurum-pixel', text, size)`.
 *
 * This script uses the same PNG primitives as `generate-icons.js` so it has
 * zero external dependencies.
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 5x7 bitmap font source ───────────────────────────────────────
// Each glyph is rows of 5 chars; '#' = pixel on, '.' = pixel off.
// Letter coverage targets dialogue, menus, HUD: ASCII printable subset.

const FONT_W = 5;
const FONT_H = 7;
const SCALE = 2;          // 2x upscaled PNG so glyphs render crisp at 14px-ish size

const GLYPHS = {
  ' ': ['.....','.....','.....','.....','.....','.....','.....'],
  '!': ['..#..','..#..','..#..','..#..','..#..','.....','..#..'],
  '"': ['.#.#.','.#.#.','.....','.....','.....','.....','.....'],
  '#': ['.#.#.','#####','.#.#.','#####','.#.#.','.....','.....'],
  '$': ['..#..','.####','#.#..','.###.','..#.#','####.','..#..'],
  '%': ['##..#','##.#.','...#.','..#..','.#.##','#..##','.....'],
  '&': ['.##..','#..#.','.##..','#..#.','#.##.','.##.#','.....'],
  "'": ['..#..','..#..','..#..','.....','.....','.....','.....'],
  '(': ['...#.','..#..','..#..','..#..','..#..','..#..','...#.'],
  ')': ['.#...','..#..','..#..','..#..','..#..','..#..','.#...'],
  '*': ['.....','#.#.#','.###.','#####','.###.','#.#.#','.....'],
  '+': ['.....','..#..','..#..','#####','..#..','..#..','.....'],
  ',': ['.....','.....','.....','.....','.....','..#..','.#...'],
  '-': ['.....','.....','.....','.###.','.....','.....','.....'],
  '.': ['.....','.....','.....','.....','.....','.....','..#..'],
  '/': ['....#','....#','...#.','..#..','.#...','#....','#....'],
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
  ':': ['.....','.....','..#..','.....','..#..','.....','.....'],
  ';': ['.....','.....','..#..','.....','..#..','.#...','.....'],
  '<': ['...#.','..#..','.#...','#....','.#...','..#..','...#.'],
  '=': ['.....','.....','.###.','.....','.###.','.....','.....'],
  '>': ['.#...','..#..','...#.','....#','...#.','..#..','.#...'],
  '?': ['.###.','#...#','...#.','..#..','..#..','.....','..#..'],
  '@': ['.###.','#...#','#.###','#.###','#.##.','#....','.###.'],
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
  '[': ['.###.','.#...','.#...','.#...','.#...','.#...','.###.'],
  '\\': ['#....','#....','.#...','..#..','...#.','....#','....#'],
  ']': ['.###.','...#.','...#.','...#.','...#.','...#.','.###.'],
  '^': ['..#..','.#.#.','#...#','.....','.....','.....','.....'],
  '_': ['.....','.....','.....','.....','.....','.....','#####'],
  '`': ['.#...','..#..','.....','.....','.....','.....','.....'],
  'a': ['.....','.....','.###.','....#','.####','#...#','.####'],
  'b': ['#....','#....','####.','#...#','#...#','#...#','####.'],
  'c': ['.....','.....','.####','#....','#....','#....','.####'],
  'd': ['....#','....#','.####','#...#','#...#','#...#','.####'],
  'e': ['.....','.....','.###.','#...#','#####','#....','.####'],
  'f': ['..##.','.#..#','.#...','####.','.#...','.#...','.#...'],
  'g': ['.....','.####','#...#','#...#','.####','....#','.###.'],
  'h': ['#....','#....','####.','#...#','#...#','#...#','#...#'],
  'i': ['..#..','.....','.##..','..#..','..#..','..#..','.###.'],
  'j': ['...#.','.....','..##.','...#.','...#.','#..#.','.##..'],
  'k': ['#....','#....','#..#.','#.#..','##...','#.#..','#..#.'],
  'l': ['.##..','..#..','..#..','..#..','..#..','..#..','.###.'],
  'm': ['.....','.....','##.#.','#.#.#','#.#.#','#...#','#...#'],
  'n': ['.....','.....','####.','#...#','#...#','#...#','#...#'],
  'o': ['.....','.....','.###.','#...#','#...#','#...#','.###.'],
  'p': ['.....','.....','####.','#...#','####.','#....','#....'],
  'q': ['.....','.....','.####','#...#','.####','....#','....#'],
  'r': ['.....','.....','#.##.','##..#','#....','#....','#....'],
  's': ['.....','.....','.####','#....','.###.','....#','####.'],
  't': ['.#...','.#...','####.','.#...','.#...','.#..#','..##.'],
  'u': ['.....','.....','#...#','#...#','#...#','#...#','.####'],
  'v': ['.....','.....','#...#','#...#','#...#','.#.#.','..#..'],
  'w': ['.....','.....','#...#','#...#','#.#.#','#.#.#','.#.#.'],
  'x': ['.....','.....','#...#','.#.#.','..#..','.#.#.','#...#'],
  'y': ['.....','.....','#...#','#...#','.####','....#','.###.'],
  'z': ['.....','.....','#####','...#.','..#..','.#...','#####'],
  '{': ['..##.','.#...','.#...','##...','.#...','.#...','..##.'],
  '|': ['..#..','..#..','..#..','..#..','..#..','..#..','..#..'],
  '}': ['.##..','...#.','...#.','...##','...#.','...#.','.##..'],
  '~': ['.....','.....','.#..#','#####','#..#.','.....','.....'],
};

// ── PNG primitives ──────────────────────────────────────────────

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const td = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const cr = Buffer.alloc(4);
  cr.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, cr]);
}

/** Encode an RGBA pixel buffer (height × (1 + width*4) bytes) as a PNG. */
function encodePNG(width, height, pixelRows) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(pixelRows, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Build the glyph atlas ───────────────────────────────────────

const ATLAS_COLS = 16;             // 16 glyphs wide
const CELL_W = (FONT_W + 1) * SCALE; // 1px gap between cells
const CELL_H = (FONT_H + 1) * SCALE;

const glyphEntries = Object.entries(GLYPHS);
const ATLAS_ROWS = Math.ceil(glyphEntries.length / ATLAS_COLS);
const ATLAS_W = ATLAS_COLS * CELL_W;
const ATLAS_H = ATLAS_ROWS * CELL_H;

// Allocate an RGBA pixel buffer, transparent by default.
const pixelRows = Buffer.alloc((1 + ATLAS_W * 4) * ATLAS_H);
for (let y = 0; y < ATLAS_H; y++) {
  pixelRows[y * (1 + ATLAS_W * 4)] = 0; // filter byte = None
}

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= ATLAS_W || y < 0 || y >= ATLAS_H) return;
  const rowStart = y * (1 + ATLAS_W * 4) + 1;
  const idx = rowStart + x * 4;
  pixelRows[idx] = r;
  pixelRows[idx + 1] = g;
  pixelRows[idx + 2] = b;
  pixelRows[idx + 3] = a;
}

const charEntries = []; // { char, x, y, w, h, xoffset, yoffset, xadvance }

glyphEntries.forEach(([ch, glyph], i) => {
  const col = i % ATLAS_COLS;
  const row = Math.floor(i / ATLAS_COLS);
  const cellX = col * CELL_W;
  const cellY = row * CELL_H;

  // Render glyph at SCALE upscale.
  for (let gy = 0; gy < FONT_H; gy++) {
    const line = glyph[gy];
    for (let gx = 0; gx < FONT_W; gx++) {
      if (line[gx] === '#') {
        for (let dy = 0; dy < SCALE; dy++) {
          for (let dx = 0; dx < SCALE; dx++) {
            setPixel(cellX + gx * SCALE + dx, cellY + gy * SCALE + dy, 255, 255, 255, 255);
          }
        }
      }
    }
  }

  charEntries.push({
    char: ch,
    code: ch.charCodeAt(0),
    x: cellX,
    y: cellY,
    w: FONT_W * SCALE,
    h: FONT_H * SCALE,
    xoffset: 0,
    yoffset: 0,
    xadvance: (FONT_W + 1) * SCALE,
  });
});

const png = encodePNG(ATLAS_W, ATLAS_H, pixelRows);

// ── BMFont XML descriptor ───────────────────────────────────────

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const charsXml = charEntries.map(c =>
  `    <char id="${c.code}" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" ` +
  `xoffset="${c.xoffset}" yoffset="${c.yoffset}" xadvance="${c.xadvance}" page="0" chnl="15"/>`
).join('\n');

const xml = `<?xml version="1.0"?>
<font>
  <info face="Aurum Pixel" size="${FONT_H * SCALE}" bold="0" italic="0" charset="" unicode="1"
        stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="0,0" outline="0"/>
  <common lineHeight="${(FONT_H + 1) * SCALE}" base="${FONT_H * SCALE}" scaleW="${ATLAS_W}" scaleH="${ATLAS_H}"
          pages="1" packed="0" alphaChnl="0" redChnl="0" greenChnl="0" blueChnl="0"/>
  <pages>
    <page id="0" file="${xmlEscape('aurum-pixel.png')}"/>
  </pages>
  <chars count="${charEntries.length}">
${charsXml}
  </chars>
</font>
`;

// ── Write outputs ────────────────────────────────────────────────

const outDir = resolve(__dirname, '..', 'public', 'assets', 'fonts');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'aurum-pixel.png'), png);
writeFileSync(join(outDir, 'aurum-pixel.xml'), xml);

console.log(`Generated Aurum Pixel BMFont:`);
console.log(`  ${join(outDir, 'aurum-pixel.png')} (${png.length} bytes, ${ATLAS_W}x${ATLAS_H})`);
console.log(`  ${join(outDir, 'aurum-pixel.xml')} (${charEntries.length} glyphs)`);
