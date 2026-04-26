import { MapDefinition, parseMap } from '../shared';

// Voltara City — Town 6 (24 wide × 30 tall)
// Neon-lit tech hub. Gym 5 (Electric — Blitz), Conduit network
// Biome tiles: ¥=CONDUIT, ¦=ELECTRIC_PANEL, §=WIRE_FLOOR,
//              Ʃ=METAL_FLOOR, Ɯ=METAL_WALL
const voltaraGround = parseMap([
  'ƜƜƜƜƜƜƜƜƜƜ¥PP¥ƜƜƜƜƜƜƜƜƜƜ', // 0  south exit
  'Ɯ§§.......¥PP¥.......§§Ɯ', // 1  entry avenue
  'Ɯ§.¦.....¥¥PP¥¥.....¦.§Ɯ', // 2  conduit approach + panels
  'Ɯ.¥¥¥¥¥¥¥¥¥PP¥¥¥¥¥¥¥¥¥.Ɯ', // 3  east-west conduit channel
  'Ɯ..§§§.§§§.PP.§§§.§§§..Ɯ', // 4  wire floor promenade
  'Ɯ.CCCCCCC.¥PP¥.MMMMMM..Ɯ', // 5  PokéCenter (NW) + Mart (NE)
  'Ɯ.c$ccccc.¥PP¥.mm&mmm..Ɯ', // 6  walls + windows
  'Ɯ.ccecccc.¥PP¥.mmnmmm..Ɯ', // 7  doors (PC col4, Mart col17)
  'Ɯ.f..¦§§§¥¥PP¥¥§§..¦.f.Ɯ', // 8  tech alley + panels
  'Ɯ§.........PP.........§Ɯ', // 9  open transition
  'Ɯ§.¦ƩƩƩƩƩƩƩƩƩƩƩƩƩƩƩƩ¦.§Ɯ', // 10 tech plaza north edge
  'Ɯ.¥ƩƩƩ¥ƩƩƩ¥ƩƩ¥ƩƩƩ¥ƩƩƩ¥.Ɯ', // 11 conduit grid
  'Ɯ.¥Ʃ¦ƩƩƩ¥¥¥ƩƩ¥¥¥ƩƩƩ¦Ʃ¥.Ɯ', // 12 conduit hub arms
  'Ɯ.¥ƩƩƩ¥¥¥ƩƩƩƩƩƩ¥¥¥ƩƩƩ¥.Ɯ', // 13 hub center (open cross)
  'Ɯ.¥Ʃ¦ƩƩƩ¥¥¥ƩƩ¥¥¥ƩƩƩ¦Ʃ¥.Ɯ', // 14 conduit hub arms
  'Ɯ.¥ƩƩƩ¥ƩƩƩ¥ƩƩ¥ƩƩƩ¥ƩƩƩ¥.Ɯ', // 15 conduit grid
  'Ɯ§.¦ƩƩƩƩƩƩƩƩƩƩƩƩƩƩƩƩ¦.§Ɯ', // 16 tech plaza south edge
  'Ɯ§..§§....¥PP¥..RRRRRRRƜ', // 17 house roof (east)
  'Ɯ§........¥PP¥..HH&HHHHƜ', // 18 house wall
  'Ɯ.........¥PP¥..HHHDHHHƜ', // 19 house door (col19)
  'Ɯ§.¦..§§..¥PP¥......¦.§Ɯ', // 20 transition + panels
  'Ɯ¥¥¥¥¥¥¥¥¥¥PP¥¥¥¥¥¥¥¥¥¥Ɯ', // 21 conduit ring (gym approach)
  'Ɯ¥.AAAAAAA.PP...§§§...¥Ɯ', // 22 gym roof (cols 3-9)
  'Ɯ¥.ggg&ggg.PP...§§§...¥Ɯ', // 23 gym wall + window
  'Ɯ¥.gggaggg.PP.¦..§..¦.¥Ɯ', // 24 gym door (col6)
  'Ɯ¥¥¥¥¥¥¥¥¥¥PP¥¥.......¥Ɯ', // 25 conduit channel south
  'Ɯ§..f.....¥PP¥.....f..§Ɯ', // 26 green pocket
  'Ɯ§........¥PP¥........§Ɯ', // 27 north approach
  'Ɯ§§.......¥PP¥.......§§Ɯ', // 28 north approach
  'ƜƜƜƜƜƜƜƜƜƜ¥PP¥ƜƜƜƜƜƜƜƜƜƜ', // 29 north exit
]);

export const voltaraCity: MapDefinition = {
  key: 'voltara-city',
  width: 24,
  height: 30,
  ground: voltaraGround,
  encounterTableKey: '',
  battleBg: 'bg-industrial',
  displayName: 'Voltara City',
  npcs: [
    {
      id: 'voltara-sign',
      tileX: 14,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['VOLTARA CITY', '"The City That Never Sleeps"'],
    },
    {
      id: 'voltara-npc-1',
      name: 'Townsperson',
      tileX: 18,
      tileY: 9,
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
      name: 'Sparks',
      tileX: 18,
      tileY: 12,
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
      name: 'Bolt',
      tileX: 5,
      tileY: 10,
      textureKey: 'npc-male-4',
      facing: 'right',
      dialogue: [
        'Bolt: I\'m a Move Tutor. I can teach powerful moves!',
        'Bolt: Bring me colored shards from dungeons',
        'Bolt: and I\'ll teach your Pokémon a new trick.',
      ],
      interactionType: 'move-tutor', interactionData: 'tutor-voltara',
    },
    // Story: Blitz discovers Collective is tapping the grid
    {
      id: 'voltara-blitz-story',
      name: 'Blitz',
      tileX: 11,
      tileY: 13,
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
    // Conduit interaction points for Power Restoration quest
    {
      id: 'voltara-conduit-1',
      name: 'Conduit',
      tileX: 6,
      tileY: 25,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['The conduit crackles with unstable energy...', 'You repair the conduit! It hums steadily now.'],
      requireFlag: '!conduit-1-repaired',
      setsFlag: 'conduit-1-repaired',
    },
    {
      id: 'voltara-conduit-2',
      name: 'Conduit',
      tileX: 5,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['Sparks fly from the damaged conduit...', 'You reconnect the wiring! Power flows again.'],
      requireFlag: '!conduit-2-repaired',
      setsFlag: 'conduit-2-repaired',
    },
    {
      id: 'voltara-conduit-3',
      name: 'Conduit',
      tileX: 10,
      tileY: 27,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['The north gate conduit is completely fried...', 'You replace the core component! It powers up.'],
      requireFlag: '!conduit-3-repaired',
      setsFlag: 'conduit-3-repaired',
    },
    // Story: Professor Willow kidnapping
    {
      id: 'voltara-willow-kidnap',
      name: 'Prof. Willow',
      tileX: 11,
      tileY: 9,
      textureKey: 'npc-oak',
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
    // South exit → Verdantia Village
    { tileX: 11, tileY: 0, targetMap: 'verdantia-village', targetSpawnId: 'from-voltara' },
    { tileX: 12, tileY: 0, targetMap: 'verdantia-village', targetSpawnId: 'from-voltara' },
    // Buildings
    { tileX: 4, tileY: 7, targetMap: 'voltara-pokecenter', targetSpawnId: 'default' },
    { tileX: 17, tileY: 7, targetMap: 'voltara-pokemart', targetSpawnId: 'default' },
    { tileX: 6, tileY: 24, targetMap: 'voltara-gym', targetSpawnId: 'default' },
    // North exit → Route 6
    { tileX: 11, tileY: 29, targetMap: 'route-6', targetSpawnId: 'from-voltara' },
    { tileX: 12, tileY: 29, targetMap: 'route-6', targetSpawnId: 'from-voltara' },
    // House interior
    { tileX: 19, tileY: 19, targetMap: 'voltara-city-house-1', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default':          { x: 11, y: 13, direction: 'up' },
    'from-verdantia':   { x: 12, y: 1, direction: 'up' },
    'from-route-6':     { x: 12, y: 28, direction: 'down' },
    'from-pokecenter':  { x: 4, y: 8, direction: 'down' },
    'from-pokemart':    { x: 17, y: 8, direction: 'down' },
    'from-gym':         { x: 6, y: 25, direction: 'down' },
    'from-house-1':     { x: 19, y: 20, direction: 'down' },
  },
};
