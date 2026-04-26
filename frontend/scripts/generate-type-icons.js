#!/usr/bin/env node
// Generate type-badges.png spritesheet: 18 type badges as a single horizontal strip.
// Each badge is 32x14 with a rounded-rect background in the type's color and
// abbreviated type name rendered as white pixels.
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Type definitions (same order as TYPE_BADGE_FRAMES in theme.ts) ──
const TYPES = [
  { name: 'NOR', color: [168, 168, 120] },
  { name: 'FIR', color: [240, 128, 48] },
  { name: 'WTR', color: [104, 144, 240] },
  { name: 'ELC', color: [248, 208, 48] },
  { name: 'GRS', color: [120, 200, 80] },
  { name: 'ICE', color: [152, 216, 216] },
  { name: 'FGT', color: [192, 48, 40] },
  { name: 'PSN', color: [160, 64, 160] },
  { name: 'GND', color: [224, 192, 104] },
  { name: 'FLY', color: [168, 144, 240] },
  { name: 'PSY', color: [248, 88, 136] },
  { name: 'BUG', color: [168, 184, 32] },
  { name: 'RCK', color: [184, 160, 56] },
  { name: 'GHO', color: [112, 88, 152] },
  { name: 'DRG', color: [112, 56, 248] },
  { name: 'DRK', color: [112, 88, 72] },
  { name: 'STL', color: [184, 184, 208] },
  { name: 'FAI', color: [238, 153, 172] },
];

const BADGE_W = 32;
const BADGE_H = 14;
const SHEET_W = BADGE_W * TYPES.length; // 576
const SHEET_H = BADGE_H;
const CORNER_R = 3;

// Tiny 3x5 pixel font for uppercase letters/digits (enough for 3-char abbreviations)
const GLYPHS = {
  A: ['111','101','111','101','101'],
  B: ['110','101','110','101','110'],
  C: ['111','100','100','100','111'],
  D: ['110','101','101','101','110'],
  E: ['111','100','110','100','111'],
  F: ['111','100','110','100','100'],
  G: ['111','100','101','101','111'],
  H: ['101','101','111','101','101'],
  I: ['111','010','010','010','111'],
  K: ['101','110','100','110','101'],
  L: ['100','100','100','100','111'],
  N: ['101','111','111','101','101'],
  O: ['111','101','101','101','111'],
  P: ['111','101','111','100','100'],
  R: ['111','101','111','110','101'],
  S: ['111','100','111','001','111'],
  T: ['111','010','010','010','010'],
  U: ['101','101','101','101','111'],
  W: ['101','101','111','111','101'],
  Y: ['101','101','010','010','010'],
};

function drawGlyph(buf, sheetW, gx, gy, char) {
  const g = GLYPHS[char];
  if (!g) return;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (g[row][col] === '1') {
        const px = gx + col;
        const py = gy + row;
        const off = (py * sheetW + px) * 4;
        buf[off] = 255; buf[off + 1] = 255; buf[off + 2] = 255; buf[off + 3] = 255;
      }
    }
  }
}

function isInsideRoundedRect(x, y, w, h, r) {
  // Check if (x, y) is inside a rounded rect from (0,0) to (w-1, h-1)
  if (x >= r && x < w - r) return true; // middle horizontal strip
  if (y >= r && y < h - r) return true; // middle vertical strip
  // Check corners
  const corners = [
    [r, r],
    [w - 1 - r, r],
    [r, h - 1 - r],
    [w - 1 - r, h - 1 - r],
  ];
  for (const [cx, cy] of corners) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) return true;
  }
  return false;
}

// Build raw RGBA pixel data
const pixels = Buffer.alloc(SHEET_W * SHEET_H * 4, 0);

for (let ti = 0; ti < TYPES.length; ti++) {
  const { name, color } = TYPES[ti];
  const ox = ti * BADGE_W;

  // Draw rounded rectangle background
  for (let y = 0; y < BADGE_H; y++) {
    for (let x = 0; x < BADGE_W; x++) {
      if (isInsideRoundedRect(x, y, BADGE_W, BADGE_H, CORNER_R)) {
        const off = (y * SHEET_W + ox + x) * 4;
        pixels[off] = color[0];
        pixels[off + 1] = color[1];
        pixels[off + 2] = color[2];
        pixels[off + 3] = 255;
      }
    }
  }

  // Draw 3-char type abbreviation centered
  const textW = name.length * 4 - 1; // 3 chars * 3px + 2 gaps
  const textX = ox + Math.floor((BADGE_W - textW) / 2);
  const textY = Math.floor((BADGE_H - 5) / 2);
  for (let ci = 0; ci < name.length; ci++) {
    drawGlyph(pixels, SHEET_W, textX + ci * 4, textY, name[ci]);
  }
}

// ── Encode as PNG ──
// Build raw image data with filter bytes
const raw = Buffer.alloc((1 + SHEET_W * 4) * SHEET_H);
let off = 0;
for (let y = 0; y < SHEET_H; y++) {
  raw[off++] = 0; // filter: None
  const srcOff = y * SHEET_W * 4;
  pixels.copy(raw, off, srcOff, srcOff + SHEET_W * 4);
  off += SHEET_W * 4;
}

const deflated = deflateSync(raw, { level: 9 });

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

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SHEET_W, 0);
ihdr.writeUInt32BE(SHEET_H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflated),
  chunk('IEND', Buffer.alloc(0)),
]);

const dest = resolve(__dirname, '..', 'public', 'assets', 'ui', 'type-badges.png');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, png);
console.log(`Created type-badges.png (${png.length} bytes, ${SHEET_W}x${SHEET_H}, ${TYPES.length} badges)`);
