import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mulberry32 } from '../../frontend/src/utils/seeded-random';

describe('mulberry32 Seeded Random', () => {
  it('should produce deterministic sequences from the same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (rng1() === rng2()) same++;
    }
    expect(same).toBeLessThan(5); // Extremely unlikely to be equal
  });

  it('should produce values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('should have good distribution across 10 buckets', () => {
    const rng = mulberry32(999);
    const buckets = Array(10).fill(0);
    const n = 10000;
    for (let i = 0; i < n; i++) {
      buckets[Math.floor(rng() * 10)]++;
    }
    // Each bucket should be roughly n/10 = 1000 ± 200
    for (const count of buckets) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1300);
    }
  });

  it('seed 0 should work without infinite loops', () => {
    const rng = mulberry32(0);
    const v1 = rng();
    const v2 = rng();
    expect(typeof v1).toBe('number');
    expect(v1).not.toBe(v2);
  });

  it('negative seeds should work', () => {
    const rng = mulberry32(-12345);
    const v = rng();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it('can replace Math.random for deterministic testing', () => {
    const origRandom = Math.random;
    const rng = mulberry32(42);
    Math.random = rng;

    const values = [Math.random(), Math.random(), Math.random()];
    expect(values.every(v => typeof v === 'number')).toBe(true);
    expect(new Set(values).size).toBe(3); // All different

    Math.random = origRandom;
  });

  it('large seeds should work', () => {
    const rng = mulberry32(Number.MAX_SAFE_INTEGER);
    expect(typeof rng()).toBe('number');
  });
});
