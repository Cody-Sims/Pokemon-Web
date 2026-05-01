import { MapDefinition, parseMap } from '../shared';

const viridianGround = parseMap([
  // 0         1         2
  // 0123456789012345678901234567 89
  'TTTTTTTTTTTTTTTTTTTTTTTTTT.PPT', // 0  - NE exit to Route 2
  'T..........................PPT', // 1
  'T..CCCCCC......MMMMMM......PPT', // 2  - PokéCenter + PokéMart roofs
  'T..c$cccc......m$mmmm......PPT', // 3  - walls with windows
  'T..cceccc......mmnmmm......PPT', // 4  - doors
  'T....PP..........PP........PPT', // 5  - paths from doors
  'TPPPPPPPPPPPPPPPPPPPPPPPPPPPPT', // 6  - main E-W road (north bank)
  'T.PP.............PP..........T', // 7  - paths to bridges
  'TWPPWWWWWWWWWWWWWPPWWWWWWWWWWT', // 8  - river + 2 bridges
  'TWPPWWWWWWWWWWWWWPPWWWWWWWWWWT', // 9  - river row 2
  'T.PP.............PP..........T', // 10 - south bank approach
  'TPPPPPPPPPPPPPPPPPPPPPPPPPPPPT', // 11 - main E-W road (south bank)
  'T..PP..........PP............T', // 12 - paths diverge
  'Tfff..AAAAAAA..PP............T', // 13 - park flowers + Gym roof
  'TfSf..ggggggg..PP......RRRRR.T', // 14 - park sign + Gym wall + House2 roof
  'Tfff..gggaggg..PP......HH&HH.T', // 15 - park + Gym door + House2 wall
  'T........PP....PP......HHDHH.T', // 16 - Gym approach + House2 door
  'T.WW...PP.....RRRRR...PP.....T', // 17 - pond + House1 roof
  'T.WW...PP.....HH&HH...PP.....T', // 18 - pond + House1 wall
  'T.WW...PP.....HHDHH...PP.....T', // 19 - pond + House1 door
  'T......PP......PP.....PP.....T', // 20
  'T..>...PP......PP.....PP.....T', // 21 - cut tree (requires Cut)
  'T..P...PPPPPPPPPP.....PP.....T', // 22 - alley behind cut tree
  'T.............PP......PP.....T', // 23
  'T.............PPPPPPPPPPPP...T', // 24 - paths merge
  'T.............PP....f...f....T', // 25
  'T.............PP.............T', // 26
  'T.............PP.............T', // 27
  'T.............PP.............T', // 28
  'TTTTTTTTTTTTT.PP.TTTTTTTTTTTTT', // 29 - south exit to Route 1
]);

export const viridianCity: MapDefinition = {
  key: 'viridian-city',
  width: 30,
  height: 30,
  ground: viridianGround,
  encounterTableKey: '',
  npcs: [
    {
      id: 'viridian-npc-1',
      name: 'Townsperson',
      tileX: 20,
      tileY: 5,
      textureKey: 'npc-male-2',
      facing: 'left',
      dialogue: [
        'The Gym has been closed for a while.',
        'I wonder when the leader will return...',
      ],
      behavior: { type: 'pace', paceRoute: ['left', 'left', 'right', 'right'] },
    },
    {
      id: 'viridian-gym-block',
      name: 'Townsperson',
      tileX: 9,
      tileY: 16,
      textureKey: 'npc-male-3',
      facing: 'up',
      requireFlag: '!badge_7',
      dialogue: ['The Viridian Gym is closed right now.', 'The leader is away on business.'],
    },
    {
      id: 'viridian-route2-guide',
      name: 'Guide',
      tileX: 25,
      tileY: 1,
      textureKey: 'npc-oldman',
      facing: 'down',
      dialogue: ['Route 2 is just north of here.', 'Viridian Forest is beyond that!'],
    },
    {
      id: 'viridian-magnus',
      name: 'Magnus',
      tileX: 20,
      tileY: 12,
      textureKey: 'npc-male-3',
      facing: 'left',
      dialogue: [
        'Magnus: I\'m a Pokémon Collector! I travel the world to see rare species.',
        'Magnus: Would you show me different types of Pokémon?',
        'Magnus: I want to see a Water-type, a Fire-type, and a Flying-type.',
        'Magnus: Show them to me and I\'ll reward you handsomely!',
      ],
      setsFlag: 'quest_collector_started',
      interactionType: 'show-pokemon',
      interactionData: 'water:quest_collector_water|fire:quest_collector_fire|flying:quest_collector_flying',
      flagDialogue: [
        {
          flag: 'quest_collector_complete',
          dialogue: [
            'Magnus: What a magnificent collection you\'ve shown me!',
            'Magnus: You have a real gift for finding Pokémon.',
            'Magnus: Here — take this. It\'s called Leftovers.',
            'Magnus: Your Pokémon will love it!',
          ],
        },
        {
          flag: 'quest_collector_started',
          dialogue: [
            'Magnus: Still looking for those Pokémon?',
            'Magnus: I need to see a Water-type, Fire-type, and Flying-type.',
            'Magnus: Keep searching!',
          ],
        },
      ],
    },
    {
      id: 'viridian-delivery-npc',
      name: 'Delivery Worker',
      tileX: 22,
      tileY: 20,
      textureKey: 'npc-female-2',
      facing: 'down',
      dialogue: ['Just a regular citizen here...'],
      flagDialogue: [
        {
          flag: 'quest_lostDelivery_viridian',
          dialogue: ['Thanks for the package! Pip is doing good work.'],
        },
        {
          flag: 'quest_lostDelivery_started',
          dialogue: [
            'Oh! Is that a package from Pip?',
            'I\'ve been waiting for this. Thank you!',
          ],
        },
      ],
      requireFlag: 'quest_lostDelivery_started',
      setsFlag: 'quest_lostDelivery_viridian',
    },
    {
      id: 'viridian-edgar',
      name: 'Edgar',
      tileX: 12,
      tileY: 1,
      textureKey: 'npc-oldman',
      facing: 'down',
      dialogue: [
        'Old Man Edgar: Ah, a young trainer!',
        'Edgar: Let me show you how to catch a Pokémon.',
        'Edgar: First, weaken it in battle. Then throw a Poké Ball!',
        'Edgar: It\'s easier if the Pokémon\'s HP is low.',
      ],
      flagDialogue: [
        {
          flag: 'caughtFirstPokemon',
          dialogue: [
            'Old Man Edgar: I see you\'ve caught your first Pokémon!',
            'Edgar: You\'re a natural! Keep at it, young one!',
          ],
        },
      ],
      schedule: {
        morning: { x: 12, y: 1 },
        day: { x: 10, y: 12 },
        evening: { x: 22, y: 17 },
        night: 'hidden',
      },
    }
  ],
  trainers: [],
  objects: [
    {
      id: 'viridian-sign-south',
      tileX: 17,
      tileY: 28,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['VIRIDIAN CITY', '"The Eternally Green Paradise"'] },
    {
      id: 'viridian-repel',
      tileX: 3,
      tileY: 23,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Repel!'],
      givesItem: 'repel',
      requireFlag: 'badge_2',
    },
  ],
  warps: [
    // South exit → Route 1
    { tileX: 14, tileY: 29, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
    { tileX: 15, tileY: 29, targetMap: 'route-1', targetSpawnId: 'from-viridian' },
    // North exit → Route 2 (northeast corner)
    { tileX: 27, tileY: 0, targetMap: 'route-2', targetSpawnId: 'from-viridian' },
    { tileX: 28, tileY: 0, targetMap: 'route-2', targetSpawnId: 'from-viridian' },
    // Building doors
    { tileX: 5, tileY: 4, targetMap: 'viridian-pokecenter', targetSpawnId: 'default' },
    { tileX: 17, tileY: 4, targetMap: 'viridian-pokemart', targetSpawnId: 'default' },
    // House doors
    { tileX: 16, tileY: 19, targetMap: 'viridian-city-house-1', targetSpawnId: 'default' },
    { tileX: 25, tileY: 16, targetMap: 'viridian-city-house-2', targetSpawnId: 'default' },
    // Viridian Gym door (requires 7 badges)
    { tileX: 9, tileY: 15, targetMap: 'viridian-gym', targetSpawnId: 'default', requireFlag: 'badge_7' },
  ],
  spawnPoints: {
    'default':         { x: 14, y: 12, direction: 'up' },
    'from-route-1':    { x: 14, y: 28, direction: 'up' },
    'from-route-2':    { x: 27, y: 1,  direction: 'down' },
    'from-pokecenter': { x: 5, y: 5, direction: 'down' },
    'from-pokemart':   { x: 17, y: 5, direction: 'down' },
    'from-house-1':    { x: 16, y: 20, direction: 'down' },
    'from-house-2':    { x: 25, y: 17, direction: 'down' },
    'from-gym':        { x: 9, y: 16, direction: 'down' },
  },
};
