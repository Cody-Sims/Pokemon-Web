# Map UI Improvement Plan

## Problem Statement

1. **Basic visuals** — All tiles are rendered as solid-color rectangles (`this.add.rectangle()`) with minimal decorative overlays. An `overworld.png` tileset exists in `public/assets/tilesets/` but is never loaded.
2. **Cannot enter buildings** — Door tiles (HOUSE_DOOR, LAB_DOOR, CENTER_DOOR, MART_DOOR, GYM_DOOR) exist in the tile system, but no warps are attached to them. There are no interior maps. `InteractableObject` has a `'door'` type but is unused.

---

## Part A: Tileset-Based Rendering

**Goal:** Replace flat color rectangles with real tile sprites from the `overworld.png` tileset using Phaser's tilemap system.

### A.1 — Tileset Atlas Preparation
- Open `overworld.png` (the CC-BY 3.0 "Legend of Pocket Monsters" tileset) and document its tile grid: tile size, columns, rows.
- Create a tile-index mapping (`TILE_TO_FRAME`) that maps each `Tile.*` constant to the correct frame index in the tileset spritesheet (e.g., `Tile.GRASS → frame 0`, `Tile.PATH → frame 12`, etc.).
- Add any missing tile types the tileset supports (e.g., roof variations, window tiles, fences, interior floors).

### A.2 — Load Tileset in Preloader
- In the `PreloadScene` (or OverworldScene preload), load `overworld.png` as a spritesheet with the correct `frameWidth`/`frameHeight`.
- Verify frames load correctly.

### A.3 — Replace `drawMap()` with Tilemap Rendering
- **Option 1 — Phaser Tilemap API:** Build a `Phaser.Tilemaps.Tilemap` from the `ground[][]` data using `map.createBlankLayer()` + `layer.putTileAt()`. This gives automatic culling, depth sorting, and potential collision integration.
- **Option 2 — Sprite-per-tile (simpler):** Replace each `this.add.rectangle(...)` call with `this.add.image(px, py, 'overworld', frameIndex)`. Less Phaser integration but minimal refactor.
- **Recommended: Option 1** for better performance and future extensibility.

### A.4 — Multi-Layer Tiles
- Add a second data layer for "decoration" tiles (flowers, signs, etc.) that render on top of the base ground layer.
- Buildings should use multi-tile compositions: roof row, wall row with windows, door tile — using distinct frames from the tileset rather than flat colors.
- Add tile variation: randomly pick between 2–3 grass frame variants to break up visual repetition.

### A.5 — Tile Transitions & Polish
- Add edge/border tiles where grass meets path (half-grass/half-path tiles from the tileset).
- Add shadow tiles under buildings and trees.
- Add animated water tiles (2–3 frame animation using Phaser tilemap animation).
- Add animated tall grass (subtle sway) — or at minimum a rustling effect when the player walks through.

---

## Part B: Building Interiors

**Goal:** Allow the player to enter buildings by stepping onto door tiles, transitioning to interior maps.

### B.1 — New Interior Tile Types
Add to `shared.ts`:
```
FLOOR:          25   // Generic indoor floor
INDOOR_WALL:    26   // Interior wall (solid)
COUNTER:        27   // PokéCenter/Mart counter (solid)
TABLE:          28   // Decoration (solid)
BOOKSHELF:      29   // Decoration (solid)
RUG:            30   // Floor decoration (walkable)
STAIRS_UP:      31   // Warp tile (to 2F)
STAIRS_DOWN:    32   // Warp tile (to 1F)
MAT:            33   // Door mat / exit warp tile
PC_TILE:        34   // PC terminal (interactable)
HEAL_MACHINE:   35   // PokéCenter healing machine
```

### B.2 — Interior Map Definitions
Create small interior maps for each enterable building. Each interior is its own `MapDefinition` with a `MAT` tile at the entrance that warps back outside.

| Interior Map Key         | Size   | Contents                                  |
|-------------------------|--------|-------------------------------------------|
| `pallet-player-house`   | 8×8    | Table, rug, bookshelf, Mom NPC, exit mat  |
| `pallet-rival-house`    | 8×8    | Table, bookshelf, Rival's sister NPC      |
| `pallet-oak-lab`        | 12×10  | Bookshelves, 3 starter Poké Balls on table, Oak NPC, assistants, exit mat |
| `viridian-pokecenter`   | 12×8   | Healing counter, Nurse NPC, PC terminal, benches, exit mat |
| `viridian-pokemart`     | 10×8   | Shop counter, Clerk NPC, shelves, exit mat |
| `viridian-house-1`      | 8×8    | Generic NPC, furniture                    |
| `pewter-pokecenter`     | 12×8   | Same layout as Viridian PokéCenter        |
| `pewter-gym`            | 14×12  | Rocky floor, Brock at back, gym trainers, exit mat |
| `pewter-museum`         | 14×10  | Display cases, guide NPC, fossils         |

### B.3 — Door Warp System
Modify `OverworldScene.onPlayerStep()` to detect when the player steps on a door tile and trigger a warp:

1. **Add door warps to map definitions** — Extend existing maps (pallet-town, viridian-city, pewter-city) with warps at each door tile position pointing to the corresponding interior map.
2. **Interior exit warps** — Each interior map has a `MAT` tile near the bottom that warps back to the exterior map, spawning the player one tile below the door.
3. **Door open SFX** — Play `sfx-door-open.wav` (already exists in assets) when entering/exiting buildings.
4. **Transition style** — Use a quick fade-to-black (already supported by `TransitionManager`) for building entry/exit, distinct from the stripe transition used for battles.

### B.4 — Move Oak's Lab Logic Indoors
Currently, Prof. Oak and the starter selection happen outside the lab (Oak NPC is placed at the lab door tile). After creating the lab interior:
- Move `pallet-oak` NPC inside `pallet-oak-lab` interior map.
- The starter Poké Balls become interactable objects on a table.
- Preserve the existing flag-gating logic (`receivedStarter`, etc.).

### B.5 — PokéCenter Interior Logic
- Nurse Joy NPC behind counter with `interactionType: 'heal'` (reuse existing heal logic).
- PC terminal as an `InteractableObject` with type `'pc'` (placeholder until PC Storage is implemented in Phase 4).
- Healing animation: play a jingle, flash effect, then "Your Pokémon are fully healed!" dialogue.

### B.6 — PokéMart Interior Logic
- Clerk NPC behind counter with `interactionType: 'shop'` (placeholder until Shop System is implemented in Phase 4).
- Shelves as decoration (solid tiles).
- Parcel quest dialogue remains flag-gated.

### B.7 — Gym Interior Logic
- Gym layout with themed floor (rocky tiles for Pewter Gym).
- Gym trainers placed inside with line-of-sight.
- Gym Leader (Brock) at the back of the gym.
- Gym guide NPC near entrance with tips.
- Move current gym trainer spawns from the exterior map to the interior.

---

## Part C: Visual Polish & UX

### C.1 — Building Entry Feedback
- Animate the door "opening" (brief 2-frame animation or tile swap) before the fade transition.
- Add a location name popup when entering a new interior ("Oak's Laboratory", "Pokémon Center", etc.).

### C.2 — Camera & Depth
- Interior maps should not scroll if they fit on screen — lock camera to center.
- Ensure NPCs and player render above floor tiles but below roof/counter tops for depth layering.

### C.3 — Minimap Indicator (Stretch)
- Show a small indicator or building name when standing near a door: "Press ENTER to enter" or auto-enter on step (classic Pokémon style).

---

## Implementation Order

| Step | Task | Depends On | Estimated Scope |
|------|------|------------|-----------------|
| 1 | Map the `overworld.png` tileset frames | — | Small |
| 2 | Load tileset in preloader | Step 1 | Small |
| 3 | Replace `drawMap()` with tilemap rendering | Steps 1–2 | Medium |
| 4 | Add tile decoration layer + variations | Step 3 | Medium |
| 5 | Add interior tile types to `shared.ts` | — | Small |
| 6 | Create interior map for Oak's Lab | Step 5 | Medium |
| 7 | Add door warps to pallet-town + lab exit warp | Step 6 | Small |
| 8 | Wire door detection into `onPlayerStep()` | Step 7 | Small |
| 9 | Move Oak/starter logic into lab interior | Step 8 | Medium |
| 10 | Create PokéCenter interior template | Step 5 | Medium |
| 11 | Create PokéMart interior template | Step 5 | Medium |
| 12 | Create Pewter Gym interior | Step 5 | Medium |
| 13 | Create remaining house interiors | Step 5 | Small each |
| 14 | Add door open SFX + transition polish | Step 8 | Small |
| 15 | Add tile transitions & animated water | Step 3 | Medium |
| 16 | Interior camera locking | Step 8 | Small |

**Suggested priority:** Steps 1–4 (tileset rendering) and Steps 5–9 (first building entry) can be done in parallel tracks. The tileset work improves all maps at once, while the building interiors add major new gameplay access.

---

## Files to Create / Modify

### New Files
- `frontend/src/data/maps/pallet-player-house.ts`
- `frontend/src/data/maps/pallet-rival-house.ts`
- `frontend/src/data/maps/pallet-oak-lab.ts`
- `frontend/src/data/maps/viridian-pokecenter.ts`
- `frontend/src/data/maps/viridian-pokemart.ts`
- `frontend/src/data/maps/pewter-pokecenter.ts`
- `frontend/src/data/maps/pewter-gym.ts`
- `frontend/src/data/maps/pewter-museum.ts`

### Modified Files
- `frontend/src/data/maps/shared.ts` — New tile types, interior tile colors, updated SOLID_TILES
- `frontend/src/data/maps/index.ts` — Register all new interior maps
- `frontend/src/data/maps/pallet-town.ts` — Add door warps + spawn points for returning from interiors
- `frontend/src/data/maps/viridian-city.ts` — Add door warps
- `frontend/src/data/maps/pewter-city.ts` — Add door warps, move Brock to gym interior
- `frontend/src/scenes/OverworldScene.ts` — Tilemap rendering, door SFX, interior camera logic
- `frontend/src/scenes/PreloadScene.ts` — Load tileset spritesheet
