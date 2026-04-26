import { MapDefinition, parseMap } from '../shared';

// Ironvale City — Town 4 (24 wide × 30 tall)
// Industrial terraced mountain town. Gym 3 (Steel — Ferris), central forge, mine hint
// Biome: CLIFF_FACE (^), CAVE_FLOOR (,), CAVE_WALL (;)
//        METAL_FLOOR (Ʃ), METAL_WALL (Ɯ), PIPE (π), GEAR (Ω)
const ironvaleGround = parseMap([
  'T^^TTTTTTT.PP.TTTTTTT^^T', // 0  south exit → Route 4
  '^..........PP..........^', // 1
  '^.CCCCCCC..PP..RRRRRR..^', // 2  center roof (NW) + house roof (NE)
  '^.c$ccccc..PP..HH&HHH..^', // 3  center wall + house wall
  '^.ccecccc..PP..HHDHHH..^', // 4  center door (4) + house door (17)
  '^..........PP..........^', // 5
  '^..PPPPPPPPPP..........^', // 6  upper terrace path
  '^....ƩΩƩƩƩƩPPƩƩƩƩΩπ....^', // 7  forge north: gears + pipe
  '^....ƩƩƩƩƩƩPPƩƩƩƩƩπ....^', // 8  forge floor
  '^....ƩπƩΩƩƩPPƩƩΩƩπƩ....^', // 9  forge south: pipes + gears
  '^....ƩƩƩƩƩƩPPƩƩƩƩƩf....^', // 10 forge exit + flower
  'T.PPPPPPPPPPPPPPPPPP.^^T', // 11 mid terrace path
  '^.MMMMMM...PP..........^', // 12 mart roof (mid W)
  '^.mm&mmm...PP..........^', // 13 mart wall
  '^.mmnmmm...PP..........^', // 14 mart door (4)
  '^..........PP..........^', // 15
  '^..PPPPPPPPPP..........^', // 16 connecting path
  '^..........PP.....,,;..^', // 17 mine hint NE
  '^..........PP....,,,,;.^', // 18 cave floor + wall
  '^..........PP.....,,;..^', // 19 mine hint
  '^....ƩƩƩπƩƩPPƩƩπƩƩƩ....^', // 20 metal walkway
  'T^^PPPPPPPPPPPPPPPP..^^T', // 21 lower terrace path
  '^.AAAAAAA..PP..........^', // 22 gym roof (lower SW)
  '^.ggg&ggg..PP..........^', // 23 gym wall
  '^.gggaggg..PP..f.......^', // 24 gym door (5)
  '^..........PP..........^', // 25
  '^..PPPPPPPPPP..........^', // 26
  '^..........PP..........^', // 27
  '^..........PP..........^', // 28
  'T^^TTTTTTT.PP.TTTTTTT^^T', // 29 north exit → Route 5
]);

export const ironvaleCity: MapDefinition = {
  key: 'ironvale-city',
  width: 24,
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
      textureKey: 'sign-post',
      facing: 'down',
      dialogue: ['IRONVALE CITY', '"Forged in Fire and Steel"'],
    },
    {
      id: 'ironvale-npc-1',
      name: 'Townsperson',
      tileX: 16,
      tileY: 6,
      textureKey: 'npc-male-1',
      facing: 'left',
      dialogue: [
        'Ferris is our Gym Leader. He\'s a blacksmith!',
        'His Steel-type Pokémon are tough as nails.',
        'Fire and Ground moves are your best bet.',
      ],
    },
    // Miner Gil (side quest: Mine Clearance) — near mine entrance
    {
      id: 'ironvale-gil',
      name: 'Gil',
      tileX: 18,
      tileY: 17,
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
    // Move Tutor — on forge terrace
    { id: 'tutor-ironvale', name: 'Move Tutor', tileX: 7, tileY: 10, textureKey: 'npc-hiker', facing: 'right',
      dialogue: ['Punch Tutor: I teach the elemental punches and more!', 'Punch Tutor: For a small fee, of course.'],
      interactionType: 'move-tutor', interactionData: 'tutor-ironvale' },
    // Aldric hologram (story event) — central forge area
    {
      id: 'ironvale-hologram',
      tileX: 10,
      tileY: 9,
      textureKey: 'sign-post',
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
      name: 'Kael',
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
          flag: 'defeatedKael3',
          dialogue: [
            'Kael: Ha! They didn\'t stand a chance against the two of us!',
            'Kael: ...Something about what they\'re doing to Pokémon really bugs me.',
            'Kael: It\'s not right. Pokémon aren\'t lab experiments.',
          ],
        },
      ],
      requireFlag: 'found_mines_terminal',
      setsFlag: 'met_kael_ironvale',
      interactionType: 'tag-battle',
      interactionData: 'rival-3|synthesis-grunt-ironvale-1|synthesis-grunt-ironvale-2|defeatedKael3',
    },
    // ─── Blacksmith's Apprentice (forge area) ───
    {
      id: 'ironvale-apprentice',
      name: 'Apprentice',
      tileX: 8,
      tileY: 8,
      textureKey: 'npc-male-5',
      facing: 'right',
      dialogue: [
        'Apprentice: I work at Ferris\'s forge!',
        'Apprentice: He\'s teaching me to craft held items for Pokémon.',
        'Apprentice: After you beat the Gym, come back!',
        'Apprentice: I might be able to reforge your items into something stronger.',
      ],
      flagDialogue: [
        {
          flag: 'defeatedFerris',
          dialogue: [
            'Apprentice: You beat Ferris? Amazing!',
            'Apprentice: I can now reforge your held items.',
            'Apprentice: Bring me a Metal Coat and I\'ll upgrade it!',
          ],
        },
      ],
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
    { tileX: 4, tileY: 14, targetMap: 'ironvale-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 24, targetMap: 'ironvale-gym', targetSpawnId: 'default' },
    { tileX: 17, tileY: 4, targetMap: 'ironvale-city-house-1', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default':         { x: 12, y: 15, direction: 'up' },
    'from-route-4':    { x: 12, y: 1, direction: 'down' },
    'from-route-5':    { x: 12, y: 28, direction: 'up' },
    'from-pokecenter': { x: 4, y: 5, direction: 'down' },
    'from-pokemart':   { x: 4, y: 15, direction: 'down' },
    'from-gym':        { x: 5, y: 25, direction: 'down' },
    'from-house-1':    { x: 17, y: 5, direction: 'down' },
  },
};
