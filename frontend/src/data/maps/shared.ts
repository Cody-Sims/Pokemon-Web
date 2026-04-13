import { Direction } from '@utils/type-helpers';

// ─── Tile type constants ───
export const Tile = {
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
} as const;

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
};

// Solid tiles that block movement
export const SOLID_TILES = new Set<number>([
  Tile.TREE, Tile.WATER, Tile.HOUSE_WALL, Tile.HOUSE_ROOF, Tile.FENCE,
  Tile.SIGN, Tile.LAB_WALL, Tile.LAB_ROOF,
  Tile.CENTER_WALL, Tile.CENTER_ROOF,
  Tile.MART_WALL, Tile.MART_ROOF,
  Tile.GYM_WALL, Tile.GYM_ROOF,
  Tile.DENSE_TREE,
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
  interactionType?: 'heal' | 'shop' | 'starter-select';
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
};

export function parseMap(rows: string[]): number[][] {
  return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? Tile.GRASS));
}
