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
};

// Solid tiles that block movement
export const SOLID_TILES = new Set<number>([
  Tile.TREE, Tile.WATER, Tile.HOUSE_WALL, Tile.HOUSE_ROOF, Tile.FENCE,
  Tile.SIGN, Tile.LAB_WALL, Tile.LAB_ROOF,
]);

// ─── Map definition types ───

export interface NpcSpawn {
  id: string;
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  dialogue: string[];
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
};

function parseMap(rows: string[]): number[][] {
  return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? Tile.GRASS));
}

// ─────────────────────────────────────────────
// PALLET TOWN  (25 wide × 20 tall)
// ─────────────────────────────────────────────
const palletGround = parseMap([
  // 0         1         2
  // 0123456789012345678901234
  'TTTTTTTTTTTTTPTTTTTTTTTTTT', // 0  - top border, north exit
  'T...........PP...........T', // 1
  'T..RRRRR....PP....RRRRR..T', // 2  - roofs
  'T..HHHHH....PP....HHHHH..T', // 3  - walls
  'T..HHDHH....PP....HHDHH..T', // 4  - doors
  'T...PP......PP......PP...T', // 5  - paths to doors
  'T...PP..PPPPPPPPPPP.PP...T', // 6  - main horizontal path
  'T...........PP...........T', // 7
  'T..f........PP........f..T', // 8
  'T...........PP...........T', // 9
  'T.....BBBBBBBBBBBBB.....T', // 10 - Oak's Lab roof
  'T.....LLLLLLLLLLLLL.....T', // 11 - Lab walls
  'T.....LLLLLELLLLLL......T', // 12 - Lab door
  'T.........PPPP...........T', // 13
  'T.........PPPP...........T', // 14
  'T..GG.....PPPP.....GG...T', // 15
  'T..GG.....PPPP.....GG...T', // 16
  'T..GG..f..PPPP..f..GG...T', // 17
  'T.........PPPP...........T', // 18
  'TTTTTTTTTTTTTTTTTTTTTTTTT', // 19 - bottom border
]);

const palletTown: MapDefinition = {
  key: 'pallet-town',
  width: 25,
  height: 20,
  ground: palletGround,
  encounterTableKey: '',  // no wild encounters in town
  npcs: [
    {
      id: 'pallet-npc-1',
      tileX: 7,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Welcome to Pallet Town!',
        'The breeze from the sea is wonderful here.',
      ],
    },
    {
      id: 'pallet-npc-2',
      tileX: 18,
      tileY: 9,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'Prof. Oak\'s Lab is that big building in the south.',
        'He studies Pokémon for a living!',
      ],
    },
    {
      id: 'pallet-npc-mom',
      tileX: 4,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Be safe on your adventure, dear!',
        'Come home if your Pokémon need rest!',
      ],
    },
    {
      id: 'pallet-sign-lab',
      tileX: 10,
      tileY: 13,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['OAK POKÉMON RESEARCH LAB'],
    },
  ],
  trainers: [],
  warps: [
    // North exit → Route 1
    { tileX: 12, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 13, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 14, direction: 'up' },
    'from-route-1': { x: 12, y: 1, direction: 'down' },
    'player-house': { x: 5, y: 5, direction: 'down' },
  },
};

// ─────────────────────────────────────────────
// ROUTE 1  (20 wide × 40 tall)
// ─────────────────────────────────────────────
const route1Ground = parseMap([
  // 01234567890123456789
  'TTTTTTTTPPTTTTTTTTTT', // 0  - north exit to Viridian
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T..GGG...PP...GGG..T', // 4
  'T........PP........T', // 5
  'T........PP........T', // 6
  'T.....PPPPPPPP.....T', // 7  - bend in path
  'T.....PP...........T', // 8
  'T.....PP...........T', // 9
  'T..GGGPP....GGG....T', // 10
  'T..GGGPP....GGG....T', // 11
  'T..GGGPP....GGG....T', // 12
  'T.....PP...........T', // 13
  'T.....PP...........T', // 14
  'T.....PPPPPPPP.....T', // 15 - bend back
  'T........PP........T', // 16
  'T........PP........T', // 17
  'T...GGG..PP..GGG...T', // 18
  'T...GGG..PP..GGG...T', // 19
  'T...GGG..PP..GGG...T', // 20
  'T...GGG..PP..GGG...T', // 21
  'T........PP........T', // 22
  'T........PP........T', // 23
  'T..f.....PP.....f..T', // 24
  'T........PP........T', // 25
  'T....PPPPPPPPPP....T', // 26 - another bend
  'T....PP............T', // 27
  'T....PP............T', // 28
  'T..GGPP.....GGG....T', // 29
  'T..GGPP.....GGG....T', // 30
  'T..GGPP.....GGG....T', // 31
  'T....PP............T', // 32
  'T....PPPPPPPPPP....T', // 33 - bend back
  'T........PP........T', // 34
  'T........PP........T', // 35
  'T..GG....PP....GG..T', // 36
  'T..GG....PP....GG..T', // 37
  'T........PP........T', // 38
  'TTTTTTTTPPTTTTTTTTTT', // 39 - south exit to Pallet
]);

const route1: MapDefinition = {
  key: 'route-1',
  width: 20,
  height: 40,
  ground: route1Ground,
  encounterTableKey: 'route-1',
  npcs: [
    {
      id: 'route1-sign-north',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 1', 'VIRIDIAN CITY ↑  PALLET TOWN ↓'],
    },
    {
      id: 'route1-npc-1',
      tileX: 14,
      tileY: 6,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'If your Pokémon are weak, don\'t go into the tall grass!',
        'Wild Pokémon will jump out at you!',
      ],
    },
    {
      id: 'route1-npc-2',
      tileX: 4,
      tileY: 24,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        'I\'ve heard Pikachu live on this route...',
        'But they\'re really rare!',
      ],
    },
  ],
  trainers: [
    {
      id: 'route1-youngster',
      trainerId: 'youngster-1',
      tileX: 14,
      tileY: 18,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Pallet Town
    { tileX: 8, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    { tileX: 9, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    // North exit → Viridian City (placeholder — loops back for now)
    { tileX: 8, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
    { tileX: 9, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 37, direction: 'up' },
    'from-pallet':   { x: 9, y: 38, direction: 'up' },
    'from-viridian': { x: 9, y: 1,  direction: 'down' },
  },
};

// ─── Registry ───
export const mapRegistry: Record<string, MapDefinition> = {
  'pallet-town': palletTown,
  'route-1': route1,
};
