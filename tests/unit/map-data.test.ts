import { describe, it, expect } from 'vitest';
import { Tile, TILE_COLORS, SOLID_TILES } from '../../frontend/src/data/map-data';

describe('Map Data — Tile System', () => {
  describe('Tile constants', () => {
    it('should have unique values for all tile types', () => {
      const values = Object.values(Tile);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('all tile types should be non-negative integers', () => {
      for (const [name, value] of Object.entries(Tile)) {
        expect(Number.isInteger(value), `Tile.${name} should be integer`).toBe(true);
        expect(value, `Tile.${name} should be >= 0`).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('TILE_COLORS', () => {
    it('every tile type should have a color', () => {
      for (const [name, value] of Object.entries(Tile)) {
        expect(TILE_COLORS[value], `Tile.${name} (${value}) missing color`).toBeDefined();
      }
    });

    it('all colors should be valid hex numbers', () => {
      for (const [tileId, color] of Object.entries(TILE_COLORS)) {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xFFFFFF);
      }
    });
  });

  describe('SOLID_TILES', () => {
    it('trees should be solid', () => {
      expect(SOLID_TILES.has(Tile.TREE)).toBe(true);
      expect(SOLID_TILES.has(Tile.DENSE_TREE)).toBe(true);
    });

    it('water should be solid', () => {
      expect(SOLID_TILES.has(Tile.WATER)).toBe(true);
    });

    it('walls and roofs are solid', () => {
      expect(SOLID_TILES.has(Tile.HOUSE_WALL)).toBe(true);
      expect(SOLID_TILES.has(Tile.HOUSE_ROOF)).toBe(true);
      expect(SOLID_TILES.has(Tile.LAB_WALL)).toBe(true);
      expect(SOLID_TILES.has(Tile.LAB_ROOF)).toBe(true);
      expect(SOLID_TILES.has(Tile.GYM_WALL)).toBe(true);
      expect(SOLID_TILES.has(Tile.GYM_ROOF)).toBe(true);
    });

    it('paths should NOT be solid', () => {
      expect(SOLID_TILES.has(Tile.PATH)).toBe(false);
      expect(SOLID_TILES.has(Tile.GRASS)).toBe(false);
    });

    it('doors should NOT be solid', () => {
      expect(SOLID_TILES.has(Tile.HOUSE_DOOR)).toBe(false);
      expect(SOLID_TILES.has(Tile.LAB_DOOR)).toBe(false);
      expect(SOLID_TILES.has(Tile.CENTER_DOOR)).toBe(false);
    });

    it('tall grass should NOT be solid', () => {
      expect(SOLID_TILES.has(Tile.TALL_GRASS)).toBe(false);
    });

    it('fence should be solid', () => {
      expect(SOLID_TILES.has(Tile.FENCE)).toBe(true);
    });
  });
});
