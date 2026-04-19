# UI Improvement Plan — Pokemon Web: Aurum Region

> **Visual Quality Roadmap** | April 2026
> A systematic process for elevating every pixel of the Aurum Region
> from functional placeholder to state-of-the-art 2D pixel art.

---

## Executive Summary

The Aurum Region has deep mechanics and a complete story. This plan
systematically audits, previews, validates, and improves every map and
UI element in the game through an agent-driven pipeline.

### Progress Overview

| Sprint | Scope | Status |
|--------|-------|--------|
| 1 | Tileset pixel art (42 tiles) | ✅ Complete |
| 2 | Validation pipeline (warps, audit, preview) | ✅ Complete |
| 3 | City redesigns (6 cities) | ✅ Complete |
| 4 | Route and dungeon polish | ✅ Complete |
| 5 | Interior deduplication | ✅ Complete |
| 6 | UI visual upgrade | ⏳ In progress (Step 1 done) |
| — | Camera/viewport centering | ✅ Complete |

---

## Current State Audit

### Tileset Quality

| Tile Range | Count | Quality   | Description                                                 |
|------------|:-----:|-----------|-------------------------------------------------------------|
| 0-67       |    68 | Pixel art | Core tiles with texture, shading, and detail in tileset.png |
| 68-109     |    42 | ✅ Upgraded | GBA-style pixel art, 6-13 colors per tile, proper shading |

All 42 solid-color tiles were replaced with textured pixel art in Sprint 1.

### Map Quality Ratings

| Category    | Maps | Status | Notes                                                                |
|-------------|:----:|--------|----------------------------------------------------------------------|
| Cities      |   10 | ✅ Done | All 10 have unique biome-appropriate layouts                        |
| Routes      |    8 | ✅ Done | All 8 polished with biome tiles, weather, and environmental detail  |
| Dungeons    |   15 | ✅ Done | Victory Road expanded 25x35, Ember Mines synthesis lab added        |
| Interiors   |   32 | ✅ Done | 3 PokéCenter variants, 3 PokéMart variants, 4 house biome layouts  |

### UI Component Quality

| Component       | Status     | Notes                                                     |
|-----------------|------------|-----------------------------------------------------------|
| Battle HUD      | Functional | Rectangle-based, no sprite frames or polish               |
| Text/Dialog Box | ✅ Upgraded | Uses NinePatchPanel with rounded corners and drop shadow |
| Menu Screens    | Functional | Consistent theme.ts styling, no visual flair              |
| Health/EXP Bars | Good       | Color-coded, smooth fills                                 |
| Type Icons      | Remaining  | Types shown as colored text, no sprite icons              |
| Status Icons    | Remaining  | Status conditions shown as text labels                    |
| Overworld HUD   | Minimal    | Clock display, no minimap or area indicator               |
| Camera/Viewport | ✅ Fixed   | Maps centered when smaller than viewport, dark background |

---

## The Pipeline: Agent-Driven Visual Improvement

### Overview

```text
┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  1. AUDIT    │──▶│  2. PREVIEW  │──▶│  3. VALIDATE  │──▶│  4. IMPROVE   │
│  Tile & Map  │   │  Render All  │   │  Warps/Logic  │   │  Pixel Art   │
│  Inventory   │   │  Map PNGs    │   │  Consistency  │   │  Redesign    │
└─────────────┘   └─────────────┘   └──────────────┘   └──────────────┘
       │                 │                  │                   │
       ▼                 ▼                  ▼                   ▼
  audit-report.md   previews/*.png   validation.md    updated tiles/maps
```

Each stage is idempotent and can be re-run after any change. The agent executes
all four stages in sequence, iterating until the validation report is clean.

---

## Stage 1: Audit — Tile and Map Inventory

### 1.1 Tile Quality Audit

Automated script that classifies every tile in tileset.png:

| Check                          | Method                                              |
|--------------------------------|-----------------------------------------------------|
| Is pixel art or solid color?   | Count unique colors per 16x16 cell; <4 = solid      |
| Has proper shading?            | Check for highlight/shadow pixel variance            |
| Palette consistency?           | Compare hue range against neighboring biome tiles    |
| Overlay base correctness?      | Verify OVERLAY_BASE entry matches tile semantics     |

**Output:** `tile-audit-report.md` rating each tile as:

- **A** — Production-quality pixel art with shading, texture, and detail
- **B** — Acceptable pixel art, minor polish needed
- **C** — Minimal texture, needs redesign pass
- **F** — Flat solid color, needs full pixel art replacement

### 1.2 Map Usage Audit

For every map file in `frontend/src/data/maps/`:

| Check                             | Method                                             |
|-----------------------------------|----------------------------------------------------|
| Tile type coverage                | Count distinct tile types used per map              |
| Biome-appropriate tile usage      | Cross-reference map location vs tiles used          |
| Layout variety score              | Measure building placement regularity (grid detect) |
| Size and proportion               | Check dimensions relative to content density        |
| Dead space percentage             | Count tiles that are pure filler (walls of grass/trees) |

**Output:** `map-audit-report.md` with per-map scorecard.

### 1.3 UI Component Audit

Inventory of every UI rendering call across scenes:

| Check                     | Method                                                  |
|---------------------------|---------------------------------------------------------|
| Rendering approach        | Classify: rectangle, sprite, NinePatch, text-only       |
| Theme compliance          | Verify colors match theme.ts constants                  |
| Pixel art asset usage     | Count sprite-based vs programmatic UI elements          |
| Accessibility             | Check text contrast ratios, touch target sizes           |

**Output:** `ui-audit-report.md` with component quality grades.

---

## Stage 2: Preview — Render All Maps

### 2.1 Enhanced Map Preview Renderer

Extend the existing `temp/scripts/map-preview/render_all_maps.py` into a
comprehensive preview generator:

```text
Input:  All .ts map files in frontend/src/data/maps/
Output: Per-map PNG previews at 3x scale with annotations
```

**Preview layers (composited):**

| Layer          | Content                                                      |
|----------------|--------------------------------------------------------------|
| Ground         | Base tile rendering with overlay compositing                 |
| Grid overlay   | Optional 16px grid lines for spatial reference               |
| Warp markers   | Colored arrows at warp tiles showing target map              |
| Spawn markers  | Player spawn points marked with directional indicators       |
| NPC positions  | NPC and trainer positions marked with icons                  |
| Collision map  | Semi-transparent red overlay on solid tiles                  |
| Problem tiles  | Yellow highlight on solid-color (grade F) tiles              |

**Output formats:**

- `previews/{map-key}_preview.png` — Full annotated preview
- `previews/{map-key}_clean.png` — Clean render without annotations
- `previews/{map-key}_collision.png` — Collision overlay view
- `previews/{map-key}_warps.png` — Warp connectivity diagram

### 2.2 Region Overview Map

Stitch all outdoor maps (cities + routes) into a single region overview image
showing how areas connect, using warp data to position maps relative to each
other.

### 2.3 Tileset Reference Sheet

Generate a visual reference of all 110 tiles with:

- Tile index number
- Tile name from `tiles.ts`
- Quality grade from audit
- Overlay base indicator
- Solid/walkable classification

---

## Stage 3: Validate — Warps, Logic, and Consistency

### 3.1 Warp Integrity Validation

For every `WarpDefinition` across all maps:

| Check                               | Severity | Description                                      |
|--------------------------------------|----------|--------------------------------------------------|
| Target map exists                    | Error    | `targetMap` resolves to a registered map          |
| Target spawn exists                  | Error    | `targetSpawnId` exists in target map spawnPoints  |
| Bidirectional warp                   | Warning  | Every warp A→B has a matching warp B→A           |
| Warp tile is walkable                | Error    | Warp tileX/tileY is not a solid tile             |
| Spawn direction makes sense          | Warning  | Spawn faces away from the warp tile              |
| Flag-gated warps have unlock path    | Warning  | `requireFlag` warps have a way to set that flag  |

**Output:** `warp-validation.md` listing every issue by severity.

### 3.2 Map Logic Validation

| Check                                   | Severity | Description                                      |
|------------------------------------------|----------|--------------------------------------------------|
| All spawn points are on walkable tiles  | Error    | No spawning inside walls                          |
| NPCs are on walkable tiles              | Error    | NPC tileX/tileY resolves to walkable ground       |
| Trainers have line-of-sight path        | Warning  | Trainer facing + LOS range has walkable tiles     |
| Map dimensions match grid               | Error    | width/height matches ground array dimensions      |
| No orphaned interior maps               | Warning  | Every interior has a warp leading to it           |
| No unreachable tiles                    | Info     | Flood-fill from spawn finds all walkable tiles    |

### 3.3 Visual Consistency Validation

| Check                                    | Severity | Description                                     |
|-------------------------------------------|----------|-------------------------------------------------|
| Biome tile usage matches map location    | Warning  | Coral Harbor uses coastal tiles, not forge tiles |
| Building completion                      | Warning  | Every roof has walls and a door below it         |
| Edge continuity                          | Info     | Map edges that connect have matching tile types  |
| Interior size matches exterior building  | Info     | Building footprint roughly matches interior size |

---

## Stage 4: Improve — Systematic Visual Upgrades

### 4.1 Tileset Pixel Art Upgrade (42 tiles)

Replace all 42 solid-color tiles (68-109) with proper 16x16 pixel art.
Each tile gets a Python generation function in the tileset upgrade script.

**Pixel art requirements per tile:**

- Minimum 8 unique colors per tile (base, highlight, shadow, detail)
- Consistent lighting direction (top-left light source)
- 1-pixel dark border on bottom and right edges for depth
- Texture patterns that tile seamlessly when placed adjacent
- Visual distinction at both 1x and 2x rendering scale

**Tile upgrade batches (grouped by biome for palette consistency):**

| Batch | Biome         | Tiles                                          | Palette Reference       |
|-------|---------------|------------------------------------------------|-------------------------|
| 1     | Coastal       | 68-71 (TIDE_POOL through CORAL_BLOCK)          | Water tile (4) palette   |
| 2     | Volcanic      | 72-74 (LAVA_ROCK through VOLCANIC_WALL)        | Cave tile (57-59) palette |
| 3     | Mine          | 75-76 (MINE_TRACK, MINE_SUPPORT)               | Rock floor (51) palette  |
| 4     | Industrial    | 77-80 (METAL_FLOOR through GEAR)               | New steel palette        |
| 5     | Forest        | 81-84 (VINE through BERRY_TREE)                | Tree tile (3) palette    |
| 6     | Electric      | 85-87 (CONDUIT through WIRE_FLOOR)             | New neon accent palette  |
| 7     | Ghost/Ruin    | 88-92 (GRAVE_MARKER through MIST)              | Cave palette + gray      |
| 8     | Dragon        | 93-95 (DRAGON_SCALE_FLOOR through FORTRESS_WALL) | New blue-stone palette |
| 9     | Fire          | 96-98 (ASH_GROUND through HOT_SPRING)          | Volcanic + orange        |
| 10    | Synthesis     | 99-104 (SYNTHESIS_FLOOR through TERMINAL)      | New teal-white palette   |
| 11    | Post-game     | 105-106 (SHATTERED_GROUND, AETHER_CRYSTAL)     | Mixed palette            |
| 12    | League        | 107-109 (LEAGUE_FLOOR through CHAMPION_THRONE) | New gold-marble palette  |

### 4.2 City Map Redesigns (6 cities)

Each template-grid city gets a complete layout redesign:

**Redesign protocol per city:**

1. Define the city's visual identity (signature tiles, landmark, feel)
2. Design organic path layout (no grid pattern)
3. Place buildings with varied spacing and rotation
4. Add signature landmark structure
5. Include environmental detail tiles (decorations, flora, terrain features)
6. Verify all warps connect correctly
7. Generate preview and validate

**City redesign specifications:**

| City             | Signature Landmark          | Primary Tiles                                          | Layout Style            |
|------------------|-----------------------------|-------------------------------------------------------|-------------------------|
| Ironvale City    | Central forge with smoke    | METAL_FLOOR, PIPE, GEAR, CLIFF_FACE                  | Terraced mountain town  |
| Voltara City     | Neon-lit tech plaza         | CONDUIT, ELECTRIC_PANEL, WIRE_FLOOR, METAL_FLOOR     | Radial hub with conduits |
| Wraithmoor Town  | Ruined cathedral            | CRACKED_FLOOR, RUIN_WALL, RUIN_PILLAR, GRAVE_MARKER, MIST | Spiral around ruins |
| Scalecrest Citadel | Dragon gate fortress      | FORTRESS_WALL, DRAGON_SCALE_FLOOR, DRAGON_STATUE, CLIFF_FACE | Fortress with courtyard |
| Cinderfall Town  | Hot spring plaza            | ASH_GROUND, EMBER_VENT, HOT_SPRING, LAVA_ROCK, MAGMA_CRACK | Volcanic caldera rim |
| Coral Harbor     | Boardwalk and lighthouse    | DOCK_PLANK, WET_SAND, TIDE_POOL, PALM_TREE, CORAL_BLOCK | Curved harbor shore |

### 4.3 Route Visual Polish

| Route   | Treatment                                                                             |
|---------|---------------------------------------------------------------------------------------|
| Route 6 | Tech-to-ruins gradient: CONDUIT remnants → DARK_GRASS, AUTUMN_TREE → CRACKED_FLOOR, MIST |
| Route 7 | Mountain pass: CLIFF_FACE walls, switchback paths, BOULDER obstacles, fog             |
| Route 4 | Add LAVA_ROCK, MAGMA_CRACK, VOLCANIC_WALL for volcanic atmosphere                    |
| Route 5 | Add VINE, MOSS_STONE, GIANT_ROOT, BERRY_TREE for jungle density                      |
| Victory Road | Expand to 25x35 with AETHER_CRYSTAL and BOULDER puzzles                          |

### 4.4 Interior Deduplication and Polish

| Interior Type   | Count | Issue                            | Fix                                       |
|-----------------|:-----:|----------------------------------|--------------------------------------------|
| PokeCenters     |    8  | All share same layout            | 3 layout variants by city size             |
| PokeMarts       |    8  | All share same layout            | 3 layout variants with local stock theming |
| Gyms            |    8  | Basic layouts for most           | Unique puzzle/theme per gym type           |
| Houses          |    1  | Single generic-house template    | 4 variants by biome                        |

### 4.5 UI Visual Upgrade

**Phase 1: Core UI sprites**

| Asset                 | Current       | Target                                         |
|-----------------------|---------------|-------------------------------------------------|
| Dialog frame          | Rectangle     | 9-patch sprite with pixel art border            |
| Menu frame            | Rectangle     | Matching 9-patch with rounded pixel corners     |
| Type icons            | Colored text  | 18 pixel art type badges (32x14 each)           |
| Status condition icons | Text labels  | 6 pixel art status badges (sleep, burn, etc.)    |
| Button sprites        | Rectangles    | Pixel art button states (normal, hover, pressed) |
| Cursor/selector       | Rectangle     | Animated pixel art hand cursor                   |
| HP/EXP bar frames     | Rectangles    | Sprite-based bar containers with labels          |

**Phase 2: Battle UI overhaul**

| Element               | Current       | Target                                          |
|-----------------------|---------------|-------------------------------------------------|
| Battle platform       | None          | Pixel art ground platforms for both sides        |
| Move selection panel  | Text list     | 4-button grid with type-colored backgrounds     |
| Battle message box    | Plain box     | Styled message area with character portrait      |
| Pokemon info panel    | Rectangle     | Sprite-framed HP/name/level display             |
| Bag/Pokemon selector  | Text menus    | Grid layout with item/Pokemon icons             |

**Phase 3: Overworld UI**

| Element               | Current       | Target                                          |
|-----------------------|---------------|-------------------------------------------------|
| Area name popup       | Text only     | Slide-in banner with region-styled frame        |
| Clock display         | Corner text   | Pixel art clock widget with day/night indicator |
| Interaction prompts   | None          | "A" button prompt near interactable objects     |
| Minimap               | None          | Corner minimap showing nearby tile layout       |

---

## Agent Workflow: How to Execute This Plan

### Pre-requisites

The agent needs these tools available:

- **Python 3 with Pillow (PIL)** for tileset generation and map preview
- **File read/write** for map data files (TypeScript)
- **Terminal** for running preview scripts

### Workflow Per Improvement Cycle

```text
1. Run audit scripts
   └─ Identify lowest-grade tiles and maps

2. Generate previews for target maps
   └─ Visual reference for current state

3. Run validation
   └─ Fix any errors (broken warps, bad spawns)

4. Improve target tiles/maps
   ├─ Generate pixel art tiles via Python/Pillow
   ├─ Redesign map layout in TypeScript
   └─ Update UI sprites as needed

5. Re-run preview + validation
   └─ Confirm improvements, iterate if needed

6. Run game tests
   └─ npm run test to confirm no regressions
```

### Agent Checklist Per Map Improvement

```markdown
- [ ] Preview current state (generate PNG)
- [ ] Identify tile quality issues (grade F tiles in use)
- [ ] Upgrade any needed tiles in tileset.png
- [ ] Redesign map layout if template-grid
- [ ] Verify all warps are bidirectional and valid
- [ ] Verify all NPCs and trainers on walkable tiles
- [ ] Verify all spawn points on walkable tiles
- [ ] Generate new preview for comparison
- [ ] Run validation suite
- [ ] Run npm run test
- [ ] Update CHANGELOG.md
```

---

## Validation Scripts Specification

### Script 1: `validate-warps.ts`

Location: `temp/scripts/map-audit/validate-warps.ts`

```typescript
// Pseudocode for warp validation
for (const [mapKey, mapDef] of allMaps) {
  for (const warp of mapDef.warps) {
    // 1. Target map exists
    assert(allMaps.has(warp.targetMap));

    // 2. Target spawn exists
    const target = allMaps.get(warp.targetMap);
    assert(target.spawnPoints[warp.targetSpawnId]);

    // 3. Warp tile is walkable
    const tile = mapDef.ground[warp.tileY][warp.tileX];
    assert(!SOLID_TILES.has(tile));

    // 4. Bidirectional check
    const hasReturn = target.warps.some(w =>
      w.targetMap === mapKey
    );
    if (!hasReturn) warn(`One-way warp: ${mapKey} → ${warp.targetMap}`);
  }
}
```

### Script 2: `audit-tiles.py`

Location: `temp/scripts/tileset/audit-tiles.py`

Reads tileset.png and grades each 16x16 cell by unique color count,
contrast range, and texture pattern detection.

### Script 3: `audit-maps.ts`

Location: `temp/scripts/map-audit/audit-maps.ts`

Reads all map definitions and generates per-map scorecards covering tile
variety, biome appropriateness, layout regularity, and dead space.

---

## Tile Pixel Art Style Guide

### Color Palette Rules

All new tiles MUST follow these palette constraints to maintain visual
cohesion with the existing 68 tiles:

| Rule                     | Specification                                           |
|--------------------------|---------------------------------------------------------|
| Max colors per tile      | 12 (excluding transparency)                             |
| Min colors per tile      | 6 for walkable, 8 for solid/interactive                 |
| Lighting direction       | Top-left (highlight top-left corner, shadow bottom-right) |
| Outline                  | 1px darker border on bottom and right edges             |
| Dithering                | Checkerboard pattern for gradients, max 2 colors        |
| Saturation               | Medium; avoid neon or washed-out                        |

### Tile Categories and Requirements

**Walkable ground tiles** (floors, paths, terrain):

- Subtle texture pattern that tiles seamlessly
- No strong directional elements that break when rotated
- Slight color variation across the 16x16 area
- Must read clearly at 32px (2x game scale)

**Solid wall/obstacle tiles** (walls, rocks, objects):

- Stronger contrast and detail than ground tiles
- Clear visual weight indicating "you cannot walk here"
- Top edge highlight, bottom edge shadow
- Decorative detail appropriate to the object

**Interactive tiles** (doors, machines, items):

- Distinct visual focus point (doorknob, screen, glow)
- Color accent that draws the eye
- Must be distinguishable from neighboring wall tiles at a glance

**Overlay tiles** (decorations placed on ground):

- Transparent background pixels where base tile shows through
- Visual detail concentrated in center of tile
- Must look correct over their designated OVERLAY_BASE tile

---

## Priority Execution Order

### Sprint 1: Foundation (Tileset Upgrade) — ✅ Complete

All 42 solid-color tiles (68-109) replaced with GBA-style pixel art via
`temp/scripts/tileset/upgrade_tiles.py`. Covers 12 biomes with 6-13 unique
colors per tile, proper shading, texture, and depth borders.

### Sprint 2: Validation Pipeline — ✅ Complete

Three validation scripts and enhanced preview renderer built:

- `temp/scripts/map-audit/validate-warps.py` — warp integrity checks
- `temp/scripts/map-audit/audit_tiles.py` — tile quality grading
- `temp/scripts/map-preview/render_all_maps.py` — annotated map previews
  with warp markers, spawn points, NPC/trainer positions, and problem tile
  highlighting. Generates `_clean.png` and `_preview.png` per map plus
  a `tileset_reference.png` sheet.

### Sprint 3: City Redesigns — ✅ Complete

All 6 template-grid cities redesigned with biome-appropriate layouts:
Coral Harbor (curved harbor shore), Cinderfall Town (volcanic caldera),
Wraithmoor Town (haunted ruins), Ironvale City (terraced mountain),
Voltara City (neon tech hub), Scalecrest Citadel (dragon fortress).

### Sprint 4: Route and Dungeon Polish — ✅ Complete

All 8 routes polished with biome tiles and weather effects.
Victory Road expanded from 20x25 to 25x35 with crystal cavern,
boulder puzzles, and winding passages. Ember Mines lower half
converted to Synthesis Collective lab with containment pods,
aether conduits, and terminals.

### Sprint 5: Interior Deduplication — ✅ Complete

| Target             | Treatment                                                        |
|--------------------|------------------------------------------------------------------|
| PokéCenters (×8)   | 3 size variants: Small 9x8, Medium 11x8, Large 13x8             |
| PokéMarts (×8)     | 3 size variants: Small 9x8, Medium 10x8, Large 12x8             |
| Gyms (×8)          | Already unique per type                                      |
| Generic houses     | 4 biome variants: standard, coastal, industrial, haunted     |

### Sprint 6: UI Visual Upgrade — ✅ Complete

| Step | Target              | Status  | Treatment                                    |
|------|---------------------|---------|----------------------------------------------|
| 1    | Dialog/menu frames  | ✅ Done | TextBox uses NinePatchPanel                   |
| 2    | Type icons          | ✅ Done | 18 pixel-art badges (spritesheet)            |
| 3    | Status icons        | ✅ Done | 6 pixel-art status badges in battle + party  |
| 4    | Battle status       | ✅ Done | Sprite-based status indicators in BattleScene |
| 5    | Area name banner    | ✅ Done | Slide-in gold banner on all map entries       |
| 6    | Interaction prompt  | ✅ Done | Floating "Z"/"Tap" prompt near NPCs/trainers |

### Sprint 7: City Warp Integrity — ✅ Complete

Audited all 10 cities for unwired doors, missing warps, and spawn mismatches.
Fixed 6 issues across 4 cities:

| City             | Fix                                                          |
|------------------|--------------------------------------------------------------|
| Pewter City      | Wired 2 house doors, added extra PokéMart door warp          |
| Viridian City    | Wired 2 house doors (gym left intentionally NPC-blocked)     |
| Verdantia Village| Wired 1 house door                                           |
| Ironvale City    | Fixed spawn name mismatch (`from-house` → `from-house-1`)   |

All 10 cities now have every visible door wired to an interior.

### Camera/Viewport Centering — ✅ Complete

Maps smaller than the viewport are now centered on both axes. The camera
bounds expand to the viewport size when the map is narrower or shorter,
and a dark background (`0x0f0f1a`) fills any void area outside map content.

---

## Remaining Work

### Sprint 6 Remaining: UI Visual Upgrades

| Step | Target              | Priority | Treatment                         |
|------|---------------------|----------|-----------------------------------|
| 2    | Type icons          | High     | 18 pixel art badges (32x14)       |
| 3    | Status icons        | High     | 6 pixel art status badges         |
| 4    | Battle UI overhaul  | High     | Platforms, move grid, info panels |
| 5    | Overworld UI        | Medium   | Area banner, clock widget, prompts|

### Warp Validation Cleanup

The validation script found 56 errors and 63 warnings. Run the validator
against updated maps and systematically fix remaining issues.

### Museum Interior Upgrade

Pewter Museum exists but could be expanded with unique fossil exhibits,
interactive displays, and quest-related items.

### Viridian Gym (Story-Gated)

The Viridian Gym door is NPC-blocked. Once the story flag system supports
conditional warps removing the NPC, add a `requireFlag: 'gym8_unlocked'`
warp.

---

## Success Criteria

### Tile Quality

- [x] All 110 tiles graded B or above in the tile audit
- [x] No solid-color tiles remain in tileset.png
- [x] All biome palettes are internally consistent

### Map Quality

- [x] All 10 cities have unique layouts (no template grids)
- [x] All 8 routes have biome-appropriate tile usage
- [x] All maps score above 70% on tile variety metric
- [x] Dead space below 20% on all outdoor maps

### Warp Integrity

- [ ] Zero warp validation errors (reduced from 56 to 8, all remaining are parser false positives)
- [x] All visible doors wired to interiors (6 fixed across 4 cities)
- [x] All spawn points on walkable tiles

### UI Quality

- [x] Dialog boxes use NinePatchPanel frames
- [x] Type icons are sprite-based (18-badge spritesheet)
- [x] Status icons are sprite-based (6-badge spritesheet)
- [ ] Battle UI uses sprite frames for HP, info panels
- [x] All UI colors sourced from theme.ts
- [x] Maps centered in viewport when smaller than screen

### Pipeline

- [x] Preview renderer generates PNGs for all maps
- [ ] Region overview map auto-generated from warp graph
- [x] Validation suite runs (zero errors target not yet met)
- [x] All scripts are re-runnable and idempotent

---

## Relationship to Level Up Plan

This UI Improvement Plan is the visual execution arm of the Level Up Plan's
Tier 0 (City Identity Overhaul, Route Polish) and extends into Tier 1
(visual polish). The two plans share these touchpoints:

| Level Up Plan Item            | UI Plan Coverage                         |
|-------------------------------|------------------------------------------|
| Tier 0.1: City redesigns      | Sprint 3 (full city redesign protocol)   |
| Tier 0.2: Route 6-7 polish    | Sprint 4, Steps 1-2                      |
| Tier 1.2: Cycling sprite      | Not covered (character art, not UI/maps) |
| Tier 1.5: Weather-per-route   | Sprint 4 (visual consistency validation) |
| Tier 5.2: Texture atlas       | Sprint 1 (tileset is the atlas source)   |

The Level Up Plan defines *what* to build. This plan defines *how* to build it
with a repeatable, validated pipeline that ensures every change is an
improvement.
