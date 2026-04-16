import { MapDefinition, parseMap } from '../shared';

// Ironvale City — Town 4 (25 wide × 30 tall)
// Industrial steel town. Gym 3 (Steel — Ferris), forge, mine entrance
const ironvaleGround = parseMap([
  'TTTTTTTTTT.PP.TTTTTTTTTT', // 0  south exit to Route 4
  'T..........PP..........T', // 1
  'T.CCCCCCC..PP.RRRRRRR..T', // 2  center roof + house roof
  'T.c$ccccc..PP.HH&HHHH..T', // 3
  'T.ccecccc..PP.HHHDHHH..T', // 4
  'T....PP.PPPPPP.........T', // 5
  'T....PP................T', // 6
  'T....PP..MMMMMM........T', // 7  mart
  'T....PP..mm&mmm........T', // 8
  'T....PP..mmnmmm........T', // 9
  'T....PPPPPPPPPPPPPP....T', // 10
  'T....PP................T', // 11
  'T....PP................T', // 12
  'T.f..PP.......f........T', // 13
  'T....PP................T', // 14
  'T....PP................T', // 15
  'T....PPPPPPPPPPPPPP....T', // 16
  'T....PP................T', // 17
  'T.AAAAAAA..PP..........T', // 18 gym roof
  'T.ggg&ggg..PP..........T', // 19 gym wall
  'T.gggaggg..PP..........T', // 20 gym door
  'T..........PP..........T', // 21
  'T....PPPPPPPP..........T', // 22
  'T....PP....PP..........T', // 23
  'T.f..PP....PP..f.......T', // 24
  'T....PP....PP..........T', // 25
  'T....PP....PP..........T', // 26
  'T....PP....PP..........T', // 27
  'T....PP....PP..........T', // 28
  'TTTTTTTTTT.PP.TTTTTTTTTT', // 29 north exit to Route 5
]);

export const ironvaleCity: MapDefinition = {
  key: 'ironvale-city',
  width: 25,
  height: 30,
  ground: ironvaleGround,
  encounterTableKey: '',
  battleBg: 'bg-industrial',
  displayName: 'Ironvale City',
  npcs: [
    {
      id: 'ironvale-sign',
      tileX: 13,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['IRONVALE CITY', '"Forged in Fire and Steel"'],
    },
    {
      id: 'ironvale-npc-1',
      tileX: 18,
      tileY: 6,
      textureKey: 'npc-male-1',
      facing: 'left',
      dialogue: [
        'Ferris is our Gym Leader. He\'s a blacksmith!',
        'His Steel-type Pokémon are tough as nails.',
        'Fire and Ground moves are your best bet.',
      ],
    },
    // Miner Gil (side quest: Mine Clearance)
    {
      id: 'ironvale-gil',
      tileX: 18,
      tileY: 15,
      textureKey: 'npc-hiker',
      facing: 'left',
      dialogue: [
        'Gil: The old mine shaft has been overrun!',
        'Gil: Those Synthesis Collective agents set up shop in there.',
        'Gil: Can you clear them out? I\'ll reward you with a rare stone!',
      ],
      setsFlag: 'quest_mineClearance_started',
      flagDialogue: [
        {
          flag: 'quest_mineClearance_complete',
          dialogue: [
            'Gil: You cleared the mines? Amazing!',
            'Gil: Here — pick any Evolution Stone you want!',
          ],
        },
        {
          flag: 'quest_mineClearance_started',
          dialogue: [
            'Gil: Still working on clearing those agents?',
            'Gil: There should be grunts on three floors.',
          ],
        },
      ],
    },
    // Move Tutor
    { id: 'tutor-ironvale', tileX: 8, tileY: 15, textureKey: 'npc-hiker', facing: 'right',
      dialogue: ['Punch Tutor: I teach the elemental punches and more!', 'Punch Tutor: For a small fee, of course.'],
      interactionType: 'move-tutor', interactionData: 'tutor-ironvale' },
    // Aldric hologram (story event)
    {
      id: 'ironvale-hologram',
      tileX: 12,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A holographic projection flickers to life...',
        'Aldric: Impressive. You\'ve disrupted our operations twice now.',
        'Aldric: But you understand nothing of what we\'re building.',
        'Aldric: Every Pokémon we enhance is freed from weakness.',
        'Aldric: Freed from suffering. From death.',
        'Aldric: You\'ll understand, eventually. They all do.',
        'The hologram fades...',
      ],
      requireFlag: 'found_mines_terminal',
      setsFlag: 'saw_aldric_hologram',
    },
    // Kael — tag-battle partner (story encounter 3)
    {
      id: 'ironvale-kael',
      tileX: 15,
      tileY: 15,
      textureKey: 'rival',
      facing: 'left',
      dialogue: [
        'Kael: Those Synthesis creeps are trying to take the forge!',
        'Kael: I\'m not letting that happen. You with me?',
        'Kael: Let\'s take them down — together!',
      ],
      flagDialogue: [
        {
          flag: 'ironvale_tag_battle_won',
          dialogue: [
            'Kael: Ha! They didn\'t stand a chance against the two of us!',
            'Kael: ...Something about what they\'re doing to Pokémon really bugs me.',
            'Kael: It\'s not right. Pokémon aren\'t lab experiments.',
          ],
        },
      ],
      requireFlag: 'found_mines_terminal',
      setsFlag: 'met_kael_ironvale',
    },
  ],
  trainers: [],
  warps: [
    // South exit → Route 4
    { tileX: 11, tileY: 0, targetMap: 'route-4', targetSpawnId: 'from-ironvale' },
    { tileX: 12, tileY: 0, targetMap: 'route-4', targetSpawnId: 'from-ironvale' },
    // North exit → Route 5 (Canopy Trail)
    { tileX: 11, tileY: 29, targetMap: 'route-5', targetSpawnId: 'from-ironvale' },
    { tileX: 12, tileY: 29, targetMap: 'route-5', targetSpawnId: 'from-ironvale' },
    // Buildings
    { tileX: 4, tileY: 4, targetMap: 'ironvale-pokecenter', targetSpawnId: 'default' },
    { tileX: 11, tileY: 9, targetMap: 'ironvale-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 20, targetMap: 'ironvale-gym', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default':         { x: 12, y: 15, direction: 'up' },
    'from-route-4':    { x: 12, y: 1, direction: 'down' },
    'from-route-5':    { x: 12, y: 28, direction: 'up' },
    'from-pokecenter': { x: 4, y: 5, direction: 'down' },
    'from-pokemart':   { x: 11, y: 10, direction: 'down' },
    'from-gym':        { x: 5, y: 21, direction: 'down' },
  },
};
