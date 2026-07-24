/**
 * Organic route generator.
 *
 * Produces non-rectangular overworld routes inspired by mainline Pokémon —
 * irregular tree-lines, optional coastlines and cliff edges, branching paths,
 * tall-grass patches and one-way ledges. Built on top of [`shapeOrganicBorder`]
 * and the existing `Grid` / `SeededRandom` infrastructure.
 *
 * The generator produces a numeric tile grid using the same neutral tile IDs
 * as `route-carver.ts`, so the output flows through `gridToCharMap()` and the
 * biome substitution layer unchanged.
 */

import { Grid } from '../core/grid';
import { SeededRandom } from '../core/rng';
import { floodFill, findConnectedRegions } from '../core/flood-fill';
import {
  shapeOrganicBorder,
  carveCoastline,
  carveCliffEdge,
  punchEntrance,
  type Side,
} from '../core/border-shaper';

// ---------------------------------------------------------------------------
// Tile IDs (must match TILE_TO_CHAR in export/to-charmap.ts)
// ---------------------------------------------------------------------------

const T = {
  GRASS: 0,
  PATH: 1,
  TALL_GRASS: 2,
  TREE: 3,
  WATER: 4,
  FLOWER: 9,
  SAND: 54,
  LEDGE: 14,
  BUSH: 56,
  ROCK: 55,
  CLIFF: 57,
  DENSE_TREE: 24,
} as const;

const WALKABLE = new Set<number>([T.GRASS, T.PATH, T.TALL_GRASS, T.FLOWER, T.SAND]);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RouteShape = 'forest' | 'coastal' | 'cliffside' | 'peninsula';

export interface OrganicEntrance {
  x: number;
  y: number;
  side: Side;
}

export interface OrganicRouteConfig {
  width: number;
  height: number;
  /** Where the route connects. Default: north + south at the centre. */
  entrances?: OrganicEntrance[];
  /** Overall map silhouette. Default 'forest'. */
  shape?: RouteShape;
  /** Path width. Default 3. */
  pathWidth?: number;
  /** Number of branching side paths leading to alcoves. Default: auto. */
  branches?: number;
  /** Add ledges on the path? Default true. */
  ledges?: boolean;
  /** Edge roughness 0..1. Default 0.55. */
  roughness?: number;
  seed?: number;
}

export interface OrganicRouteResult {
  grid: Grid;
  entrances: OrganicEntrance[];
  /** Tile coords of the carved branch alcoves — good spots for hidden items. */
  alcoves: Array<{ x: number; y: number }>;
  /** Path tiles where ledges were placed. */
  ledges: Array<{ x: number; y: number }>;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateOrganicRoute(config: OrganicRouteConfig): OrganicRouteResult {
  const {
    width,
    height,
    pathWidth = 3,
    branches,
    ledges = true,
    roughness = 0.55,
    seed = 42,
  } = config;
  const shape: RouteShape = config.shape ?? 'forest';
  const entrances: OrganicEntrance[] = config.entrances ?? [
    { x: Math.floor(width / 2), y: 0, side: 'north' },
    { x: Math.floor(width / 2), y: height - 1, side: 'south' },
  ];

  const rng = new SeededRandom(seed);
  const grid = new Grid(width, height, T.GRASS);

  // Inward-from-edge anchor for every entrance so we can punch a corridor
  // after sculpting the border.
  const protect = entrances.flatMap(e => entranceProtectCells(e, width, height, pathWidth));

  // -----------------------------------------------------------------------
  // 1. Sculpt the silhouette
  // -----------------------------------------------------------------------
  applyShape(grid, shape, roughness, seed, protect);

  // -----------------------------------------------------------------------
  // 2. Punch entrances through the irregular border
  // -----------------------------------------------------------------------
  for (const e of entrances) {
    const inward = inwardAnchor(e, width, height);
    punchEntrance(grid, { x: e.x, y: e.y }, inward, T.PATH, pathWidth);
  }

  // -----------------------------------------------------------------------
  // 3. Carve the main meandering path between every consecutive entrance
  // -----------------------------------------------------------------------
  for (let i = 0; i < entrances.length - 1; i++) {
    carveMeanderingPath(grid, rng, entrances[i], entrances[i + 1], pathWidth);
  }

  // -----------------------------------------------------------------------
  // 4. Branch paths to hidden alcoves
  // -----------------------------------------------------------------------
  const branchCount = branches ?? Math.max(1, Math.floor((width * height) / 280));
  const alcoves: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < branchCount; i++) {
    const a = carveBranchAlcove(grid, rng);
    if (a) alcoves.push(a);
  }

  // -----------------------------------------------------------------------
  // 5. Tall grass, water, decorations
  // -----------------------------------------------------------------------
  scatterGrassPatches(grid, rng);
  scatterDecorations(grid, rng, 0.3);

  // -----------------------------------------------------------------------
  // 6. Ledges (one-way shortcuts) along the path
  // -----------------------------------------------------------------------
  const ledgePositions = ledges ? placeLedges(grid, rng) : [];

  // -----------------------------------------------------------------------
  // 7. Final connectivity guard
  // -----------------------------------------------------------------------
  ensureEntrancesConnected(grid, entrances);

  return { grid, entrances, alcoves, ledges: ledgePositions };
}

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

function applyShape(
  grid: Grid,
  shape: RouteShape,
  roughness: number,
  seed: number,
  protect: ReadonlyArray<{ x: number; y: number }>,
): void {
  switch (shape) {
    case 'forest':
      shapeOrganicBorder(grid, {
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        thickness: 3,
        roughness,
        scale: 6,
        seed,
        protect,
      });
      break;

    case 'coastal':
      // Shape the inland sides (north/east/west) with trees, then carve a
      // wavy southern coast.
      shapeOrganicBorder(grid, {
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        thickness: 3,
        roughness,
        scale: 6,
        seed,
        protect,
        sides: ['north', 'east', 'west'],
      });
      carveCoastline(grid, {
        side: 'south',
        waterTile: T.WATER,
        sandTile: T.SAND,
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        depth: Math.max(3, Math.floor(grid.height * 0.18)),
        beachWidth: 1,
        roughness: Math.min(1, roughness + 0.1),
        scale: 8,
        seed: seed + 17,
        protect,
      });
      break;

    case 'cliffside':
      // Trees on three sides, jagged cliff face on the west — gates an
      // upper tier off until you find a stair.
      shapeOrganicBorder(grid, {
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        thickness: 3,
        roughness,
        scale: 6,
        seed,
        protect,
        sides: ['north', 'south', 'east'],
      });
      carveCliffEdge(grid, {
        side: 'west',
        cliffTile: T.CLIFF,
        interiorTile: T.GRASS,
        thickness: Math.max(2, Math.floor(grid.width * 0.18)),
        roughness,
        scale: 5,
        seed: seed + 31,
        protect,
      });
      break;

    case 'peninsula':
      // Trees on the north spur, water on east and west — the player walks
      // a narrowing landmass.
      shapeOrganicBorder(grid, {
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        thickness: 2,
        roughness,
        scale: 5,
        seed,
        protect,
        sides: ['north'],
      });
      carveCoastline(grid, {
        side: 'east',
        waterTile: T.WATER,
        sandTile: T.SAND,
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        depth: Math.max(3, Math.floor(grid.width * 0.22)),
        beachWidth: 1,
        roughness,
        scale: 7,
        seed: seed + 11,
        protect,
      });
      carveCoastline(grid, {
        side: 'west',
        waterTile: T.WATER,
        sandTile: T.SAND,
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        depth: Math.max(3, Math.floor(grid.width * 0.22)),
        beachWidth: 1,
        roughness,
        scale: 7,
        seed: seed + 23,
        protect,
      });
      carveCoastline(grid, {
        side: 'south',
        waterTile: T.WATER,
        sandTile: T.SAND,
        borderTile: T.TREE,
        interiorTile: T.GRASS,
        depth: Math.max(2, Math.floor(grid.height * 0.12)),
        beachWidth: 1,
        roughness,
        scale: 9,
        seed: seed + 37,
        protect,
      });
      break;
  }
}

function entranceProtectCells(
  e: OrganicEntrance,
  width: number,
  height: number,
  pathWidth: number,
): Array<{ x: number; y: number }> {
  // A small T-shaped protection patch around the entrance, projecting inward
  // a few tiles so the noise pass cannot wall the player out before the
  // entrance corridor is punched.
  const cells: Array<{ x: number; y: number }> = [];
  const half = Math.floor(pathWidth / 2);
  const reach = Math.max(4, pathWidth + 3);

  switch (e.side) {
    case 'north':
      for (let dx = -half; dx <= half; dx++)
        for (let dy = 0; dy < reach; dy++)
          cells.push({ x: e.x + dx, y: dy });
      break;
    case 'south':
      for (let dx = -half; dx <= half; dx++)
        for (let dy = 0; dy < reach; dy++)
          cells.push({ x: e.x + dx, y: height - 1 - dy });
      break;
    case 'west':
      for (let dy = -half; dy <= half; dy++)
        for (let dx = 0; dx < reach; dx++)
          cells.push({ x: dx, y: e.y + dy });
      break;
    case 'east':
      for (let dy = -half; dy <= half; dy++)
        for (let dx = 0; dx < reach; dx++)
          cells.push({ x: width - 1 - dx, y: e.y + dy });
      break;
  }
  return cells;
}

function inwardAnchor(
  e: OrganicEntrance,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (e.side) {
    case 'north': return { x: e.x, y: 4 };
    case 'south': return { x: e.x, y: height - 5 };
    case 'west':  return { x: 4, y: e.y };
    case 'east':  return { x: width - 5, y: e.y };
  }
}

// ---------------------------------------------------------------------------
// Path carving
// ---------------------------------------------------------------------------

function carveMeanderingPath(
  grid: Grid,
  rng: SeededRandom,
  from: OrganicEntrance,
  to: OrganicEntrance,
  pathWidth: number,
): void {
  const half = Math.floor(pathWidth / 2);
  let x = clamp(from.x, 1, grid.width - 2);
  let y = clamp(from.y, 1, grid.height - 2);
  const tx = clamp(to.x, 1, grid.width - 2);
  const ty = clamp(to.y, 1, grid.height - 2);

  const maxSteps = grid.width * grid.height;
  for (let step = 0; step < maxSteps; step++) {
    paintPath(grid, x, y, half);
    if (x === tx && y === ty) break;

    const dx = tx - x;
    const dy = ty - y;
    if (rng.chance(0.72)) {
      // Bias toward target.
      if (Math.abs(dx) > Math.abs(dy) || (dx !== 0 && dy !== 0 && rng.chance(0.5))) {
        x += Math.sign(dx);
      } else if (dy !== 0) {
        y += Math.sign(dy);
      } else {
        x += Math.sign(dx);
      }
    } else {
      // Organic perpendicular wander.
      if (Math.abs(dx) > Math.abs(dy)) y += rng.chance(0.5) ? 1 : -1;
      else x += rng.chance(0.5) ? 1 : -1;
    }
    x = clamp(x, 1, grid.width - 2);
    y = clamp(y, 1, grid.height - 2);
  }
}

function paintPath(grid: Grid, cx: number, cy: number, half: number): void {
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!grid.inBounds(nx, ny)) continue;
      // Don't punch through water or cliff faces — the player should walk
      // *around* those, not through them. Trees we replace freely.
      const v = grid.get(nx, ny);
      if (v === T.WATER || v === T.CLIFF) continue;
      grid.set(nx, ny, T.PATH);
    }
  }
}

function carveBranchAlcove(
  grid: Grid,
  rng: SeededRandom,
): { x: number; y: number } | null {
  // Find a path tile somewhere on the existing path and walk perpendicular
  // for 3-6 tiles into a clearing.
  const paths = grid.findAll(T.PATH);
  if (paths.length === 0) return null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const start = rng.pick(paths);
    const horizontal = rng.chance(0.5);
    const dir = rng.chance(0.5) ? 1 : -1;
    const length = rng.nextInt(3, 6);

    // Don't let a branch start within 4 tiles of an existing alcove tip.
    const stub: Array<{ x: number; y: number }> = [];
    let x = start.x;
    let y = start.y;
    let blocked = false;
    for (let i = 0; i < length; i++) {
      if (horizontal) x += dir;
      else y += dir;
      if (!grid.inBounds(x, y)) { blocked = true; break; }
      const v = grid.get(x, y);
      if (v === T.WATER || v === T.CLIFF) { blocked = true; break; }
      stub.push({ x, y });
    }
    if (blocked || stub.length < 3) continue;

    // Carve the corridor and a small 3x3 clearing at the tip.
    for (const c of stub) grid.set(c.x, c.y, T.PATH);
    const tip = stub[stub.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tip.x + dx;
        const ny = tip.y + dy;
        if (!grid.inBounds(nx, ny)) continue;
        const v = grid.get(nx, ny);
        if (v === T.WATER || v === T.CLIFF) continue;
        if (v === T.TREE || v === T.GRASS) grid.set(nx, ny, T.GRASS);
      }
    }
    grid.set(tip.x, tip.y, T.GRASS); // alcove floor — flag spot for items
    return tip;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Decoration
// ---------------------------------------------------------------------------

function scatterGrassPatches(grid: Grid, rng: SeededRandom): void {
  const n = Math.max(2, Math.floor((grid.width * grid.height) / 130));
  for (let i = 0; i < n; i++) {
    const w = rng.nextInt(2, 5);
    const h = rng.nextInt(2, 4);
    const px = rng.nextInt(2, grid.width - w - 2);
    const py = rng.nextInt(2, grid.height - h - 2);

    let canPlace = true;
    for (let y = py; y < py + h && canPlace; y++) {
      for (let x = px; x < px + w && canPlace; x++) {
        if (grid.get(x, y) !== T.GRASS) canPlace = false;
      }
    }
    if (!canPlace) continue;
    for (let y = py; y < py + h; y++) {
      for (let x = px; x < px + w; x++) {
        grid.set(x, y, T.TALL_GRASS);
      }
    }
  }
}

function scatterDecorations(grid: Grid, rng: SeededRandom, density: number): void {
  const decorations = [T.FLOWER, T.ROCK, T.BUSH];
  grid.forEach((x, y, v) => {
    if (v !== T.GRASS) return;
    if (rng.chance(density * 0.05)) grid.set(x, y, rng.pick(decorations));
  });
}

// ---------------------------------------------------------------------------
// Ledges
// ---------------------------------------------------------------------------

/**
 * Place ledges along horizontal sections of the path that run east–west, so
 * the player drops south on touch (one-way shortcut). We place at most a few
 * 2-3 tile segments to avoid spamming the route.
 */
function placeLedges(grid: Grid, rng: SeededRandom): Array<{ x: number; y: number }> {
  const placed: Array<{ x: number; y: number }> = [];
  const candidates: Array<{ x: number; y: number }> = [];

  // A ledge tile is a path cell where the cell directly north is also path
  // (so the player approaches from the north) and the cell directly south is
  // *not* a wall (so they land on traversable ground).
  for (let y = 2; y < grid.height - 2; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
      if (grid.get(x, y) !== T.PATH) continue;
      if (grid.get(x, y - 1) !== T.PATH) continue;
      const south = grid.get(x, y + 1);
      if (south !== T.PATH && south !== T.GRASS) continue;
      candidates.push({ x, y });
    }
  }

  // Lay short ledge runs at most a few times.
  rng.shuffle(candidates);
  const targetRuns = Math.min(3, Math.floor(candidates.length / 24));
  let runs = 0;
  for (const c of candidates) {
    if (runs >= targetRuns) break;
    // Skip if any neighbour is already a ledge.
    if (grid.get(c.x - 1, c.y) === T.LEDGE || grid.get(c.x + 1, c.y) === T.LEDGE) continue;

    const runLen = rng.nextInt(2, 3);
    let ok = true;
    for (let k = 0; k < runLen; k++) {
      if (grid.get(c.x + k, c.y) !== T.PATH) { ok = false; break; }
      if (grid.get(c.x + k, c.y - 1) !== T.PATH) { ok = false; break; }
    }
    if (!ok) continue;
    for (let k = 0; k < runLen; k++) {
      grid.set(c.x + k, c.y, T.LEDGE);
      placed.push({ x: c.x + k, y: c.y });
    }
    runs++;
  }
  return placed;
}

// ---------------------------------------------------------------------------
// Connectivity guard
// ---------------------------------------------------------------------------

function ensureEntrancesConnected(grid: Grid, entrances: OrganicEntrance[]): void {
  if (entrances.length < 2) return;
  const head = entrances[0];
  const reachable = new Set(
    floodFill(grid, head.x, head.y, v => WALKABLE.has(v) || v === T.LEDGE).map(c => `${c.x},${c.y}`),
  );

  for (let i = 1; i < entrances.length; i++) {
    const e = entrances[i];
    if (reachable.has(`${e.x},${e.y}`)) continue;
    // Emergency: punch a straight L from head to this entrance.
    drawL(grid, head, e);
  }

  // Fill any tiny stray walkable pockets with grass-like terrain so the
  // largest region truly dominates (cosmetic only).
  const regions = findConnectedRegions(grid, v => WALKABLE.has(v) || v === T.LEDGE);
  if (regions.length > 1) {
    for (let i = 1; i < regions.length; i++) {
      if (regions[i].cells.length < 6) {
        for (const c of regions[i].cells) grid.set(c.x, c.y, T.TREE);
      }
    }
  }
}

function drawL(
  grid: Grid,
  a: { x: number; y: number },
  b: { x: number; y: number },
): void {
  let x = clamp(a.x, 1, grid.width - 2);
  let y = clamp(a.y, 1, grid.height - 2);
  const bx = clamp(b.x, 1, grid.width - 2);
  const by = clamp(b.y, 1, grid.height - 2);
  while (x !== bx) {
    if (grid.get(x, y) !== T.WATER && grid.get(x, y) !== T.CLIFF) grid.set(x, y, T.PATH);
    x += Math.sign(bx - x);
  }
  while (y !== by) {
    if (grid.get(x, y) !== T.WATER && grid.get(x, y) !== T.CLIFF) grid.set(x, y, T.PATH);
    y += Math.sign(by - y);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export default generateOrganicRoute;
