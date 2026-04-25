---
description: Map generation workflow, tooling, and rules for creating or editing game maps
applyTo: 'frontend/src/data/maps/**'
---

# Map Generation Instructions

## Overview

This project has a comprehensive map generation toolchain at `temp/scripts/map-gen/`. Use these tools instead of hand-authoring character grids whenever possible.

## Available Commands

```bash
npm run map:validate                              # Validate all maps
npm run map:validate -- --map route-1             # Validate one map
npm run map:preview -- --map route-1              # Render PPM preview
npm run map:preview-all                           # Render all map previews
npm run map:gen dungeon -- --width 31 --height 25 --seed 42 --biome cave
npm run map:gen cave -- --width 40 --height 30 --seed 42
npm run map:gen route -- --width 25 --height 30 --seed 42
npm run map:gen maze -- --width 21 --height 21 --seed 42
npm run map:compose temp/my-town.json             # Compose from template descriptor
```

## Mandatory Workflow

### Creating New Maps

1. Choose the right approach:
   - **Cities/Towns**: Use the template composer (`map:compose`) with a JSON descriptor
   - **Dungeons/Caves**: Use BSP dungeon or cellular cave generator
   - **Routes**: Use the route carver generator
   - **Interiors**: Use interior templates from `temp/map-templates/interiors/`

2. Generate the base map with a seed for reproducibility
3. Run `npm run map:validate` immediately
4. Run `npm run map:preview` to visually inspect
5. Add warps, NPCs, trainers, and spawn points
6. Re-validate and preview

### Editing Existing Maps

1. Read the current map file
2. Run preview to understand current layout
3. Make targeted edits — **never rewrite entire grids from scratch**
4. Validate after every edit
5. Preview to confirm visual result

## Character Grid Rules

When manual character-grid editing is unavoidable:

1. **Count Unicode characters, not bytes** — use `[...row].length`
2. **Verify every row width** matches the declared `width`
3. **Use templates** for buildings — paste pre-validated footprints
4. **Never generate more than 5 rows at a time** without verifying alignment
5. **Prefer ASCII characters** — Unicode chars are error-prone

## Template Library

Building templates in `temp/map-templates/`:

| Template | Dimensions | Use |
|---|---|---|
| `buildings/pokecenter-3x4` | 3×4 | PokéCenter exterior |
| `buildings/pokemart-3x3` | 3×3 | PokéMart exterior |
| `buildings/gym-4x4` | 4×4 | Gym exterior |
| `buildings/house-small-2x2` | 2×2 | Small house |
| `buildings/house-large-3x3` | 3×3 | Large house |
| `buildings/lab-5x3` | 5×3 | Professor's Lab |
| `terrain/lake-5x3` | 5×3 | Lake with shore |
| `terrain/pond-2x2` | 2×2 | Small pond |
| `terrain/tree-cluster-3x3` | 3×3 | Dense tree cluster |
| `terrain/grass-patch-3x3` | 3×3 | Tall grass encounter area |
| `interiors/pokecenter-interior` | 9×7 | Standard PokéCenter |
| `interiors/pokemart-interior` | 7×6 | Standard PokéMart |
| `interiors/generic-room-small` | 7×5 | Small NPC room |
| `interiors/generic-room-large` | 9×7 | Large NPC room |

## CHAR_TO_TILE Quick Reference

### ASCII (preferred)

```
.  GRASS          P  PATH           G  TALL_GRASS
T  TREE           W  WATER          H  HOUSE_WALL
R  HOUSE_ROOF     D  HOUSE_DOOR     F  FENCE
f  FLOWER         S  SIGN           L  LAB_WALL
B  LAB_ROOF       E  LAB_DOOR       J  LEDGE
c  CENTER_WALL    C  CENTER_ROOF    e  CENTER_DOOR
m  MART_WALL      M  MART_ROOF      n  MART_DOOR
g  GYM_WALL       A  GYM_ROOF       a  GYM_DOOR
X  DENSE_TREE     _  FLOOR          #  INDOOR_WALL
k  COUNTER        t  TABLE          b  BOOKSHELF
r  RUG            v  MAT            p  PC_TILE
h  HEAL_MACHINE   w  WINDOW         i  CHAIR
o  POKEBALL_ITEM  y  GYM_FLOOR      z  GYM_STATUE
V  TV             Z  BED            N  PLANT
U  STAIRS         O  CENTER_FLOOR   K  PINK_COUNTER
I  MART_FLOOR     Y  MART_SHELF     l  LAB_FLOOR
x  LAB_MACHINE    d  DISPLAY_CASE   j  FOSSIL
u  ROCK_FLOOR     q  BOULDER        Q  ARENA_MARK
s  SAND           ~  ROCK           %  BUSH
^  CLIFF_FACE     ,  CAVE_FLOOR     ;  CAVE_WALL
&  HOUSE_WINDOW   @  LAB_WINDOW     $  CENTER_WINDOW
1  PINE_TREE      2  AUTUMN_TREE    3  PALM_TREE
4  DARK_GRASS     5  LIGHT_GRASS
```

### Biome-Specific (Unicode)

```
6  TIDE_POOL      7  WET_SAND       8  DOCK_PLANK     9  CORAL_BLOCK
Ø  LAVA_ROCK      µ  MAGMA_CRACK    Þ  VOLCANIC_WALL
=  MINE_TRACK     |  MINE_SUPPORT
†  GRAVE_MARKER   ‡  CRACKED_FLOOR  ®  RUIN_WALL      ©  RUIN_PILLAR
°  MIST           Ð  DRAGON_SCALE   ð  DRAGON_STATUE  Æ  FORTRESS_WALL
«  ASH_GROUND     »  EMBER_VENT     ±  HOT_SPRING
Ŧ  SYNTH_FLOOR    Ħ  SYNTH_WALL     Đ  SYNTH_DOOR
÷  AETHER_CRYSTAL ×  LEAGUE_FLOOR   Ł  LEAGUE_WALL    Ý  CHAMPION_THRONE
```

## Biome Substitution

Author maps in the standard biome (ASCII chars), then convert:

```bash
# The CLI applies biome substitution automatically
npx tsx temp/scripts/map-gen/cli.ts dungeon --width 31 --height 25 --biome volcanic
```

Available biomes: `standard`, `volcanic`, `coastal`, `forest`, `ghost`, `dragon`, `mine`, `electric`, `synthesis`, `cave`

## Procedural Generator Parameters

### BSP Dungeon (for dungeons, underground areas)
- `--width` / `--height`: Must be odd numbers
- `--seed`: Deterministic seed
- `--biome`: cave, mine, ghost, dragon, etc.

### Cellular Cave (for natural caves, organic shapes)
- `--width` / `--height`: Any size ≥ 10
- `--seed`: Deterministic seed
- `--biome`: cave, volcanic, forest, etc.

### Route (for overworld paths between cities)
- `--width` / `--height`: Typical 20-30 × 25-40
- `--seed`: Deterministic seed
- Automatically places border, path, grass patches, decorations

### Maze (for puzzle areas, labyrinthine sections)
- `--width` / `--height`: Must be odd numbers
- `--seed`: Deterministic seed
- `--biome`: cave, ghost, electric, etc.

## MapDefinition Required Fields

Every map must have:
```typescript
{
  key: string;             // Unique map key
  width: number;           // Grid width
  height: number;          // Grid height
  ground: number[][];      // From parseMap(charGrid)
  encounterTableKey: string; // '' for no encounters
  npcs: NpcSpawn[];
  trainers: TrainerSpawn[];
  warps: WarpDefinition[];
  spawnPoints: Record<string, SpawnPoint>;
}
```
