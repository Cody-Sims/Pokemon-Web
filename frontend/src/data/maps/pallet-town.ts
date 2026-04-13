import { MapDefinition, parseMap } from './shared';

const palletGround = parseMap([
  //                   1111111111222222
  // col: 0123456789...0123456789012345
  'TTTTTTTTTTTTPPTTTTTTTTTTT', // 0  - top border, north exit (PP at 12-13)
  'T...........PP..........T', // 1
  'T..RRRRR....PP....RRRRR.T', // 2  - roofs (3-7 and 18-22)
  'T..HHHHH....PP....HHHHH.T', // 3  - walls
  'T..HHDHH....PP....HHDHH.T', // 4  - doors (D at 5 and 20)
  'T....P......PP......P...T', // 5  - paths from doors
  'T....PPPPPPPPPPPPPPPP...T', // 6  - horizontal connecting path (5-20)
  'T...........PP..........T', // 7
  'T..f........PP........f.T', // 8  - flowers
  'T...........PP..........T', // 9
  'T.....BBBBBBBBBBBBB.....T', // 10 - Lab roof (6-18)
  'T.....LLLLLLLLLLLLL.....T', // 11 - Lab walls (6-18)
  'T.....LLLLLELLLLLLL.....T', // 12 - Lab door (E at 11, walls 6-18)
  'T.........PPPP..........T', // 13 - path from lab (10-13)
  'T.........PPPP..........T', // 14
  'T..GG.....PPPP.....GG...T', // 15 - grass patches
  'T..GG.....PPPP.....GG...T', // 16
  'T..GG..f..PPPP.f...GG...T', // 17 - grass + flowers
  'T.........PPPP..........T', // 18
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
    { tileX: 12, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 13, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    // Building doors
    { tileX: 5, tileY: 4, targetMap: 'pallet-player-house', targetSpawnId: 'default' },
    { tileX: 20, tileY: 4, targetMap: 'pallet-rival-house', targetSpawnId: 'default' },
    { tileX: 11, tileY: 12, targetMap: 'pallet-oak-lab', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 14, direction: 'up' },
    'from-route-1': { x: 12, y: 1, direction: 'down' },
    'player-house': { x: 5, y: 5, direction: 'down' },
    'from-player-house': { x: 5, y: 5, direction: 'down' },
    'from-rival-house': { x: 20, y: 5, direction: 'down' },
    'from-oak-lab': { x: 11, y: 13, direction: 'down' },
  },
};
