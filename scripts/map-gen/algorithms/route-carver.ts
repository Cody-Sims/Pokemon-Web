/**
 * Route Carver: generates overworld route maps with natural terrain,
 * paths between entrances, and feature placement (tall grass, water, ledges).
 */
import { Grid } from '../core/grid';
import { SeededRandom } from '../core/rng';
import { astar } from '../core/pathfind';
import { floodFill } from '../core/flood-fill';

export interface Entrance {
  x: number;
  y: number;
  side: 'north' | 'south' | 'east' | 'west';
}

export interface FeatureZone {
  type: 'tall-grass' | 'water' | 'ledge' | 'sand' | 'flowers' | 'trees';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RouteConfig {
  width: number;
  height: number;
  entrances: Entrance[];
  /** Feature placement density (0-1). Default 0.3 */
  featureDensity?: number;
  /** Number of tall grass patches. Default: auto based on size */
  grassPatches?: number;
  /** Minimum path width between entrances. Default 3 */
  pathWidth?: number;
  seed?: number;
}

export interface RouteResult {
  grid: Grid;
  entrances: Entrance[];
  features: FeatureZone[];
}

/** Tile values for route generation (neutral biome) */
const T = {
  GRASS: 0,       // '.'
  PATH: 1,        // 'P'
  TALL_GRASS: 2,  // 'G'
  TREE: 3,        // 'T'
  WATER: 4,       // 'W'
  FLOWER: 9,      // 'f'
  SAND: 54,       // 's'
  LEDGE: 14,      // 'J'
  FENCE: 8,       // 'F'
  BUSH: 56,       // '%'
  ROCK: 55,       // '~'
  DENSE_TREE: 24, // 'X'
  SIGN: 10,       // 'S'
} as const;

const WALKABLE = new Set([T.GRASS, T.PATH, T.TALL_GRASS, T.FLOWER, T.SAND]);

export function generateRoute(config: RouteConfig): RouteResult {
  const {
    width, height, entrances,
    featureDensity = 0.3,
    grassPatches,
    pathWidth = 3,
    seed = Date.now(),
  } = config;

  const rng = new SeededRandom(seed);
  const grid = new Grid(width, height, T.GRASS);
  const features: FeatureZone[] = [];

  // 1. Place border (trees on all edges)
  placeBorder(grid, T.TREE);

  // 2. Open entrances
  for (const ent of entrances) {
    openEntrance(grid, ent, pathWidth);
  }

  // 3. Carve main paths between entrances
  carveMainPaths(grid, entrances, pathWidth, rng);

  // 4. Place feature zones
  const numGrass = grassPatches ?? Math.max(2, Math.floor((width * height) / 120));
  for (let i = 0; i < numGrass; i++) {
    const zone = placeGrassPatch(grid, rng, width, height);
    if (zone) features.push(zone);
  }

  // 5. Scatter decorative elements
  scatterDecorations(grid, rng, featureDensity);

  // 6. Place water features occasionally
  if (rng.chance(0.4) && width >= 15 && height >= 15) {
    const wz = placeWaterFeature(grid, rng, width, height);
    if (wz) features.push(wz);
  }

  // 7. Verify connectivity between all entrances
  ensureConnectivity(grid, entrances);

  return { grid, entrances, features };
}

function placeBorder(grid: Grid, tile: number): void {
  for (let x = 0; x < grid.width; x++) {
    grid.set(x, 0, tile);
    grid.set(x, grid.height - 1, tile);
  }
  for (let y = 0; y < grid.height; y++) {
    grid.set(0, y, tile);
    grid.set(grid.width - 1, y, tile);
  }
}

function openEntrance(grid: Grid, ent: Entrance, pathWidth: number): void {
  const half = Math.floor(pathWidth / 2);
  switch (ent.side) {
    case 'north':
      for (let dx = -half; dx <= half; dx++) {
        grid.set(ent.x + dx, 0, T.PATH);
        grid.set(ent.x + dx, 1, T.PATH);
      }
      break;
    case 'south':
      for (let dx = -half; dx <= half; dx++) {
        grid.set(ent.x + dx, grid.height - 1, T.PATH);
        grid.set(ent.x + dx, grid.height - 2, T.PATH);
      }
      break;
    case 'west':
      for (let dy = -half; dy <= half; dy++) {
        grid.set(0, ent.y + dy, T.PATH);
        grid.set(1, ent.y + dy, T.PATH);
      }
      break;
    case 'east':
      for (let dy = -half; dy <= half; dy++) {
        grid.set(grid.width - 1, ent.y + dy, T.PATH);
        grid.set(grid.width - 2, ent.y + dy, T.PATH);
      }
      break;
  }
}

function carveMainPaths(grid: Grid, entrances: Entrance[], pathWidth: number, rng: SeededRandom): void {
  if (entrances.length < 2) return;
  const half = Math.floor(pathWidth / 2);

  for (let i = 0; i < entrances.length - 1; i++) {
    const from = entrances[i];
    const to = entrances[i + 1];

    // Use weighted random walk with directional bias toward target
    const path = randomWalkPath(grid, from, to, rng);

    // Carve the path with given width
    for (const pt of path) {
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = pt.x + dx;
          const ny = pt.y + dy;
          if (grid.inBounds(nx, ny) && grid.get(nx, ny) !== T.TREE) {
            // Don't overwrite border trees unless at entrances
            if (nx > 0 && nx < grid.width - 1 && ny > 0 && ny < grid.height - 1) {
              grid.set(nx, ny, T.PATH);
            }
          }
        }
      }
    }
  }
}

function randomWalkPath(
  grid: Grid,
  from: Entrance,
  to: Entrance,
  rng: SeededRandom,
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];
  let x = Math.max(1, Math.min(grid.width - 2, from.x));
  let y = Math.max(1, Math.min(grid.height - 2, from.y));
  const tx = Math.max(1, Math.min(grid.width - 2, to.x));
  const ty = Math.max(1, Math.min(grid.height - 2, to.y));

  const maxSteps = grid.width * grid.height;
  for (let step = 0; step < maxSteps; step++) {
    path.push({ x, y });
    if (x === tx && y === ty) break;

    // Bias toward target with some randomness for organic feel
    const dx = tx - x;
    const dy = ty - y;

    if (rng.chance(0.7)) {
      // Move toward target
      if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && rng.chance(0.5))) {
        x += Math.sign(dx);
      } else {
        y += Math.sign(dy);
      }
    } else {
      // Random perpendicular step for organic feel
      if (Math.abs(dx) > Math.abs(dy)) {
        y += rng.chance(0.5) ? 1 : -1;
      } else {
        x += rng.chance(0.5) ? 1 : -1;
      }
    }
    x = Math.max(2, Math.min(grid.width - 3, x));
    y = Math.max(2, Math.min(grid.height - 3, y));
  }

  return path;
}

function placeGrassPatch(
  grid: Grid,
  rng: SeededRandom,
  width: number,
  height: number,
): FeatureZone | null {
  const patchW = rng.nextInt(2, 5);
  const patchH = rng.nextInt(2, 4);
  const px = rng.nextInt(2, width - patchW - 2);
  const py = rng.nextInt(2, height - patchH - 2);

  // Only place on grass (not on paths or other features)
  let canPlace = true;
  for (let y = py; y < py + patchH && canPlace; y++) {
    for (let x = px; x < px + patchW && canPlace; x++) {
      const v = grid.get(x, y);
      if (v !== T.GRASS) canPlace = false;
    }
  }

  if (!canPlace) return null;

  for (let y = py; y < py + patchH; y++) {
    for (let x = px; x < px + patchW; x++) {
      grid.set(x, y, T.TALL_GRASS);
    }
  }

  return { type: 'tall-grass', x: px, y: py, width: patchW, height: patchH };
}

function scatterDecorations(grid: Grid, rng: SeededRandom, density: number): void {
  const decorations = [T.FLOWER, T.ROCK, T.BUSH];
  grid.forEach((x, y, v) => {
    if (v === T.GRASS && rng.chance(density * 0.05)) {
      grid.set(x, y, rng.pick(decorations));
    }
  });
}

function placeWaterFeature(
  grid: Grid,
  rng: SeededRandom,
  width: number,
  height: number,
): FeatureZone | null {
  const ww = rng.nextInt(3, 6);
  const wh = rng.nextInt(2, 4);
  const wx = rng.nextInt(3, width - ww - 3);
  const wy = rng.nextInt(3, height - wh - 3);

  // Only place on grass
  let canPlace = true;
  for (let y = wy - 1; y <= wy + wh && canPlace; y++) {
    for (let x = wx - 1; x <= wx + ww && canPlace; x++) {
      const v = grid.get(x, y);
      if (v !== T.GRASS && v !== T.FLOWER) canPlace = false;
    }
  }

  if (!canPlace) return null;

  for (let y = wy; y < wy + wh; y++) {
    for (let x = wx; x < wx + ww; x++) {
      grid.set(x, y, T.WATER);
    }
  }

  return { type: 'water', x: wx, y: wy, width: ww, height: wh };
}

function ensureConnectivity(grid: Grid, entrances: Entrance[]): void {
  if (entrances.length < 2) return;

  for (let i = 0; i < entrances.length - 1; i++) {
    const a = entrances[i];
    const b = entrances[i + 1];
    const ax = Math.max(1, Math.min(grid.width - 2, a.x));
    const ay = Math.max(1, Math.min(grid.height - 2, a.y));
    const bx = Math.max(1, Math.min(grid.width - 2, b.x));
    const by = Math.max(1, Math.min(grid.height - 2, b.y));

    const connected = floodFill(grid, ax, ay, v => WALKABLE.has(v));
    const reachable = connected.some(c => c.x === bx && c.y === by);

    if (!reachable) {
      // Emergency: carve direct L-path
      let x = ax;
      while (x !== bx) {
        if (grid.get(x, ay) === T.TREE) grid.set(x, ay, T.PATH);
        else if (!WALKABLE.has(grid.get(x, ay))) grid.set(x, ay, T.PATH);
        x += Math.sign(bx - ax);
      }
      let y = ay;
      while (y !== by) {
        if (grid.get(bx, y) === T.TREE) grid.set(bx, y, T.PATH);
        else if (!WALKABLE.has(grid.get(bx, y))) grid.set(bx, y, T.PATH);
        y += Math.sign(by - ay);
      }
    }
  }
}
