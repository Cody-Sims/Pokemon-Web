/**
 * Flood-fill connectivity utilities for map validation and generation.
 */
import { Grid } from './grid';

export interface ConnectedRegion {
  id: number;
  cells: Array<{ x: number; y: number }>;
}

/**
 * Flood fill from a starting point, returning all connected cells that match the predicate.
 * Uses 4-directional (cardinal) connectivity.
 */
export function floodFill(
  grid: Grid,
  startX: number,
  startY: number,
  predicate: (val: number) => boolean,
): Array<{ x: number; y: number }> {
  const visited = new Set<string>();
  const result: Array<{ x: number; y: number }> = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  const startVal = grid.get(startX, startY);
  if (startVal === -1 || !predicate(startVal)) return result;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const val = grid.get(x, y);
    if (val === -1 || !predicate(val)) continue;

    result.push({ x, y });

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = `${nx},${ny}`;
      if (!visited.has(nk) && grid.inBounds(nx, ny)) {
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return result;
}

/**
 * Find all connected regions of cells matching the predicate.
 * Returns regions sorted by size (largest first).
 */
export function findConnectedRegions(
  grid: Grid,
  predicate: (val: number) => boolean,
): ConnectedRegion[] {
  const visited = new Set<string>();
  const regions: ConnectedRegion[] = [];
  let regionId = 0;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      const val = grid.get(x, y);
      if (!predicate(val)) {
        visited.add(key);
        continue;
      }

      const cells = floodFill(grid, x, y, predicate);
      for (const c of cells) visited.add(`${c.x},${c.y}`);

      if (cells.length > 0) {
        regions.push({ id: regionId++, cells });
      }
    }
  }

  regions.sort((a, b) => b.cells.length - a.cells.length);
  return regions;
}

/**
 * Check if two points are connected via walkable tiles.
 */
export function areConnected(
  grid: Grid,
  x1: number, y1: number,
  x2: number, y2: number,
  predicate: (val: number) => boolean,
): boolean {
  const region = floodFill(grid, x1, y1, predicate);
  return region.some(c => c.x === x2 && c.y === y2);
}

/**
 * Build a region-label grid: each cell gets the ID of its connected region (-1 for non-matching).
 */
export function labelRegions(
  grid: Grid,
  predicate: (val: number) => boolean,
): Grid {
  const labels = new Grid(grid.width, grid.height, -1);
  const regions = findConnectedRegions(grid, predicate);
  for (const region of regions) {
    for (const { x, y } of region.cells) {
      labels.set(x, y, region.id);
    }
  }
  return labels;
}
