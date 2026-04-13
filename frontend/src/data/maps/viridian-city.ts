import { MapDefinition, parseMap } from './shared';

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

export const viridianCity: MapDefinition = {
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
    // Building doors
    { tileX: 11, tileY: 10, targetMap: 'viridian-pokecenter', targetSpawnId: 'default' },
    { tileX: 21, tileY: 10, targetMap: 'viridian-pokemart', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default':         { x: 14, y: 15, direction: 'up' },
    'from-route-1':    { x: 14, y: 28, direction: 'up' },
    'from-route-2':    { x: 14, y: 1,  direction: 'down' },
    'from-pokecenter': { x: 11, y: 11, direction: 'down' },
    'from-pokemart':   { x: 21, y: 11, direction: 'down' },
  },
};
