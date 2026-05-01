import { describe, it, expect } from 'vitest';
import {
  Tile,
  TILE_COLORS,
  SOLID_TILES,
  OVERLAY_BASE,
  FOREGROUND_TILES,
  parseMap,
} from '../../../frontend/src/data/maps';

/**
 * Phase 0 of docs/Map-improvements.md adds character mappings for the three
 * field-ability target tiles so that map files can place them in their
 * character grids. The runtime handlers (Cut, Rock Smash, Strength) live in
 * frontend/src/scenes/overworld/OverworldInteraction.ts and were already
 * wired before Phase 0 — this test guards the data plumbing.
 */
describe('Field-ability target tiles (Phase 0)', () => {
  describe('Tile constants exist', () => {
    it.each([
      ['CUT_TREE', Tile.CUT_TREE, 110],
      ['CRACKED_ROCK', Tile.CRACKED_ROCK, 111],
      ['STRENGTH_BOULDER', Tile.STRENGTH_BOULDER, 112],
    ])('%s has stable id %i', (_name, value, expected) => {
      expect(value).toBe(expected);
    });
  });

  describe('parser char mappings', () => {
    it("'>' parses to CUT_TREE", () => {
      expect(parseMap(['>'])).toEqual([[Tile.CUT_TREE]]);
    });

    it("'*' parses to CRACKED_ROCK", () => {
      expect(parseMap(['*'])).toEqual([[Tile.CRACKED_ROCK]]);
    });

    it("'+' parses to STRENGTH_BOULDER", () => {
      expect(parseMap(['+'])).toEqual([[Tile.STRENGTH_BOULDER]]);
    });

    it('field-ability chars coexist with surrounding terrain', () => {
      expect(parseMap(['..>..', '..*..', '..+..'])).toEqual([
        [Tile.GRASS, Tile.GRASS, Tile.CUT_TREE, Tile.GRASS, Tile.GRASS],
        [Tile.GRASS, Tile.GRASS, Tile.CRACKED_ROCK, Tile.GRASS, Tile.GRASS],
        [Tile.GRASS, Tile.GRASS, Tile.STRENGTH_BOULDER, Tile.GRASS, Tile.GRASS],
      ]);
    });
  });

  describe('SOLID_TILES membership', () => {
    it.each([
      ['CUT_TREE', Tile.CUT_TREE],
      ['CRACKED_ROCK', Tile.CRACKED_ROCK],
      ['STRENGTH_BOULDER', Tile.STRENGTH_BOULDER],
    ])('%s blocks movement', (_name, tile) => {
      expect(SOLID_TILES.has(tile)).toBe(true);
    });
  });

  describe('TILE_COLORS coverage', () => {
    it.each([
      ['CUT_TREE', Tile.CUT_TREE],
      ['CRACKED_ROCK', Tile.CRACKED_ROCK],
      ['STRENGTH_BOULDER', Tile.STRENGTH_BOULDER],
    ])('%s has a color', (_name, tile) => {
      expect(TILE_COLORS[tile]).toBeDefined();
      expect(typeof TILE_COLORS[tile]).toBe('number');
    });
  });

  describe('OVERLAY_BASE coverage', () => {
    it.each([
      ['CUT_TREE', Tile.CUT_TREE],
      ['CRACKED_ROCK', Tile.CRACKED_ROCK],
      ['STRENGTH_BOULDER', Tile.STRENGTH_BOULDER],
    ])('%s overlays on GRASS so a base is rendered underneath', (_name, tile) => {
      expect(OVERLAY_BASE[tile]).toBe(Tile.GRASS);
    });
  });

  describe('FOREGROUND_TILES coverage', () => {
    it('CUT_TREE renders as a foreground tile (player walks under canopy)', () => {
      expect(FOREGROUND_TILES.has(Tile.CUT_TREE)).toBe(true);
    });
  });
});
