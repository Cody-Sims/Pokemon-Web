import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clamp, lerp, randomInt, randomFloat, weightedRandom } from '../../../frontend/src/utils/math-helpers';

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
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('should return integer within range', () => {
      const result = randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return min when random is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(randomInt(1, 10)).toBe(1);
    });

    it('should return max when random is close to 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      expect(randomInt(1, 10)).toBe(10);
    });

    it('should return the only value when min equals max', () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe('randomFloat', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('should return float within range', () => {
      const result = randomFloat(0.85, 1.0);
      expect(result).toBeGreaterThanOrEqual(0.85);
      expect(result).toBeLessThan(1.0);
    });

    it('should return min when random is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(randomFloat(0.85, 1.0)).toBe(0.85);
    });
  });

  describe('weightedRandom', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('should return a valid index', () => {
      const index = weightedRandom([10, 20, 30]);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(3);
    });

    it('should favor heavier weights', () => {
      // With weights [1, 99], random=0.5 → roll=50 → subtracts 1 → 49 remaining, so index=1
      const index = weightedRandom([1, 99]);
      expect(index).toBe(1);
    });

    it('should return first index when random is very low', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001);
      const index = weightedRandom([50, 50]);
      expect(index).toBe(0);
    });

    it('should return last index as fallback', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      const index = weightedRandom([10, 10, 10]);
      expect(index).toBe(2);
    });

    it('should handle single-element array', () => {
      expect(weightedRandom([100])).toBe(0);
    });
  });
});
