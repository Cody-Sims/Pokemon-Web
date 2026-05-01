import { MapDefinition, parseMap } from '../shared';

const pewterGround = parseMap([
  // 0         1         2
  // 012345678901234567890123456789
  'TTTTTTTTTTTTTTTTTTTTTTT~~*~*~T', // 0  border + NE rocky outcrop
  'T.............PP.......~.*..~T', // 1  cracked rocks in outcrop
  'T..AAAAAAAA...PP...RRRRR.~...T', // 2  Gym roof (upper) + Museum roof
  'T..gggggggg...PP...HH&HH.....T', // 3  Gym wall + Museum wall
  'T..ggggaggg...PP...HHDHH.....T', // 4  Gym door + Museum door
  'T......P......PP.....P.......T', // 5  paths from doors
  'T.PPPPPPPPPPPPPPPPPPPPPPPPP..T', // 6  main upper E-W road
  'T.............PP.............T', // 7  open plateau
  'T....f........PP........f....T', // 8  flowers on plateau
  'T.............PP.............T', // 9  open plateau
  'T.............PP.............T', // 10 open plateau
  'T.PPPPPPPPPPPPPPPPPPPPPPPPPP.T', // 11 cliff-top road
  '^^^^^^^^^^^^^PPP^^^^^^^^^PP^^^', // 12 CLIFF FACE — central stairs + east gap
  'T............PP..........PP..T', // 13 lower ground
  'T..CCCCCC....PP..MMMMMM..PP..T', // 14 PokéCenter + PokéMart roofs
  'T..c$cccc....PP..mmmmmm..PP..T', // 15 walls
  'T..cceccc....PP..mmnnmm..PP..T', // 16 doors
  'T....P.......PP....PPPPPPPP..T', // 17 door paths + east switchback
  'T.PPPPPPPPPPPPPPPPPPPPPPPPPPPP', // 18 main lower road + east exit →
  'T.PP..........PP............PP', // 19 east exit row 2
  'T.PP..........PP.............T', // 20
  'T.PP.RRRRR....PP....RRRRR....T', // 21 houses
  'T.PP.HH&HH....PP....HH&HH....T', // 22 house walls
  'T.PP.HHDHH....PP....HHDHH....T', // 23 house doors
  'T.PP...P......PP......P......T', // 24 door paths
  'T.PPPPPPPPPPPPPPPPPPPPPPPP...T', // 25 lower south road
  'T.............PP.............T', // 26
  'T.....f.......PP........f....T', // 27 flowers
  'T.............PP.............T', // 28 sign area
  'TTTTTTTTTTTTT.PP.TTTTTTTTTTTTT', // 29 south exit → Viridian Forest
]);

export const pewterCity: MapDefinition = {
  key: 'pewter-city',
  width: 30,
  height: 30,
  ground: pewterGround,
  encounterTableKey: '',
  npcs: [
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
      tileX: 18,
      tileY: 5,
      textureKey: 'npc-male-2',
      facing: 'right',
      dialogue: [
        'The Pewter Museum of Science is famous!',
        'They have fossils of ancient Pokémon!',
      ],
    },
    {
      id: 'pewter-jerome',
      name: 'Jerome',
      tileX: 12,
      tileY: 9,
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
    {
      id: 'pewter-delivery-npc',
      name: 'Delivery Worker',
      tileX: 4,
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
    {
      id: 'pewter-curator',
      name: 'Curator',
      tileX: 17,
      tileY: 7,
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
    }
  ],
  trainers: [],
  objects: [
    {
      id: 'pewter-sign',
      tileX: 15,
      tileY: 28,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['PEWTER CITY', '"A Stone Gray City"'] }
  ],
  warps: [
    // South exit → Viridian Forest (UNCHANGED)
    { tileX: 14, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    { tileX: 15, tileY: 29, targetMap: 'viridian-forest', targetSpawnId: 'from-pewter' },
    // Building doors (upper plateau)
    { tileX: 7, tileY: 4, targetMap: 'pewter-gym', targetSpawnId: 'default' },
    { tileX: 21, tileY: 4, targetMap: 'pewter-museum', targetSpawnId: 'default' },
    // Building doors (lower ground)
    { tileX: 5, tileY: 16, targetMap: 'pewter-pokecenter', targetSpawnId: 'default' },
    { tileX: 19, tileY: 16, targetMap: 'pewter-pokemart', targetSpawnId: 'default' },
    { tileX: 20, tileY: 16, targetMap: 'pewter-pokemart', targetSpawnId: 'default' },
    // House doors (lower ground)
    { tileX: 7, tileY: 23, targetMap: 'pewter-city-house-1', targetSpawnId: 'default' },
    { tileX: 22, tileY: 23, targetMap: 'pewter-city-house-2', targetSpawnId: 'default' },
    // East exit → Route 3 (via switchback)
    { tileX: 29, tileY: 18, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
    { tileX: 29, tileY: 19, targetMap: 'route-3', targetSpawnId: 'from-pewter' },
  ],
  spawnPoints: {
    'default':         { x: 14, y: 13, direction: 'up' },
    'from-forest':     { x: 14, y: 28, direction: 'up' },
    'from-pokecenter': { x: 5, y: 17, direction: 'down' },
    'from-pokemart':   { x: 19, y: 17, direction: 'down' },
    'from-gym':        { x: 7, y: 5, direction: 'down' },
    'from-museum':     { x: 21, y: 5, direction: 'down' },
    'from-route-3':    { x: 28, y: 18, direction: 'left' },
    'from-house-1':    { x: 7, y: 24, direction: 'down' },
    'from-house-2':    { x: 22, y: 24, direction: 'down' },
  },
};
