<!-- markdownlint-disable-file -->

# Map Generation Plan

> A comprehensive strategy for generating high-quality tilemaps in the Pokemon Web project, addressing the limitations of LLM-authored maps and establishing a reproducible, tooling-backed workflow.

## Problem Statement

Hand-authoring maps as character-grid strings in TypeScript is error-prone and hard for an LLM to do well:

- **Dimension drift**: Rows silently end up with inconsistent character counts, especially with multi-byte Unicode tile characters (Þ, Ø, µ, «, etc.).
- **No visual feedback loop**: The LLM generates a grid of characters but cannot see the rendered result — misplaced tiles, broken paths, disconnected rooms, and ugly layouts go undetected.
- **Spatial reasoning limits**: LLMs struggle with precise 2D spatial layout — counting columns, aligning doors to paths, maintaining symmetry, and ensuring connectivity.
- **Aesthetic blind spots**: Generated maps tend to be monotonous (uniform grass fill, simple rectangular rooms) because the LLM has no tileset-aware aesthetic model.

## Current System Summary

| Aspect | Detail |
|---|---|
| Format | TypeScript `string[]` character grids in `frontend/src/data/maps/` |
| Parser | `parseMap()` converts chars to tile IDs via `CHAR_TO_TILE` (~120 mappings) |
| Tile size | 16px sprites scaled to 32px runtime |
| Tileset | `tileset.png` — 10×11 grid of 16px tiles (IDs 0–109) |
| Renderer | `OverworldScene.drawMap()` creates individual `Phaser.GameObjects.Image` per cell |
| Map count | ~80 maps (10 cities, 8 routes, 15 dungeons, 37 interiors, 12 houses) |
| Existing tooling | ~15 scripts in `temp/` for validation, preview rendering, biome substitution |

## Strategy Overview

The plan uses a **multi-layered approach** combining three complementary techniques:

1. **Template-Based Composition** (immediate, for structured maps)
2. **Procedural Generation Scripts** (for dungeons, caves, routes)
3. **Validate-Render-Iterate Loop** (correctness guarantee for all maps)

This is NOT about replacing hand-authored maps entirely — it's about giving the LLM and developers a **toolchain** that catches errors, provides visual feedback, and generates procedural content where appropriate.

---

## Layer 1: Template-Based Composition System

### Concept

Instead of authoring entire maps character-by-character, define maps as **compositions of reusable building blocks** placed on a canvas. This is the approach most compatible with LLM generation because it operates at a higher abstraction level.

### Template Library

Create a library of validated map fragments (templates) for common structures:

```
temp/map-templates/
├── buildings/
│   ├── pokecenter-3x4.txt      # 3-wide × 4-tall PokéCenter footprint
│   ├── pokemart-3x3.txt        # PokéMart footprint
│   ├── gym-4x4.txt             # Gym footprint
│   ├── house-small-2x2.txt     # Small house
│   └── house-large-3x3.txt     # Large house
├── terrain/
│   ├── lake-5x3.txt            # Lake with shore tiles
│   ├── pond-2x2.txt            # Small pond
│   ├── cliff-edge-h.txt        # Horizontal cliff edge
│   └── tree-cluster-3x3.txt    # Dense tree cluster
├── paths/
│   ├── road-h.txt              # Horizontal road segment
│   ├── road-v.txt              # Vertical road segment
│   ├── road-cross.txt          # Crossroads
│   └── road-turn-*.txt         # Turn variants
└── interiors/
    ├── pokecenter-interior.txt  # Standard PC interior (full map)
    ├── pokemart-interior.txt    # Standard mart interior
    └── generic-room-*.txt       # Room templates
```

Each template file is a validated character grid with metadata:

```
# pokecenter-3x4.txt
# dim: 3x4
# anchor: door at (1,3)
CCC
c$c
cec
c.c
```

### Map Composer Script

A Node.js script that places templates onto a canvas:

```typescript
// temp/scripts/map-compose/compose-map.ts
interface Placement {
  template: string;    // path to template file
  x: number;           // column offset on canvas
  y: number;           // row offset on canvas
  biome?: string;      // optional biome substitution
}

interface MapComposition {
  name: string;
  width: number;
  height: number;
  fill: string;        // default fill character (e.g., '.' for grass)
  border: string;      // border character (e.g., 'T' for trees)
  placements: Placement[];
  paths: PathSegment[];
  warps: WarpDef[];
  npcs: NpcDef[];
  spawns: SpawnDef[];
}
```

**Workflow**:
1. Define a `MapComposition` JSON/TS descriptor
2. Run the composer to stamp templates onto the canvas
3. Run pathfinding to connect buildings with roads
4. Validate dimensions and connectivity
5. Render preview image
6. Export as TypeScript map definition

### Benefits for LLM Generation

- The LLM only needs to specify **what** goes **where** at a high level
- Template dimensions are pre-validated — no column-counting errors
- Biome substitution is automatic — write once, theme for any biome
- Path connectivity can be computed, not hand-drawn

---

## Layer 2: Procedural Generation Algorithms

For maps that benefit from randomness (dungeons, caves, forests), use purpose-built generation algorithms implemented as TypeScript scripts.

### Algorithm Selection by Map Type

| Map Type | Algorithm | Rationale |
|---|---|---|
| **Dungeons / Caves** | BSP Tree + Rooms & Corridors | Guarantees connectivity; produces natural-looking dungeon layouts with rooms of varied sizes connected by corridors. Based on Bob Nystrom's approach. |
| **Forest / Nature Routes** | Cellular Automata | Creates organic cave-like shapes; good for forest clearings, winding paths through trees. Simple to implement and tune. |
| **Cities / Towns** | Template Composition (Layer 1) | Cities have authored structure — the composer is the right tool. |
| **Interior Buildings** | Template Library (Layer 1) | Interiors are small and structured — templates work best. |
| **Maze-like areas** | Recursive Backtracker + Sparsification | Growing Tree maze algorithm, then remove dead ends to leave interesting corridors. |
| **Multi-biome routes** | Noise-based terrain + path carving | Perlin/simplex noise for terrain variety, A* for guaranteed-connected paths between exits. |

### Algorithm 1: BSP Dungeon Generator

Based on the "Rooms and Mazes" approach (Bob Nystrom / Hauberk):

```
Input: width, height, minRoomSize, maxRoomSize, roomAttempts, biome
Output: number[][] tile grid

1. Fill grid with WALL tiles
2. Place N random non-overlapping rooms (odd-aligned for corridor compatibility)
3. Flood-fill remaining solid regions with maze (recursive backtracker)
4. Find connectors between adjacent regions
5. Build spanning tree to connect all regions (with small chance of extra connections)
6. Remove dead-end corridors (sparsification pass)
7. Apply biome-specific tile substitution
8. Place doors at room-corridor junctions
```

### Algorithm 2: Cellular Automata (Caves / Forests)

```
Input: width, height, fillProbability, iterations, biome
Output: number[][] tile grid

1. Randomly fill grid — each cell has fillProbability chance of being solid
2. Repeat for N iterations:
   - For each cell, count solid neighbors in Moore neighborhood (8 cells)
   - If neighbors >= 5: cell becomes solid
   - If neighbors <= 3: cell becomes open
3. Find largest connected open region (flood fill)
4. Fill all other open regions (ensures connectivity)
5. Carve guaranteed path between entrance and exit (A* on open cells)
6. Apply biome tile substitution
```

### Algorithm 3: Route Generator (Overworld Paths)

```
Input: width, height, entrances[], biome, features[]
Output: number[][] tile grid

1. Fill grid with biome-appropriate ground tile
2. Place border tiles (trees, cliffs, water depending on biome)
3. Carve main path between entrances using weighted random walk
4. Place feature zones (tall grass patches, water features, ledges)
5. Scatter decorative tiles (flowers, rocks, signs)
6. Ensure all entrances are reachable via flood-fill check
```

### Implementation Plan

```
temp/scripts/map-gen/
├── core/
│   ├── grid.ts              # Grid class with bounds-safe get/set
│   ├── flood-fill.ts        # Connectivity checking
│   ├── pathfind.ts          # A* pathfinding on grids
│   └── biome-themes.ts      # Char substitution tables per biome
├── algorithms/
│   ├── bsp-dungeon.ts       # BSP room placement + maze fill
│   ├── cellular-cave.ts     # Cellular automata caves
│   ├── route-carver.ts      # Overworld route generation
│   └── maze-generator.ts    # Growing tree maze with sparsification
├── compose/
│   ├── template-loader.ts   # Load .txt template fragments
│   ├── map-composer.ts      # Place templates on canvas
│   └── path-connector.ts    # Auto-connect buildings with roads
├── export/
│   ├── to-charmap.ts        # Grid → character string[] (using TILE_TO_CHAR)
│   └── to-typescript.ts     # Full MapDefinition TS file export
└── cli.ts                   # CLI entry point
```

### Seeded Randomness

All generators accept a `seed` parameter for reproducibility:

```typescript
// When called with same seed, produces identical output
generateDungeon({ width: 30, height: 25, seed: 42, biome: 'cave' });
```

This allows:
- Deterministic map regeneration for debugging
- Version control of map seeds rather than full map data
- A/B testing of generation parameters

---

## Layer 3: Validate-Render-Iterate Loop

The critical missing piece: a **feedback loop** that catches errors before they reach the game.

### Validation Pipeline

Run automatically after any map creation or edit:

```
npm run map:validate [mapKey]     # Validate a specific map or all maps
```

#### Checks performed:

1. **Dimension consistency**: Every row has exactly `width` characters (Unicode-aware)
2. **Character validity**: All characters exist in `CHAR_TO_TILE`
3. **Border integrity**: Outer ring is solid (trees/walls) except at warp points
4. **Warp reachability**: Every warp tile can be reached from spawn point via non-solid path
5. **NPC/trainer placement**: NPCs and trainers are on walkable tiles
6. **Spawn validity**: At least one spawn point exists on a walkable tile
7. **Connectivity**: All walkable areas form a single connected component (or are intentionally separated with explanation)
8. **Door alignment**: Building doors connect to adjacent walkable paths

### Visual Preview Renderer

Enhance the existing `render_all_maps.py` into a fast feedback tool:

```
npm run map:preview [mapKey]      # Render PNG preview of a map
npm run map:preview-all           # Render all maps to temp/map-previews/
```

Features:
- Color-coded tiles using `TILE_COLORS` from `tile-metadata.ts`
- Warp points highlighted with arrows showing destination
- NPC/trainer positions marked with icons
- Spawn points marked
- Grid overlay option for counting
- Side-by-side with the actual tileset-rendered version

### The Full Loop

```
┌──────────────┐
│  1. Generate  │  LLM creates map via composer/procgen/hand-edit
└──────┬───────┘
       ▼
┌──────────────┐
│  2. Validate  │  npm run map:validate → catches dimension/connectivity errors
└──────┬───────┘
       ▼
┌──────────────┐
│  3. Preview   │  npm run map:preview → PNG image for visual inspection
└──────┬───────┘
       ▼
┌──────────────────┐
│  4. Fix / Iterate │  Address issues found in validation or preview
└──────┬───────────┘
       ▼
┌──────────────┐
│  5. Commit    │  Map is correct and looks good
└──────────────┘
```

---

## LLM-Specific Workflow (Copilot Skill / Instruction Set)

### Working Process for Map Generation

When an LLM (Copilot) needs to create or modify a map, follow this process:

#### For New City/Town Maps:
1. Define a `MapComposition` specifying building placements, dimensions, exits
2. Run the composer to generate the base character grid
3. Run validation
4. Run preview and describe the result
5. Iterate on placement if needed

#### For New Dungeon/Cave Maps:
1. Choose appropriate algorithm (BSP for rooms, cellular automata for caves)
2. Set parameters (size, room count, biome)
3. Run generator with a seed
4. Add warps, spawns, encounter zones
5. Validate and preview

#### For Editing Existing Maps:
1. Read the current map file
2. Run preview to understand current layout
3. Make targeted edits (never rewrite entire grids from scratch)
4. Validate after every edit
5. Preview to confirm visual result

### Rules for LLM Map Authoring

If manual character-grid editing is unavoidable:

1. **Always count Unicode characters, not bytes.** Use `[...row].length` mentally.
2. **Work row-by-row and verify width** matches the declared `width` before moving on.
3. **Use the template approach** for buildings — paste pre-validated building footprints.
4. **Run validation immediately** after generating any map content.
5. **Never generate more than 5 rows at a time** without pausing to verify alignment.
6. **Use landmark comments** on each row: `// row 0: north border (24 chars)`.
7. **Prefer ASCII characters** where possible — Unicode chars are error-prone.

---

## Biome Substitution System

One core principle: **author maps once in a neutral biome, then substitute**.

### Biome Themes

| Biome | Ground | Border | Path | Decorative | Special |
|---|---|---|---|---|---|
| Standard | `.` GRASS | `T` TREE | `P` PATH | `f` FLOWER | `W` WATER |
| Volcanic | `«` ASH | `Þ` VOLCANIC_WALL | `P` PATH | `»` EMBER_VENT | `Ø` LAVA_ROCK |
| Snow/Ice | `Ñ` SNOW | `Ð` ICE_WALL | `P` PATH | `Ó` ICE_CRYSTAL | `Ò` FROZEN_WATER |
| Coral/Ocean | `ñ` CORAL_SAND | `ó` SEA_CLIFF | `P` PATH | `ò` SHELL_TILE | `ô` TIDEPOOL |
| Dark/Ghost | `ú` SHADOW_TILE | `ü` DARK_WALL | `P` PATH | `û` GRAVE_MARKER | `ù` WISP |
| Mystic | `è` MYSTIC_GRASS | `ê` MYSTIC_TREE | `P` PATH | `ë` RUNE_STONE | `é` MIST |

### Substitution Function

```typescript
function applyBiome(neutralGrid: string[], biome: BiomeTheme): string[] {
  return neutralGrid.map(row =>
    [...row].map(ch => biome.substitutions[ch] ?? ch).join('')
  );
}
```

This means the LLM can author all maps using the simple ASCII character set (`.`, `T`, `P`, `f`, `W`, etc.) and biome theming is applied automatically.

---

## Implementation Phases

### Phase 1: Validation & Preview Pipeline (Foundation)

**Goal**: Immediate quality improvement for all existing and new maps.

- [ ] Create `temp/scripts/map-gen/core/grid.ts` — Grid utility class
- [ ] Create validation script with all 8 checks listed above
- [ ] Enhance `render_all_maps.py` with warp arrows, NPC markers, grid overlay
- [ ] Add npm scripts: `map:validate`, `map:preview`, `map:preview-all`
- [ ] Run full validation audit on all 80 existing maps, fix issues found

### Phase 2: Template Library & Composer

**Goal**: Enable high-level map composition instead of character-by-character authoring.

- [ ] Extract building footprints from existing maps into template files
- [ ] Create template loader and map composer script
- [ ] Create path-connector that auto-routes roads between buildings and exits
- [ ] Create biome substitution module
- [ ] Test by regenerating 2-3 existing city maps via composition and comparing

### Phase 3: Procedural Generators

**Goal**: Algorithmic generation for dungeons, caves, and routes.

- [ ] Implement BSP dungeon generator
- [ ] Implement cellular automata cave generator
- [ ] Implement route carver with noise-based terrain
- [ ] Add TypeScript exporter (grid → full MapDefinition .ts file)
- [ ] Generate replacement maps for 3-5 existing dungeons to validate quality

### Phase 4: Copilot Skill & Instruction Set

**Goal**: Codify the workflow so future LLM sessions produce correct maps without this research.

- [ ] Create `.github/instructions/map-generation.instructions.md` with rules and process
- [ ] Create `.github/skills/map-generation/SKILL.md` with the full template library reference
- [ ] Document the CHAR_TO_TILE mapping as a quick-reference table in the skill
- [ ] Include example compositions and generator invocations
- [ ] Add the validate-render-iterate loop as a mandatory post-generation step

---

## Technical References

### Research Sources

| Source | Key Insight |
|---|---|
| Bob Nystrom, "Rooms and Mazes" (2014) | Rooms-first + maze-fill + spanning tree connection + dead-end removal. Produces connected, imperfect dungeons with tunable room density. |
| Boris the Brave, "Dungeon Generation in Enter the Gungeon" (2019) | Abstract graph-first approach: define room relationships as a flow graph, then lay out spatially. Separates pacing/structure from tile placement. |
| Boris the Brave, "Wave Function Collapse Explained" (2020) | WFC is constraint-based: define adjacency rules, propagate constraints. Powerful for tile-fitting but lacks global structure without additional constraints. |
| Boris the Brave, "WFC Tips and Tricks" (2020) | Marching-cubes tileset design; path constraints for connectivity; biome variation by enabling/disabling tile subsets; fixed tiles for pinning structure. |
| Maxim Gumin, WaveFunctionCollapse (GitHub) | Reference WFC implementation. Simple Tiled Model uses adjacency data. Overlapped Model uses NxN pattern matching from samples. |

### Why NOT Wave Function Collapse (for now)

WFC is powerful but has significant drawbacks for this project:

1. **No global structure**: WFC produces locally-consistent but globally-homogeneous output. Pokemon maps need intentional structure (town center, gym placement, route progression).
2. **Tileset complexity**: The current 120-tile system would require defining adjacency rules for every tile pair — a massive upfront investment.
3. **Contradiction handling**: WFC can fail (all possibilities eliminated). For a game with 80+ maps that must always generate correctly, this is risky.
4. **Overkill for authored content**: Most Pokemon maps are intentionally designed, not random. WFC shines for emergent content, not structured game worlds.

WFC could be revisited for **optional bonus content** (randomized post-game dungeons, daily challenge areas) where the global structure requirements are lower.

### Why Template Composition + BSP is the Right Fit

1. **Matches the game's needs**: Pokemon towns and routes have intentional layouts. Templates preserve that while eliminating character-counting errors.
2. **LLM-friendly abstraction**: Specifying "place pokecenter at (2,3), gym at (8,15)" is much easier for an LLM than drawing a 25×30 character grid.
3. **Validated by construction**: Templates are pre-validated; the composer enforces dimensions; the validator catches remaining issues.
4. **Procedural where it helps**: Dungeons and caves benefit from randomness — BSP and cellular automata deliver this with guaranteed connectivity.
5. **Visual feedback closes the loop**: Preview rendering gives the LLM (via tool output) or the developer the ability to see what was generated.

---

## Appendix: Quick Reference

### CHAR_TO_TILE Essentials (ASCII subset)

```
.  GRASS          T  TREE           P  PATH
W  WATER          #  WALL           _  FLOOR
S  SAND           R  ROOF           C  ROOF_RED
M  ROOF_BLUE      A  ROOF_GREEN     H  ROOF_BROWN
B  BOOKSHELF      L  LEDGE          G  TALL_GRASS
F  FENCE          &  WINDOW         $  HEALING_MACHINE
n  SHOP_SHELF     e  PC_DOOR        D  HOUSE_DOOR
a  GYM_DOOR       c  PC_FLOOR       m  MART_FLOOR
g  GYM_FLOOR      ,  ROAD           s  STAIR_UP
z  STAIR_DOWN     w  WATERFALL      b  BRIDGE
```

### MapDefinition Required Fields

```typescript
{
  key: string;
  width: number;
  height: number;
  ground: number[][];          // from parseMap(charGrid)
  encounterTableKey: string;
  npcs: NpcSpawn[];
  trainers: TrainerSpawn[];
  warps: WarpDefinition[];
  spawnPoints: SpawnPoint[];
}
```

### Validation Command (Target)

```bash
npm run map:validate                    # All maps
npm run map:validate -- --map route-1   # Single map
npm run map:preview -- --map route-1    # Render preview PNG
npm run map:gen dungeon -- --seed 42 --biome cave --width 30 --height 25
npm run map:compose cinderfall.json     # Compose from template descriptor
```
