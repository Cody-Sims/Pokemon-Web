import { Direction } from '@utils/type-helpers';

// ─── Tile type constants ───
export const Tile = {
  // Overworld tiles
  GRASS:       0,
  PATH:        1,
  TALL_GRASS:  2,
  TREE:        3,
  WATER:       4,
  HOUSE_WALL:  5,
  HOUSE_ROOF:  6,
  HOUSE_DOOR:  7,
  FENCE:       8,
  FLOWER:      9,
  SIGN:       10,
  LAB_WALL:   11,
  LAB_ROOF:   12,
  LAB_DOOR:   13,
  LEDGE:      14,
  CENTER_WALL: 15,
  CENTER_ROOF: 16,
  CENTER_DOOR: 17,
  MART_WALL:   18,
  MART_ROOF:   19,
  MART_DOOR:   20,
  GYM_WALL:    21,
  GYM_ROOF:    22,
  GYM_DOOR:    23,
  DENSE_TREE:  24,
  // Interior tiles
  FLOOR:         25,
  INDOOR_WALL:   26,
  COUNTER:       27,
  TABLE:         28,
  BOOKSHELF:     29,
  RUG:           30,
  MAT:           31,
  PC_TILE:       32,
  HEAL_MACHINE:  33,
  WINDOW:        34,
  CHAIR:         35,
  POKEBALL_ITEM: 36,
  GYM_FLOOR:     37,
  GYM_STATUE:    38,

  // ── New tiles: Location-specific ──
  // House interior
  TV:            39,    // television/screen on stand
  BED:           40,    // bed (solid)
  PLANT:         41,    // potted plant decoration
  STAIRS:        42,    // staircase (solid)

  // PokéCenter interior
  CENTER_FLOOR:  43,    // pink/white tile floor (walkable)
  PINK_COUNTER:  44,    // PokéCenter service counter (solid)

  // PokéMart interior
  MART_FLOOR:    45,    // blue/white commercial tile floor (walkable)
  MART_SHELF:    46,    // merchandise shelf (solid)

  // Lab interior
  LAB_FLOOR:     47,    // white tile lab floor (walkable)
  LAB_MACHINE:   48,    // lab equipment/microscope (solid)

  // Museum
  DISPLAY_CASE:  49,    // glass display case (solid)
  FOSSIL:        50,    // fossil on pedestal (solid)

  // Gym (Pewter/Rock theme)
  ROCK_FLOOR:    51,    // rocky arena floor (walkable)
  BOULDER:       52,    // boulder obstacle (solid)
  ARENA_MARK:    53,    // battle arena floor marking (walkable)

  // Overworld extras
  SAND:          54,    // beach/desert sand (walkable)
  ROCK:          55,    // small rock obstacle (solid)
  BUSH:          56,    // short bush (solid)
  CLIFF_FACE:    57,    // cliff/mountain wall (solid)
  CAVE_FLOOR:    58,    // dark cave floor (walkable)
  CAVE_WALL:     59,    // cave wall (solid)

  // Exterior building details
  HOUSE_WINDOW:  60,    // window on house wall exterior (solid)
  LAB_WINDOW:    61,    // window on lab wall exterior (solid)
  CENTER_WINDOW: 62,    // window on PokéCenter wall (solid)

  // Biome tree/grass variants
  PINE_TREE:     63,    // evergreen/pine tree for forest biomes (solid)
  AUTUMN_TREE:   64,    // orange/red autumn tree (solid)
  PALM_TREE:     65,    // tropical palm tree for beach (solid)
  DARK_GRASS:    66,    // darker forest grass (walkable)
  LIGHT_GRASS:   67,    // light meadow grass (walkable)

  // ── Phase 4.5: Biome expansion tiles ──
  // Coastal
  TIDE_POOL:     68,    // shallow tidal pool (walkable, fishable)
  WET_SAND:      69,    // damp sand near water (walkable)
  DOCK_PLANK:    70,    // wooden dock/pier plank (walkable)
  CORAL_BLOCK:   71,    // coral-marked building wall (solid)
  // Volcanic
  LAVA_ROCK:     72,    // dark volcanic rock ground (walkable)
  MAGMA_CRACK:   73,    // glowing magma crack (solid)
  VOLCANIC_WALL: 74,    // basalt cliff wall (solid)
  // Mine/Dungeon
  MINE_TRACK:    75,    // minecart track on cave floor (walkable)
  MINE_SUPPORT:  76,    // wooden mine beam (solid)
  // Industrial
  METAL_FLOOR:   77,    // steel/iron plating floor (walkable)
  METAL_WALL:    78,    // riveted metal wall (solid)
  PIPE:          79,    // exposed pipe decoration (solid)
  GEAR:          80,    // decorative/puzzle gear on wall (solid)
  // Forest
  VINE:          81,    // hanging vine (walkable overlay)
  MOSS_STONE:    82,    // mossy stone block (solid)
  GIANT_ROOT:    83,    // large tree root (solid)
  BERRY_TREE:    84,    // berry-bearing tree (solid, interactable)
  // Electric/Tech
  CONDUIT:       85,    // aether energy conduit on floor (walkable)
  ELECTRIC_PANEL:86,    // control panel (solid, interactable)
  WIRE_FLOOR:    87,    // floor with cable runs (walkable)
  // Ghost/Ruin
  GRAVE_MARKER:  88,    // tombstone (solid)
  CRACKED_FLOOR: 89,    // broken stone floor (walkable)
  RUIN_WALL:     90,    // ancient crumbling wall (solid)
  RUIN_PILLAR:   91,    // stone column (solid)
  MIST:          92,    // low fog overlay (walkable)
  // Dragon
  DRAGON_SCALE_FLOOR: 93, // ornate scale-pattern stone (walkable)
  DRAGON_STATUE: 94,    // dragon statue decoration (solid)
  FORTRESS_WALL: 95,    // ancient fortress masonry (solid)
  // Volcanic/Fire
  ASH_GROUND:    96,    // ashy gray soil (walkable)
  EMBER_VENT:    97,    // steam/ember vent (solid)
  HOT_SPRING:    98,    // hot spring pool (solid, heal)
  // Synthesis Collective HQ
  SYNTHESIS_FLOOR: 99,  // clean white lab tile (walkable)
  SYNTHESIS_WALL: 100,  // teal-white paneled wall (solid)
  SYNTHESIS_DOOR: 101,  // sliding lab door (walkable warp)
  CONTAINMENT_POD:102,  // pokémon containment unit (solid)
  AETHER_CONDUIT: 103,  // glowing aether pipe (solid)
  TERMINAL:      104,   // data terminal (solid, interactable)
  // Post-game
  SHATTERED_GROUND:105, // fractured earth (walkable)
  AETHER_CRYSTAL: 106,  // exposed crystal formation (solid)
  // Pokémon League
  LEAGUE_FLOOR:  107,   // grand marble floor (walkable)
  LEAGUE_WALL:   108,   // ornate marble wall (solid)
  CHAMPION_THRONE:109,  // champion's throne (solid)

  // ── Field ability target tiles ──
  CUT_TREE:        110,  // small cuttable tree (solid, cuttable)
  CRACKED_ROCK:    111,  // smashable rock (solid, Rock Smash target)
  STRENGTH_BOULDER:112,  // pushable boulder (solid, Strength target)
  LEDGE_LEFT:      113,  // one-way ledge: can only enter from right (moving left)
  LEDGE_RIGHT:     114,  // one-way ledge: can only enter from left (moving right)
} as const;

/**
 * One-way ledge tiles: the direction from which you can step ONTO the tile.
 * e.g. LEDGE = can only be entered while moving 'down'.
 */
export const LEDGE_TILES: Partial<Record<number, Direction>> = {
  [Tile.LEDGE]:       'down',
  [Tile.LEDGE_LEFT]:  'left',
  [Tile.LEDGE_RIGHT]: 'right',
};
