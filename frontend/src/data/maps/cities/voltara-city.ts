import { MapDefinition, parseMap } from '../shared';

// Voltara City — Town 6 (25 wide × 30 tall)
// Industrial/tech city. Gym 5 (Electric — Blitz), Power Plant
const voltaraGround = parseMap([
  'TTTTTTTTTT.PP.TTTTTTTTTT', // 0  south exit
  'T..........PP..........T', // 1
  'T.CCCCCCC..PP.RRRRRRR..T', // 2  center + house
  'T.c$ccccc..PP.HH&HHHH..T', // 3
  'T.ccecccc..PP.HHHDHHH..T', // 4
  'T....PP.PPPPPP.........T', // 5
  'T....PP................T', // 6
  'T....PP...MMMMMM.......T', // 7  mart
  'T....PP...mm&mmm.......T', // 8
  'T....PP...mmnmmm.......T', // 9
  'T....PPPPPPPPPPPPPP....T', // 10
  'T....PP................T', // 11
  'T.f..PP.....f..........T', // 12
  'T....PP................T', // 13
  'T....PP................T', // 14
  'T....PPPPPPPPPPPPPP....T', // 15
  'T....PP................T', // 16
  'T....PP................T', // 17
  'T.AAAAAAA..PP..........T', // 18  gym
  'T.ggg&ggg..PP..........T', // 19
  'T.gggaggg..PP..........T', // 20
  'T..........PP..........T', // 21
  'T....PPPPPPPP..........T', // 22
  'T....PP....PP..........T', // 23
  'T.f..PP....PP..f.......T', // 24
  'T....PP....PP..........T', // 25
  'T....PP....PP..........T', // 26
  'T....PP....PP..........T', // 27
  'T....PP....PP..........T', // 28
  'TTTTTTTTTT.PP.TTTTTTTTTT', // 29 north border
]);

export const voltaraCity: MapDefinition = {
  key: 'voltara-city',
  width: 25,
  height: 30,
  ground: voltaraGround,
  encounterTableKey: '',
  battleBg: 'bg-industrial',
  displayName: 'Voltara City',
  npcs: [
    {
      id: 'voltara-sign',
      tileX: 13,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['VOLTARA CITY', '"The City That Never Sleeps"'],
    },
    {
      id: 'voltara-npc-1',
      tileX: 18,
      tileY: 6,
      textureKey: 'npc-male-2',
      facing: 'left',
      dialogue: [
        'Blitz is our Gym Leader — he\'s a genius inventor!',
        'His Electric Pokémon are powered by Aether conduits.',
        'Ground-type moves are your only hope!',
      ],
    },
    // Engineer Sparks (power restoration quest)
    {
      id: 'voltara-sparks',
      tileX: 18,
      tileY: 14,
      textureKey: 'npc-scientist',
      facing: 'left',
      dialogue: [
        'Sparks: The city\'s Aether conduits are failing!',
        'Sparks: Someone has been tapping our power grid remotely.',
        'Sparks: I need to repair 3 conduits around the city.',
        'Sparks: Help me and I\'ll give you a Thunderstone!',
      ],
      setsFlag: 'quest_powerRestore_started',
      flagDialogue: [
        {
          flag: 'quest_powerRestore_complete',
          dialogue: [
            'Sparks: Power is restored! The grid is secure.',
            'Sparks: Here — a Thunderstone and TM Thunderbolt!',
            'Sparks: I traced the power drain to an island east of here...',
            'Sparks: That\'s where their HQ must be.',
          ],
        },
        {
          flag: 'quest_powerRestore_started',
          dialogue: [
            'Sparks: Still working on those conduits?',
            'Sparks: Check near the Gym, the PokéCenter, and the north gate.',
          ],
        },
      ],
    },
    // Move Tutor Bolt
    {
      id: 'voltara-bolt',
      tileX: 8,
      tileY: 17,
      textureKey: 'npc-male-4',
      facing: 'right',
      dialogue: [
        'Bolt: I\'m a Move Tutor. I can teach powerful moves!',
        'Bolt: Bring me colored shards from dungeons',
        'Bolt: and I\'ll teach your Pokémon a new trick.',
      ],
    },
    // Story: Blitz discovers Collective is tapping the grid
    {
      id: 'voltara-blitz-story',
      tileX: 12,
      tileY: 12,
      textureKey: 'npc-gym-blitz',
      facing: 'down',
      dialogue: [
        'Blitz: I\'ve been running diagnostics all night!',
        'Blitz: Someone is siphoning power from my grid!',
        'Blitz: I traced the signal to coordinates in the eastern sea.',
        'Blitz: That must be where the Synthesis Collective operates.',
        'Blitz: After you beat my Gym, I\'ll share what I know.',
      ],
      requireFlag: 'saw_aldric_hologram',
      setsFlag: 'blitz_hq_discovery',
    },
    // Story: Professor Willow kidnapping
    {
      id: 'voltara-willow-kidnap',
      tileX: 10,
      tileY: 6,
      textureKey: 'npc-professor',
      facing: 'down',
      dialogue: [
        'A scientist runs up to you, panicked!',
        '"Professor Willow has been taken!"',
        '"People in white coats — they grabbed her and her research!"',
        '"They said they needed her ley-line maps..."',
        '"You have to help her!"',
      ],
      requireFlag: 'blitz_hq_discovery',
      setsFlag: 'willow_kidnapped',
    },
  ],
  trainers: [],
  warps: [
    // South exit → Verdantia Village (connected via short route)
    { tileX: 11, tileY: 0, targetMap: 'verdantia-village', targetSpawnId: 'from-voltara' },
    { tileX: 12, tileY: 0, targetMap: 'verdantia-village', targetSpawnId: 'from-voltara' },
    // Buildings
    { tileX: 4, tileY: 4, targetMap: 'voltara-pokecenter', targetSpawnId: 'default' },
    { tileX: 12, tileY: 9, targetMap: 'voltara-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 20, targetMap: 'voltara-gym', targetSpawnId: 'default' },
    // North exit → Route 6
    { tileX: 11, tileY: 29, targetMap: 'route-6', targetSpawnId: 'from-voltara' },
    { tileX: 12, tileY: 29, targetMap: 'route-6', targetSpawnId: 'from-voltara' },
  ],
  spawnPoints: {
    'default':          { x: 12, y: 15, direction: 'up' },
    'from-verdantia':   { x: 12, y: 1, direction: 'down' },
    'from-route-6':     { x: 12, y: 28, direction: 'up' },
    'from-pokecenter':  { x: 4, y: 5, direction: 'down' },
    'from-pokemart':    { x: 12, y: 10, direction: 'down' },
    'from-gym':         { x: 5, y: 21, direction: 'down' },
  },
};
