/**
 * Path connector: auto-route roads between buildings and exits.
 * Uses A* pathfinding on the character grid to connect doors to the nearest path network.
 */

/** Point on a character grid */
interface Point {
  x: number;
  y: number;
}

/** Walkable characters for routing (tiles the path can cross) */
const WALKABLE_CHARS = new Set([
  '.', 'P', 'G', 'f', 's', 'S', ',', 'D', 'e', 'n', 'a', 'E',
  '_', 'O', 'I', 'l', 'y', 'u', 'v', 'r', 'Q',
  '4', '5', '7', '«', '‡', 'Ð', '§', 'Ŧ', 'Ʃ',
]);

/** Door characters that need path connections */
const DOOR_CHARS = new Set(['D', 'e', 'n', 'a', 'E']);

/** Path character */
const PATH_CHAR = 'P';

/**
 * Find all door positions in a character grid.
 */
export function findDoors(grid: string[]): Point[] {
  const doors: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    const chars = [...grid[y]];
    for (let x = 0; x < chars.length; x++) {
      if (DOOR_CHARS.has(chars[x])) {
        doors.push({ x, y });
      }
    }
  }
  return doors;
}

/**
 * Find all existing path positions in a character grid.
 */
export function findPaths(grid: string[]): Point[] {
  const paths: Point[] = [];
  for (let y = 0; y < grid.length; y++) {
    const chars = [...grid[y]];
    for (let x = 0; x < chars.length; x++) {
      if (chars[x] === PATH_CHAR) {
        paths.push({ x, y });
      }
    }
  }
  return paths;
}

/**
 * Connect all doors to the nearest path cell using A*, drawing PATH tiles.
 * Modifies the grid in place and returns it.
 */
export function connectDoorsToPath(grid: string[]): string[] {
  const doors = findDoors(grid);
  const pathCells = findPaths(grid);
  if (pathCells.length === 0 || doors.length === 0) return grid;

  // Convert to mutable 2D array
  const canvas = grid.map(row => [...row]);
  const height = canvas.length;
  const width = canvas[0]?.length ?? 0;

  for (const door of doors) {
    // Check if door is already adjacent to a path
    const adjacent = getCardinalNeighbors(door.x, door.y, width, height);
    const alreadyConnected = adjacent.some(
      n => canvas[n.y]?.[n.x] === PATH_CHAR
    );
    if (alreadyConnected) continue;

    // Find nearest path cell
    const nearest = findNearest(door, pathCells);
    if (!nearest) continue;

    // A* from door's adjacent walkable cell to nearest path
    const doorExit = findWalkableAdjacent(door, canvas, width, height);
    if (!doorExit) continue;

    const route = astarChars(canvas, doorExit, nearest, width, height);
    if (route) {
      for (const p of route) {
        if (canvas[p.y][p.x] !== PATH_CHAR && !DOOR_CHARS.has(canvas[p.y][p.x])) {
          canvas[p.y][p.x] = PATH_CHAR;
        }
      }
    } else {
      // Fallback: L-shaped direct connection
      lShapedPath(canvas, doorExit, nearest);
    }
  }

  return canvas.map(row => row.join(''));
}

/** Find walkable cell adjacent to a door (below the door, typically) */
function findWalkableAdjacent(door: Point, canvas: string[][], w: number, h: number): Point | null {
  // Prefer below, then left/right, then above
  const offsets = [
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
  ];
  for (const { dx, dy } of offsets) {
    const nx = door.x + dx;
    const ny = door.y + dy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const ch = canvas[ny][nx];
      if (ch === PATH_CHAR || WALKABLE_CHARS.has(ch)) {
        return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function findNearest(from: Point, targets: Point[]): Point | null {
  let best: Point | null = null;
  let bestDist = Infinity;
  for (const t of targets) {
    const d = Math.abs(from.x - t.x) + Math.abs(from.y - t.y);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}

function getCardinalNeighbors(x: number, y: number, w: number, h: number): Point[] {
  return [
    { x: x - 1, y }, { x: x + 1, y },
    { x, y: y - 1 }, { x, y: y + 1 },
  ].filter(p => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h);
}

/** Simplified A* on character grid — avoids solid tiles */
function astarChars(
  canvas: string[][],
  start: Point,
  goal: Point,
  w: number,
  h: number,
): Point[] | null {
  const SOLID_CHARS = new Set([
    'T', 'X', 'W', 'H', 'R', 'L', 'B', 'C', 'M', 'A', '#',
    'F', '^', ';', '~', '%', 'q',
    '&', '@', '$', 'w',
    '1', '2', '3',
    'Þ', 'Ɯ', 'Ħ', 'Æ', '®',
  ]);

  interface Node {
    x: number; y: number;
    g: number; h: number; f: number;
    parent: Node | null;
  }

  const open = new Map<string, Node>();
  const closed = new Set<string>();

  const hFn = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const startNode: Node = {
    x: start.x, y: start.y,
    g: 0, h: hFn(start, goal), f: hFn(start, goal),
    parent: null,
  };
  open.set(`${start.x},${start.y}`, startNode);

  while (open.size > 0) {
    let current: Node | null = null;
    for (const n of open.values()) {
      if (!current || n.f < current.f) current = n;
    }
    if (!current) return null;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [];
      let n: Node | null = current;
      while (n) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
      return path;
    }

    const key = `${current.x},${current.y}`;
    open.delete(key);
    closed.add(key);

    for (const next of getCardinalNeighbors(current.x, current.y, w, h)) {
      const nk = `${next.x},${next.y}`;
      if (closed.has(nk)) continue;
      const ch = canvas[next.y][next.x];
      if (SOLID_CHARS.has(ch)) continue;

      const g = current.g + 1;
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        const node: Node = {
          x: next.x, y: next.y,
          g, h: hFn(next, goal), f: g + hFn(next, goal),
          parent: current,
        };
        open.set(nk, node);
      }
    }
  }
  return null;
}

function lShapedPath(canvas: string[][], from: Point, to: Point): void {
  // Horizontal then vertical
  const xDir = to.x > from.x ? 1 : -1;
  let x = from.x;
  while (x !== to.x) {
    if (canvas[from.y][x] === '.') canvas[from.y][x] = PATH_CHAR;
    x += xDir;
  }

  const yDir = to.y > from.y ? 1 : -1;
  let y = from.y;
  while (y !== to.y + yDir) {
    if (canvas[y][to.x] === '.') canvas[y][to.x] = PATH_CHAR;
    y += yDir;
  }
}
