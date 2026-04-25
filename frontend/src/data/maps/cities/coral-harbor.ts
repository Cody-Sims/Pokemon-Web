import { MapDefinition, parseMap } from '../shared';

// Coral Harbor — Town 3 (25 wide × 30 tall)
// A coastal port town. Gym 2 (Water — Coral), PokéCenter, PokéMart, docks
const coralGround = parseMap([
  'TTTTTTTTTT.PP.TTTTTTTTTTT', // 0  north exit
  'T..........PP..........sT', // 1
  'T.CCCCCCC..PP.........ssT', // 2  center roof
  'T.c$ccccc..PP........sssT', // 3
  'T.ccecccc..PP.......ss7sT', // 4  center door
  'T....PPPPPPPPP.....ss67sT', // 5
  'T....PP..........3.ss7ssT', // 6
  'T.RRRRRRR.PP.......sssssT', // 7  house roof
  'T.HH&HHHH.PP......ssssssT', // 8
  'T.HHHDHHH.PP.....sssWWWWT', // 9  house door
  'T....PPPPPPPP....ss88WWWT', // 10
  'T....PP........ss88888WWT', // 11 dock
  'T.MMMMMM.PP....s888888WWT', // 12 mart roof
  'T.mm&mmm.PP....s888888WWT', // 13
  'T.mmnmmm.PP....ss8888WWWT', // 14 mart door
  'T....PPPPPP.....ssssWWWWT', // 15
  'T....PP.............WWWWT', // 16
  'T.f..PP.....3.......WWWWT', // 17
  'T....PP.............WWWWT', // 18
  'T....PPPPPPP........WWWWT', // 19
  'T....PP....PP.......WWWWT', // 20
  'T.99999999.PP...3.ssWWWWT', // 21 gym (coral)
  'T.9ggg&gg9.PP.....sssWWWT', // 22
  'T.9gggagg9.PP.....ssss.sT', // 23 gym door
  'T.99999999.PP......ss3.sT', // 24
  'T..........PP........sssT', // 25
  'T.f........PP..........sT', // 26
  'T..........PP...........T', // 27
  'T....PP....PP...........T', // 28
  'TTTTTTTTTT.PP.TTTTTTTTTTT', // 29 south exit
]);

export const coralHarbor: MapDefinition = {
  key: 'coral-harbor',
  width: 25,
  height: 30,
  ground: coralGround,
  encounterTableKey: '',
  battleBg: 'bg-harbor',
  displayName: 'Coral Harbor',
  weather: 'rain',
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
      name: 'Townsperson',
      tileX: 8,
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
      name: 'Captain Stern',
      tileX: 14,
      tileY: 10,
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
      name: 'Lena',
      tileX: 16,
      tileY: 16,
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
      name: 'Marco',
      tileX: 8,
      tileY: 19,
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
      name: 'Zara',
      tileX: 10,
      tileY: 17,
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
    { id: 'coral-stern-grunt-2', name: 'Synthesis Grunt', trainerId: 'stern-grunt-2', tileX: 14, tileY: 11, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 3, condition: '!stern-grunt-2' },
    { id: 'coral-stern-grunt-3', name: 'Synthesis Grunt', trainerId: 'stern-grunt-3', tileX: 8, tileY: 18, textureKey: 'npc-grunt', facing: 'up', lineOfSight: 3, condition: '!stern-grunt-3' },
  ],
  warps: [
    // North exit → Route 3
    { tileX: 11, tileY: 0, targetMap: 'route-3', targetSpawnId: 'from-coral' },
    { tileX: 12, tileY: 0, targetMap: 'route-3', targetSpawnId: 'from-coral' },
    // Building doors
    { tileX: 4, tileY: 4, targetMap: 'coral-pokecenter', targetSpawnId: 'default' },
    { tileX: 4, tileY: 14, targetMap: 'coral-pokemart', targetSpawnId: 'default' },
    { tileX: 6, tileY: 23, targetMap: 'coral-gym', targetSpawnId: 'default' },
    { tileX: 5, tileY: 9, targetMap: 'coral-harbor-house-1', targetSpawnId: 'default' },
    // Ferry dock → Shattered Isles
    { tileX: 15, tileY: 11, targetMap: 'shattered-isles-shore', targetSpawnId: 'from-coral-harbor', requireFlag: 'quest_sternEngine_complete' },
    // South exit → Route 4
    { tileX: 5, tileY: 28, targetMap: 'route-4', targetSpawnId: 'from-coral' },
    { tileX: 6, tileY: 28, targetMap: 'route-4', targetSpawnId: 'from-coral' },
  ],
  spawnPoints: {
    'default':           { x: 11, y: 15, direction: 'down' },
    'from-route-3':      { x: 11, y: 1, direction: 'down' },
    'from-route-4':      { x: 5, y: 27, direction: 'up' },
    'from-pokecenter':   { x: 4, y: 5, direction: 'down' },
    'from-pokemart':     { x: 3, y: 15, direction: 'down' },
    'from-gym':          { x: 5, y: 25, direction: 'down' },
    'from-house-1':      { x: 4, y: 10, direction: 'down' },
    'from-shattered-isles': { x: 15, y: 10, direction: 'up' },
  },
};
