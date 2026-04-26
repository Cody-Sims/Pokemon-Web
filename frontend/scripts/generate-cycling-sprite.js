#!/usr/bin/env node
// Generate cycling spritesheets for male + female player characters.
// Layout matches the walking sprite atlas: 64x51 PNG (4 cols × 3 rows of 16×17 frames).
// Columns: down, right, up, left.  Rows: frame 0, 1, 2 (pedal animation).
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 16, H = 17, COLS = 4, ROWS = 3;
const SHEET_W = W * COLS;   // 64
const SHEET_H = H * ROWS;   // 51

// ── Palettes ──────────────────────────────────────────────
const MALE_PALETTE = {
  '.': [0, 0, 0, 0],           // transparent
  'K': [40, 40, 48, 255],      // outline
  'R': [208, 64, 40, 255],     // red cap
  'r': [176, 48, 32, 255],     // dark cap
  'S': [232, 184, 120, 255],   // skin
  's': [200, 152, 96, 255],    // skin shadow
  'B': [48, 168, 152, 255],    // teal shirt
  'b': [32, 128, 120, 255],    // dark shirt
  'D': [48, 56, 112, 255],     // dark pants/legs
  'G': [168, 168, 176, 255],   // gray bike
  'g': [104, 104, 112, 255],   // dark bike
  'W': [248, 248, 248, 255],   // white/eye
  'H': [136, 88, 48, 255],     // hair brown
};

const FEMALE_PALETTE = {
  '.': [0, 0, 0, 0],
  'K': [40, 40, 48, 255],
  'R': [200, 56, 72, 255],     // red-pink hat/bow
  'r': [168, 40, 56, 255],
  'S': [232, 184, 120, 255],
  's': [200, 152, 96, 255],
  'B': [200, 56, 72, 255],     // red top (matches her outfit)
  'b': [168, 40, 56, 255],
  'D': [48, 56, 112, 255],
  'G': [168, 168, 176, 255],
  'g': [104, 104, 112, 255],
  'W': [248, 248, 248, 255],
  'H': [136, 64, 40, 255],     // auburn hair
};

// ── Frame data ────────────────────────────────────────────
// Each frame: array of 17 strings, each 16 chars wide.
// Directions: down (facing camera), right (side), up (back), left (side mirror)

// ── DOWN direction ───
const downF0 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KSSSSKK.....',
  '....KSWSWKK.....',
  '.....KSSK.......',
  '......BB........',
  '.....BBBB.......',
  '....SBggBS......',
  '.....gDDg.......',
  '....gD..Dg......',
  '...gg....gg.....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

const downF1 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KSSSSKK.....',
  '....KSWSWKK.....',
  '.....KSSK.......',
  '......BB........',
  '.....BBBB.......',
  '....SBggBS......',
  '.....gDDg.......',
  '...gDD..Dg......',
  '..gg.....gg.....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

const downF2 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KSSSSKK.....',
  '....KSWSWKK.....',
  '.....KSSK.......',
  '......BB........',
  '.....BBBB.......',
  '....SBggBS......',
  '.....gDDg.......',
  '....gD..DDg.....',
  '...gg.....gg....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

// ── RIGHT direction (side view) ───
const rightF0 = [
  '................',
  '....KrrK........',
  '...KRRRrK.......',
  '...KRRRRK.......',
  '...KSSSK........',
  '...KSWSK........',
  '....SSK.........',
  '....BBK.........',
  '...BBBB.........',
  '...SBggG........',
  '....gDDg........',
  '....gD.g........',
  '...gG..gG.......',
  '...gGg.gGg......',
  '...gGg.gGg......',
  '....g...g.......',
  '................',
];

const rightF1 = [
  '................',
  '....KrrK........',
  '...KRRRrK.......',
  '...KRRRRK.......',
  '...KSSSK........',
  '...KSWSK........',
  '....SSK.........',
  '....BBK.........',
  '...BBBB.........',
  '...SBggG........',
  '....gDg.........',
  '...gDD.g........',
  '...gG..gG.......',
  '...gGg.gGg......',
  '...gGg.gGg......',
  '....g...g.......',
  '................',
];

const rightF2 = [
  '................',
  '....KrrK........',
  '...KRRRrK.......',
  '...KRRRRK.......',
  '...KSSSK........',
  '...KSWSK........',
  '....SSK.........',
  '....BBK.........',
  '...BBBB.........',
  '...SBggG........',
  '....gDg.........',
  '....gD.Dg.......',
  '...gG..gG.......',
  '...gGg.gGg......',
  '...gGg.gGg......',
  '....g...g.......',
  '................',
];

// ── UP direction (facing away) ───
const upF0 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KHHHHK......',
  '....KHHHHK......',
  '.....KHK........',
  '......BB........',
  '.....BBBB.......',
  '....bBggBb......',
  '.....gDDg.......',
  '....gD..Dg......',
  '...gg....gg.....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

const upF1 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KHHHHK......',
  '....KHHHHK......',
  '.....KHK........',
  '......BB........',
  '.....BBBB.......',
  '....bBggBb......',
  '.....gDDg.......',
  '...gDD..Dg......',
  '..gg.....gg.....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

const upF2 = [
  '................',
  '.....KrrK.......',
  '....KRRRrK......',
  '....KRRRRK......',
  '....KHHHHK......',
  '....KHHHHK......',
  '.....KHK........',
  '......BB........',
  '.....BBBB.......',
  '....bBggBb......',
  '.....gDDg.......',
  '....gD..DDg.....',
  '...gg.....gg....',
  '...gGg..gGg.....',
  '...gGg..gGg.....',
  '....gg..gg......',
  '................',
];

// ── LEFT direction (mirror of right) ───
function mirrorFrame(frame) {
  return frame.map(row => row.split('').reverse().join(''));
}

const leftF0 = mirrorFrame(rightF0);
const leftF1 = mirrorFrame(rightF1);
const leftF2 = mirrorFrame(rightF2);

// Directions in column order: down=0, right=1, up=2, left=3
const allFrames = [
  [downF0, downF1, downF2],
  [rightF0, rightF1, rightF2],
  [upF0, upF1, upF2],
  [leftF0, leftF1, leftF2],
];

// ── PNG encoder (same approach as generate-icons.js) ──────
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const td = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const cr = Buffer.alloc(4);
  cr.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, cr]);
}

function buildPNG(w, h, pixels) {
  // pixels: Uint8Array of w*h*4 (RGBA)
  const rowLen = 1 + w * 4; // filter byte + RGBA
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0; // filter=None
    for (let x = 0; x < w; x++) {
      const srcOff = (y * w + x) * 4;
      const dstOff = y * rowLen + 1 + x * 4;
      raw[dstOff]     = pixels[srcOff];
      raw[dstOff + 1] = pixels[srcOff + 1];
      raw[dstOff + 2] = pixels[srcOff + 2];
      raw[dstOff + 3] = pixels[srcOff + 3];
    }
  }
  const deflated = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflated),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderSheet(palette) {
  const pixels = new Uint8Array(SHEET_W * SHEET_H * 4);
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const frame = allFrames[col][row];
      const baseX = col * W;
      const baseY = row * H;
      for (let y = 0; y < H; y++) {
        const line = frame[y];
        for (let x = 0; x < W; x++) {
          const ch = line[x] || '.';
          const rgba = palette[ch] || palette['.'];
          const off = ((baseY + y) * SHEET_W + (baseX + x)) * 4;
          pixels[off]     = rgba[0];
          pixels[off + 1] = rgba[1];
          pixels[off + 2] = rgba[2];
          pixels[off + 3] = rgba[3];
        }
      }
    }
  }
  return buildPNG(SHEET_W, SHEET_H, pixels);
}

// ── Atlas JSON ────────────────────────────────────────────
function buildAtlasJSON(imageName) {
  const dirs = ['down', 'right', 'up', 'left'];
  const frames = {};
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const key = `walk-${dirs[col]}-${row}`;
      frames[key] = {
        frame: { x: col * W, y: row * H, w: W, h: H },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: W, h: H },
        sourceSize: { w: W, h: H },
      };
    }
  }
  return { frames, meta: { app: 'pokemon-web-sprite-gen', version: '1.0', image: imageName, format: 'RGBA8888', size: { w: SHEET_W, h: SHEET_H }, scale: '1' } };
}

// ── Write files ───────────────────────────────────────────
const outDir = resolve(__dirname, '..', 'public', 'assets', 'sprites', 'player');
mkdirSync(outDir, { recursive: true });

// Male
const malePng = renderSheet(MALE_PALETTE);
writeFileSync(resolve(outDir, 'player-cycle.png'), malePng);
writeFileSync(resolve(outDir, 'player-cycle.json'), JSON.stringify(buildAtlasJSON('player-cycle.png'), null, 2));
console.log(`Created player-cycle.png (${malePng.length} bytes, ${SHEET_W}x${SHEET_H})`);

// Female
const femalePng = renderSheet(FEMALE_PALETTE);
writeFileSync(resolve(outDir, 'player-cycle-female.png'), femalePng);
writeFileSync(resolve(outDir, 'player-cycle-female.json'), JSON.stringify(buildAtlasJSON('player-cycle-female.png'), null, 2));
console.log(`Created player-cycle-female.png (${femalePng.length} bytes, ${SHEET_W}x${SHEET_H})`);
