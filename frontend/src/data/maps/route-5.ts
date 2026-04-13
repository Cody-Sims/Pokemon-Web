import { MapDefinition, parseMap } from './shared';

// Route 5 — Canopy Trail
// Dense forest route connecting Ironvale to Verdantia Village
// Features: dark grass, dense trees, vines (story: Synthesis traps)
const route5Ground = parseMap([
  'XXXXXXXXXXPPXXXXXXXXXX', // 0  north exit
  'X..........PP........X', // 1
  'X..4444....PP...444..X', // 2  dark grass
  'X..4444....PP...444..X', // 3
  'X..........PP........X', // 4
  'X....PPPPPPPPPPPP....X', // 5
  'X....PP..........44..X', // 6
  'X....PP...4444...44..X', // 7
  'X....PP...4444.......X', // 8
  'X....PP..........44..X', // 9
  'X....PPPPPPPPPPPP44..X', // 10
  'X..........PP........X', // 11
  'X..444.....PP...444..X', // 12
  'X..444.....PP...444..X', // 13
  'X..........PP........X', // 14
  'X..........PP........X', // 15
  'X....PPPPPPPPPPPP....X', // 16
  'X....PP..........44..X', // 17
  'X....PP...4444...44..X', // 18
  'X....PP...4444.......X', // 19
  'X....PP..............X', // 20
  'X....PPPPPPPPPPPP....X', // 21
  'X..........PP........X', // 22
  'X..4444....PP...444..X', // 23
  'X..4444....PP...444..X', // 24
  'X..........PP........X', // 25
  'X..f.......PP.....f..X', // 26
  'X..........PP........X', // 27
  'X..........PP........X', // 28
  'XXXXXXXXXXPPXXXXXXXXXX', // 29 south exit
]);

export const route5: MapDefinition = {
  key: 'route-5',
  width: 22,
  height: 30,
  ground: route5Ground,
  encounterTableKey: 'route-5',
  battleBg: 'bg-forest',
  npcs: [
    {
      id: 'route5-sign',
      tileX: 13,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 5 — CANOPY TRAIL', 'Verdantia Village ↓  Ironvale City ↑'],
    },
    // Synthesis trap found
    {
      id: 'route5-trap',
      tileX: 16,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A strange cage sits among the trees...',
        'It\'s designed to drain energy from captured Pokémon!',
        'The Synthesis Collective insignia is stamped on the side.',
      ],
      setsFlag: 'found_synthesis_trap',
    },
    // Marina co-op event
    {
      id: 'route5-marina',
      tileX: 6,
      tileY: 14,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        'Marina: There you are! I\'ve been tracking energy signatures.',
        'Marina: These traps are draining wild Pokémon...',
        'Marina: Help me free them! We need to disable the cages.',
        'Marina: The Aether readings here are off the charts.',
      ],
      requireFlag: 'found_synthesis_trap',
      setsFlag: 'helped_marina_traps',
    },
  ],
  trainers: [
    {
      id: 'route5-bugcatcher-4',
      trainerId: 'bug-catcher-4',
      tileX: 7,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route5-lass-3',
      trainerId: 'lass-3',
      tileX: 15,
      tileY: 20,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route5-grunt-4',
      trainerId: 'synthesis-grunt-3',
      tileX: 10,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'down',
      lineOfSight: 3,
    },
    {
      id: 'route5-camper-4',
      trainerId: 'camper-4',
      tileX: 4,
      tileY: 16,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route5-youngster-6',
      trainerId: 'youngster-6',
      tileX: 17,
      tileY: 24,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route5-grunt-6',
      trainerId: 'synthesis-grunt-6',
      tileX: 12,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  warps: [
    // North exit → Ironvale City
    { tileX: 10, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-5' },
    { tileX: 11, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-5' },
    // South exit → Verdantia Village
    { tileX: 10, tileY: 29, targetMap: 'verdantia-village', targetSpawnId: 'from-route-5' },
    { tileX: 11, tileY: 29, targetMap: 'verdantia-village', targetSpawnId: 'from-route-5' },
  ],
  spawnPoints: {
    'default':          { x: 11, y: 15, direction: 'down' },
    'from-ironvale':    { x: 11, y: 1, direction: 'down' },
    'from-verdantia':   { x: 11, y: 28, direction: 'up' },
  },
};
