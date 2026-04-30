import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clamp, lerp, randomInt, randomFloat, weightedRandom, seedRng } from '../../../frontend/src/utils/math-helpers';

describe('math-helpers', () => {
  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp to max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('lerp', () => {
    it('should return a when t=0', () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });

    it('should return b when t=1', () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should return midpoint when t=0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('randomInt', () => {
    beforeEach(() => {
      seedRng(42);
    });

    it('should return integer within range', () => {
      const result = randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return min when range has one value', () => {
      expect(randomInt(5, 5)).toBe(5);
    });

    it('should produce same sequence for same seed', () => {
      seedRng(99);
      const a = randomInt(1, 10);
      seedRng(99);
      const b = randomInt(1, 10);
      expect(a).toBe(b);
    });

    it('should return the only value when min equals max', () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe('randomFloat', () => {
    beforeEach(() => {
      seedRng(42);
    });

    it('should return float within range', () => {
      const result = randomFloat(0.85, 1.0);
      expect(result).toBeGreaterThanOrEqual(0.85);
      expect(result).toBeLessThan(1.0);
    });

    it('should produce same value for same seed', () => {
      seedRng(99);
      const a = randomFloat(0.85, 1.0);
      seedRng(99);
      const b = randomFloat(0.85, 1.0);
      expect(a).toBe(b);
    });
  });

  describe('weightedRandom', () => {
    beforeEach(() => {
      seedRng(42);
    });

    it('should return a valid index', () => {
      const index = weightedRandom([10, 20, 30]);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(3);
    });

    it('should produce same sequence for same seed', () => {
      seedRng(99);
      const a = weightedRandom([50, 50]);
      seedRng(99);
      const b = weightedRandom([50, 50]);
      expect(a).toBe(b);
    });

    it('should return last index as fallback for single-element', () => {
      expect(weightedRandom([100])).toBe(0);
    });
  });
});
