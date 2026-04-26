#!/usr/bin/env node
// Generate PWA icons: 180x180 apple-touch-icon, 192x192 and 512x512 manifest icons
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createPNG(w, h, bgR, bgG, bgB, ballR, ballG, ballB) {
  const cx = w / 2, cy = h / 2;
  const radius = Math.floor(Math.min(w, h) * 0.42);
  const inner = Math.floor(radius * 0.22);
  const band = Math.floor(radius * 0.08);
  const buf = Buffer.alloc((1 + w * 4) * h);
  let off = 0;
  for (let y = 0; y < h; y++) {
    buf[off++] = 0; // filter byte = None
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
      let r, g, b, a = 255;
      if (d <= inner) {
        r = 255; g = 255; b = 255;
      } else if (Math.abs(dy) <= band && d <= radius) {
        r = 40; g = 40; b = 40;
      } else if (d <= radius) {
        if (dy < 0) { r = ballR; g = ballG; b = ballB; }
        else { r = 240; g = 240; b = 240; }
      } else if (d <= radius + 2) {
        r = 40; g = 40; b = 40;
      } else {
        r = bgR; g = bgG; b = bgB;
      }
      buf[off++] = r; buf[off++] = g; buf[off++] = b; buf[off++] = a;
    }
  }
  const deflated = deflateSync(buf, { level: 9 });

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
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const base = resolve(__dirname, '..', 'public');
const icons = [
  [180, 'apple-touch-icon.png'],
  [192, join('assets', 'ui', 'icon-192.png')],
  [512, join('assets', 'ui', 'icon-512.png')],
];

for (const [size, rel] of icons) {
  const png = createPNG(size, size, 15, 15, 26, 220, 50, 50);
  const dest = join(base, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, png);
  console.log(`Created ${rel} (${png.length} bytes, ${size}x${size})`);
}
