<!-- markdownlint-disable-file -->

# Tile & Sprite Asset Plan

> Strategy for creating, validating, and maintaining high-quality pixel art tiles and character sprites for the Pokemon Web project — with emphasis on closing the gap between LLM-generated art and hand-crafted pixel art.

## Problem Statement

LLM-generated pixel art tiles suffer from several recurring issues:

- **Flat coloring**: Tiles often use uniform fills or too few colors, producing a "programmer art" look rather than the textured GBA-era aesthetic the game targets.
- **No lighting model**: Tiles lack the top-left highlight / bottom-right shadow convention that gives pixel art depth and consistency.
- **Poor tiling**: Tiles don't seamlessly tile when placed adjacent to themselves — seams and misaligned patterns are visible.
- **Color palette drift**: Each batch of generated tiles uses slightly different color palettes, creating a patchwork look across the tileset.
- **Tileset overflow**: The `Tile` enum (115 types, indices 0-114) exceeds the tileset grid capacity (110 slots in a 10x11 sheet). Tiles 110-114 have no spritesheet frames and fall back to colored rectangles.
- **Missing animation**: All tiles are static single frames — no water shimmer, flowing lava, waving grass, or flickering torches.
- **Sprite inconsistency**: NPC sprites are generated via palette-swapping scripts but the base character set is limited (12M + 12F). Special NPCs (gym leaders, rivals, quest characters) lack distinct visual identities.

## Current Asset Inventory

### Tileset

| File | Dimensions | Grid | Status |
|---|---|---|---|
| `tileset.png` | 160x176 | 10x11 @ 16px | **Active** — primary game tileset |
| `overworld.png` | 448x848 | — | Reference only, not used for tile rendering |
| `tileset-2.png` | 160x176 | 10x11 @ 16px | Unused backup |
| `tileset-backup.png` | 160x176 | 10x11 @ 16px | Backup before upgrade_tiles.py run |

**Tile ID allocation:**

| Range | Count | Category | Quality |
|---|---|---|---|
| 0-9 | 10 | Core terrain (grass, path, water, sand) | Good — sourced from Tuxemon CC-BY assets |
| 10-29 | 20 | Buildings, interiors, structures | Mixed — some custom, some generated |
| 30-49 | 20 | Special terrain, doors, furniture | Mixed |
| 50-67 | 18 | Extended terrain, bridges, stairs | Acceptable |
| 68-109 | 42 | Phase 4.5 biome tiles (volcanic, snow, coral, etc.) | **Weakest** — Pillow-generated pixel art |
| 110-114 | 5 | Field ability tiles (cut, rock, boulder, ledges) | **Broken** — outside tileset grid, render as colored rectangles |

### Sprites

| Category | Count | Format | Quality |
|---|---|---|---|
| Player (male) | 1 atlas | 64x51, 12 frames @ 16x17 | Good |
| Player (female) | reuses npc-lass | 64x51, 12 frames @ 16x17 | Placeholder |
| NPCs | 40 PNGs + 39 atlas JSONs | 64x51, 12 frames @ 16x17 | Acceptable — palette-swapped from 24 bases |
| Pokemon (front) | 151 PNGs | 96x96 | Good — sourced from PokeAPI |
| Pokemon (back) | 151 PNGs | 96x96 | Good — sourced from PokeAPI |
| Pokemon (icons) | 151 PNGs | 68x56 | Good — sourced from PokeAPI |

### Attribution

| Source | License | Usage |
|---|---|---|
| Tuxemon tileset (Buch) | CC-BY 3.0 | Grass, flowers, water, fence tiles |
| Legend of Pocket Monsters (Chad Wolfe) | CC-BY 3.0 | Overworld reference tileset |
| Tiny Characters Set (Fleurman/GrafxKid) | CC0 | NPC base character sprites |
| PokeAPI Sprites | Various (see PokeAPI) | Pokemon battle sprites and icons |
| Custom pixel art | Project-owned | Path, trees, tall grass, buildings, interiors, biome tiles |

---

## Strategy: Tile Quality Improvement

### Principle: Reference-Driven Generation

The fundamental problem with LLM-generated tiles is the lack of visual reference and feedback. The solution is a **reference-first pipeline** where every tile is generated against a documented specification, validated against quality rules, and rendered for visual inspection.

### The Tile Quality Spec

Every tile in the tileset should meet these criteria (based on GBA-era Pokemon aesthetics):

#### Color Rules

1. **Minimum 4 unique colors per tile** (6+ preferred for terrain). Solid single-color fills are never acceptable for visible tiles.
2. **Palette harmony**: Each biome has a defined palette of 8-12 colors. All tiles in a biome draw from this palette exclusively.
3. **Top-left lighting**: Highlight colors (lighter) toward top-left edges; shadow colors (darker) toward bottom-right edges.
4. **1px depth border**: Bottom and right edges use a darkened variant of the base color. Top and left edges use a lightened variant.
5. **Dithering over gradients**: Use checkerboard or ordered dithering patterns for smooth transitions, never linear gradients.

#### Tiling Rules

6. **Seamless repetition**: Any tile that appears in open areas (grass, water, sand, floor) must tile seamlessly in all 4 directions.
7. **Edge compatibility**: Transition tiles (grass-to-water, path-to-grass) must line up with their adjacent tile types on all relevant edges.
8. **No isolated pixels**: Avoid single floating pixels unless they represent intentional detail (sparkles, dust). Random noise reads as dirt.

#### Structural Rules

9. **Consistent scale**: All detail should be at the same visual scale. A tree trunk should be 3-4px wide, not 1px in one tile and 6px in another.
10. **Readable silhouette**: A tile's function should be identifiable from its shape alone, even without color (solid vs walkable, building vs terrain).

### Biome Palette Reference

Each biome has a locked palette. All tile generation for that biome must use only these colors.

```python
PALETTES = {
    'standard': {
        'grass_light':    (88, 168, 56),
        'grass_mid':      (72, 144, 48),
        'grass_dark':     (56, 120, 40),
        'path_light':     (216, 184, 128),
        'path_mid':       (192, 160, 104),
        'path_dark':      (168, 136, 88),
        'water_light':    (96, 168, 224),
        'water_mid':      (64, 128, 192),
        'water_dark':     (40, 96, 160),
        'tree_canopy':    (32, 104, 32),
        'tree_trunk':     (128, 88, 48),
        'roof_red':       (200, 72, 56),
    },
    'volcanic': {
        'ash_light':      (120, 112, 104),
        'ash_mid':        (96, 88, 80),
        'ash_dark':       (72, 64, 56),
        'lava_bright':    (255, 160, 32),
        'lava_mid':       (224, 96, 16),
        'lava_dark':      (176, 48, 8),
        'rock_light':     (80, 72, 64),
        'rock_mid':       (56, 48, 40),
        'rock_dark':      (40, 32, 24),
        'ember_glow':     (255, 200, 80),
        'hot_spring':     (128, 200, 224),
        'magma_crack':    (200, 64, 24),
    },
    'snow': {
        'snow_light':     (240, 248, 255),
        'snow_mid':       (208, 224, 240),
        'snow_dark':      (176, 196, 220),
        'ice_light':      (160, 220, 255),
        'ice_mid':        (120, 180, 224),
        'ice_dark':       (80, 140, 192),
        'pine_canopy':    (24, 80, 48),
        'pine_trunk':     (96, 72, 48),
        'frozen_water':   (144, 200, 240),
        'frost_accent':   (200, 232, 255),
        'stone_cold':     (128, 136, 148),
        'cabin_wood':     (144, 104, 64),
    },
    'coral': {
        'sand_light':     (240, 224, 176),
        'sand_mid':       (216, 192, 144),
        'sand_dark':      (184, 160, 112),
        'coral_pink':     (240, 128, 144),
        'coral_orange':   (240, 160, 96),
        'ocean_light':    (64, 176, 208),
        'ocean_mid':      (32, 128, 176),
        'ocean_dark':     (16, 88, 136),
        'shell_white':    (248, 240, 232),
        'seaweed':        (48, 144, 80),
        'tidepool':       (80, 160, 192),
        'cliff_grey':     (160, 152, 136),
    },
    'dark': {
        'shadow_light':   (72, 64, 80),
        'shadow_mid':     (48, 40, 56),
        'shadow_dark':    (32, 24, 40),
        'ghost_light':    (160, 128, 200),
        'ghost_mid':      (120, 88, 168),
        'ghost_dark':     (80, 56, 128),
        'grave_stone':    (112, 104, 96),
        'dead_grass':     (96, 104, 64),
        'wisp_glow':      (176, 224, 160),
        'iron_fence':     (72, 72, 80),
        'moss':           (64, 96, 48),
        'dark_wood':      (80, 56, 40),
    },
    'mystic': {
        'mystic_grass':   (64, 144, 104),
        'mystic_glow':    (128, 224, 176),
        'mystic_dark':    (32, 96, 64),
        'crystal_light':  (200, 160, 255),
        'crystal_mid':    (160, 112, 224),
        'crystal_dark':   (120, 72, 192),
        'ancient_stone':  (144, 136, 120),
        'rune_glow':      (224, 200, 128),
        'mist_light':     (200, 224, 232),
        'mist_mid':       (168, 200, 216),
        'vine_green':     (48, 128, 72),
        'mushroom_cap':   (192, 96, 128),
    },
}
```

---

## Tile Creation Pipeline

### Step 1: Tile Specification

Before generating any tile, document it:

```python
TILE_SPEC = {
    'id': 68,
    'name': 'TIDE_POOL',
    'biome': 'coral',
    'category': 'terrain',
    'walkable': False,
    'tiles_with': True,           # must tile seamlessly with itself
    'adjacent_to': ['CORAL_SAND', 'OCEAN_SHALLOW'],  # edge-compatible tiles
    'description': 'Shallow tidal pool with sand rim, blue water center, small rocks',
    'palette_colors': ['sand_mid', 'sand_dark', 'ocean_light', 'ocean_mid', 'tidepool', 'shell_white'],
    'detail_notes': 'Rounded sand edges, 2-3px rocks in corners, water ripple dithering in center',
}
```

### Step 2: Tile Generation Script

Each tile is generated by a Python function that follows the spec:

```python
def make_tile(spec: dict) -> Image.Image:
    """Generate a 16x16 tile from a specification."""
    palette = PALETTES[spec['biome']]
    t = Image.new('RGBA', (16, 16))
    d = ImageDraw.Draw(t)

    # 1. Fill base color
    base = palette[spec['palette_colors'][0]]
    d.rectangle([0, 0, 15, 15], fill=base)

    # 2. Add depth border (mandatory for all tiles)
    add_depth_border(d, base, palette)

    # 3. Add detail per tile type
    # (tile-specific drawing code)

    # 4. Validate
    validate_tile(t, spec)
    return t
```

### Step 3: Tile Validation

Automated checks run on every generated tile:

```python
def validate_tile(img: Image.Image, spec: dict) -> list[str]:
    """Validate a tile against quality rules. Returns list of warnings."""
    warnings = []
    colors = set(img.getdata())

    # Rule 1: Minimum color count
    if len(colors) < 4:
        warnings.append(f"Only {len(colors)} unique colors (minimum 4)")

    # Rule 3: Top-left lighting check — top-left quadrant avg brightness
    #          should be >= bottom-right quadrant avg brightness
    tl_brightness = avg_brightness(img.crop((0, 0, 8, 8)))
    br_brightness = avg_brightness(img.crop((8, 8, 16, 16)))
    if tl_brightness < br_brightness - 10:
        warnings.append("Lighting model violation: bottom-right brighter than top-left")

    # Rule 4: Depth border check
    bottom_row = [img.getpixel((x, 15)) for x in range(16)]
    right_col = [img.getpixel((15, y)) for y in range(16)]
    # These should be darker than the tile average

    # Rule 6: Tiling check (if tiles_with is True)
    if spec.get('tiles_with'):
        tiled = tile_4x4(img)
        if has_visible_seams(tiled):
            warnings.append("Visible seams when tiled 4x4")

    # Rule 8: Isolated pixel check
    isolated = count_isolated_pixels(img)
    if isolated > 3:
        warnings.append(f"{isolated} isolated pixels detected")

    return warnings
```

### Step 4: Visual Catalog

Generate a catalog image showing every tile at 4x zoom with its ID and name:

```
npm run tiles:catalog     # Generates temp/tile-catalog.png
```

This produces a reference sheet: each tile rendered at 64x64 with its index number overlaid, grouped by biome. Useful for visual comparison and catching inconsistencies across batches.

### Step 5: Tiling Preview

For any tile that tiles with itself, generate a 4x4 tiled preview:

```
npm run tiles:preview 68  # Preview tile 68 tiled in a 4x4 grid
npm run tiles:preview-all # Preview all tileable tiles
```

---

## Tileset Expansion Strategy

### Immediate Fix: Tiles 110-114

These 5 tiles (CUT_TREE, CRACKED_ROCK, STRENGTH_BOULDER, LEDGE_LEFT, LEDGE_RIGHT) exceed the current 10x11 grid. Two options:

**Option A: Expand the tileset to 10x12** (recommended)
- Add one row to `tileset.png` (160x192)
- Update Phaser spritesheet loading to `endFrame: 119`
- Leaves 5 spare slots (115-119) for future tiles
- Simple, backward-compatible

**Option B: Repurpose unused tile IDs**
- Audit which tiles in 0-109 are actually used in maps
- Reassign unused slots
- More complex, risks map breakage

### Future Expansion: Animation Frames

Animated tiles (water, lava, torches) require multiple frames per tile. This needs a separate animation tileset or a wider spritesheet:

**Proposed approach**: Keep static tiles in the current sheet. Add a second spritesheet `tileset-anim.png` for animated variants:
- 4 frames per animated tile
- 10 columns x N rows
- Phaser `anims.create()` cycles frames at configurable speed
- Tiles that have animated variants get swapped at runtime

Candidate animated tiles:
- WATER (gentle wave cycle)
- LAVA_ROCK / MAGMA_CRACK (pulsing glow)
- WATERFALL (flowing motion)
- TORCH / EMBER_VENT (flickering)
- HOT_SPRING (steam wisps)
- WISP (floating ghost light)

---

## Sprite Quality Strategy

### Current Issues

1. **Female player** reuses `npc-lass` — needs a proper dedicated atlas.
2. **Special NPCs** (gym leaders, rivals, professor, elite four) use generic palette-swapped sprites — they need distinct character designs.
3. **Trainer battle sprites** — trainers appear in battle but use the same overworld sprite. Higher-detail battle portraits would improve the battle experience.
4. **No overworld Pokemon sprites** — following/surfing Pokemon are not visually represented.

### Sprite Quality Rules

All sprites should follow these conventions (matching the existing Fleurman/GrafxKid base set):

1. **Frame size**: 16x17 pixels per frame (current standard).
2. **Animation frames**: 12 frames per character — 4 directions × 3 steps (stand, walk-left, walk-right).
3. **Outline**: 1px dark outline (near-black, not pure black) on the character silhouette.
4. **Limited palette**: Max 8 colors per character (excluding transparency). GBA sprites used 15 colors max per palette.
5. **Sub-pixel animation**: Walk frames shift by 1px for subtle bounce. Head and arms alternate.
6. **Consistent proportions**: Head = 6px tall, body = 8px tall, legs = 3px tall. Total = 17px with 1px overlap.

### Sprite Creation Pipeline

#### For Generic NPCs (palette-swap approach)

The existing scripts (`create_npc_atlases.py`, `create_sprite_variants.py`) handle this well. The pipeline is:

1. Select a base character from the 24 existing bases (12M + 12F)
2. Define palette mapping (old color → new color)
3. Run palette-swap script
4. Generate atlas JSON
5. Register in NPC data

#### For Special Characters (hand-crafted approach)

Gym leaders, rivals, and story characters need unique sprites:

1. **Spec first**: Define the character's visual identity — hair color, outfit colors, distinguishing features (hat, cape, glasses).
2. **Base template**: Start from the closest existing base character.
3. **Pixel edits**: Modify the template pixel-by-pixel to add unique features. This is best done in an actual pixel art tool, but when using scripts:
   - Define the character's unique features as "overlays" applied to the base template
   - Hair shape changes: redraw the top 6px of head frames
   - Outfit changes: palette swap plus structural modifications to body frames
4. **Validation**: Check all 12 frames for consistency — no animation artifacts, consistent outline, palette within 8-color limit.

#### For Pokemon Overworld Sprites (new category)

If follower Pokemon are implemented:

1. **Source**: Scale down from existing 96x96 front sprites to 16x16 overworld size
2. **Frame count**: 4 frames minimum (one per direction), 8 preferred (walk cycle)
3. **Auto-generation**: Python script using Pillow to:
   - Load 96x96 sprite
   - Quantize to 8 colors
   - Resize to 16x16 with nearest-neighbor (preserves pixel aesthetic)
   - Generate directional variants by horizontal flip and minor pixel adjustments

### Sprite Catalog Script

Similar to the tile catalog, generate a visual reference of all sprites:

```
npm run sprites:catalog   # Generates temp/sprite-catalog.png
```

Each character shown in all 4 directions, 3 frames each, at 4x zoom, with the texture key label.

---

## Asset Sourcing Strategy

### CC0/CC-BY Compatible Sources

For tiles and sprites that are too complex to generate programmatically, these are high-quality, license-compatible pixel art sources:

| Source | Content | License | URL |
|---|---|---|---|
| OpenGameArt.org | Thousands of 2D tilesets and sprites | Various (CC0, CC-BY, CC-BY-SA) | opengameart.org |
| Tuxemon | Pokemon-style creature sprites + world tiles | CC-BY-SA 4.0 | github.com/Tuxemon |
| GrafxKid | Retro RPG sprite bases | CC0 | opengameart.org/users/grafxkid |
| Buch | Tilesets (Tuxemon tileset) | CC-BY 3.0 | opengameart.org/users/buch |
| Kenney.nl | Generic game assets (UI, tiles, sprites) | CC0 | kenney.nl |
| itch.io asset packs | Curated pixel art packs | Various per pack | itch.io/game-assets/tag-pixel-art |

### Sourcing Rules

1. **License must be CC0, CC-BY 3.0/4.0, or CC-BY-SA 3.0/4.0**. No NC (non-commercial) or ND (no-derivatives) licenses.
2. **All sourced assets must be credited** in `frontend/public/assets/CREDITS.txt`.
3. **Visual consistency**: Sourced assets must match the game's 16px tile / 16x17 sprite standard. Resize if necessary, but prefer assets that are already at the right scale.
4. **Prefer CC0**: When multiple options exist, prefer CC0 to minimize attribution complexity.

### When to Source vs Generate

| Scenario | Approach |
|---|---|
| Core terrain tiles (grass, water, paths) | **Source** from Tuxemon/Buch — these are professional quality |
| Biome-specific variants | **Generate** via palette swap from core tiles |
| Building structures | **Generate** — project-specific layouts |
| Interior furniture/detail | **Source** if good CC0 options exist, else generate |
| Generic NPC sprites | **Generate** via palette-swap pipeline |
| Special character sprites | **Source** a close base, then modify |
| Pokemon sprites | **Source** from PokeAPI (already done) |
| UI elements | **Source** from Kenney or similar CC0 packs |

---

## Implementation Phases

### Phase 1: Fix Critical Gaps

- [ ] Expand tileset.png from 10x11 to 10x12 (160x192) to accommodate tiles 110-114
- [ ] Draw proper pixel art for tiles 110-114 (CUT_TREE, CRACKED_ROCK, STRENGTH_BOULDER, LEDGE_LEFT, LEDGE_RIGHT)
- [ ] Update Phaser spritesheet loading to handle the larger tileset
- [ ] Create a proper female player sprite atlas (not reusing npc-lass)

### Phase 2: Quality Audit & Biome Palette Lock

- [ ] Create `temp/scripts/tileset/validate_tiles.py` — automated quality checker against the rules above
- [ ] Create `temp/scripts/tileset/tile_catalog.py` — visual catalog generator at 4x zoom
- [ ] Define and lock biome palettes in a shared `palettes.py` config
- [ ] Audit all 42 biome tiles (68-109) against quality rules, log failures
- [ ] Regenerate worst-scoring tiles using the locked palettes and quality pipeline

### Phase 3: Tile Improvement Pass

- [ ] Regenerate all biome tiles (68-109) using the reference-driven pipeline
- [ ] Run seamless tiling validation on all terrain tiles
- [ ] Generate 4x4 tiling previews for visual inspection
- [ ] Source higher-quality replacements from OpenGameArt for core terrain if current quality is below standard

### Phase 4: Animation Foundation

- [ ] Create `tileset-anim.png` spritesheet for animated tile variants
- [ ] Implement water animation (4 frames, gentle wave)
- [ ] Implement lava/ember animation (4 frames, pulsing glow)
- [ ] Add animation system to OverworldScene tile renderer
- [ ] Create waterfall animation

### Phase 5: Sprite Expansion

- [ ] Create unique sprites for all 8 gym leaders
- [ ] Create unique sprites for rival character
- [ ] Create unique sprite for professor
- [ ] Create unique sprites for Elite Four + Champion
- [ ] Create `temp/scripts/sprites/sprite_catalog.py` — visual sprite catalog generator

---

## Script Reference

### Existing Scripts (in temp/)

| Script | Purpose |
|---|---|
| `scripts/tileset/generate_tileset.py` | Generates tileset from scratch using Pillow drawing |
| `scripts/tileset/upgrade_tiles.py` | Upgrades placeholder tiles 68-109 to pixel art |
| `scripts/tileset/build_tileset.py` | Compiles final tileset from individual tile images |
| `scripts/tileset/catalog_tiles.py` | Generates tile catalog reference image |
| `scripts/tileset/extract_tileset.py` (v1-v3) | Extracts individual tiles from tileset sheet |
| `scripts/tileset/make_grids.py` | Creates tiling grid preview images |
| `create_npc_atlases.py` | Generates NPC sprite atlas PNGs + JSON from base characters |
| `create_sprite_variants.py` | Palette-swaps base sprites to create NPC variants |
| `create_oak_sprite.py` | Special-case sprite generation for Professor Oak |
| `sprite_audit.py` | Audits sprite dimensions and frame counts |
| `update_sprites.py` | Batch-updates texture keys in sprite references |

### Proposed New Scripts

| Script | Purpose |
|---|---|
| `scripts/tileset/validate_tiles.py` | Quality rule checker (colors, lighting, tiling, borders) |
| `scripts/tileset/regen_tile.py` | Regenerate single tile by ID using spec + palette |
| `scripts/tileset/tile_preview.py` | Render 4x4 tiled preview for seamless-tiling check |
| `scripts/tileset/expand_tileset.py` | Expand tileset grid dimensions safely |
| `scripts/sprites/sprite_catalog.py` | Visual catalog of all sprites at 4x zoom |
| `scripts/sprites/make_unique_npc.py` | Generate unique NPC sprite from spec + base template |

---

## Appendix: Tile Drawing Patterns

Reference patterns for the most common tile types, to ensure consistency when generating new tiles:

### Grass Tile Pattern

```
16x16 grid. Base fill: grass_mid.
- Scatter 6-8 random grass_light pixels in top half (highlights)
- Scatter 4-6 random grass_dark pixels in bottom half (shadows)
- 2-3 tiny grass blade clusters: 1px wide, 2-3px tall, placed at random
- Bottom-right 1px border: grass_dark
- Top-left 1px border: grass_light
```

### Water Tile Pattern

```
16x16 grid. Base fill: water_mid.
- Horizontal wave lines at y=3, y=8, y=13 using water_light (1px wide, 4-6px long)
- Shadow dithering in bottom-right quadrant using water_dark
- 2-3 water_light reflective highlights scattered top-left
- Edges match adjacent water tiles seamlessly (wave lines wrap)
```

### Tree Canopy Tile Pattern

```
16x16 grid. Base fill: tree_canopy.
- Rounded cluster: lighter center, darker edges
- 4-6 leaf detail pixels using lighten(tree_canopy, 30) in center
- Shadow pixels darken(tree_canopy, 25) on bottom and right
- Small gaps (1-2px of grass_dark showing through) for depth
- Bottom 2px may show trunk (tree_trunk color) if this is the base of a tree
```

### Building Wall Tile Pattern

```
16x16 grid. Base fill: wall color.
- Horizontal mortar lines at y=4, y=8, y=12 (1px, lighter than wall)
- Vertical mortar offsets every 4px (brick pattern)
- Top-left illumination: lighten wall color by 15 for top 2 rows
- Bottom-right shadow: darken wall color by 20 for bottom 2 rows
- 1px depth border standard
```

### Interior Floor Tile Pattern

```
16x16 grid. Base fill: floor_mid.
- Subtle checkerboard: alternating floor_light and floor_mid in 2x2 blocks
- Or wood plank pattern: vertical lines every 4px using floor_dark
- Minimal detail — floors should be visually quiet to not compete with characters
- Seamless tiling mandatory
```
