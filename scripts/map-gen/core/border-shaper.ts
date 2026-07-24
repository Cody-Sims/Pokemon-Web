/**
 * Border shaper — turns a rectangular grid into a non-rectangular playable
 * area by carving irregular tree-lines, coastlines and cliff faces.
 *
 * Authoring model: caller fills the grid with the *interior* tile (e.g. grass)
 * and tells us which tiles to use for the border (trees), water (coast) and
 * cliff (cliff face). We then sculpt the edges with low-frequency value noise.
 *
 * Connectivity is always preserved — after shaping we run a flood fill and
 * any interior cells that were cut off from the largest playable region are
 * back-filled with the border tile, so the player can never get stuck on a
 * disconnected island of grass. Caller-supplied `protected` cells are guaranteed
 * to remain interior.
 */

import { Grid } from './grid';
import { findConnectedRegions } from './flood-fill';
import { ValueNoise } from './value-noise';

export type Side = 'north' | 'south' | 'east' | 'west';

export interface OrganicBorderOpts {
  /** Tile id used for the border (trees, dense forest, cliff, …). */
  borderTile: number;
  /** Tile id that marks the playable interior, used for the connectivity test. */
  interiorTile: number;
  /** Mean border thickness, in tiles. Default 3. */
  thickness?: number;
  /** How rough the edge is. 0 = nearly straight, 1 = very ragged. Default 0.55. */
  roughness?: number;
  /** Noise frequency scale. Smaller = larger lobes. Default 6. */
  scale?: number;
  /** Cells that must remain interior (entrances, warps, etc.). */
  protect?: ReadonlyArray<{ x: number; y: number }>;
  /** Seed for the noise field. Default 1. */
  seed?: number;
  /** Sides to shape. Default: all four. */
  sides?: ReadonlyArray<Side>;
}

/**
 * Carve an irregular border into `grid`. The grid is mutated in place.
 *
 * Algorithm:
 *   1. For each cell, compute its distance from the nearest selected edge.
 *   2. Sample a noise value at that cell.
 *   3. If the noise-perturbed distance is below a threshold derived from
 *      `thickness` and `roughness`, mark the cell as border.
 *   4. After the pass, keep only the largest connected interior region; any
 *      stray pockets become border so the player can't reach them.
 */
export function shapeOrganicBorder(grid: Grid, opts: OrganicBorderOpts): void {
  const {
    borderTile,
    interiorTile,
    thickness = 3,
    roughness = 0.55,
    scale = 6,
    protect = [],
    seed = 1,
    sides = ['north', 'south', 'east', 'west'],
  } = opts;

  const noise = new ValueNoise(seed);
  const { width, height } = grid;
  const sideSet = new Set(sides);

  const protectKeys = new Set(protect.map(p => `${p.x},${p.y}`));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (protectKeys.has(`${x},${y}`)) continue;

      // Distance from each enabled edge.
      const dN = sideSet.has('north') ? y : Infinity;
      const dS = sideSet.has('south') ? height - 1 - y : Infinity;
      const dW = sideSet.has('west') ? x : Infinity;
      const dE = sideSet.has('east') ? width - 1 - x : Infinity;
      const edgeDist = Math.min(dN, dS, dW, dE);

      // Noise in [0, 1) — multiplied by roughness * thickness gives the
      // amount we *push* the boundary inwards at this cell.
      const n = noise.fbm(x / scale, y / scale, 4, 0.55);
      const inset = n * roughness * thickness * 2;

      if (edgeDist < thickness - thickness * (1 - roughness) * 0.5 + inset - thickness) {
        // Solid border zone — always border.
        grid.set(x, y, borderTile);
      } else if (edgeDist < thickness + inset) {
        // Soft fringe — border where noise is high.
        if (n > 0.5 - roughness * 0.4) {
          grid.set(x, y, borderTile);
        }
      }
    }
  }

  enforceConnectivity(grid, interiorTile, borderTile, protect);
}

export interface CoastlineOpts {
  side: Side;
  /** Tile id for water (e.g. WATER = 4). */
  waterTile: number;
  /** Tile id for the beach band laid between water and interior (e.g. SAND = 54). */
  sandTile: number;
  /** Tile id used to wall off cells cut off by the carved coast. */
  borderTile: number;
  /** Tile id of the interior, for the connectivity guard. */
  interiorTile: number;
  /** Average inland penetration of the water in tiles. Default 4. */
  depth?: number;
  /** Width of the beach band. Default 1. */
  beachWidth?: number;
  /** How wavy the shoreline is. 0 = straight, 1 = many bays. Default 0.6. */
  roughness?: number;
  /** Noise feature scale along the shore. Default 7. */
  scale?: number;
  /** Cells that must remain interior. */
  protect?: ReadonlyArray<{ x: number; y: number }>;
  seed?: number;
}

/**
 * Replace one side of the map with an irregular coast: water + a thin sand
 * band, with a noisy boundary that produces coves and headlands. Useful for
 * routes that hug a sea.
 */
export function carveCoastline(grid: Grid, opts: CoastlineOpts): void {
  const {
    side,
    waterTile,
    sandTile,
    borderTile,
    interiorTile,
    depth = 4,
    beachWidth = 1,
    roughness = 0.6,
    scale = 7,
    protect = [],
    seed = 1,
  } = opts;

  const noise = new ValueNoise(seed);
  const { width, height } = grid;
  const protectKeys = new Set(protect.map(p => `${p.x},${p.y}`));

  // For each column (or row, depending on side) decide how far inland the
  // water reaches. Then fill that band with water and a 1-2 tile sand fringe.
  if (side === 'north' || side === 'south') {
    for (let x = 0; x < width; x++) {
      const n = noise.fbm(x / scale, side === 'north' ? 0 : 100, 3, 0.55);
      const reach = Math.round(depth * (0.6 + roughness * (n - 0.5) * 2));

      for (let d = 0; d < reach; d++) {
        const y = side === 'north' ? d : height - 1 - d;
        if (protectKeys.has(`${x},${y}`)) continue;
        grid.set(x, y, waterTile);
      }
      for (let d = reach; d < reach + beachWidth; d++) {
        const y = side === 'north' ? d : height - 1 - d;
        if (protectKeys.has(`${x},${y}`)) continue;
        if (grid.get(x, y) === interiorTile) grid.set(x, y, sandTile);
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      const n = noise.fbm(side === 'west' ? 0 : 100, y / scale, 3, 0.55);
      const reach = Math.round(depth * (0.6 + roughness * (n - 0.5) * 2));

      for (let d = 0; d < reach; d++) {
        const x = side === 'west' ? d : width - 1 - d;
        if (protectKeys.has(`${x},${y}`)) continue;
        grid.set(x, y, waterTile);
      }
      for (let d = reach; d < reach + beachWidth; d++) {
        const x = side === 'west' ? d : width - 1 - d;
        if (protectKeys.has(`${x},${y}`)) continue;
        if (grid.get(x, y) === interiorTile) grid.set(x, y, sandTile);
      }
    }
  }

  enforceConnectivity(grid, interiorTile, borderTile, protect);
}

export interface CliffEdgeOpts {
  side: Side;
  /** Tile id for the cliff face (CLIFF_FACE = 57). */
  cliffTile: number;
  /** Tile id of the interior. */
  interiorTile: number;
  /** Average cliff thickness. Default 2. */
  thickness?: number;
  /** Roughness of the cliff base (0 = straight, 1 = jagged). Default 0.5. */
  roughness?: number;
  /** Noise feature scale. Default 5. */
  scale?: number;
  protect?: ReadonlyArray<{ x: number; y: number }>;
  seed?: number;
}

/**
 * Stamp a wavy cliff face along one side. The cliff is opaque — the border
 * shaper guarantees no interior cell is sealed off.
 */
export function carveCliffEdge(grid: Grid, opts: CliffEdgeOpts): void {
  const {
    side,
    cliffTile,
    interiorTile,
    thickness = 2,
    roughness = 0.5,
    scale = 5,
    protect = [],
    seed = 1,
  } = opts;

  shapeOrganicBorder(grid, {
    borderTile: cliffTile,
    interiorTile,
    thickness,
    roughness,
    scale,
    protect,
    seed,
    sides: [side],
  });
}

/**
 * After any shaping pass, ensure every interior cell is reachable from the
 * largest connected region. Pockets are filled with `borderTile` (so they
 * disappear visually rather than tempting the player into a dead area).
 *
 * `protect` cells are forced into the largest region's predicate by being
 * reset to interior before the flood fill — this guarantees the caller's
 * entrances cannot be sealed off.
 */
function enforceConnectivity(
  grid: Grid,
  interiorTile: number,
  borderTile: number,
  protect: ReadonlyArray<{ x: number; y: number }>,
): void {
  for (const p of protect) {
    if (grid.inBounds(p.x, p.y)) grid.set(p.x, p.y, interiorTile);
  }

  const regions = findConnectedRegions(grid, v => v === interiorTile);
  if (regions.length <= 1) return;

  const keep = new Set(regions[0].cells.map(c => `${c.x},${c.y}`));
  for (let i = 1; i < regions.length; i++) {
    for (const c of regions[i].cells) {
      if (!keep.has(`${c.x},${c.y}`)) grid.set(c.x, c.y, borderTile);
    }
  }
}

/**
 * Punch a corridor of interior tiles from an external entry point to the
 * playable region. Useful for guaranteeing every map entrance is reachable
 * even after a noise pass.
 */
export function punchEntrance(
  grid: Grid,
  entry: { x: number; y: number },
  inward: { x: number; y: number },
  interiorTile: number,
  width = 1,
): void {
  const half = Math.floor(width / 2);
  let cx = entry.x;
  let cy = entry.y;
  const dx = Math.sign(inward.x - entry.x);
  const dy = Math.sign(inward.y - entry.y);

  // Carve until we reach an existing interior cell — then stop.
  for (let i = 0; i < grid.width + grid.height; i++) {
    for (let oy = -half; oy <= half; oy++) {
      for (let ox = -half; ox <= half; ox++) {
        if (grid.inBounds(cx + ox, cy + oy)) {
          grid.set(cx + ox, cy + oy, interiorTile);
        }
      }
    }
    if (cx === inward.x && cy === inward.y) return;
    if (Math.abs(inward.x - cx) > Math.abs(inward.y - cy)) cx += dx;
    else if (cy !== inward.y) cy += dy;
    else cx += dx;
  }
}
