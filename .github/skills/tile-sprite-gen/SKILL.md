---
description: "Generate, validate, and maintain pixel art tiles and NPC/character sprites for the Pokemon Web game tileset. Use when creating new tiles, fixing tile quality, generating NPC sprites, or modifying the tileset."
---

# Tile & Sprite Generation Skill

## When to Use

- Creating new tile pixel art for the tileset
- Fixing tile quality issues (color count, lighting, tiling)
- Generating NPC or character sprite atlases
- Adding animation frames to existing tiles
- Running tile/sprite validation or catalog scripts

## Tileset Format

| Property | Value |
|---|---|
| File | `frontend/public/assets/tilesets/tileset.png` |
| Dimensions | 160x192 (10 cols x 12 rows) |
| Tile size | 16x16 pixels |
| Total frames | 120 (IDs 0-119) |
| Used frames | 0-118 (119 is spare) |
| Loaded by | `PreloadScene` as Phaser spritesheet `'tileset'` |
| Rendered by | `OverworldScene.drawMap()` — `this.add.image(px, py, 'tileset', tileId)` |

## Tile Quality Rules (MANDATORY)

Every tile MUST meet these criteria:

### Color Rules

1. **Minimum 4 unique colors** per tile (6+ preferred for terrain). Single-color fills are never acceptable.
2. **Palette harmony**: Use the biome palette for the tile's category. Do not invent new colors.
3. **Top-left lighting**: Lighter pixels toward top-left, darker toward bottom-right.
4. **1px depth border**: Bottom + right edges use darkened base color. Top + left edges use lightened base color.
5. **Dithering over gradients**: Use checkerboard patterns for transitions, never linear gradients.

### Structural Rules

6. **Seamless tiling**: Terrain tiles (grass, water, sand, floor) must tile seamlessly in all 4 directions.
7. **No isolated pixels**: Max 5 floating pixels that differ from all 4 cardinal neighbors.
8. **Consistent scale**: Tree trunks 3-4px wide, character heads 6px tall. Match existing proportions.

## Tile Generation Process

### Step 1: Use Python + Pillow

All tiles are generated with Python scripts using Pillow. Scripts go in `temp/scripts/tileset/`.

```python
from PIL import Image, ImageDraw

T = 16  # tile size
img = Image.new('RGBA', (T, T))
d = ImageDraw.Draw(img)

# 1. Fill base color from biome palette
d.rectangle([0, 0, 15, 15], fill=base_color)

# 2. Add texture detail (highlights + shadows)
# 3. Add depth border (ALWAYS)
def add_depth_border(d, base):
    dark = darken(base, 30)
    light = lighten(base, 15)
    d.line([(0, 15), (15, 15)], fill=dark)
    d.line([(15, 0), (15, 15)], fill=dark)
    d.line([(0, 0), (14, 0)], fill=light)
    d.line([(0, 0), (0, 14)], fill=light)
```

### Step 2: Place in Tileset

```python
def put_tile(tileset, idx, tile_img):
    col = idx % 10
    row = idx // 10
    tileset.paste(tile_img, (col * 16, row * 16))
```

### Step 3: Validate

Run after every tile change:
```bash
python3 temp/scripts/tileset/validate_tiles.py --tile <ID>
```

### Step 4: Add TILE_COLORS Entry

Every new Tile enum member MUST have a matching entry in `TILE_COLORS` in `tile-metadata.ts`. Tests will fail otherwise.

### Step 5: Update Catalog

```bash
python3 temp/scripts/tileset/tile_catalog.py
```

## Biome Palettes

Use ONLY these colors for the corresponding biome. Each tuple is (R, G, B, 255).

### Standard (grass, path, water)

| Name | RGB |
|---|---|
| grass_light | (88, 168, 56) |
| grass_mid | (72, 144, 48) |
| grass_dark | (56, 120, 40) |
| path_light | (216, 184, 128) |
| path_mid | (192, 160, 104) |
| path_dark | (168, 136, 88) |
| water_light | (96, 168, 224) |
| water_mid | (64, 128, 192) |
| water_dark | (40, 96, 160) |
| tree_canopy | (32, 104, 32) |
| tree_trunk | (128, 88, 48) |

### Volcanic

| Name | RGB |
|---|---|
| ash_light | (120, 112, 104) |
| ash_mid | (96, 88, 80) |
| rock_dark | (40, 32, 24) |
| lava_bright | (255, 160, 32) |
| lava_mid | (224, 96, 16) |
| ember_glow | (255, 200, 80) |
| magma_crack | (200, 64, 24) |

### Snow/Ice

| Name | RGB |
|---|---|
| snow_light | (240, 248, 255) |
| snow_mid | (208, 224, 240) |
| ice_light | (160, 220, 255) |
| ice_mid | (120, 180, 224) |
| pine_canopy | (24, 80, 48) |
| frost_accent | (200, 232, 255) |

### Dark/Ghost

| Name | RGB |
|---|---|
| shadow_light | (72, 64, 80) |
| shadow_mid | (48, 40, 56) |
| ghost_light | (160, 128, 200) |
| wisp_glow | (176, 224, 160) |
| grave_stone | (112, 104, 96) |
| moss | (64, 96, 48) |

## Sprite Format

### NPC Sprites

| Property | Value |
|---|---|
| PNG size | 64x51 |
| Frame size | 16x17 |
| Layout | Row-major: row 0 = down, row 1 = left/right, row 2 = up |
| Frames per dir | 4 (indices 0-3) |
| Total frames | 16 |
| Atlas format | Phaser JSON Atlas with frame names `walk-{dir}-{0-3}` |
| Location | `frontend/public/assets/sprites/npcs/{name}.png` + `.json` |

### Player Sprites

| Property | Value |
|---|---|
| PNG size | 64x51 |
| Frame size | 16x17 |
| Layout | Column-major: col 0 = down, col 1 = right, col 2 = up, col 3 = left |
| Frames per dir | 3 (indices 0-2) |
| Total frames | 12 |
| Atlas format | frame names `walk-{dir}-{0-2}` |
| Location | `frontend/public/assets/sprites/player/{name}.png` + `.json` |

### Character Palette Convention

- Max 8 colors per character (excluding transparency)
- 1px dark outline on silhouette (near-black, not pure black)
- Head = 6px tall, body = 8px, legs = 3px (total 17px with overlap)
- Skin: (240, 200, 168) light / (216, 172, 140) shadow

## Sprite Generation Process

### For palette-swap NPCs:
1. Pick base from existing 24 characters (12M + 12F)
2. Define color mapping
3. Run `temp/scripts/sprites/create_npc_atlases.py`

### For unique characters (gym leaders, Elite Four):
1. Define palette dict with: hair, hair_light, hair_dark, skin, skin_shadow, top, top_light, top_dark, pants, pants_dark, shoes, accent
2. Use `temp/scripts/sprites/create_gym_leaders.py` as template
3. Generate PNG + JSON atlas
4. Add to `npcSprites` array in PreloadScene
5. Update trainer data `spriteKey`

## Scripts Reference

| Script | Purpose |
|---|---|
| `temp/scripts/tileset/validate_tiles.py` | Quality validation (colors, lighting, borders, isolated pixels) |
| `temp/scripts/tileset/tile_catalog.py` | Generate visual tile catalog at 4x zoom |
| `temp/scripts/tileset/expand_tileset.py` | Expand tileset grid (add rows) |
| `temp/scripts/tileset/fix_worst_tiles.py` | Fix biome tiles 68-109 |
| `temp/scripts/tileset/fix_core_tiles.py` | Fix core tiles 0-67 |
| `temp/scripts/sprites/create_gym_leaders.py` | Generate unique character sprites |
| `temp/scripts/sprites/create_female_player.py` | Generate female player atlas |
| `temp/scripts/sprites/sprite_catalog.py` | Visual sprite catalog at 4x zoom |

## Animation System

Water and lava tiles use frame-swap animation in OverworldScene:
- Water: cycles through `Tile.WATER`, `Tile.WATER_FRAME_1` (115), `Tile.WATER_FRAME_2` (116) every 30 ticks
- Lava: cycles through `Tile.LAVA_ROCK`, `Tile.LAVA_FRAME_1` (117), `Tile.LAVA_FRAME_2` (118) every 30 ticks

To add new animated tiles:
1. Draw variant frames in spare tileset slots
2. Add Tile enum constants in `tiles.ts`
3. Add TILE_COLORS entries in `tile-metadata.ts`
4. Add frame cycle array in OverworldScene `animateTiles()` method

## Validation Checklist

Before committing any tile or sprite change:

- [ ] Run `python3 temp/scripts/tileset/validate_tiles.py --tile <ID>` — 0 FAIL
- [ ] New Tile enum entries have matching TILE_COLORS
- [ ] New sprites added to PreloadScene `npcSprites` array
- [ ] Trainer/NPC data updated with correct `spriteKey`
- [ ] `npm run test` passes (TILE_COLORS test catches missing entries)
- [ ] Update `docs/CHANGELOG.md`
