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
        'Prof. Oak is in his lab to the south.',
        'Go see him to get your first Pokémon!',
      ],
      flagDialogue: [
        {
          flag: 'receivedStarter',
          dialogue: [
            'Be safe on your adventure, dear!',
            'Come home if your Pokémon need rest!',
          ],
        },
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
    {
      id: 'pallet-oak',
      tileX: 12,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Prof. Oak: Ah, there you are!',
        'Prof. Oak: The world of Pokémon awaits!',
        'Prof. Oak: Choose one of these three Pokémon!',
      ],
      interactionType: 'starter-select',
      requireFlag: '!receivedStarter',
    },
    {
      id: 'pallet-oak-after',
      tileX: 12,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Prof. Oak: Your Pokémon is looking great!',
        'Prof. Oak: Go explore the world!',
      ],
      flagDialogue: [
        {
          flag: 'receivedPokedex',
          dialogue: [
            'Prof. Oak: Fill up that Pokédex for me!',
            'Prof. Oak: There are 151 Pokémon to discover!',
          ],
        },
        {
          flag: 'hasParcel',
          dialogue: [
            'Prof. Oak: Oh! Is that a package from the PokéMart?',
            'Prof. Oak: Thank you for delivering it!',
            'Prof. Oak: Here, take this Pokédex!',
            'Prof. Oak: It records data on all Pokémon you encounter.',
          ],
        },
      ],
      requireFlag: 'receivedStarter',
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
    // North exit → Viridian City
    { tileX: 8, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
    { tileX: 9, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 37, direction: 'up' },
    'from-pallet':   { x: 9, y: 38, direction: 'up' },
    'from-viridian': { x: 9, y: 1,  direction: 'down' },
  },
};

// ─────────────────────────────────────────────
// VIRIDIAN CITY  (30 wide × 30 tall)
// ─────────────────────────────────────────────
const viridianGround = parseMap([
  // 012345678901234567890123456789
  'TTTTTTTTTTTTTTPPTTTTTTTTTTTTTTTT', // 0  - north exit to Route 2
  'T..............PP..............T', // 1
  'T..RRRRR.......PP.......RRRRR.T', // 2  - houses
  'T..HHHHH.......PP.......HHHHH.T', // 3
  'T..HHDHH.......PP.......HHDHH.T', // 4
  'T....PP........PP........PP...T', // 5
  'T..PPPPPPPPPPPPPPPPPPPPPPPP...T', // 6  - main east-west road
  'T..PP..........................T', // 7
  'T..PP....CCCCCC....MMMMMM.....T', // 8  - PokéCenter roof / Mart roof
  'T..PP....cccccc....mmmmmm.....T', // 9  - PokéCenter wall / Mart wall
  'T..PP....cceccc....mmnmmm.....T', // 10 - PokéCenter door / Mart door
  'T..PP......PP........PP.......T', // 11
  'T..PP......PP........PP.......T', // 12
  'T..PPPPPPPPPPPPPPPPPPPPPPPP...T', // 13 - another east-west road
  'T..PP..........................T', // 14
  'T..PP....AAAAAA..............T', // 15 - Gym roof
  'T..PP....gggggg..............T', // 16 - Gym wall
  'T..PP....ggaggg..............T', // 17 - Gym door
  'T..PP......PP................T', // 18
  'T..PP......PP.....f....f.....T', // 19
  'T..PPPPPPPPPP................T', // 20
  'T..PP..........................T', // 21
  'T..PP.....f........f.........T', // 22
  'T..PP..........................T', // 23
  'T..PP.........WWWWW..........T', // 24 - pond
  'T..PP.........WWWWW..........T', // 25
  'T..PP.........WWWWW..........T', // 26
  'T..PP..........................T', // 27
  'T..PP..........................T', // 28
  'TTTTTTTTTTTTTTPPTTTTTTTTTTTTTTTT', // 29 - south exit to Route 1
]);

const viridianCity: MapDefinition = {
  key: 'viridian-city',
  width: 30,
  height: 30,
  ground: viridianGround,
  encounterTableKey: '',
  npcs: [
    {
      id: 'viridian-sign-south',
      tileX: 15,
      tileY: 28,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['VIRIDIAN CITY', '"The Eternally Green Paradise"'],
    },
    {
      id: 'viridian-npc-1',
      tileX: 20,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'The Gym has been closed for a while.',
        'I wonder when the leader will return...',
      ],
    },
    {
      id: 'viridian-nurse',
      tileX: 10,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['Welcome to the Pokémon Center!', 'We\'ll heal your Pokémon back to full health!'],
      interactionType: 'heal',
    },
    {
      id: 'viridian-clerk',
      tileX: 22,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Welcome to the PokéMart!',
        'Oh wait, I have a package for Prof. Oak.',
        'Would you deliver it for me?',
      ],
      flagDialogue: [
        {
          flag: 'deliveredParcel',
          dialogue: [
            'Welcome to the PokéMart!',
            'We have Poké Balls, Potions, and more!',
          ],
        },
      ],
      setsFlag: 'hasParcel',
    },
    {
      id: 'viridian-gym-block',
      tileX: 10,
      tileY: 18,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['The Viridian Gym is closed right now.', 'The leader is away on business.'],
    },
    {
      id: 'viridian-route2-guide',
      tileX: 6,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['Route 2 is just north of here.', 'Viridian Forest is beyond that!'],
    },
  ],
  trainers: [],
  warps: [
    // South exit → Route 1
    { tileX: 14, tileY: 29, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
    { tileX: 15, tileY: 29, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
    // North exit → Route 2
    { tileX: 14, tileY: 0, targetMap: 'route-2', targetSpawnId: 'from-viridian' },
    { tileX: 15, tileY: 0, targetMap: 'route-2', targetSpawnId: 'from-viridian' },
  ],
  spawnPoints: {
    'default':       { x: 14, y: 15, direction: 'up' },
    'from-route-1':  { x: 14, y: 28, direction: 'up' },
    'from-route-2':  { x: 14, y: 1,  direction: 'down' },
  },
};

// ─────────────────────────────────────────────
// ROUTE 2  (20 wide × 30 tall)
// ─────────────────────────────────────────────
const route2Ground = parseMap([
  // 01234567890123456789
  'TTTTTTTTPPTTTTTTTTTT', // 0  - north exit to Viridian Forest
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T..GGG...PP...GGG..T', // 4
  'T........PP........T', // 5
  'T....PPPPPPPPPP.....T', // 6
  'T....PP............T', // 7
  'T....PP....GGG.....T', // 8
  'T....PP....GGG.....T', // 9
  'T....PP............T', // 10
  'T....PPPPPPPPPP.....T', // 11
  'T........PP........T', // 12
  'T..GG....PP....GG..T', // 13
  'T..GG....PP....GG..T', // 14
  'T........PP........T', // 15
  'T........PP........T', // 16
  'T...GGG..PP..GGG...T', // 17
  'T...GGG..PP..GGG...T', // 18
  'T...GGG..PP..GGG...T', // 19
  'T........PP........T', // 20
  'T..f.....PP.....f..T', // 21
  'T........PP........T', // 22
  'T..GG....PP....GG..T', // 23
  'T..GG....PP....GG..T', // 24
  'T........PP........T', // 25
  'T........PP........T', // 26
  'T........PP........T', // 27
  'T........PP........T', // 28
  'TTTTTTTTPPTTTTTTTTTT', // 29 - south exit to Viridian City
]);

const route2: MapDefinition = {
  key: 'route-2',
  width: 20,
  height: 30,
  ground: route2Ground,
  encounterTableKey: 'route-2',
  npcs: [
    {
      id: 'route2-sign',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 2', 'VIRIDIAN FOREST ↑  VIRIDIAN CITY ↓'],
    },
    {
      id: 'route2-npc-1',
      tileX: 14,
      tileY: 15,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'Viridian Forest is just ahead!',
        'Watch out for Bug Catchers in there.',
      ],
    },
  ],
  trainers: [],
  warps: [
    // South exit → Viridian City
    { tileX: 8, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    // North exit → Viridian Forest
    { tileX: 8, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
  ],
  spawnPoints: {
    'default':        { x: 9, y: 15, direction: 'up' },
    'from-viridian':  { x: 9, y: 28, direction: 'up' },
    'from-forest':    { x: 9, y: 1,  direction: 'down' },
  },
};

// ─────────────────────────────────────────────
// VIRIDIAN FOREST  (25 wide × 40 tall)
// ─────────────────────────────────────────────
const forestGround = parseMap([
  // 0123456789012345678901234
  'XXXXXXXXXPPXXXXXXXXXXXXX', // 0  - north exit to Pewter side
  'X.........PP...........X', // 1
  'X..GGG....PP.....GGG..X', // 2
  'X..GGG....PP.....GGG..X', // 3
  'X..GGG....PP.....GGG..X', // 4
  'X.........PP...........X', // 5
  'X....PPPPPPPPPPP.......X', // 6
  'X....PP................X', // 7
  'X....PP..GGG...GGG....X', // 8
  'X....PP..GGG...GGG....X', // 9
  'X....PP..GGG...GGG....X', // 10
  'X....PP................X', // 11
  'X....PPPPPPPPPPP.......X', // 12
  'X.........PP...........X', // 13
  'X..GGG....PP....GGG...X', // 14
  'X..GGG....PP....GGG...X', // 15
  'X..GGG....PP....GGG...X', // 16
  'X.........PP...........X', // 17
  'X.........PP...........X', // 18
  'X....PPPPPPPPPPP.......X', // 19
  'X....PP................X', // 20
  'X....PP.....GGG........X', // 21
  'X....PP.....GGG........X', // 22
  'X....PP.....GGG........X', // 23
  'X....PPPPPPPPPPP.......X', // 24
  'X.........PP...........X', // 25
  'X..GGG....PP.....GGG..X', // 26
  'X..GGG....PP.....GGG..X', // 27
  'X..GGG....PP.....GGG..X', // 28
  'X.........PP...........X', // 29
  'X.........PP...........X', // 30
  'X...GGG...PP...GGG....X', // 31
  'X...GGG...PP...GGG....X', // 32
  'X...GGG...PP...GGG....X', // 33
  'X.........PP...........X', // 34
  'X..f......PP......f...X', // 35
  'X.........PP...........X', // 36
  'X.........PP...........X', // 37
  'X.........PP...........X', // 38
  'XXXXXXXXXPPXXXXXXXXXXXXX', // 39 - south exit to Route 2
]);

const viridianForest: MapDefinition = {
  key: 'viridian-forest',
  width: 25,
  height: 40,
  ground: forestGround,
  encounterTableKey: 'viridian-forest',
  npcs: [
    {
      id: 'forest-sign-south',
      tileX: 12,
      tileY: 38,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['VIRIDIAN FOREST', 'Watch your step — Bug Pokémon everywhere!'],
    },
  ],
  trainers: [
    {
      id: 'forest-bugcatcher-1',
      trainerId: 'bug-catcher-1',
      tileX: 7,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'forest-bugcatcher-2',
      trainerId: 'bug-catcher-2',
      tileX: 16,
      tileY: 15,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'forest-bugcatcher-3',
      trainerId: 'bug-catcher-3',
      tileX: 7,
      tileY: 27,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
  ],
  warps: [
    // South exit → Route 2
    { tileX: 9, tileY: 39, targetMap: 'route-2', targetSpawnId: 'from-forest' },
    { tileX: 10, tileY: 39, targetMap: 'route-2', targetSpawnId: 'from-forest' },
    // North exit → Pewter City
    { tileX: 9, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-forest' },
    { tileX: 10, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-forest' },
  ],
  spawnPoints: {
    'default':       { x: 10, y: 20, direction: 'up' },
    'from-route-2':  { x: 10, y: 38, direction: 'up' },
    'from-pewter':   { x: 10, y: 1,  direction: 'down' },
  },
};

// ─────────────────────────────────────────────
// PEWTER CITY  (30 wide × 30 tall)
// ─────────────────────────────────────────────
const pewterGround = parseMap([
  // 012345678901234567890123456789
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0
  'T............................T', // 1
  'T..RRRRR.....PP......RRRRR..T', // 2  - houses
  'T..HHHHH.....PP......HHHHH..T', // 3
  'T..HHDHH.....PP......HHDHH..T', // 4
  'T....PP......PP........PP...T', // 5
  'T..PPPPPPPPPPPPPPPPPPPPPP...T', // 6  - main east-west road
  'T..PP..........................T', // 7
  'T..PP....CCCCCC.............T', // 8  - PokéCenter roof
  'T..PP....cccccc.............T', // 9  - PokéCenter wall
  'T..PP....cceccc.............T', // 10 - PokéCenter door
  'T..PP......PP...............T', // 11
  'T..PPPPPPPPPPPPPPPPPPPPPP...T', // 12 - mid road
  'T..PP..........................T', // 13
  'T..PP......AAAAAAAA.........T', // 14 - Gym roof
  'T..PP......gggggggg.........T', // 15 - Gym wall
  'T..PP......ggggaggg.........T', // 16 - Gym door
  'T..PP........PP.............T', // 17
  'T..PP........PP.............T', // 18
  'T..PPPPPPPPPPPP.............T', // 19
  'T..PP..........................T', // 20
  'T..PP.....f........f........T', // 21
  'T..PP..........................T', // 22
  'T..PP..........................T', // 23
  'T..PP..........................T', // 24
  'T..PP.....RRRRR.............T', // 25 - museum/house
  'T..PP.....HHHHH.............T', // 26
  'T..PP.....HHDHH.............T', // 27
  'T..PP..........................T', // 28
  'TTTTTTTTTTTTTTPPTTTTTTTTTTTTTT', // 29 - south exit to Route 2 / Forest
]);

const pewterCity: MapDefinition = {
  key: 'pewter-city',
  width: 30,
  height: 30,
  ground: pewterGround,
  encounterTableKey: '',
  npcs: [
    {
      id: 'pewter-sign',
      tileX: 15,
      tileY: 28,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['PEWTER CITY', '"A Stone Gray City"'],
    },
    {
      id: 'pewter-nurse',
      tileX: 10,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['Welcome to the Pokémon Center!', 'Let me heal your Pokémon!'],
      interactionType: 'heal',
    },
    {
      id: 'pewter-npc-1',
      tileX: 20,
      tileY: 6,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'Brock is the Gym Leader here.',
        'He uses Rock-type Pokémon.',
        'Water and Grass moves work well against Rock types!',
      ],
    },
    {
      id: 'pewter-gym-guide',
      tileX: 12,
      tileY: 17,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: [
        'This is the Pewter City Gym!',
        'The leader, Brock, is a rock-solid trainer!',
      ],
      flagDialogue: [
        {
          flag: 'defeatedBrock',
          dialogue: [
            'You beat Brock! Amazing!',
            'The Boulder Badge is proof of your strength!',
          ],
        },
      ],
    },
    {
      id: 'pewter-museum-npc',
      tileX: 10,
      tileY: 25,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        'The Pewter Museum of Science is famous!',
        'They have fossils of ancient Pokémon!',
      ],
    },
  ],
  trainers: [
    {
      id: 'pewter-gym-brock',
      trainerId: 'gym-brock',
      tileX: 15,
      tileY: 15,
      textureKey: 'generic-trainer',
      facing: 'down',
      lineOfSight: 3,
    },
  ],
  warps: [
    // South exit → Viridian Forest
    { tileX: 14, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    { tileX: 15, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
  ],
  spawnPoints: {
    'default':      { x: 14, y: 15, direction: 'up' },
    'from-forest':  { x: 14, y: 28, direction: 'up' },
  },
};

// ─── Registry ───
export const mapRegistry: Record<string, MapDefinition> = {
  'pallet-town': palletTown,
  'route-1': route1,
  'viridian-city': viridianCity,
  'route-2': route2,
  'viridian-forest': viridianForest,
  'pewter-city': pewterCity,
};
