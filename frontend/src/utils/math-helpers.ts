/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b by factor t (0–1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Seeded PRNG (Mulberry32) ────────────────────────────────
let rngState = Date.now();

/** Seed the global game PRNG. Call with a fixed value for deterministic tests/replays. */
export function seedRng(seed: number): void {
  rngState = seed;
}

/** Return a pseudo-random float in [0, 1) from the seeded Mulberry32 PRNG. */
export function seededRandom(): number {
  rngState |= 0;
  rngState = (rngState + 0x6D2B79F5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
export function randomFloat(min: number, max: number): number {
  return seededRandom() * (max - min) + min;
}

/** Pick a weighted random entry. Returns the index.
 *  Pass a precomputed total to avoid repeated reduce(). */
export function weightedRandom(weights: number[], precomputedTotal?: number): number {
  const total = precomputedTotal ?? weights.reduce((sum, w) => sum + w, 0);
  let roll = seededRandom() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}
