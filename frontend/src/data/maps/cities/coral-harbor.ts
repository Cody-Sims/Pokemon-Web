import { MapDefinition, parseMap } from '../shared';

// Coral Harbor — Town 3 (25 wide × 30 tall)
// A coastal port town. Gym 2 (Water — Coral), PokéCenter, PokéMart, docks
const W = 25;
const pad = (s: string) => s.length < W ? s.slice(0, -1) + '.'.repeat(W - s.length) + s.slice(-1) : s.slice(0, W);
const coralGround = parseMap([
  'TTTTTTTTTT.PP.TTTTTTTTTTTTTT', // 0
  'T..........PP............T', // 1
  'T.CCCCCCC..PP..RRRRRRR..T', // 2
  'T.c$ccccc..PP..HH&HHHH..T', // 3
  'T.cceccccPPPPPPHHHDHHH..T', // 4
  'T....PP..PPPPP.........sT', // 5
  'T....PP..............sssT', // 6
  'T....PP..MMMMMM....sss.T', // 7
  'T....PP..mm&mmm....ss7sT', // 8
  'T....PP..mmnmmm....ss7sT', // 9
  'T....PPPPPPPPPP..ssssssT', // 10
  'T....PP......3..ss888WWT', // 11
  'T.f..PP........s88888WWT', // 12
  'T....PP.......s888888WWT', // 13
  'T....PP.......sssssWWWWT', // 14
  'T....PP...........WWWWWT', // 15
  'T....PPPPPPPPP....WWWWWT', // 16
  'T.........PP......WWWWWT', // 17
  'T.AAAAAAA.PP......WWWWWT', // 18
  'T.ggg&ggg.PP....sssWWWT', // 19
  'T.gggaggg.PP...sssssWWT', // 20
  'T..........PP..ssssssWWT', // 21
  'T....PPPPPPPP.....sss.T', // 22
  'T....PP..............ssT', // 23
  'T.f..PP........3.....sT', // 24
  'T....PP..............ssT', // 25
  'T....PP...............sT', // 26
  'T....PP...............sT', // 27
  'T....PP...............sT', // 28
  'TTTTTTTTTT.PP.TTTTTTTTTTTTTT', // 29
].map(r => pad(r)));

export const coralHarbor: MapDefinition = {
  key: 'coral-harbor',
  width: 25,
  height: 30,
  ground: coralGround,
  encounterTableKey: '',
  battleBg: 'bg-harbor',
  displayName: 'Coral Harbor',
  npcs: [
    {
      id: 'coral-sign',
      tileX: 15,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['CORAL HARBOR', '"Where the Tides Meet the Shore"'],
    },
    {
      id: 'coral-npc-1',
      tileX: 22,
      tileY: 6,
      textureKey: 'npc-male-5',
      facing: 'left',
      dialogue: [
        'Coral is the Gym Leader here!',
        'She\'s a surfer who uses Water-type Pokémon.',
        'Grass and Electric moves work great against her!',
      ],
    },
    // ─── Captain Stern (ferry quest) ───
    {
      id: 'coral-stern',
      tileX: 22,
      tileY: 12,
      textureKey: 'npc-sailor',
      facing: 'down',
      dialogue: [
        'Captain Stern: Ahoy! I\'m Captain Stern.',
        'Captain Stern: My ferry used to run to the eastern islands...',
        'Captain Stern: But some ruffians stole my engine parts!',
        'Captain Stern: If you find them, I\'ll give you passage.',
      ],
      setsFlag: 'quest_sternEngine_started',
      flagDialogue: [
        {
          flag: 'quest_sternEngine_complete',
          dialogue: [
            'Captain Stern: The ferry is up and running!',
            'Captain Stern: Come back anytime you need a ride.',
          ],
        },
        {
          flag: 'quest_sternEngine_started',
          dialogue: [
            'Captain Stern: Still missing those engine parts...',
            'Captain Stern: The thieves headed toward Route 3.',
          ],
        },
      ],
    },
    // ─── Diver Lena (Good Rod) ───
    {
      id: 'coral-lena',
      tileX: 26,
      tileY: 15,
      textureKey: 'npc-swimmer',
      facing: 'left',
      dialogue: [
        'Diver Lena: Hey there, landlubber!',
        'Diver Lena: You look like someone who appreciates the sea.',
        'Diver Lena: Here — take this Good Rod!',
        'Diver Lena: You can catch better Water Pokémon with it.',
      ],
      setsFlag: 'receivedGoodRod',
    },
    // ─── Chef Marco (Berry quest) ───
    {
      id: 'coral-marco',
      tileX: 8,
      tileY: 17,
      textureKey: 'npc-male-6',
      facing: 'right',
      dialogue: [
        'Chef Marco: Welcome to my seaside kitchen!',
        'Chef Marco: I make the best Pokémon food in Aurum...',
        'Chef Marco: But I need rare Berries for my recipes!',
        'Chef Marco: Bring me 5 different Berry types and I\'ll cook something special.',
      ],
      setsFlag: 'quest_chef_started',
      flagDialogue: [
        {
          flag: 'quest_chef_complete',
          dialogue: [
            'Chef Marco: Your Pokémon loved the meal!',
            'Chef Marco: Come back anytime!',
          ],
        },
        {
          flag: 'quest_chef_started',
          dialogue: [
            'Chef Marco: Still gathering Berries?',
            'Chef Marco: I need 5 different types!',
          ],
        },
      ],
    },
    // ─── Zara Lux disguised appearance ───
    {
      id: 'coral-zara-disguise',
      tileX: 10,
      tileY: 5,
      textureKey: 'npc-female-6',
      facing: 'down',
      dialogue: [
        'Philanthropist: Oh, hello! I\'m just a traveling philanthropist.',
        'Philanthropist: I donated supplies to the Pokémon Center today!',
        'Philanthropist: I believe in helping Pokémon reach their full potential.',
        'Philanthropist: ...Every last one of them.',
      ],
      setsFlag: 'met_zara_disguise',
    },
  ],
  trainers: [
    // Stern Engine quest grunts (docks & beach)
    { id: 'coral-stern-grunt-2', trainerId: 'stern-grunt-2', tileX: 20, tileY: 11, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 3, condition: '!stern-grunt-2' },
    { id: 'coral-stern-grunt-3', trainerId: 'stern-grunt-3', tileX: 18, tileY: 20, textureKey: 'npc-grunt', facing: 'up', lineOfSight: 3, condition: '!stern-grunt-3' },
  ],
  warps: [
    // North exit → Route 3
    { tileX: 11, tileY: 0, targetMap: 'route-3', targetSpawnId: 'from-coral' },
    { tileX: 12, tileY: 0, targetMap: 'route-3', targetSpawnId: 'from-coral' },
    // Building doors
    { tileX: 4, tileY: 4, targetMap: 'coral-pokecenter', targetSpawnId: 'default' },
    { tileX: 11, tileY: 9, targetMap: 'coral-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 20, targetMap: 'coral-gym', targetSpawnId: 'default' },
    // Ferry dock → Shattered Isles
    { tileX: 22, tileY: 14, targetMap: 'shattered-isles-shore', targetSpawnId: 'from-coral-harbor', requireFlag: 'quest_sternEngine_complete' },
    // South exit → Route 4
    { tileX: 4, tileY: 28, targetMap: 'route-4', targetSpawnId: 'from-coral' },
    { tileX: 5, tileY: 28, targetMap: 'route-4', targetSpawnId: 'from-coral' },
  ],
  spawnPoints: {
    'default':           { x: 11, y: 15, direction: 'down' },
    'from-route-3':      { x: 11, y: 1, direction: 'down' },
    'from-route-4':      { x: 5, y: 27, direction: 'up' },
    'from-pokecenter':   { x: 4, y: 5, direction: 'down' },
    'from-pokemart':     { x: 11, y: 10, direction: 'down' },
    'from-gym':          { x: 5, y: 21, direction: 'down' },
    'from-shattered-isles': { x: 22, y: 13, direction: 'up' },
  },
};
