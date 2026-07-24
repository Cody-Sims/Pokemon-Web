/**
 * A* pathfinding on grids.
 */
import { Grid } from './grid';

interface PathNode {
  x: number;
  y: number;
  g: number;   // cost from start
  h: number;   // heuristic to goal
  f: number;   // g + h
  parent: PathNode | null;
}

/** Manhattan distance heuristic */
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Find shortest path from (sx, sy) to (gx, gy) on a grid.
 * `walkable` predicate determines which cells can be traversed.
 * Returns array of {x, y} from start to goal (inclusive), or null if no path.
 */
export function astar(
  grid: Grid,
  sx: number, sy: number,
  gx: number, gy: number,
  walkable: (val: number) => boolean,
): Array<{ x: number; y: number }> | null {
  if (!grid.inBounds(sx, sy) || !grid.inBounds(gx, gy)) return null;
  if (!walkable(grid.get(sx, sy)) || !walkable(grid.get(gx, gy))) return null;

  const openSet = new Map<string, PathNode>();
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: sx, y: sy,
    g: 0, h: heuristic(sx, sy, gx, gy),
    f: heuristic(sx, sy, gx, gy),
    parent: null,
  };
  openSet.set(`${sx},${sy}`, startNode);

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  while (openSet.size > 0) {
    // Find node with lowest f score
    let current: PathNode | null = null;
    for (const node of openSet.values()) {
      if (!current || node.f < current.f) current = node;
    }
    if (!current) return null;

    // Reached goal
    if (current.x === gx && current.y === gy) {
      const path: Array<{ x: number; y: number }> = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    const key = `${current.x},${current.y}`;
    openSet.delete(key);
    closedSet.add(key);

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nk = `${nx},${ny}`;

      if (!grid.inBounds(nx, ny)) continue;
      if (closedSet.has(nk)) continue;
      if (!walkable(grid.get(nx, ny))) continue;

      const g = current.g + 1;
      const existing = openSet.get(nk);

      if (!existing || g < existing.g) {
        const h = heuristic(nx, ny, gx, gy);
        const node: PathNode = { x: nx, y: ny, g, h, f: g + h, parent: current };
        openSet.set(nk, node);
      }
    }
  }

  return null; // no path found
}

/**
 * Carve a path between two points on the grid, setting each cell to the given tile value.
 * Uses A* if a walkable path exists, otherwise uses L-shaped corridor.
 */
export function carvePath(
  grid: Grid,
  sx: number, sy: number,
  gx: number, gy: number,
  floorTile: number,
  walkable?: (val: number) => boolean,
): void {
  const isWalkable = walkable ?? ((v: number) => v === floorTile);
  const path = astar(grid, sx, sy, gx, gy, isWalkable);

  if (path) {
    for (const { x, y } of path) {
      grid.set(x, y, floorTile);
    }
  } else {
    // Fallback: L-shaped corridor
    const midX = sx;
    const midY = gy;
    // Horizontal segment
    const xStart = Math.min(sx, gx);
    const xEnd = Math.max(sx, gx);
    for (let x = xStart; x <= xEnd; x++) {
      grid.set(x, midY, floorTile);
    }
    // Vertical segment
    const yStart = Math.min(sy, gy);
    const yEnd = Math.max(sy, gy);
    for (let y = yStart; y <= yEnd; y++) {
      grid.set(midX, y, floorTile);
    }
  }
}
