import { MapDefinition, parseMap } from '../shared';

const forestGround = parseMap([
  // 0123456789012345678901234
  'XXXXXXXX.PP.XXXXXXXXXXX.X', // 0  - north exit to Pewter side
  'X..1......PP......1.....X', // 1  pines frame the entrance
  'X..GGG.%..PP...GGGG.....X', // 2  irregular grass, bush
  'X.GGG.....PP....GGG...1.X', // 3  shifted patch, pine
  'X..GG.....PP.....GGG....X', // 4  varied grass shapes
  'X.........PP..1.........X', // 5  lone pine in clearing
  'X....PPPPPPPPPPP........X', // 6  ── east-west connector ──
  'X..1.PP........~.1......X', // 7  rocky clearing: pines & rock
  'X....PP..GGG..¢GGG......X', // 8  moss boulder among trees
  'X....PP..GGG...GGG...%..X', // 9  bush at edge
  'X....PP...GG...GGG......X', // 10 thinning grass
  'X..%.PP.......~.........X', // 11 bush & rock on forest floor
  'X....PPPPPPPPPPP........X', // 12 ── east-west connector ──
  'X..1......PP.....%......X', // 13 pine, undergrowth
  'X....GG...PP....GGG...1.X', // 14 irregular grass, pine
  'X...GGG...PP....GGG.....X', // 15 dense grass patch
  'X....GG...PP....GG......X', // 16 thinning at edges
  'X.........PP...1........X', // 17 lone pine
  'X....¢....PP............X', // 18 ancient moss boulder
  'X....PPPPPPPPPPP........X', // 19 ── east-west connector ──
  'X.ff.PP..4444...........X', // 20 flowers & deep old forest
  'X.f..PP.44444.f.........X', // 21 dark canopy floor
  'X....PP..4444..GGG......X', // 22 dark grass fades to tall
  'X....PP...44~...........X', // 23 rock in dark grove
  'X....PPPPPPPPPPP........X', // 24 ── east-west connector ──
  'X..%......PP.....1......X', // 25 dense undergrowth section
  'X..GGG.1..PP...GGGG.....X', // 26 pine among grass
  'X..GGG....PP.....GGG.%..X', // 27 bush at clearing edge
  'X..GGG....PP.....GG.....X', // 28 uneven grass
  'X....~....PP......¢.....X', // 29 scattered rock & mossy stone
  'X.........PP....1.%.....X', // 30 pine & bush
  'X...GG....PP...GGG......X', // 31 staggered grass
  'X...GGG.1.PP...GG.......X', // 32 pine breaks up grass
  'X...GG....PP...GGG......X', // 33 irregular patch
  'X......1..PP.......%....X', // 34 pine & bush in clearing
  'X..f..1...PP......f.....X', // 35 wildflowers, pine
  'X.........PP..%..1......X', // 36 bush & pine near exit
  'X...1.....PP.........1..X', // 37 pines near south exit
  'X.........PP............X', // 38 south approach
  'XXXXXXXX.PP.XXXXXXXXXXX.X', // 39 - south exit to Route 2
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
      textureKey: 'npc-bug-catcher',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'forest-bugcatcher-2',
      trainerId: 'bug-catcher-2',
      tileX: 16,
      tileY: 15,
      textureKey: 'npc-bug-catcher',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'forest-bugcatcher-3',
      trainerId: 'bug-catcher-3',
      tileX: 7,
      tileY: 27,
      textureKey: 'npc-bug-catcher',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'forest-bugcatcher-5',
      trainerId: 'bug-catcher-5',
      tileX: 18,
      tileY: 22,
      textureKey: 'npc-bug-catcher',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'forest-lass-5',
      trainerId: 'lass-5',
      tileX: 12,
      tileY: 34,
      textureKey: 'npc-lass',
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
