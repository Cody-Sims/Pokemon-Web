/**
 * Deterministic 2-D value noise.
 *
 * A small, dependency-free noise primitive used by the organic border / shape
 * generators. Produces a smooth scalar field in [0, 1) that is reproducible
 * for a given seed and (x, y) input.
 *
 * The implementation is bilinear interpolation between hashed corner values,
 * with a smootherstep easing curve. Multi-octave fBm is layered on top.
 *
 * This is value noise (not Perlin/Simplex) — sufficient for sub-tile-frequency
 * masks like coastlines, treelines and cliff profiles, with no patent /
 * licensing concerns.
 */

import { SeededRandom } from './rng';

/** Smootherstep easing — C2 continuous, no visible grid alignment artifacts. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class ValueNoise {
  private readonly perm: Uint32Array;

  constructor(seed: number) {
    // Build a permutation table — 256 entries, repeated to 512 to avoid
    // bounds checks in the hash step below.
    const rng = new SeededRandom(seed);
    const base = new Uint32Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const tmp = base[i];
      base[i] = base[j];
      base[j] = tmp;
    }
    this.perm = new Uint32Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = base[i & 255];
  }

  /** Hash a lattice corner (ix, iy) to a value in [0, 1). */
  private corner(ix: number, iy: number): number {
    const xi = ix & 255;
    const yi = iy & 255;
    const h = this.perm[(this.perm[xi] + yi) & 511];
    return h / 256;
  }

  /**
   * Sample noise at floating-point (x, y). Output is in [0, 1).
   * Choose `x = worldX / scale` so larger `scale` produces broader features.
   */
  noise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const v00 = this.corner(ix, iy);
    const v10 = this.corner(ix + 1, iy);
    const v01 = this.corner(ix, iy + 1);
    const v11 = this.corner(ix + 1, iy + 1);

    const u = fade(fx);
    const v = fade(fy);

    return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
  }

  /**
   * Fractal Brownian Motion: sum of `octaves` noise layers, each at double
   * frequency and `persistence` amplitude of the previous. Output normalised
   * to [0, 1).
   */
  fbm(x: number, y: number, octaves = 4, persistence = 0.5): number {
    let total = 0;
    let amp = 1;
    let freq = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * freq, y * freq) * amp;
      max += amp;
      amp *= persistence;
      freq *= 2;
    }
    return total / max;
  }
}

export default ValueNoise;
