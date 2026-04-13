import { MapDefinition, parseMap } from '../shared';

const pewterGround = parseMap([
  // 012345678901234567890123456789
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0
  'T............................T', // 1
  'T..RRRRR.....PP......RRRRR...T', // 2  - houses
  'T..HH&HH.....PP......HH&HH...T', // 3  - walls with windows
  'T..HHDHH.....PP......HHDHH...T', // 4
  'T....PP......PP........PP....T', // 5
  'T..PPPPPPPPPPPPPPPPPPPPPP....T', // 6  - main east-west road
  'T..PP........................T', // 7
  'T..PP....CCCCCC..............T', // 8  - PokéCenter roof
  'T..PP....cccccc..............T', // 9  - PokéCenter wall
  'T..PP....cceccc..............T', // 10 - PokéCenter door
  'T..PP......PP................T', // 11
  'T..PPPPPPPPPPPPPPPPPPPPPP....T', // 12 - mid road
  'T..PP........................T', // 13
  'T..PP......AAAAAAAA..........T', // 14 - Gym roof
  'T..PP......gggggggg..........T', // 15 - Gym wall
  'T..PP......ggggaggg..........T', // 16 - Gym door
  'T..PP........PP..............T', // 17
  'T..PP........PP.............PP', // 18 east exit to Route 3
  'T..PPPPPPPPPPPP.............PP', // 19
  'T..PP........................T', // 20
  'T..PP.....f........f.........T', // 21
  'T..PP........................T', // 22
  'T..PP........................T', // 23
  'T..PP........................T', // 24
  'T..PP.....RRRRR..............T', // 25 - museum/house
  'T..PP.....HH&HH..............T', // 26 - museum wall with window
  'T..PP.....HHDHH..............T', // 27
  'T..PP........................T', // 28
  'TTTTTTTTTTTTTTPPTTTTTTTTTTTTTT', // 29 - south exit to Route 2 / Forest
]);

export const pewterCity: MapDefinition = {
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
    // ─── Quest NPC: Hiker Jerome (Lost Pokémon quest) ───
    {
      id: 'pewter-jerome',
      tileX: 18,
      tileY: 14,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Jerome: Oh no, oh no... my Geodude!',
        'Jerome: We were hiking near Viridian Forest and it wandered off!',
        'Jerome: Could you look for it? It\'s a friendly little Geodude.',
        'Jerome: Please, I\'m too worried to go into the forest myself!',
      ],
      setsFlag: 'quest_lostPokemon_started',
      flagDialogue: [
        {
          flag: 'quest_lostPokemon_complete',
          dialogue: [
            'Jerome: My Geodude! You found it! Thank you so much!',
            'Jerome: Here — I want you to have this. It\'s a rare TM.',
            'Jerome: You\'re a true friend to Pokémon!',
          ],
        },
        {
          flag: 'quest_lostPokemon_started',
          dialogue: [
            'Jerome: Have you found my Geodude yet?',
            'Jerome: It should be somewhere in Viridian Forest...',
            'Jerome: Look in the deeper parts of the forest!',
          ],
        },
      ],
    },
    // ─── Delivery quest receiver ───
    {
      id: 'pewter-delivery-npc',
      tileX: 8,
      tileY: 20,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: ['I work at the museum. Fascinating place!'],
      flagDialogue: [
        {
          flag: 'quest_lostDelivery_pewter',
          dialogue: ['Thank you for the delivery! This will help our research.'],
        },
        {
          flag: 'quest_lostDelivery_started',
          dialogue: [
            'A package from Pip? Wonderful!',
            'These are the supplies we\'ve been waiting for.',
            'Thank you for bringing them!',
          ],
        },
      ],
      requireFlag: 'quest_lostDelivery_started',
      setsFlag: 'quest_lostDelivery_pewter',
    },
  ],
  trainers: [],
  warps: [
    // South exit → Viridian Forest
    { tileX: 14, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    { tileX: 15, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    // Building doors
    { tileX: 11, tileY: 10, targetMap: 'pewter-pokecenter', targetSpawnId: 'default' },
    { tileX: 15, tileY: 16, targetMap: 'pewter-gym', targetSpawnId: 'default' },
    { tileX: 12, tileY: 27, targetMap: 'pewter-museum', targetSpawnId: 'default' },
    // East exit → Route 3
    { tileX: 29, tileY: 18, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
    { tileX: 29, tileY: 19, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
  ],
  spawnPoints: {
    'default':         { x: 14, y: 15, direction: 'up' },
    'from-forest':     { x: 14, y: 28, direction: 'up' },
    'from-pokecenter': { x: 11, y: 11, direction: 'down' },
    'from-gym':        { x: 15, y: 17, direction: 'down' },
    'from-museum':     { x: 12, y: 28, direction: 'down' },
    'from-route-3':    { x: 28, y: 18, direction: 'left' },
  },
};
