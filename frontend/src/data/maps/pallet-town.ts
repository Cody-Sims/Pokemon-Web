import { MapDefinition, parseMap } from './shared';

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
