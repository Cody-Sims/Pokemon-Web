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
} as const;

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
  [Tile.DENSE_TREE]:    Tile.GRASS,
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
};

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
  // New solid tiles
  Tile.TV, Tile.BED, Tile.STAIRS, Tile.PINK_COUNTER, Tile.MART_SHELF,
  Tile.LAB_MACHINE, Tile.DISPLAY_CASE, Tile.FOSSIL, Tile.BOULDER,
  Tile.ROCK, Tile.BUSH, Tile.CLIFF_FACE, Tile.CAVE_WALL,
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
  flagDialogue?: { flag: string; dialogue: string[] }[];
  /** On interaction, set this flag to true. */
  setsFlag?: string;
  /** Special interaction type instead of plain dialogue. */
  interactionType?: 'heal' | 'shop' | 'pc' | 'starter-select';
}

export interface TrainerSpawn {
  id: string;          // NPC id
  trainerId: string;   // Key into trainerData
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  lineOfSight: number;
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
};

export function parseMap(rows: string[]): number[][] {
  return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? Tile.GRASS));
}
