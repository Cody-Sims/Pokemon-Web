/**
 * Cellular automata cave generator.
 *
 * Algorithm:
 * 1. Randomly fill grid — each cell has fillProbability chance of being wall
 * 2. Run N smoothing iterations (Moore neighborhood rule 4-5)
 * 3. Find largest connected open region and wall off all others
 * 4. Place entrance/exit at opposite ends of the surviving region
 * 5. Carve guaranteed path between entrance and exit if not connected
 *
 * Tile values: 0 = floor, 1 = wall
 */

import { Grid } from '../core/grid';
import { SeededRandom } from '../core/rng';
import { findConnectedRegions } from '../core/flood-fill';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaveConfig {
  width: number;
  height: number;
  fillProbability?: number; // Default 0.45
  iterations?: number;      // Default 5
  seed?: number;
}

export interface CaveResult {
  grid: Grid;  // 0 = floor, 1 = wall
  entrance: { x: number; y: number };
  exit: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WALL = 1;
const FLOOR = 0;

const CARDINAL_DIRS: ReadonlyArray<[number, number]> = [
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
];

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateCave(config: CaveConfig): CaveResult {
  const { width, height } = config;
  const fillProb = config.fillProbability ?? 0.45;
  const iterations = config.iterations ?? 5;
  const rng = new SeededRandom(config.seed ?? Date.now());

  // -----------------------------------------------------------------------
  // Step 1 — Random fill
  // -----------------------------------------------------------------------

  let grid = new Grid(width, height, WALL);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Border is always wall
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        grid.set(x, y, WALL);
      } else {
        grid.set(x, y, rng.chance(fillProb) ? WALL : FLOOR);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Step 2 — Cellular automata smoothing
  // -----------------------------------------------------------------------

  for (let i = 0; i < iterations; i++) {
    const next = new Grid(width, height, WALL);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const solidNeighbors = grid.countNeighbors(x, y, v => v === WALL);

        if (solidNeighbors >= 5) {
          next.set(x, y, WALL);
        } else if (solidNeighbors <= 3) {
          next.set(x, y, FLOOR);
        } else {
          next.set(x, y, grid.get(x, y));
        }
      }
    }

    grid = next;
  }

  // -----------------------------------------------------------------------
  // Step 3 — Keep only the largest connected open region
  // -----------------------------------------------------------------------

  const regions = findConnectedRegions(grid, v => v === FLOOR);

  if (regions.length === 0) {
    // Degenerate case: carve a small area in the center
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    grid.fillRect(cx - 1, cy - 1, 3, 3, FLOOR);
    return {
      grid,
      entrance: { x: cx - 1, y: cy },
      exit: { x: cx + 1, y: cy },
    };
  }

  // Wall off every region except the largest
  const largestCells = new Set(
    regions[0].cells.map(c => `${c.x},${c.y}`),
  );

  for (let i = 1; i < regions.length; i++) {
    for (const cell of regions[i].cells) {
      grid.set(cell.x, cell.y, WALL);
    }
  }

  // -----------------------------------------------------------------------
  // Step 4 — Place entrance and exit at opposite ends
  // -----------------------------------------------------------------------

  const surviving = regions[0].cells;
  const { entrance, exit } = placeEntranceExit(surviving);

  // -----------------------------------------------------------------------
  // Step 5 — Guarantee path between entrance and exit
  // -----------------------------------------------------------------------

  guaranteePath(grid, entrance, exit);

  return { grid, entrance, exit };
}

// ---------------------------------------------------------------------------
// Entrance / Exit placement
// ---------------------------------------------------------------------------

/**
 * Pick the two cells in the region that are farthest apart (Manhattan distance).
 * Uses a two-pass approach: find the cell farthest from (0,0), then find the
 * cell farthest from that one.
 */
function placeEntranceExit(
  cells: Array<{ x: number; y: number }>,
): { entrance: { x: number; y: number }; exit: { x: number; y: number } } {
  // First pass: pick cell with smallest (x + y) → "top-left-ish"
  let entrance = cells[0];
  let minSum = entrance.x + entrance.y;
  for (const c of cells) {
    if (c.x + c.y < minSum) {
      minSum = c.x + c.y;
      entrance = c;
    }
  }

  // Second pass: farthest from entrance (Manhattan)
  let exit = cells[0];
  let maxDist = 0;
  for (const c of cells) {
    const d = Math.abs(c.x - entrance.x) + Math.abs(c.y - entrance.y);
    if (d > maxDist) {
      maxDist = d;
      exit = c;
    }
  }

  return { entrance: { x: entrance.x, y: entrance.y }, exit: { x: exit.x, y: exit.y } };
}

// ---------------------------------------------------------------------------
// Guaranteed path via A* tunneling
// ---------------------------------------------------------------------------

/**
 * If entrance and exit are not already connected, carve a corridor using A*.
 * The heuristic weights walls slightly more so it prefers existing open space.
 */
function guaranteePath(
  grid: Grid,
  start: { x: number; y: number },
  end: { x: number; y: number },
): void {
  // Quick connectivity check first
  if (isConnected(grid, start, end)) return;

  // A* with wall penalty
  const key = (x: number, y: number) => `${x},${y}`;

  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const openSet = new Map<string, number>(); // key -> fScore

  const startKey = key(start.x, start.y);
  const endKey = key(end.x, end.y);

  gScore.set(startKey, 0);
  openSet.set(startKey, heuristic(start.x, start.y, end.x, end.y));

  while (openSet.size > 0) {
    // Pick lowest fScore
    let currentKey = '';
    let bestF = Infinity;
    for (const [k, f] of openSet) {
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }

    if (currentKey === endKey) {
      // Reconstruct and carve
      let ck = endKey;
      while (ck !== startKey) {
        const [cx, cy] = ck.split(',').map(Number);
        grid.set(cx, cy, FLOOR);
        ck = cameFrom.get(ck)!;
      }
      return;
    }

    openSet.delete(currentKey);
    const [cx, cy] = currentKey.split(',').map(Number);
    const currentG = gScore.get(currentKey)!;

    for (const [dx, dy] of CARDINAL_DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!grid.inBounds(nx, ny)) continue;
      // Don't carve through the map border
      if (nx === 0 || nx === grid.width - 1 || ny === 0 || ny === grid.height - 1) continue;

      const nk = key(nx, ny);
      // Cost: 1 for floor, 3 for wall (prefer existing open space)
      const moveCost = grid.get(nx, ny) === WALL ? 3 : 1;
      const tentativeG = currentG + moveCost;

      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentativeG);
        cameFrom.set(nk, currentKey);
        openSet.set(nk, tentativeG + heuristic(nx, ny, end.x, end.y));
      }
    }
  }
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/** Simple BFS connectivity check */
function isConnected(
  grid: Grid,
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [a];
  const target = `${b.x},${b.y}`;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const k = `${x},${y}`;
    if (k === target) return true;
    if (visited.has(k)) continue;
    visited.add(k);

    for (const [dx, dy] of CARDINAL_DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!grid.inBounds(nx, ny)) continue;
      if (grid.get(nx, ny) === WALL) continue;
      const nk = `${nx},${ny}`;
      if (!visited.has(nk)) queue.push({ x: nx, y: ny });
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default generateCave;
