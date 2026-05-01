import { MapDefinition, parseMap } from '../shared';

// ═══ Littoral Town (Phase 1 of docs/Map-improvements.md) ═══
// Crescent-shaped seaside town hugging a curved bay.
// Layout intent:
//   • NW corner: shallow inland cliff face (^) with a CUT_TREE alcove
//     hiding a Potion (post-Badge-2 reward).
//   • Two houses (player, rival) on a raised lawn with flower yards.
//   • Oak's Lab sits on a low platform south of the town crossroads.
//   • Southern coast bends into a C-bay: dock juts EAST of center, sandy
//     beach curves around to the SW where TIDE_POOLS (6/7) replace open water.
//   • Wade's dock has a rowboat sign-object at the end as a visual anchor.
const palletGround = parseMap([
  // col: 0         1         2  4
  //      0123456789012345678901234
  'X^^^TTTTTT.PPP.TTTTTTTTTT', // 0  - inland cliff NW; north exit to Route 1
  '^^...........PPP........T', // 1
  '^.>RRRRRRR...PPP.RRRRRRRT', // 2  - CUT_TREE; player roof 3-9; rival roof 17-23
  '^..HHH&HHH...PPP.HHH&HHHT', // 3  - walls with windows
  'T..HHHDHHH...PPP.HHHDHHHT', // 4  - single main doors only: player col 6; rival col 20
  'T.....P......PPP....P...T', // 5  - one-tile door approaches, no side entrances
  'T.....PPPP.PPPP...PPP...T', // 6  - crooked courtyard connector, not a rectangle
  'T..ff......PPP..........T', // 7  - player house yard: flower garden
  'T..ffff....PPP........f.T', // 8  - garden continues
  'T..f.f.....PPP..........T', // 9  - garden tail
  'T..........PPP..........T', // 10
  'T....BBBBBBBBBBBBBBB....T', // 11 - Lab roof
  'T....LLLLLLLLLLLLLLL....T', // 12 - Lab walls
  'T....LLLLLLLELLLLLLL....T', // 13 - Lab door (col 12)
  'T...........P...........T', // 14 - one-tile path directly below lab door
  'T..GG.....PPPPP.....GG..T', // 15 - grass patches
  'T..GG.....PPPPP.....GG..T', // 16
  'T..GG..f..PPPPP..f..GG..T', // 17 - grass + flowers
  'T.........PPPPP.........T', // 18
  'T..f......PPPPP......f..T', // 19
  'T....~....PPPPP.........T', // 20 - lone rock landmark
  'T.........PPPPPPP.......T', // 21 - path branches east toward dock
  '......~..PPPPPPPPPPP....T', // 22 - tree border ends; dock approach widens east
  'ss.....ssssssss888PPP....', // 23 - sandy beach (curves east); dock at col 15-17
  's7s..ss77ss777sss888PPP..', // 24 - wet sand; dock columns extend south
  's77s67s7677666ssss888P...', // 25 - tide pools cluster SW; dock continues
  's766776677677WWWsss8888..', // 26 - dense tide pools meet open water
  'WW7676677WWWWWWWWss8888..', // 27 - water expands east
  'WWWWWWWWWWWWWWWWWWss88888', // 28 - dock juts further out east
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 29 - open sea
]);

export const palletTown: MapDefinition = {
  key: 'pallet-town',
  // BUG-014: every NPC, sign, and route refers to this town as Littoral Town,
  // so set the HUD label / banner to match the in-world name.
  displayName: 'Littoral Town',
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
      tileX: 20,
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
      schedule: {
        morning: { x: 20, y: 26 },   // at the dock early
        day: { x: 20, y: 26 },        // fishing all day
        evening: { x: 7, y: 7 },      // heads into town in the evening
        night: 'hidden',               // goes home at night
      },
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
      tileY: 14,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['OAK POKÉMON RESEARCH LAB'] },
    {
      id: 'pallet-dock-sign',
      tileX: 14,
      tileY: 22,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['LITTORAL TOWN PIER', '"Where the sea breeze begins"'] },
    // ─── Hidden Potion behind the CUT_TREE at (2, 2) — post-Cut reward. ───
    {
      id: 'pallet-cut-alcove-potion',
      tileX: 2,
      tileY: 1,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Potion!'] }
  ],
  warps: [
    // North exit → Route 1
    { tileX: 11, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 12, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    { tileX: 13, tileY: 0, targetMap: 'route-1', targetSpawnId: 'from-pallet' },
    // Building doors
    { tileX: 6, tileY: 4, targetMap: 'pallet-player-house', targetSpawnId: 'default' },
    { tileX: 20, tileY: 4, targetMap: 'pallet-rival-house', targetSpawnId: 'default' },
    { tileX: 12, tileY: 13, targetMap: 'pallet-oak-lab', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 14, direction: 'up' },
    'from-route-1': { x: 12, y: 1, direction: 'down' },
    'player-house': { x: 6, y: 5, direction: 'down' },
    'from-player-house': { x: 6, y: 5, direction: 'down' },
    'from-rival-house': { x: 20, y: 5, direction: 'down' },
    'from-oak-lab': { x: 12, y: 14, direction: 'down' },
  },
};
