import { MapDefinition, parseMap } from '../shared';

const palletGround = parseMap([
  // col: 0         1         2  4
  //      0123456789012345678901234
  'TTTTTTTTTT.PPP.TTTTTTTTTT', // 0  - north exit to Route 1
  'T..........PPP..........T', // 1
  'T.RRRRRRR..PPP..RRRRRRR.T', // 2  - roofs (7 wide)
  'T.HHH&HHH..PPP..HH&HHHH.T', // 3  - walls with windows
  'T.HHHDHHHPPPPPPPHHHDHHH.T', // 4  - doors + path connecting
  'T....PP....PPP....PP....T', // 5  - paths from doors
  'T....PPPPPPPPPPPPPPPPP..T', // 6  - main horizontal path
  'T..........PPP..........T', // 7
  'T..f.......PPP........f.T', // 8  - flowers
  'T..........PPP..........T', // 9
  'T....BBBBBBBBBBBBBBB....T', // 10 - Lab roof
  'T....LLLLLLLLLLLLLLL....T', // 11 - Lab walls
  'T....LLLLLLLELLLLLLL....T', // 12 - Lab door
  'T..........PPP..........T', // 13 - path from lab
  'T.........PPPPP.........T', // 14
  'T..GG.....PPPPP.....GG..T', // 15 - grass patches
  'T..GG.....PPPPP.....GG..T', // 16
  'T..GG..f..PPPPP..f..GG..T', // 17 - grass + flowers
  'T.........PPPPP.........T', // 18
  'T..f......PPPPP......f..T', // 19
  'T.........PPPPP.........T', // 20
  'T.........PPPPP.........T', // 21
  '..........PPPPP..........', // 22 - tree border ends, open south
  'ss.....PPPPPPPPPPPPP..ss3', // 23 - sand, path widens to pier, palm
  'ss7....PP.888888.PP..7ss.', // 24 - wet sand, solid dock platform
  's77....PP.888888.PP.77ssW', // 25 - dock extends south
  'W7s....PP.888888.PP..s7WW', // 26 - dock over shore
  'WW7s...PP.888888.PP.s7WWW', // 27 - dock over water
  'WWW7s..PPPP8888PPPP.s7WWW', // 28 - dock end platform
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 29 - open sea
]);

export const palletTown: MapDefinition = {
  key: 'pallet-town',
  width: 25,
  height: 30,
  ground: palletGround,
  encounterTableKey: '',  // no wild encounters in town
  onEnterCutscene: 'game-intro',
  npcs: [
    {
      id: 'pallet-npc-1',
      name: 'Townsperson',
      tileX: 7,
      tileY: 7,
      textureKey: 'npc-male-1',
      facing: 'down',
      dialogue: [
        'Welcome to Littoral Town!',
        'The breeze from the sea is wonderful here.',
      ],
      behavior: { type: 'look-around' },
    },
    {
      id: 'pallet-npc-2',
      name: 'Townsperson',
      tileX: 18,
      tileY: 9,
      textureKey: 'npc-female-1',
      facing: 'left',
      dialogue: [
        'Prof. Willow\'s Lab is that big building in the south.',
        'He studies Pokémon for a living!',
      ],
    },
    {
      id: 'pallet-pip',
      name: 'Pip',
      tileX: 3,
      tileY: 14,
      textureKey: 'npc-lass',
      facing: 'right',
      dialogue: [
        'Pip: Oh! You\'re a trainer? Perfect!',
        'Pip: I have packages that need delivering to Viridian City and Pewter City.',
        'Pip: I\'d go myself but... well, wild Pokémon scare me!',
        'Pip: Could you help? I\'ll make it worth your while!',
      ],
      setsFlag: 'quest_lostDelivery_started',
      flagDialogue: [
        {
          flag: 'quest_lostDelivery_complete',
          dialogue: [
            'Pip: You delivered everything? Thank you so much!',
            'Pip: Here — take this as a reward!',
            'Pip: ...Between you and me, those packages were supplies',
            'Pip: for people fighting against the Synthesis Collective.',
          ],
        },
        {
          flag: 'quest_lostDelivery_started',
          dialogue: [
            'Pip: Still working on those deliveries?',
            'Pip: One package goes to the PokéMart in Viridian City,',
            'Pip: and one goes to the Museum in Pewter City.',
            'Pip: Come back when you\'ve delivered them both!',
          ],
        },
      ],
    },
    {
      id: 'pallet-wade',
      name: 'Wade',
      tileX: 13,
      tileY: 26,
      textureKey: 'npc-sailor',
      facing: 'down',
      dialogue: [
        'Wade: Beautiful day for fishing, isn\'t it?',
        'Wade: I\'ve been casting a line off this dock for years.',
        'Wade: Here, take this — an Old Rod!',
        'Wade: Find any body of water and you can fish for Pokémon!',
      ],
      setsFlag: 'received_old_rod',
      givesItem: 'old-rod',
      flagDialogue: [
        {
          flag: 'received_old_rod',
          dialogue: [
            'Wade: Caught anything good yet?',
            'Wade: Magikarp are common, but they evolve into Gyarados!',
            'Wade: Keep at it, young trainer!',
          ],
        },
      ],
    },
    {
      id: 'pallet-mom',
      name: 'Mom',
      tileX: 3,
      tileY: 7,
      textureKey: 'npc-mom',
      facing: 'right',
      dialogue: [
        'Mom: Oh sweetie, you look tired!',
        'Mom: Let me heal your Pokémon for you.',
        'Your Pokémon were healed!',
      ],
      interactionType: 'heal',
      flagDialogue: [
        {
          flag: 'enteredHallOfFame',
          dialogue: [
            'Mom: My baby is the Champion! I\'m so proud!',
            'Mom: Your father would be so proud too.',
            'Mom: Let me heal your Pokémon, Champion!',
          ],
        },
      ],
    }
  ],
  trainers: [],
  objects: [
    {
      id: 'pallet-sign-lab',
      tileX: 10,
      tileY: 13,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['OAK POKÉMON RESEARCH LAB'] },
    {
      id: 'pallet-dock-sign',
      tileX: 8,
      tileY: 22,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['LITTORAL TOWN PIER', '"Where the sea breeze begins"'] }
  ],
  warps: [
    // North exit → Route 1
    { tileX: 11, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 12, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 13, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    // Building doors
    { tileX: 5, tileY: 4, targetMap: 'pallet-player-house', targetSpawnId: 'default' },
    { tileX: 19, tileY: 4, targetMap: 'pallet-rival-house', targetSpawnId: 'default' },
    { tileX: 12, tileY: 12, targetMap: 'pallet-oak-lab', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 14, direction: 'up' },
    'from-route-1': { x: 12, y: 1, direction: 'down' },
    'player-house': { x: 5, y: 5, direction: 'down' },
    'from-player-house': { x: 5, y: 5, direction: 'down' },
    'from-rival-house': { x: 19, y: 5, direction: 'down' },
    'from-oak-lab': { x: 12, y: 13, direction: 'down' },
  },
};
