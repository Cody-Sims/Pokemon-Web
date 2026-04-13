import { MapDefinition, parseMap } from './shared';

const forestGround = parseMap([
  // 0123456789012345678901234
  'XXXXXXXXXPPXXXXXXXXXXXX.X', // 0  - north exit to Pewter side
  'X.........PP............X', // 1
  'X..GGG....PP.....GGG....X', // 2
  'X..GGG....PP.....GGG....X', // 3
  'X..GGG....PP.....GGG....X', // 4
  'X.........PP............X', // 5
  'X....PPPPPPPPPPP........X', // 6
  'X....PP.................X', // 7
  'X....PP..GGG...GGG......X', // 8
  'X....PP..GGG...GGG......X', // 9
  'X....PP..GGG...GGG......X', // 10
  'X....PP.................X', // 11
  'X....PPPPPPPPPPP........X', // 12
  'X.........PP............X', // 13
  'X..GGG....PP....GGG.....X', // 14
  'X..GGG....PP....GGG.....X', // 15
  'X..GGG....PP....GGG.....X', // 16
  'X.........PP............X', // 17
  'X.........PP............X', // 18
  'X....PPPPPPPPPPP........X', // 19
  'X....PP.................X', // 20
  'X....PP.....GGG.........X', // 21
  'X....PP.....GGG.........X', // 22
  'X....PP.....GGG.........X', // 23
  'X....PPPPPPPPPPP........X', // 24
  'X.........PP............X', // 25
  'X..GGG....PP.....GGG....X', // 26
  'X..GGG....PP.....GGG....X', // 27
  'X..GGG....PP.....GGG....X', // 28
  'X.........PP............X', // 29
  'X.........PP............X', // 30
  'X...GGG...PP...GGG......X', // 31
  'X...GGG...PP...GGG......X', // 32
  'X...GGG...PP...GGG......X', // 33
  'X.........PP............X', // 34
  'X..f......PP......f.....X', // 35
  'X.........PP............X', // 36
  'X.........PP............X', // 37
  'X.........PP............X', // 38
  'XXXXXXXXXPPXXXXXXXXXXXX.X', // 39 - south exit to Route 2
]);

export const viridianForest: MapDefinition = {
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
    // ─── Quest NPC: Jerome's Lost Geodude ───
    {
      id: 'forest-lost-geodude',
      tileX: 18,
      tileY: 22,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'The Geodude looks confused but happy to see you!',
        'It seems like it wants to go home.',
        'You should tell Jerome in Pewter City!',
      ],
      requireFlag: 'quest_lostPokemon_started',
      setsFlag: 'quest_lostPokemon_found',
      flagDialogue: [
        {
          flag: 'quest_lostPokemon_found',
          dialogue: ['The Geodude is waiting patiently for Jerome to pick it up.'],
        },
      ],
    },
    // ─── Story NPC: Rook's first forest appearance ───
    {
      id: 'forest-rook-warning',
      tileX: 4,
      tileY: 14,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        '???: ...',
        '???: Watch yourself deeper in.',
        '???: I\'ve seen people in white coats setting up equipment.',
        '???: Stay sharp, kid.',
      ],
      requireFlag: 'receivedStarter',
    },
    // ─── Story NPC: Synthesis sensor device ───
    {
      id: 'forest-synthesis-device',
      tileX: 20,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'There\'s a strange device implanted in this tree...',
        'It hums with a faint teal glow.',
        'It seems to be measuring something in the ground.',
      ],
      setsFlag: 'found_synthesis_sensor',
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
    {
      id: 'forest-bugcatcher-5',
      trainerId: 'bug-catcher-5',
      tileX: 18,
      tileY: 22,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'forest-lass-5',
      trainerId: 'lass-5',
      tileX: 12,
      tileY: 34,
      textureKey: 'generic-trainer',
      facing: 'up',
      lineOfSight: 4,
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
