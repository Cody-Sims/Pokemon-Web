/**
 * BSP / "Rooms and Mazes" dungeon generator.
 *
 * Implements the algorithm described by Bob Nystrom (Hauberk):
 * 1. Fill grid with walls
 * 2. Place random non-overlapping rooms (odd-aligned)
 * 3. Grow mazes in remaining solid regions (recursive backtracker)
 * 4. Find connectors between adjacent regions
 * 5. Build spanning tree to connect all regions (with rare extra connections)
 * 6. Remove dead-end corridors (sparsification)
 * 7. Place doors at room–corridor junctions
 *
 * Tile values: 0 = floor, 1 = wall, 2 = door
 */

import { Grid } from '../core/grid';
import { SeededRandom } from '../core/rng';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DungeonConfig {
  width: number;                 // Must be odd
  height: number;                // Must be odd
  minRoomSize?: number;          // Default 3 (must be odd)
  maxRoomSize?: number;          // Default 9 (must be odd)
  roomAttempts?: number;         // Default 200
  extraConnectorChance?: number; // Default 0.02 (2%)
  seed?: number;                 // Default Date.now()
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DungeonResult {
  grid: Grid;    // 0 = floor, 1 = wall, 2 = door
  rooms: Room[];
}

// ---------------------------------------------------------------------------
// Tile constants
// ---------------------------------------------------------------------------

const WALL = 1;
const FLOOR = 0;
const DOOR = 2;

// Cardinal directions: N, S, E, W
const DIRS: ReadonlyArray<[number, number]> = [
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure a value is odd (rounds up if even). */
function ensureOdd(n: number): number {
  return n % 2 === 0 ? n + 1 : n;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDungeon(config: DungeonConfig): DungeonResult {
  const width = ensureOdd(config.width);
  const height = ensureOdd(config.height);
  const minRoom = ensureOdd(config.minRoomSize ?? 3);
  const maxRoom = ensureOdd(config.maxRoomSize ?? 9);
  const roomAttempts = config.roomAttempts ?? 200;
  const extraChance = config.extraConnectorChance ?? 0.02;
  const rng = new SeededRandom(config.seed ?? Date.now());

  const grid = new Grid(width, height, WALL);

  // Region map – tracks which region each floor cell belongs to.
  // -1 = unassigned (wall).
  const regionMap = new Grid(width, height, -1);
  let currentRegion = -1;

  // -----------------------------------------------------------------------
  // Step 1 – Place rooms
  // -----------------------------------------------------------------------

  const rooms: Room[] = [];

  for (let i = 0; i < roomAttempts; i++) {
    // Random odd-sized room
    const roomW = ensureOdd(rng.nextInt(minRoom, maxRoom));
    const roomH = ensureOdd(rng.nextInt(minRoom, maxRoom));

    // Random odd-aligned position (leave 1-tile border inside the map)
    const x = ensureOdd(rng.nextInt(1, width - roomW - 1));
    const y = ensureOdd(rng.nextInt(1, height - roomH - 1));

    // Check overlap (with 1-tile buffer)
    let overlaps = false;
    for (const r of rooms) {
      if (
        x - 1 < r.x + r.width &&
        x + roomW + 1 > r.x &&
        y - 1 < r.y + r.height &&
        y + roomH + 1 > r.y
      ) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    // Carve the room
    currentRegion++;
    const room: Room = { x, y, width: roomW, height: roomH };
    rooms.push(room);

    for (let ry = y; ry < y + roomH; ry++) {
      for (let rx = x; rx < x + roomW; rx++) {
        grid.set(rx, ry, FLOOR);
        regionMap.set(rx, ry, currentRegion);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Step 2 – Grow mazes in remaining solid areas (recursive backtracker)
  // -----------------------------------------------------------------------

  for (let y = 1; y < height; y += 2) {
    for (let x = 1; x < width; x += 2) {
      if (grid.get(x, y) !== WALL) continue;
      growMaze(grid, regionMap, x, y, rng, ++currentRegion, width, height);
    }
  }

  // -----------------------------------------------------------------------
  // Step 3 – Find connectors and build spanning tree
  // -----------------------------------------------------------------------

  connectRegions(grid, regionMap, currentRegion, rng, extraChance, width, height);

  // -----------------------------------------------------------------------
  // Step 4 – Remove dead ends (sparsification)
  // -----------------------------------------------------------------------

  removeDeadEnds(grid, width, height);

  // -----------------------------------------------------------------------
  // Step 5 – Place doors at room–corridor junctions
  // -----------------------------------------------------------------------

  placeDoors(grid, rooms, width, height);

  return { grid, rooms };
}

// ---------------------------------------------------------------------------
// Maze carver (recursive backtracker, iterative stack)
// ---------------------------------------------------------------------------

function growMaze(
  grid: Grid,
  regionMap: Grid,
  startX: number,
  startY: number,
  rng: SeededRandom,
  region: number,
  width: number,
  height: number,
): void {
  grid.set(startX, startY, FLOOR);
  regionMap.set(startX, startY, region);

  const stack: Array<{ x: number; y: number; lastDir: number }> = [];
  stack.push({ x: startX, y: startY, lastDir: -1 });

  while (stack.length > 0) {
    const cell = stack[stack.length - 1];
    const { x, y } = cell;

    // Find carveable neighbors (2 tiles away, still wall)
    const open: number[] = [];
    for (let d = 0; d < DIRS.length; d++) {
      const [dx, dy] = DIRS[d];
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid.get(nx, ny) === WALL) {
        open.push(d);
      }
    }

    if (open.length === 0) {
      stack.pop();
      continue;
    }

    // Prefer last direction for longer corridors (70% chance)
    let dir: number;
    if (cell.lastDir !== -1 && open.includes(cell.lastDir) && rng.chance(0.7)) {
      dir = cell.lastDir;
    } else {
      dir = rng.pick(open);
    }

    const [dx, dy] = DIRS[dir];
    // Carve the wall between and the destination
    grid.set(x + dx, y + dy, FLOOR);
    regionMap.set(x + dx, y + dy, region);
    grid.set(x + dx * 2, y + dy * 2, FLOOR);
    regionMap.set(x + dx * 2, y + dy * 2, region);

    stack.push({ x: x + dx * 2, y: y + dy * 2, lastDir: dir });
  }
}

// ---------------------------------------------------------------------------
// Connector logic — spanning tree with optional extra connections
// ---------------------------------------------------------------------------

function connectRegions(
  grid: Grid,
  regionMap: Grid,
  maxRegion: number,
  rng: SeededRandom,
  extraChance: number,
  width: number,
  height: number,
): void {
  // Build list of connectors. A connector is a wall tile adjacent (cardinally)
  // to two or more distinct regions.
  interface Connector {
    x: number;
    y: number;
    regions: Set<number>;
  }

  const connectors: Connector[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid.get(x, y) !== WALL) continue;

      const adjacent = new Set<number>();
      for (const [dx, dy] of DIRS) {
        const r = regionMap.get(x + dx, y + dy);
        if (r !== -1) adjacent.add(r);
      }
      if (adjacent.size >= 2) {
        connectors.push({ x, y, regions: adjacent });
      }
    }
  }

  if (connectors.length === 0) return;

  // Union-Find for merging regions
  const parent = new Int32Array(maxRegion + 1);
  for (let i = 0; i <= maxRegion; i++) parent[i] = i;

  function find(a: number): number {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]]; // path compression
      a = parent[a];
    }
    return a;
  }
  function union(a: number, b: number): void {
    parent[find(a)] = find(b);
  }

  // Shuffle connectors for random spanning tree
  rng.shuffle(connectors);

  for (const c of connectors) {
    const regionArr = [...c.regions];
    const roots = new Set(regionArr.map(r => find(r)));

    if (roots.size > 1) {
      // This connector bridges two unconnected regions — always open it
      grid.set(c.x, c.y, FLOOR);
      for (let i = 1; i < regionArr.length; i++) {
        union(regionArr[0], regionArr[i]);
      }
    } else if (rng.chance(extraChance)) {
      // Extra connector for loops
      grid.set(c.x, c.y, FLOOR);
    }
  }
}

// ---------------------------------------------------------------------------
// Dead-end removal
// ---------------------------------------------------------------------------

function removeDeadEnds(grid: Grid, width: number, height: number): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid.get(x, y) === WALL) continue;
        // Count open cardinal neighbors
        let openCount = 0;
        for (const [dx, dy] of DIRS) {
          if (grid.get(x + dx, y + dy) !== WALL) openCount++;
        }
        if (openCount <= 1) {
          grid.set(x, y, WALL);
          changed = true;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Door placement — mark transitions between rooms and corridors
// ---------------------------------------------------------------------------

function placeDoors(grid: Grid, rooms: Room[], _width: number, _height: number): void {
  for (const room of rooms) {
    // Scan the 1-tile border around the room
    for (let ry = room.y - 1; ry <= room.y + room.height; ry++) {
      for (let rx = room.x - 1; rx <= room.x + room.width; rx++) {
        // Only look at border tiles (not interior)
        const isInterior =
          rx >= room.x && rx < room.x + room.width &&
          ry >= room.y && ry < room.y + room.height;
        if (isInterior) continue;

        if (grid.get(rx, ry) !== FLOOR) continue;

        // Check if this floor tile bridges the room and a corridor/another room
        let touchesRoom = false;
        let touchesCorridor = false;
        for (const [dx, dy] of DIRS) {
          const nx = rx + dx;
          const ny = ry + dy;
          if (grid.get(nx, ny) === WALL) continue;
          const insideRoom =
            nx >= room.x && nx < room.x + room.width &&
            ny >= room.y && ny < room.y + room.height;
          if (insideRoom) {
            touchesRoom = true;
          } else if (grid.get(nx, ny) === FLOOR) {
            touchesCorridor = true;
          }
        }
        if (touchesRoom && touchesCorridor) {
          grid.set(rx, ry, DOOR);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default generateDungeon;
