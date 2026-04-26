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
  'T..PP....CCCCCC...MMMMMM.....T', // 8  PokéCenter + PokéMart
  'T..PP....cccccc...mmmmmm.....T', // 9  walls
  'T..PP....cceccc...mmnnmm.....T', // 10 doors
  'T..PP......PP................T', // 11
  'T..PPPPPPPPPPPPPPPPPPPPPP....T', // 12 - mid road
  'T..PP........................T', // 13
  'T..PP......AAAAAAAA..........T', // 14 - Gym roof
  'T..PP......gggggggg..........T', // 15 - Gym wall
  'T..PP......ggggaggg..........T', // 16 - Gym door
  'T..PP........PP..PP..........T', // 17
  'T..PP........PP.PPPPPPPPPPPPPP', // 18 east exit to Route 3
  'T..PPPPPPPPPPPPPP...........PP', // 19
  'T..PP.........PP.............T', // 20
  'T..PP.....f...PP...f.........T', // 21
  'T..PP.........PP.............T', // 22
  'T..PP.........PP.............T', // 23
  'T..PP.........PP.............T', // 24
  'T..PP.....RRRRPP.............T', // 25 - museum/house
  'T..PP.....HH&HPP.............T', // 26 - museum wall with window
  'T..PP.....HHDHPP.............T', // 27
  'T..PP.........PP.............T', // 28
  'TTTTTTTTTTTTT.PP.TTTTTTTTTTTTT', // 29 - south exit to Route 2 / Forest
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
      textureKey: 'sign-post',
      facing: 'down',
      dialogue: ['PEWTER CITY', '"A Stone Gray City"'],
    },
    {
      id: 'pewter-npc-1',
      name: 'Townsperson',
      tileX: 20,
      tileY: 6,
      textureKey: 'npc-male-1',
      facing: 'left',
      dialogue: [
        'Brock is the Gym Leader here.',
        'He uses Rock-type Pokémon.',
        'Water and Grass moves work well against Rock types!',
      ],
    },
    {
      id: 'pewter-museum-npc',
      name: 'Townsperson',
      tileX: 10,
      tileY: 25,
      textureKey: 'npc-male-2',
      facing: 'right',
      dialogue: [
        'The Pewter Museum of Science is famous!',
        'They have fossils of ancient Pokémon!',
      ],
    },
    // ─── Quest NPC: Hiker Jerome (Lost Pokémon quest) ───
    {
      id: 'pewter-jerome',
      name: 'Jerome',
      tileX: 18,
      tileY: 14,
      textureKey: 'npc-hiker',
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
      name: 'Delivery Worker',
      tileX: 8,
      tileY: 20,
      textureKey: 'npc-female-1',
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
    // ─── Museum Curator (Aether lore) ───
    {
      id: 'pewter-curator',
      name: 'Curator',
      tileX: 16,
      tileY: 26,
      textureKey: 'npc-male-1',
      facing: 'left',
      dialogue: [
        'Museum Curator: Welcome! I curate the Pewter Museum.',
        'Curator: We\'ve discovered fossils that suggest Pokémon once channeled pure Aether energy.',
        'Curator: The ancient texts speak of ley lines beneath the earth...',
        'Curator: Some believe the Aether still flows through them.',
      ],
      flagDialogue: [
        {
          flag: 'enteredHallOfFame',
          dialogue: [
            'Museum Curator: Champion! What an honor!',
            'Curator: We\'ve started selling fossil specimens. Interested?',
            'Curator: Bring a fossil and I\'ll revive it for you!',
          ],
        },
      ],
    },
  ],
  trainers: [],
  warps: [
    // South exit → Viridian Forest
    { tileX: 14, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    { tileX: 15, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    // Building doors
    { tileX: 11, tileY: 10, targetMap: 'pewter-pokecenter', targetSpawnId: 'default' },
    { tileX: 21, tileY: 10, targetMap: 'pewter-pokemart', targetSpawnId: 'default' },
    { tileX: 20, tileY: 10, targetMap: 'pewter-pokemart', targetSpawnId: 'default' },
    { tileX: 15, tileY: 16, targetMap: 'pewter-gym', targetSpawnId: 'default' },
    { tileX: 12, tileY: 27, targetMap: 'pewter-museum', targetSpawnId: 'default' },
    // House doors
    { tileX: 5, tileY: 4, targetMap: 'pewter-city-house-1', targetSpawnId: 'default' },
    { tileX: 23, tileY: 4, targetMap: 'pewter-city-house-2', targetSpawnId: 'default' },
    // East exit → Route 3
    { tileX: 29, tileY: 18, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
    { tileX: 29, tileY: 19, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
  ],
  spawnPoints: {
    'default':         { x: 14, y: 12, direction: 'up' },
    'from-forest':     { x: 14, y: 28, direction: 'up' },
    'from-pokecenter': { x: 11, y: 11, direction: 'down' },
    'from-pokemart':   { x: 21, y: 11, direction: 'down' },
    'from-gym':        { x: 15, y: 17, direction: 'down' },
    'from-museum':     { x: 12, y: 28, direction: 'down' },
    'from-route-3':    { x: 28, y: 18, direction: 'left' },
    'from-house-1':    { x: 5, y: 5, direction: 'down' },
    'from-house-2':    { x: 23, y: 5, direction: 'down' },
  },
};
