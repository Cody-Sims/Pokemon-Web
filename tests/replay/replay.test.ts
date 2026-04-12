import { describe, it, expect, vi } from 'vitest';
import { mulberry32 } from '../../frontend/src/utils/seeded-random';

describe('Replay System - Seeded Random', () => {
  it('mulberry32 should produce deterministic sequence', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const seq1 = Array.from({ length: 20 }, () => rng1());
    const seq2 = Array.from({ length: 20 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it('different seeds should produce different sequences', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);

    const val1 = rng1();
    const val2 = rng2();
    expect(val1).not.toBe(val2);
  });

  it('should produce values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('can replace Math.random for deterministic tests', () => {
    const rng = mulberry32(42);
    const original = Math.random;
    Math.random = rng;

    const val1 = Math.random();
    const val2 = Math.random();
    expect(val1).not.toBe(val2); // Different values from sequences
    expect(typeof val1).toBe('number');

    Math.random = original; // Restore
  });
});
