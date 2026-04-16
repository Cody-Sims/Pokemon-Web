import { Direction } from '@utils/type-helpers';
import { NPCBehaviorConfig } from '@systems/NPCBehavior';

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

/**
 * Tiles that are "overlay" objects — they should have a base ground tile drawn
 * underneath them for proper layering.  Maps to the base tile type to render below.
 */
export const OVERLAY_BASE: Partial<Record<number, number>> = {
  // Overworld: overlay on grass
  [Tile.TREE]:          Tile.GRASS,
  [Tile.TALL_GRASS]:    Tile.GRASS,
  [Tile.FLOWER]:        Tile.GRASS,
  [Tile.SIGN]:          Tile.GRASS,
  [Tile.FENCE]:         Tile.GRASS,
  [Tile.LEDGE]:         Tile.GRASS,
  [Tile.LEDGE_LEFT]:    Tile.GRASS,
  [Tile.LEDGE_RIGHT]:   Tile.GRASS,
  [Tile.DENSE_TREE]:    Tile.GRASS,
  // Doors overlay on their wall type
  [Tile.HOUSE_DOOR]:    Tile.HOUSE_WALL,
  [Tile.LAB_DOOR]:      Tile.LAB_WALL,
  [Tile.CENTER_DOOR]:   Tile.CENTER_WALL,
  [Tile.MART_DOOR]:     Tile.MART_WALL,
  [Tile.GYM_DOOR]:      Tile.GYM_WALL,
  // Interior: overlay on floor
  [Tile.TABLE]:         Tile.FLOOR,
  [Tile.CHAIR]:         Tile.FLOOR,
  [Tile.POKEBALL_ITEM]: Tile.FLOOR,
  [Tile.RUG]:           Tile.FLOOR,
  [Tile.MAT]:           Tile.FLOOR,
  [Tile.PC_TILE]:       Tile.FLOOR,
  [Tile.HEAL_MACHINE]:  Tile.FLOOR,
  [Tile.GYM_STATUE]:    Tile.FLOOR,
  [Tile.BOOKSHELF]:     Tile.FLOOR,
  [Tile.COUNTER]:       Tile.FLOOR,
  [Tile.WINDOW]:        Tile.INDOOR_WALL,
  // New overlay tiles
  [Tile.TV]:            Tile.FLOOR,
  [Tile.BED]:           Tile.FLOOR,
  [Tile.PLANT]:         Tile.FLOOR,
  [Tile.STAIRS]:        Tile.FLOOR,
  [Tile.PINK_COUNTER]:  Tile.CENTER_FLOOR,
  [Tile.MART_SHELF]:    Tile.MART_FLOOR,
  [Tile.LAB_MACHINE]:   Tile.LAB_FLOOR,
  [Tile.DISPLAY_CASE]:  Tile.FLOOR,
  [Tile.FOSSIL]:        Tile.FLOOR,
  [Tile.BOULDER]:       Tile.ROCK_FLOOR,
  [Tile.ARENA_MARK]:    Tile.ROCK_FLOOR,
  [Tile.ROCK]:          Tile.GRASS,
  [Tile.BUSH]:          Tile.GRASS,
  // Exterior windows overlay on their wall type
  [Tile.HOUSE_WINDOW]:  Tile.HOUSE_WALL,
  [Tile.LAB_WINDOW]:    Tile.LAB_WALL,
  [Tile.CENTER_WINDOW]: Tile.CENTER_WALL,
  // Biome trees overlay on grass
  [Tile.PINE_TREE]:     Tile.GRASS,
  [Tile.AUTUMN_TREE]:   Tile.GRASS,
  [Tile.PALM_TREE]:     Tile.SAND,
  // Phase 4.5 overlays
  [Tile.VINE]:            Tile.DARK_GRASS,
  [Tile.MIST]:            Tile.CRACKED_FLOOR,
  [Tile.MINE_TRACK]:      Tile.CAVE_FLOOR,
  [Tile.CONDUIT]:         Tile.METAL_FLOOR,
  [Tile.WIRE_FLOOR]:      Tile.METAL_FLOOR,
  [Tile.TIDE_POOL]:       Tile.WET_SAND,
  [Tile.GRAVE_MARKER]:    Tile.CRACKED_FLOOR,
  [Tile.DRAGON_STATUE]:   Tile.DRAGON_SCALE_FLOOR,
  [Tile.EMBER_VENT]:      Tile.ASH_GROUND,
  [Tile.HOT_SPRING]:      Tile.ASH_GROUND,
  [Tile.CONTAINMENT_POD]: Tile.SYNTHESIS_FLOOR,
  [Tile.AETHER_CONDUIT]:  Tile.SYNTHESIS_FLOOR,
  [Tile.TERMINAL]:        Tile.SYNTHESIS_FLOOR,
  [Tile.SYNTHESIS_DOOR]:  Tile.SYNTHESIS_WALL,
  [Tile.AETHER_CRYSTAL]:  Tile.SHATTERED_GROUND,
  [Tile.CHAMPION_THRONE]: Tile.LEAGUE_FLOOR,
  [Tile.BERRY_TREE]:      Tile.LIGHT_GRASS,
  // Field ability targets overlay on grass
  [Tile.CUT_TREE]:          Tile.GRASS,
  [Tile.CRACKED_ROCK]:      Tile.GRASS,
  [Tile.STRENGTH_BOULDER]:  Tile.GRASS,
};

/**
 * Overlay tiles that render ABOVE the player (foreground layer).
 * The player walks "under" these — e.g., tall grass blades cover feet.
 */
export const FOREGROUND_TILES = new Set<number>([
  Tile.TALL_GRASS,
  Tile.TREE,
  Tile.DENSE_TREE,
  Tile.PINE_TREE,
  Tile.AUTUMN_TREE,
  Tile.PALM_TREE,
  Tile.VINE,
  Tile.BERRY_TREE,
  Tile.MIST,
  Tile.CUT_TREE,
]);

// Colors for each tile type
export const TILE_COLORS: Record<number, number> = {
  [Tile.GRASS]:      0x5a9e3e,
  [Tile.PATH]:       0xc4a45a,
  [Tile.TALL_GRASS]: 0x3d7a28,
  [Tile.TREE]:       0x2d5a1e,
  [Tile.WATER]:      0x3a7ecf,
  [Tile.HOUSE_WALL]: 0xd4c4a0,
  [Tile.HOUSE_ROOF]: 0xb04040,
  [Tile.HOUSE_DOOR]: 0x6b4226,
  [Tile.FENCE]:      0x8b7355,
  [Tile.FLOWER]:     0xe8c040,
  [Tile.SIGN]:       0x8b6914,
  [Tile.LAB_WALL]:   0xc8c8c8,
  [Tile.LAB_ROOF]:   0x7070a0,
  [Tile.LAB_DOOR]:   0x5a4a3a,
  [Tile.LEDGE]:      0x4a8a3a,
  [Tile.LEDGE_LEFT]: 0x4a8a3a,
  [Tile.LEDGE_RIGHT]:0x4a8a3a,
  [Tile.CENTER_WALL]: 0xf0a0a0,
  [Tile.CENTER_ROOF]: 0xe04040,
  [Tile.CENTER_DOOR]: 0xd08060,
  [Tile.MART_WALL]:   0xa0c0e0,
  [Tile.MART_ROOF]:   0x4080c0,
  [Tile.MART_DOOR]:   0x6090b0,
  [Tile.GYM_WALL]:    0xd0b080,
  [Tile.GYM_ROOF]:    0x808080,
  [Tile.GYM_DOOR]:    0xa09070,
  [Tile.DENSE_TREE]:  0x1a4010,
  // Interior colors
  [Tile.FLOOR]:         0xd4b896,
  [Tile.INDOOR_WALL]:   0xe8dcc8,
  [Tile.COUNTER]:       0x8b6914,
  [Tile.TABLE]:         0x9e7c4a,
  [Tile.BOOKSHELF]:     0x6b4226,
  [Tile.RUG]:           0xc04040,
  [Tile.MAT]:           0x80a060,
  [Tile.PC_TILE]:       0x4060a0,
  [Tile.HEAL_MACHINE]:  0xe06060,
  [Tile.WINDOW]:        0x90c8e0,
  [Tile.CHAIR]:         0x8b6914,
  [Tile.POKEBALL_ITEM]: 0xd4b896,
  [Tile.GYM_FLOOR]:     0xc8b898,
  [Tile.GYM_STATUE]:    0x909090,
  // New tiles
  [Tile.TV]:            0x303040,
  [Tile.BED]:           0xe8e0d0,
  [Tile.PLANT]:         0x40a040,
  [Tile.STAIRS]:        0x9e7c4a,
  [Tile.CENTER_FLOOR]:  0xf0d8d8,
  [Tile.PINK_COUNTER]:  0xe08080,
  [Tile.MART_FLOOR]:    0xd0e0f0,
  [Tile.MART_SHELF]:    0x6a9ac0,
  [Tile.LAB_FLOOR]:     0xe8e8f0,
  [Tile.LAB_MACHINE]:   0x808898,
  [Tile.DISPLAY_CASE]:  0x90b0c8,
  [Tile.FOSSIL]:        0xb0a088,
  [Tile.ROCK_FLOOR]:    0xb8a888,
  [Tile.BOULDER]:       0x908070,
  [Tile.ARENA_MARK]:    0xd0c0a0,
  [Tile.SAND]:          0xe8d8a0,
  [Tile.ROCK]:          0x808070,
  [Tile.BUSH]:          0x3a8a30,
  [Tile.CLIFF_FACE]:    0x706050,
  [Tile.CAVE_FLOOR]:    0x605848,
  [Tile.CAVE_WALL]:     0x484038,
  // Exterior windows
  [Tile.HOUSE_WINDOW]:  0x90c8e0,
  [Tile.LAB_WINDOW]:    0x90c8e0,
  [Tile.CENTER_WINDOW]: 0x90c8e0,
  // Biome variants
  [Tile.PINE_TREE]:     0x1a5020,
  [Tile.AUTUMN_TREE]:   0xc06820,
  [Tile.PALM_TREE]:     0x40a040,
  [Tile.DARK_GRASS]:    0x3a7a28,
  [Tile.LIGHT_GRASS]:   0x70b848,
  // Phase 4.5 colors
  [Tile.TIDE_POOL]:       0x5098c0,
  [Tile.WET_SAND]:        0xc8b878,
  [Tile.DOCK_PLANK]:      0x9e7c4a,
  [Tile.CORAL_BLOCK]:     0xd08888,
  [Tile.LAVA_ROCK]:       0x484040,
  [Tile.MAGMA_CRACK]:     0xe06020,
  [Tile.VOLCANIC_WALL]:   0x504840,
  [Tile.MINE_TRACK]:      0x706858,
  [Tile.MINE_SUPPORT]:    0x8b6914,
  [Tile.METAL_FLOOR]:     0xa0a0a8,
  [Tile.METAL_WALL]:      0x707078,
  [Tile.PIPE]:            0x808890,
  [Tile.GEAR]:            0x909098,
  [Tile.VINE]:            0x40a030,
  [Tile.MOSS_STONE]:      0x608850,
  [Tile.GIANT_ROOT]:      0x6b4226,
  [Tile.BERRY_TREE]:      0xc04060,
  [Tile.CONDUIT]:         0x40e0d0,
  [Tile.ELECTRIC_PANEL]:  0x606880,
  [Tile.WIRE_FLOOR]:      0x909098,
  [Tile.GRAVE_MARKER]:    0x808088,
  [Tile.CRACKED_FLOOR]:   0x989088,
  [Tile.RUIN_WALL]:       0x908878,
  [Tile.RUIN_PILLAR]:     0xa09880,
  [Tile.MIST]:            0xc0c8d0,
  [Tile.DRAGON_SCALE_FLOOR]: 0x607898,
  [Tile.DRAGON_STATUE]:   0x506878,
  [Tile.FORTRESS_WALL]:   0x585860,
  [Tile.ASH_GROUND]:      0xa0a098,
  [Tile.EMBER_VENT]:      0xc04020,
  [Tile.HOT_SPRING]:      0x60b0c0,
  [Tile.SYNTHESIS_FLOOR]: 0xe0e8e8,
  [Tile.SYNTHESIS_WALL]:  0x60b0b0,
  [Tile.SYNTHESIS_DOOR]:  0x80c0c0,
  [Tile.CONTAINMENT_POD]: 0x40a0a0,
  [Tile.AETHER_CONDUIT]:  0x30e0c0,
  [Tile.TERMINAL]:        0x405060,
  [Tile.SHATTERED_GROUND]:0x807060,
  [Tile.AETHER_CRYSTAL]:  0x60e0d0,
  [Tile.LEAGUE_FLOOR]:    0xd0c8b8,
  [Tile.LEAGUE_WALL]:     0xb0a890,
  [Tile.CHAMPION_THRONE]: 0xc0a040,
  // Field ability target tiles
  [Tile.CUT_TREE]:          0x4a8a30,
  [Tile.CRACKED_ROCK]:      0x908070,
  [Tile.STRENGTH_BOULDER]:  0x808068,
};

// Solid tiles that block movement
export const SOLID_TILES = new Set<number>([
  Tile.TREE, Tile.WATER, Tile.HOUSE_WALL, Tile.HOUSE_ROOF, Tile.FENCE,
  Tile.SIGN, Tile.LAB_WALL, Tile.LAB_ROOF,
  Tile.CENTER_WALL, Tile.CENTER_ROOF,
  Tile.MART_WALL, Tile.MART_ROOF,
  Tile.GYM_WALL, Tile.GYM_ROOF,
  Tile.DENSE_TREE,
  // Interior solid tiles
  Tile.INDOOR_WALL, Tile.COUNTER, Tile.TABLE, Tile.BOOKSHELF,
  Tile.PC_TILE, Tile.HEAL_MACHINE, Tile.WINDOW, Tile.GYM_STATUE,
  Tile.CHAIR, Tile.PLANT, Tile.POKEBALL_ITEM,
  // New solid tiles
  Tile.TV, Tile.BED, Tile.STAIRS, Tile.PINK_COUNTER, Tile.MART_SHELF,
  Tile.LAB_MACHINE, Tile.DISPLAY_CASE, Tile.FOSSIL, Tile.BOULDER,
  Tile.ROCK, Tile.BUSH, Tile.CLIFF_FACE, Tile.CAVE_WALL,
  // Exterior windows + biome trees
  Tile.HOUSE_WINDOW, Tile.LAB_WINDOW, Tile.CENTER_WINDOW,
  Tile.PINE_TREE, Tile.AUTUMN_TREE, Tile.PALM_TREE,
  // Phase 4.5 solid tiles
  Tile.CORAL_BLOCK, Tile.MAGMA_CRACK, Tile.VOLCANIC_WALL,
  Tile.MINE_SUPPORT, Tile.METAL_WALL, Tile.PIPE, Tile.GEAR,
  Tile.MOSS_STONE, Tile.GIANT_ROOT, Tile.BERRY_TREE,
  Tile.ELECTRIC_PANEL,
  Tile.GRAVE_MARKER, Tile.RUIN_WALL, Tile.RUIN_PILLAR,
  Tile.DRAGON_STATUE, Tile.FORTRESS_WALL,
  Tile.EMBER_VENT, Tile.HOT_SPRING,
  Tile.SYNTHESIS_WALL, Tile.CONTAINMENT_POD, Tile.AETHER_CONDUIT, Tile.TERMINAL,
  Tile.AETHER_CRYSTAL, Tile.LEAGUE_WALL, Tile.CHAMPION_THRONE,
  // Field ability targets
  Tile.CUT_TREE, Tile.CRACKED_ROCK, Tile.STRENGTH_BOULDER,
]);

// ─── Map definition types ───

export interface NpcSpawn {
  id: string;
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  dialogue: string[];
  /** If set, NPC only appears when this flag is true (or false if prefixed with '!'). */
  requireFlag?: string;
  /** Alternative dialogue when a given flag is set. */
  flagDialogue?: { flag: string; dialogue: string[]; setFlag?: string }[];
  /** On interaction, set this flag to true. */
  setsFlag?: string;
  /** On first interaction, give this item to the player (requires setsFlag to gate). */
  givesItem?: string;
  /** Special interaction type instead of plain dialogue. */
  interactionType?: 'heal' | 'shop' | 'pc' | 'starter-select' | 'name-rater' | 'move-tutor' | 'tag-battle' | 'show-pokemon' | 'wild-encounter';
  /** Extra data for the interaction (e.g. tutorId for move-tutor). */
  interactionData?: string;
  /** Idle behavior config (look-around, wander, pace). */
  behavior?: NPCBehaviorConfig;
  /** If set, play this cutscene (by key) when the player interacts instead of normal dialogue. */
  triggerCutscene?: string;
}

export interface TrainerSpawn {
  id: string;          // NPC id
  trainerId: string;   // Key into trainerData
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  lineOfSight: number;
  /** Game flag that must be set for this trainer to appear. */
  condition?: string;
}

export interface WarpDefinition {
  tileX: number;
  tileY: number;
  targetMap: string;
  targetSpawnId: string;
}

export interface SpawnPoint {
  x: number;
  y: number;
  direction: Direction;
}

export interface MapDefinition {
  key: string;
  width: number;
  height: number;
  ground: number[][];
  encounterTableKey: string;
  npcs: NpcSpawn[];
  trainers: TrainerSpawn[];
  warps: WarpDefinition[];
  spawnPoints: Record<string, SpawnPoint>;
  /** If true, this is an interior map (smaller camera, no encounters). */
  isInterior?: boolean;
  /** Displayed when entering the map (e.g., "Oak's Laboratory"). */
  displayName?: string;
  /** Battle background key for encounters on this map. Falls back to procedural if not set. */
  battleBg?: string;
  /** If true, this map has cave darkness requiring Flash to navigate. */
  isDark?: boolean;
  /** Static light source positions (torches, lamps). */
  lightSources?: Array<{ tileX: number; tileY: number; radius?: number; color?: number }>;
  /** Overworld weather effect to render on this map. Defaults to 'none'. */
  weather?: import('@systems/WeatherRenderer').OverworldWeather;
  /** Ambient sound effect type for this map. Defaults to 'none'. */
  ambientSfx?: import('@systems/AmbientSFX').AmbientType;
}

// ─── Helper: parse string map into number grid ───
const CHAR_TO_TILE: Record<string, number> = {
  '.': Tile.GRASS,
  'P': Tile.PATH,
  'G': Tile.TALL_GRASS,
  'T': Tile.TREE,
  'W': Tile.WATER,
  'H': Tile.HOUSE_WALL,
  'R': Tile.HOUSE_ROOF,
  'D': Tile.HOUSE_DOOR,
  'F': Tile.FENCE,
  'f': Tile.FLOWER,
  'S': Tile.SIGN,
  'L': Tile.LAB_WALL,
  'B': Tile.LAB_ROOF,
  'E': Tile.LAB_DOOR,
  'J': Tile.LEDGE,
  'c': Tile.CENTER_WALL,
  'C': Tile.CENTER_ROOF,
  'e': Tile.CENTER_DOOR,
  'm': Tile.MART_WALL,
  'M': Tile.MART_ROOF,
  'n': Tile.MART_DOOR,
  'g': Tile.GYM_WALL,
  'A': Tile.GYM_ROOF,
  'a': Tile.GYM_DOOR,
  'X': Tile.DENSE_TREE,
  // Interior tiles
  '_': Tile.FLOOR,
  '#': Tile.INDOOR_WALL,
  'k': Tile.COUNTER,
  't': Tile.TABLE,
  'b': Tile.BOOKSHELF,
  'r': Tile.RUG,
  'v': Tile.MAT,
  'p': Tile.PC_TILE,
  'h': Tile.HEAL_MACHINE,
  'w': Tile.WINDOW,
  'i': Tile.CHAIR,
  'o': Tile.POKEBALL_ITEM,
  'y': Tile.GYM_FLOOR,
  'z': Tile.GYM_STATUE,
  // New tiles
  'V': Tile.TV,
  'Z': Tile.BED,
  'N': Tile.PLANT,
  'U': Tile.STAIRS,
  'O': Tile.CENTER_FLOOR,
  'K': Tile.PINK_COUNTER,
  'I': Tile.MART_FLOOR,
  'Y': Tile.MART_SHELF,
  'l': Tile.LAB_FLOOR,
  'x': Tile.LAB_MACHINE,
  'd': Tile.DISPLAY_CASE,
  'j': Tile.FOSSIL,
  'u': Tile.ROCK_FLOOR,
  'q': Tile.BOULDER,
  'Q': Tile.ARENA_MARK,
  's': Tile.SAND,
  '~': Tile.ROCK,
  '%': Tile.BUSH,
  '^': Tile.CLIFF_FACE,
  ',': Tile.CAVE_FLOOR,
  ';': Tile.CAVE_WALL,
  // Exterior windows (use & for house window to avoid W=WATER conflict)
  '&': Tile.HOUSE_WINDOW,
  '@': Tile.LAB_WINDOW,
  '$': Tile.CENTER_WINDOW,
  // Biome variants
  '1': Tile.PINE_TREE,
  '2': Tile.AUTUMN_TREE,
  '3': Tile.PALM_TREE,
  '4': Tile.DARK_GRASS,
  '5': Tile.LIGHT_GRASS,
  // Phase 4.5 chars
  '6': Tile.TIDE_POOL,
  '7': Tile.WET_SAND,
  '8': Tile.DOCK_PLANK,
  '9': Tile.CORAL_BLOCK,
  'Ø': Tile.LAVA_ROCK,
  'µ': Tile.MAGMA_CRACK,
  'Þ': Tile.VOLCANIC_WALL,
  '=': Tile.MINE_TRACK,
  '|': Tile.MINE_SUPPORT,
  'Ʃ': Tile.METAL_FLOOR,
  'Ɯ': Tile.METAL_WALL,
  'π': Tile.PIPE,
  'Ω': Tile.GEAR,
  '¡': Tile.VINE,
  '¢': Tile.MOSS_STONE,
  '£': Tile.GIANT_ROOT,
  '¤': Tile.BERRY_TREE,
  '¥': Tile.CONDUIT,
  '¦': Tile.ELECTRIC_PANEL,
  '§': Tile.WIRE_FLOOR,
  '†': Tile.GRAVE_MARKER,
  '‡': Tile.CRACKED_FLOOR,
  '®': Tile.RUIN_WALL,
  '©': Tile.RUIN_PILLAR,
  '°': Tile.MIST,
  'Ð': Tile.DRAGON_SCALE_FLOOR,
  'ð': Tile.DRAGON_STATUE,
  'Æ': Tile.FORTRESS_WALL,
  '«': Tile.ASH_GROUND,
  '»': Tile.EMBER_VENT,
  '±': Tile.HOT_SPRING,
  'Ŧ': Tile.SYNTHESIS_FLOOR,
  'Ħ': Tile.SYNTHESIS_WALL,
  'Đ': Tile.SYNTHESIS_DOOR,
  'Ŋ': Tile.CONTAINMENT_POD,
  'Ɖ': Tile.AETHER_CONDUIT,
  'ƫ': Tile.TERMINAL,
  '¬': Tile.SHATTERED_GROUND,
  '÷': Tile.AETHER_CRYSTAL,
  '×': Tile.LEAGUE_FLOOR,
  'Ł': Tile.LEAGUE_WALL,
  'Ý': Tile.CHAMPION_THRONE,
};

export function parseMap(rows: string[]): number[][] {
  return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? Tile.GRASS));
}
