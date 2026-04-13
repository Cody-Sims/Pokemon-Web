import { MapDefinition, parseMap } from './shared';

const palletGround = parseMap([
  // col: 0         1         2  4
  //      0123456789012345678901234
  'TTTTTTTTTTTPPPTTTTTTTTTTT', // 0  - north exit
  'T..........PPP..........T', // 1
  'T.RRRRRRR..PPP..RRRRRRR.T', // 2  - roofs (7 wide)
  'T.HHH&HHH..PPP..HH&HHHH.T', // 3  - walls with windows
  'T.HHHDHHHPPPPPPPHHHDHHH.T', // 4  - doors + path connecting
  'T....PP....PPP....PP....T', // 5  - paths from doors
  'T....PPPPPPPPPPPPPPPPP..T', // 6  - main horizontal path
  'T..........PPP..........T', // 7
  'T..f.......PPP........f.T', // 8  - flowers
  'T..........PPP..........T', // 9
  'T....BBBBBBBBBBBBBBB....T', // 10 - Lab roof
  'T....LLLLLLLLLLLLLLL....T', // 11 - Lab walls
  'T....LLLLLLLELLLLLLL....T', // 12 - Lab door (E at col 12)
  'T..........PPP..........T', // 13 - path from lab
  'T.........PPPPP.........T', // 14
  'T..GG.....PPPPP.....GG..T', // 15 - grass patches
  'T..GG.....PPPPP.....GG..T', // 16
  'T..GG..f..PPPPP..f..GG..T', // 17 - grass + flowers
  'T.........PPPPP.........T', // 18
  'TTTTTTTTTTTTTTTTTTTTTTTTT', // 19 - bottom border
]);

export const palletTown: MapDefinition = {
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
    { tileX: 11, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 12, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 13, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    // Building doors
    { tileX: 5, tileY: 4, targetMap: 'pallet-player-house', targetSpawnId: 'default' },
    { tileX: 19, tileY: 4, targetMap: 'pallet-rival-house', targetSpawnId: 'default' },
    { tileX: 11, tileY: 12, targetMap: 'pallet-oak-lab', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 14, direction: 'up' },
    'from-route-1': { x: 12, y: 1, direction: 'down' },
    'player-house': { x: 5, y: 5, direction: 'down' },
    'from-player-house': { x: 5, y: 5, direction: 'down' },
    'from-rival-house': { x: 19, y: 5, direction: 'down' },
    'from-oak-lab': { x: 12, y: 13, direction: 'down' },
  },
};
