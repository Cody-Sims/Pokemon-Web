import { TILE_SIZE } from '@utils/constants';
import { clamp as clampNumber } from '@utils/math-helpers';
import type { Direction } from '@utils/type-helpers';

export interface GridPoint {
  tileX: number;
  tileY: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export type TileOrigin = 'top-left' | 'center';

export const CARDINAL_DIRECTIONS = ['up', 'down', 'left', 'right'] as const satisfies readonly Direction[];

export const DIRECTION_DELTAS: Readonly<Record<Direction, GridPoint>> = {
  up: { tileX: 0, tileY: -1 },
  down: { tileX: 0, tileY: 1 },
  left: { tileX: -1, tileY: 0 },
  right: { tileX: 1, tileY: 0 },
};

export { clampNumber as clamp };

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function tileToWorld(tileX: number, tileY: number, origin: TileOrigin = 'top-left'): WorldPoint {
  const offset = origin === 'center' ? TILE_SIZE / 2 : 0;
  return {
    x: tileX * TILE_SIZE + offset,
    y: tileY * TILE_SIZE + offset,
  };
}

export function tileCenter(tileX: number, tileY: number): WorldPoint {
  return tileToWorld(tileX, tileY, 'center');
}

export function worldToTile(x: number, y: number): GridPoint {
  return {
    tileX: normalizeZero(Math.floor(x / TILE_SIZE)),
    tileY: normalizeZero(Math.floor(y / TILE_SIZE)),
  };
}

export function worldCenterToTile(x: number, y: number): GridPoint {
  return {
    tileX: normalizeZero(Math.round(x / TILE_SIZE - 0.5)),
    tileY: normalizeZero(Math.round(y / TILE_SIZE - 0.5)),
  };
}

export function manhattanDistance(...args: [GridPoint, GridPoint] | [number, number, number, number]): number {
  if (args.length === 4) {
    const [ax, ay, bx, by] = args;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  const [a, b] = args;
  return Math.abs(a.tileX - b.tileX) + Math.abs(a.tileY - b.tileY);
}

export function directionToDelta(direction: Direction, steps = 1): GridPoint {
  const delta = DIRECTION_DELTAS[direction];
  return {
    tileX: delta.tileX * steps,
    tileY: delta.tileY * steps,
  };
}

export function offsetTile(point: GridPoint, direction: Direction, steps = 1): GridPoint {
  const delta = directionToDelta(direction, steps);
  return {
    tileX: point.tileX + delta.tileX,
    tileY: point.tileY + delta.tileY,
  };
}

export function oppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function deltaToDirection(deltaX: number, deltaY: number): Direction | null {
  const normalizedX = Math.sign(deltaX);
  const normalizedY = Math.sign(deltaY);

  if (normalizedX === 0 && normalizedY === -1) return 'up';
  if (normalizedX === 0 && normalizedY === 1) return 'down';
  if (normalizedX === -1 && normalizedY === 0) return 'left';
  if (normalizedX === 1 && normalizedY === 0) return 'right';
  return null;
}
