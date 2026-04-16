import { MapDefinition, parseMap } from '../shared';

const viridianGround = parseMap([
  // 012345678901234567890123456789
  'TTTTTTTTTTTTT.PP.TTTTTTTTTTTTT', // 0  - north exit to Route 2
  'T..............PP............T', // 1
  'T..RRRRR.......PP.......RRRRRT', // 2  - houses
  'T..HH&HH.......PP.......HH&HHT', // 3  - walls with windows
  'T..HHDHH.......PP.......HHDHHT', // 4
  'T....PP........PP........PP..T', // 5
  'T..PPPPPPPPPPPPPPPPPPPPPPPP..T', // 6  - main east-west road
  'T..PP........................T', // 7
  'T..PP....CCCCCC....MMMMMM....T', // 8  - PokéCenter roof / Mart roof
  'T..PP....cccccc....mmmmmm....T', // 9  - PokéCenter wall / Mart wall
  'T..PP....cceccc....mmnmmm....T', // 10 - PokéCenter door / Mart door
  'T..PP......PP........PP......T', // 11
  'T..PP......PP........PP......T', // 12
  'T..PPPPPPPPPPPPPPPPPPPPPPPP..T', // 13 - another east-west road
  'T..PP.........PP.............T', // 14
  'T..PP....AAAAAAPP............T', // 15 - Gym roof
  'T..PP....ggggggPP............T', // 16 - Gym wall
  'T..PP....ggagggPP............T', // 17 - Gym door
  'T..PP......PP..PP............T', // 18
  'T..PP......PP..PP..f....f....T', // 19
  'T..PPPPPPPPPPPPPP............T', // 20
  'T..PP.........PP.............T', // 21
  'T..PP.....f...PP...f.........T', // 22
  'T..PP.........PP.............T', // 23
  'T..PP.........PPWWWW.........T', // 24 - pond
  'T..PP.........PPWWWW.........T', // 25
  'T..PP.........PPWWWW.........T', // 26
  'T..PP.........PP.............T', // 27
  'T..PP.........PP.............T', // 28
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
      textureKey: 'npc-oldman',
      facing: 'down',
      dialogue: ['Route 2 is just north of here.', 'Viridian Forest is beyond that!'],
    },
    // ─── Quest NPC: Collector Magnus ───
    {
      id: 'viridian-magnus',
      tileX: 24,
      tileY: 15,
      textureKey: 'npc-male-4',
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
    // ─── Delivery quest receiver ───
    {
      id: 'viridian-delivery-npc',
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
    'default':         { x: 14, y: 13, direction: 'up' },
    'from-route-1':    { x: 14, y: 28, direction: 'up' },
    'from-route-2':    { x: 14, y: 1,  direction: 'down' },
    'from-pokecenter': { x: 11, y: 11, direction: 'down' },
    'from-pokemart':   { x: 21, y: 11, direction: 'down' },
  },
};
