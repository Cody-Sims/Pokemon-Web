import { MapDefinition, parseMap } from '../shared';

const forestGround = parseMap([
  // 0123456789012345678901234
  'XXXXXXXXX.PP.XXXXXXXXXXXX', // 0  - north exit to Pewter City
  'X..1......PP......1.....X', // 1
  'X...GGG...PP...GGG..1...X', // 2  branching grass
  'X..GGG....PP...GGG......X', // 3
  'X...GG....PP....GG......X', // 4
  'X.........PP..1.........X', // 5  clearing
  'X...PPPPPPPPPPPPPPPPP...X', // 6  ── branches rejoin --
  'X..1.PP..........PP.1...X', // 7  fork: left + right branches
  'X....PP.GGG......PP.....X', // 8  left branch path
  'X....PP.GGG......PP..%..X', // 9  right branch path
  'X....PP..GG......PP.....X', // 10
  'X..%.PP....~.....PP.....X', // 11 rock on forest floor
  'X...PPPPPPPPPPPPPPPPP...X', // 12 ── east-west connector --
  'X..1......PP.......%....X', // 13
  'X....GG...PP...GGG..1...X', // 14 irregular grass
  'X...GGG...PP...GGG......X', // 15 dense grass
  'X....GG...PP...GG.......X', // 16
  'X.........PP...1........X', // 17
  'X>.........PP...........X', // 18 cut tree #1
  'X...PPPPPPPPPPPPPPPPP...X', // 19 ── east-west connector --
  'X.ff.PP.44444....PP.....X', // 20 deep grove: dark grass + flowers
  'X.f..PP444444....PP.....X', // 21 dense dark canopy
  'X....PP.44444....PP.GGG.X', // 22 deep grove + right-side grass
  'X....PP..44~.....PP.GGG.X', // 23 rock in grove
  'X....PP..........PP.>...X', // 24 cut tree #2
  'X...PPPPPPPPPPPPPPPPP...X', // 25 ── east-west connector --
  'X..%......PP......1.....X', // 26 dense undergrowth
  'X..GGG..1.PP..GGGG......X', // 27 grass patches
  'X..GGG....PP..>.GG.%....X', // 28 cut tree #3
  'X..GGG....PP....GG......X', // 29
  'X....~....PP.....1.%....X', // 30 rock + pine
  'X...GG....PP..GGG.......X', // 31
  'X...GGG.1.PP..GG........X', // 32
  'X...GG....PP..GGG.......X', // 33
  'X......1..PP.......%....X', // 34
  'X..f..1...PP.....f......X', // 35
  'X.........PP..%..1......X', // 36
  'X...1.....PP.........1..X', // 37
  'X.........PP............X', // 38 south approach
  'XXXXXXXXX.PP.XXXXXXXXXXXX', // 39 - south exit to Route 2
]);

export const viridianForest: MapDefinition = {
  key: 'viridian-forest',
  width: 25,
  height: 40,
  ground: forestGround,
  encounterTableKey: 'viridian-forest',
  npcs: [
    {
      id: 'forest-rook-warning',
      name: 'Rook',
      tileX: 4,
      tileY: 14,
      textureKey: 'npc-male-5',
      facing: 'right',
      dialogue: [
        '???: ...',
        '???: Watch yourself deeper in.',
        '???: I\'ve seen people in white coats setting up equipment.',
        '???: Stay sharp, kid.',
      ],
      requireFlag: 'receivedStarter',
    }
  ],
  trainers: [
    {
      id: 'forest-bugcatcher-1',
      name: 'Bug Catcher',
      trainerId: 'bug-catcher-1',
      tileX: 7,
      tileY: 8,
      textureKey: 'npc-bug-catcher',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'forest-bugcatcher-2',
      name: 'Bug Catcher',
      trainerId: 'bug-catcher-2',
      tileX: 16,
      tileY: 15,
      textureKey: 'npc-bug-catcher',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'forest-bugcatcher-3',
      name: 'Bug Catcher',
      trainerId: 'bug-catcher-3',
      tileX: 7,
      tileY: 27,
      textureKey: 'npc-bug-catcher',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'forest-bugcatcher-5',
      name: 'Bug Catcher',
      trainerId: 'bug-catcher-5',
      tileX: 18,
      tileY: 22,
      textureKey: 'npc-bug-catcher',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'forest-lass-5',
      name: 'Lass',
      trainerId: 'lass-5',
      tileX: 12,
      tileY: 34,
      textureKey: 'npc-lass',
      facing: 'up',
      lineOfSight: 4,
    },
  ],
  objects: [
    {
      id: 'forest-sign-south',
      tileX: 12,
      tileY: 38,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['VIRIDIAN FOREST', 'Watch your step — Bug Pokémon everywhere!'] },
    {
      id: 'forest-lost-geodude',
      tileX: 20,
      tileY: 22,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: [
        'The lost Pokémon appears to be a Geodude!',
        'It seems startled and ready to fight!',
      ],
      requireFlag: 'quest_lostPokemon_started',
      setsFlag: 'quest_lostPokemon_found',
      interactionType: 'wild-encounter',
      interactionData: '74-25',
      flagDialogue: [
        {
          flag: 'quest_lostPokemon_found',
          dialogue: ['The Geodude is waiting patiently for Jerome to pick it up.'] },
      ] },
    {
      id: 'forest-synthesis-device',
      tileX: 20,
      tileY: 9,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: [
        'There\'s a strange device implanted in this tree...',
        'It hums with a faint teal glow.',
        'It seems to be measuring something in the ground.',
      ],
      setsFlag: 'found_synthesis_sensor' },
    {
      id: 'forest-net-ball',
      tileX: 3,
      tileY: 18,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Net Ball!'],
      givesItem: 'net-ball',
      requireFlag: 'badge_2',
    },
    {
      id: 'forest-repel',
      tileX: 21,
      tileY: 24,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Repel!'],
      givesItem: 'repel',
      requireFlag: 'badge_2',
    },
    {
      id: 'forest-oran-berry',
      tileX: 15,
      tileY: 28,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found an Oran Berry!'],
      givesItem: 'oran-berry',
      requireFlag: 'badge_2',
    },
  ],
  warps: [
    // South exit → Route 2
    { tileX: 10, tileY: 39, targetMap: 'route-2', targetSpawnId: 'from-forest' },
    { tileX: 11, tileY: 39, targetMap: 'route-2', targetSpawnId: 'from-forest' },
    // North exit → Pewter City (FIXED ── do not move)
    { tileX: 9, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-forest' },
    { tileX: 10, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-forest' },
  ],
  spawnPoints: {
    'default':       { x: 10, y: 20, direction: 'up' },
    'from-route-2':  { x: 10, y: 38, direction: 'up' },
    'from-pewter':   { x: 10, y: 1,  direction: 'down' },
  },
};
