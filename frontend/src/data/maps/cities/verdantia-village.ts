import { MapDefinition, parseMap } from '../shared';

// Verdantia Village — Town 5 (25 wide × 25 tall)
// Peaceful herbalist village. Gym 4 (Grass — Ivy)
const verdantiaGround = parseMap([
  'XXXXXXXX.PP.XXXXXXXXXXXX', // 0  north exit to Route 5
  'X........PP............X', // 1
  'X.CCCCCCCPP..RRRRRRR..X', // 2  center + house
  'X.c$cccccPP..HH&HHHH..X', // 3
  'X.cceccc.PP..HHHDHHH..X', // 4
  'X....PP.PPPPPP........X', // 5
  'X....PP...........5555X', // 6  light grass
  'X....PP..MMMMMM..5555.X', // 7
  'X....PP..mm&mmm..555f.X', // 8
  'X....PP..mmnmmm..5555.X', // 9
  'X....PPPPPPPPPPPP.....X', // 10
  'X....PP......55555....X', // 11
  'X.f..PP.....555555..f.X', // 12
  'X....PP......55555....X', // 13
  'X....PP..............GX', // 14
  'X....PPPPPPPPP.......GX', // 15
  'X.........PP.........GX', // 16
  'X.AAAAAAA.PP..........X', // 17  gym
  'X.ggg&ggg.PP..........X', // 18
  'X.gggaggg.PP..........X', // 19
  'X.........PP..........X', // 20
  'X..f......PP......f...X', // 21
  'X.........PP..........X', // 22
  'X.........PP..........X', // 23
  'XXXXXXXX.PP.XXXXXXXXXXXX', // 24  south border
]);

export const verdantiaVillage: MapDefinition = {
  key: 'verdantia-village',
  width: 25,
  height: 25,
  ground: verdantiaGround,
  encounterTableKey: '',
  battleBg: 'bg-forest',
  displayName: 'Verdantia Village',
  onEnterCutscene: 'willow-kidnapping',
  onEnterCutsceneRequireFlag: 'defeatedIvy',
  npcs: [
    {
      id: 'verdantia-sign',
      tileX: 12,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['VERDANTIA VILLAGE', '"Where Life Takes Root"'],
    },
    {
      id: 'verdantia-npc-1',
      tileX: 18,
      tileY: 6,
      textureKey: 'npc-female-2',
      facing: 'left',
      dialogue: [
        'Ivy is our Gym Leader. She runs the sanctuary.',
        'Her Grass-type Pokémon are deeply connected to nature.',
        'Be careful — her Sleep Powder strategy is brutal!',
      ],
    },
    // Elder Moss (Aether lore)
    {
      id: 'verdantia-moss',
      tileX: 14,
      tileY: 12,
      textureKey: 'npc-oldman',
      facing: 'down',
      dialogue: [
        'Elder Moss: Ah, young trainer...',
        'Elder Moss: Do you know the legend of Solatheon?',
        'Elder Moss: It is said a great guardian sleeps beneath the ley lines.',
        'Elder Moss: It protected this region for millennia...',
        'Elder Moss: But if the Aether is disturbed, it may awaken.',
        'Elder Moss: And it will not distinguish friend from foe.',
        'Elder Moss: Take this — an Amulet Coin. May it bring you fortune.',
      ],
      setsFlag: 'heard_solatheon_legend',
    },
    // Berry Farmer Hana (quest)
    {
      id: 'verdantia-hana',
      tileX: 20,
      tileY: 11,
      textureKey: 'npc-female-5',
      facing: 'left',
      dialogue: [
        'Hana: Welcome to my berry garden!',
        'Hana: I\'m trying to plant berry trees across the region.',
        'Hana: Could you help tend them?',
        'Hana: Plant berries on Route 1, Route 2, and Viridian Forest!',
      ],
      setsFlag: 'quest_berryFarming_started',
      flagDialogue: [
        {
          flag: 'quest_berryFarming_complete',
          dialogue: [
            'Hana: The berry trees are thriving! Thank you!',
            'Hana: Here — take these rare berries as thanks!',
          ],
        },
        {
          flag: 'quest_berryFarming_started',
          dialogue: [
            'Hana: Still planting? Don\'t forget — Route 1, Route 2, and Viridian Forest!',
          ],
        },
      ],
    },
    // Move Tutor
    { id: 'tutor-verdantia', tileX: 6, tileY: 12, textureKey: 'npc-oldman', facing: 'right',
      dialogue: ['Move Tutor: I can teach your Pokémon powerful Grass-type moves!', 'Move Tutor: All I ask for are Heart Scales.'],
      interactionType: 'move-tutor', interactionData: 'tutor-verdantia' },
    // Dragon's Lament quest: herb pickup
    { id: 'verdantia-herb', tileX: 18, tileY: 8, textureKey: 'generic-trainer', facing: 'down',
      dialogue: ['A rare medicinal herb grows here...', 'You gathered the Aether Herb for the salve!'],
      requireFlag: '!dragon-herb-found', setsFlag: 'dragon-herb-found' },
    // Name Rater
    {
      id: 'name-rater',
      tileX: 7,
      tileY: 12,
      textureKey: 'npc-oldman',
      facing: 'right',
      dialogue: [
        'I am the Name Rater!',
        'I can judge the names of your Pokémon.',
        'Would you like me to rename one?',
      ],
      interactionType: 'name-rater',
    },
  ],
  trainers: [],
  warps: [
    // North exit → Route 5
    { tileX: 9, tileY: 0, targetMap: 'route-5', targetSpawnId: 'from-verdantia' },
    { tileX: 10, tileY: 0, targetMap: 'route-5', targetSpawnId: 'from-verdantia' },
    // Buildings
    { tileX: 4, tileY: 4, targetMap: 'verdantia-pokecenter', targetSpawnId: 'default' },
    { tileX: 11, tileY: 9, targetMap: 'verdantia-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 19, targetMap: 'verdantia-gym', targetSpawnId: 'default' },
    // South exit → Voltara City
    { tileX: 9, tileY: 24, targetMap: 'voltara-city', targetSpawnId: 'from-verdantia' },
    { tileX: 10, tileY: 24, targetMap: 'voltara-city', targetSpawnId: 'from-verdantia' },
    // Hidden lab entrance (behind Giant Root near gym area)
    { tileX: 23, tileY: 14, targetMap: 'verdantia-lab', targetSpawnId: 'from-verdantia-village', requireFlag: 'defeatedIvy' },
  ],
  spawnPoints: {
    'default':          { x: 10, y: 12, direction: 'up' },
    'from-verdantia-lab': { x: 22, y: 14, direction: 'left' },
    'from-route-5':     { x: 10, y: 1, direction: 'down' },
    'from-voltara':     { x: 10, y: 23, direction: 'up' },
    'from-pokecenter':  { x: 4, y: 5, direction: 'down' },
    'from-pokemart':    { x: 11, y: 10, direction: 'down' },
    'from-gym':         { x: 5, y: 20, direction: 'down' },
  },
};
