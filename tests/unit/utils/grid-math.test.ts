import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '@utils/constants';
import {
  clamp,
  deltaToDirection,
  directionToDelta,
  manhattanDistance,
  offsetTile,
  oppositeDirection,
  tileCenter,
  tileToWorld,
  worldCenterToTile,
  worldToTile,
} from '@utils/grid-math';

const halfTile = TILE_SIZE / 2;

describe('grid-math', () => {
  it('converts tile coordinates to top-left and center world positions', () => {
    expect(tileToWorld(3, 4)).toEqual({ x: 3 * TILE_SIZE, y: 4 * TILE_SIZE });
    expect(tileToWorld(-2, 1)).toEqual({ x: -2 * TILE_SIZE, y: TILE_SIZE });
    expect(tileCenter(3, 4)).toEqual({ x: 3 * TILE_SIZE + halfTile, y: 4 * TILE_SIZE + halfTile });
  });

  it('floors world coordinates into grid tiles, including negatives', () => {
    expect(worldToTile(0, 0)).toEqual({ tileX: 0, tileY: 0 });
    expect(worldToTile(TILE_SIZE - 1, TILE_SIZE)).toEqual({ tileX: 0, tileY: 1 });
    expect(worldToTile(-1, -TILE_SIZE - 1)).toEqual({ tileX: -1, tileY: -2 });
  });

  it('rounds centered sprite positions back to their owning tile', () => {
    expect(worldCenterToTile(2 * TILE_SIZE + halfTile, -3 * TILE_SIZE + halfTile)).toEqual({ tileX: 2, tileY: -3 });
    expect(worldCenterToTile(2 * TILE_SIZE + halfTile + 0.49, halfTile - 0.49)).toEqual({ tileX: 2, tileY: 0 });
  });

  it('re-exports the shared clamp helper', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(Number.NaN, 0, 10)).toBeNaN();
  });

  it('calculates manhattan distance from points or coordinate arguments', () => {
    expect(manhattanDistance({ tileX: -2, tileY: 5 }, { tileX: 4, tileY: -1 })).toBe(12);
    expect(manhattanDistance(-2, 5, 4, -1)).toBe(12);
  });

  it('maps directions to deltas and offsets tiles by multiple steps', () => {
    expect(directionToDelta('up')).toEqual({ tileX: 0, tileY: -1 });
    expect(directionToDelta('right', 3)).toEqual({ tileX: 3, tileY: 0 });
    expect(offsetTile({ tileX: 5, tileY: 5 }, 'left', 2)).toEqual({ tileX: 3, tileY: 5 });
  });

  it('maps deltas and opposite directions for cardinal movement only', () => {
    expect(oppositeDirection('down')).toBe('up');
    expect(deltaToDirection(0, -4)).toBe('up');
    expect(deltaToDirection(2, 0)).toBe('right');
    expect(deltaToDirection(1, 1)).toBeNull();
    expect(deltaToDirection(0, 0)).toBeNull();
  });
});
