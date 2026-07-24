/**
 * Maze Generator: Growing Tree algorithm with sparsification.
 * Produces maze-like maps suitable for puzzle areas and labyrinthine dungeons.
 */
import { Grid } from '../core/grid';
import { SeededRandom } from '../core/rng';

export interface MazeConfig {
  width: number;       // Must be odd
  height: number;      // Must be odd
  /** Strategy for picking next cell: 'newest' (DFS-like), 'random', 'oldest' (BFS-like), 'mixed' */
  strategy?: 'newest' | 'random' | 'oldest' | 'mixed';
  /** Number of dead-end removal passes (0 = keep all dead ends). Default 3 */
  sparsification?: number;
  /** Chance to remove extra walls for loop creation (0-1). Default 0 */
  loopChance?: number;
  seed?: number;
}

export interface MazeResult {
  grid: Grid;   // 0 = passage, 1 = wall
}

export function generateMaze(config: MazeConfig): MazeResult {
  let { width, height } = config;
  const {
    strategy = 'mixed',
    sparsification = 3,
    loopChance = 0,
    seed = Date.now(),
  } = config;

  // Ensure odd dimensions
  if (width % 2 === 0) width++;
  if (height % 2 === 0) height++;

  const rng = new SeededRandom(seed);
  const grid = new Grid(width, height, 1); // all walls

  // 1. Growing Tree maze generation
  const cells: Array<{ x: number; y: number }> = [];

  // Start from a random odd-aligned cell
  const startX = 1 + 2 * rng.nextInt(0, Math.floor((width - 2) / 2));
  const startY = 1 + 2 * rng.nextInt(0, Math.floor((height - 2) / 2));
  grid.set(startX, startY, 0);
  cells.push({ x: startX, y: startY });

  const dirs = [
    { dx: 0, dy: -2 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
    { dx: 2, dy: 0 },
  ];

  while (cells.length > 0) {
    // Pick a cell based on strategy
    const idx = pickIndex(cells, strategy, rng);
    const cell = cells[idx];

    // Find unvisited neighbors (2 cells away)
    const unvisited = dirs
      .map(d => ({
        x: cell.x + d.dx,
        y: cell.y + d.dy,
        wallX: cell.x + d.dx / 2,
        wallY: cell.y + d.dy / 2,
      }))
      .filter(n =>
        grid.inBounds(n.x, n.y) && grid.get(n.x, n.y) === 1
      );

    if (unvisited.length > 0) {
      const next = rng.pick(unvisited);
      // Carve passage
      grid.set(next.wallX, next.wallY, 0);
      grid.set(next.x, next.y, 0);
      cells.push({ x: next.x, y: next.y });
    } else {
      // No unvisited neighbors — remove from list
      cells.splice(idx, 1);
    }
  }

  // 2. Optional loop creation: randomly remove walls that separate two passages
  if (loopChance > 0) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid.get(x, y) === 1 && rng.chance(loopChance)) {
          // Check if this wall separates two passage cells
          const hNeighbors = grid.get(x - 1, y) === 0 && grid.get(x + 1, y) === 0;
          const vNeighbors = grid.get(x, y - 1) === 0 && grid.get(x, y + 1) === 0;
          if (hNeighbors || vNeighbors) {
            grid.set(x, y, 0);
          }
        }
      }
    }
  }

  // 3. Sparsification: remove dead ends
  for (let pass = 0; pass < sparsification; pass++) {
    let changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid.get(x, y) === 0) {
          const openNeighbors = countCardinalOpen(grid, x, y);
          if (openNeighbors <= 1) {
            grid.set(x, y, 1); // fill in dead end
            changed = true;
          }
        }
      }
    }
    if (!changed) break;
  }

  return { grid };
}

function pickIndex(
  cells: Array<{ x: number; y: number }>,
  strategy: string,
  rng: SeededRandom,
): number {
  switch (strategy) {
    case 'newest':
      return cells.length - 1;
    case 'oldest':
      return 0;
    case 'random':
      return rng.nextInt(0, cells.length - 1);
    case 'mixed':
    default:
      // 50% newest (DFS-like corridors), 50% random (branching)
      return rng.chance(0.5) ? cells.length - 1 : rng.nextInt(0, cells.length - 1);
  }
}

function countCardinalOpen(grid: Grid, x: number, y: number): number {
  let count = 0;
  if (grid.get(x, y - 1) === 0) count++;
  if (grid.get(x, y + 1) === 0) count++;
  if (grid.get(x - 1, y) === 0) count++;
  if (grid.get(x + 1, y) === 0) count++;
  return count;
}
