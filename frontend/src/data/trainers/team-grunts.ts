import { TrainerData } from '../interfaces';

export const teamGruntTrainers: Record<string, TrainerData> = {
  // ─── Synthesis Collective: Grunts ───
  'synthesis-grunt-1': {
    id: 'synthesis-grunt-1', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 41, level: 13, moves: ['leech-life', 'supersonic'] },
      { pokemonId: 109, level: 14, moves: ['tackle', 'smog', 'poison-gas'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: Hey! This is a restricted research area!',
        'Synthesis Grunt: You shouldn\'t be here, kid!',
      ],
      after: [
        'Synthesis Grunt: Ugh... The Director won\'t be happy about this...',
      ],
    },
    rewardMoney: 280,
  },
  'synthesis-grunt-2': {
    id: 'synthesis-grunt-2', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 88, level: 14, moves: ['pound', 'poison-gas', 'harden'] },
      { pokemonId: 23, level: 14, moves: ['wrap', 'leer', 'poison-sting'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: For the future of all Pokémon!',
      ],
      after: [
        'Synthesis Grunt: This doesn\'t change anything...',
      ],
    },
    rewardMoney: 280,
  },
  'synthesis-grunt-3': {
    id: 'synthesis-grunt-3', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 109, level: 22, moves: ['sludge', 'smokescreen', 'self-destruct'] },
      { pokemonId: 42, level: 22, moves: ['wing-attack', 'bite', 'confuse-ray'] },
      { pokemonId: 24, level: 23, moves: ['poison-sting', 'bite', 'glare', 'acid'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: The Director\'s vision will reshape the world!',
        'Synthesis Grunt: And you won\'t stop it!',
      ],
      after: [
        'Synthesis Grunt: How... how are you so strong?',
      ],
    },
    rewardMoney: 460,
  },

  // ─── Synthesis Collective: Ironvale Tag-Battle Grunts ───
  'synthesis-grunt-ironvale-1': {
    id: 'synthesis-grunt-ironvale-1', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 110, level: 26, moves: ['sludge', 'smokescreen', 'tackle', 'self-destruct'] },
      { pokemonId: 42, level: 25, moves: ['wing-attack', 'bite', 'confuse-ray', 'leech-life'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: The forge belongs to the Collective now!',
        'Synthesis Grunt: You and your little friend won\'t stop us!',
      ],
      after: [
        'Synthesis Grunt: No... our operation here is finished!',
      ],
    },
    rewardMoney: 520,
  },
  'synthesis-grunt-ironvale-2': {
    id: 'synthesis-grunt-ironvale-2', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 24, level: 26, moves: ['poison-sting', 'bite', 'glare', 'acid'] },
      { pokemonId: 89, level: 25, moves: ['sludge', 'pound', 'disable', 'minimize'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: You won\'t interfere with the Director\'s research!',
      ],
      after: [
        'Synthesis Grunt: The Director will hear about this...',
      ],
    },
    rewardMoney: 520,
  },

  // ─── Route 4: Basalt Ridge — Synthesis presence ───
  'synthesis-grunt-4': {
    id: 'synthesis-grunt-4', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 88, level: 17, moves: ['pound', 'poison-gas', 'sludge'] },
      { pokemonId: 41, level: 17, moves: ['leech-life', 'supersonic', 'bite'] },
      { pokemonId: 109, level: 18, moves: ['tackle', 'smog', 'smokescreen'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: This ridge is under Collective surveillance!',
        'Synthesis Grunt: The Aether readings here are off the charts!',
        'Synthesis Grunt: You shouldn\'t have come this way!',
      ],
      after: [
        'Synthesis Grunt: Fine... but the operation in the mines will continue!',
        'Synthesis Grunt: You\'re too late to stop what\'s already in motion!',
      ],
    },
    rewardMoney: 360,
  },

  // ─── Ember Mines: Additional grunt ───
  'synthesis-grunt-5': {
    id: 'synthesis-grunt-5', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 42, level: 21, moves: ['wing-attack', 'bite', 'confuse-ray', 'supersonic'] },
      { pokemonId: 89, level: 22, moves: ['sludge', 'body-slam', 'harden', 'pound'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: Dr. Vex said to expect company.',
        'Synthesis Grunt: You won\'t reach the extraction chamber!',
      ],
      after: [
        'Synthesis Grunt: This is just one facility... we have others.',
      ],
    },
    rewardMoney: 440,
  },

  // ─── Route 5: Verdant Path — Synthesis scout ───
  'synthesis-grunt-6': {
    id: 'synthesis-grunt-6', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 24, level: 24, moves: ['poison-sting', 'bite', 'glare', 'acid'] },
      { pokemonId: 110, level: 24, moves: ['sludge', 'smokescreen', 'tackle', 'self-destruct'] },
      { pokemonId: 42, level: 25, moves: ['wing-attack', 'bite', 'confuse-ray'] },
    ],
    dialogue: {
      before: [
        'Synthesis Grunt: We\'re collecting samples from the old-growth forest.',
        'Synthesis Grunt: The Aether concentration in these roots is extraordinary!',
        'Synthesis Grunt: You again?! I won\'t let you interfere!',
      ],
      after: [
        'Synthesis Grunt: The lab beneath Verdantia is already operational...',
        'Synthesis Grunt: You can\'t shut it all down!',
      ],
    },
    rewardMoney: 500,
  },

  // ─── Dr. Vex Corbin (Admin — Boss encounter 1) ───
  'admin-vex-1': {
    id: 'admin-vex-1', name: 'Admin Vex', spriteKey: 'npc-admin-vex',
    party: [
      { pokemonId: 109, level: 22, moves: ['sludge', 'smokescreen', 'tackle', 'self-destruct'] },
      { pokemonId: 89, level: 23, moves: ['sludge', 'body-slam', 'acid', 'harden'] },
      { pokemonId: 110, level: 24, moves: ['sludge', 'smokescreen', 'self-destruct', 'tackle'] },
    ],
    dialogue: {
      before: [
        'Dr. Vex: Ah. The persistent trainer.',
        'Dr. Vex: Subject demonstrates adequate combat potential. Noted.',
        'Dr. Vex: You\'ve delayed our extraction schedule by... twelve minutes.',
        'Dr. Vex: Sentiment is a variable I eliminated long ago.',
        'Dr. Vex: Let me show you what efficiency looks like.',
      ],
      after: [
        'Dr. Vex: ...Inconvenient.',
        'Dr. Vex: You\'ve delayed us by hours. We\'ve been working for years.',
        'Dr. Vex: The Director will not be pleased.',
        'Dr. Vex: But make no mistake — this changes nothing.',
      ],
    },
    rewardMoney: 1200,
    victoryFlag: 'defeatedVex1',
  },

  // ─── Dr. Vex boss battle #2 ───
  'admin-vex-2': {
    id: 'admin-vex-2', name: 'Admin Vex', spriteKey: 'npc-admin-vex',
    party: [
      { pokemonId: 110, level: 36, moves: ['sludge', 'smokescreen', 'self-destruct', 'fire-blast'] },
      { pokemonId: 89, level: 37, moves: ['sludge', 'body-slam', 'acid', 'fire-punch'] },
      { pokemonId: 110, level: 38, moves: ['sludge', 'smokescreen', 'explosion', 'thunder-punch'] },
    ],
    dialogue: {
      before: ['Dr. Vex: You again. Persistent subject.', 'Dr. Vex: The Director has begun the ritual. You are too late.'],
      after: ['Dr. Vex: ...The Aether Lens. So Rook gave it to you.', 'Dr. Vex: It doesn\'t matter. The Director is already at the League.'],
    },
    rewardMoney: 1900,
    victoryFlag: 'defeatedVex2',
  },

  // ─── Abyssal Spire: Dr. Vex — Encounter 3 ───
  'admin-vex-3': {
    id: 'admin-vex-3', name: 'Admin Vex', spriteKey: 'npc-vex',
    party: [
      { pokemonId: 89, level: 42, moves: ['sludge', 'minimize', 'toxic', 'fire-blast'] },
      { pokemonId: 82, level: 41, moves: ['thunderbolt', 'tri-attack', 'thunder-wave', 'sonic-boom'] },
      { pokemonId: 110, level: 42, moves: ['sludge', 'explosion', 'smokescreen', 'thunderbolt'] },
      { pokemonId: 73, level: 44, moves: ['hydro-pump', 'sludge', 'barrier', 'wrap'] },
    ],
    dialogue: {
      before: ['Sentiment is a variable I eliminated long ago.', 'This lab is MY domain.'],
      after: ['My research... years of data...', 'You understand nothing of what we\'ve built.'],
    },
    rewardMoney: 4400,
    victoryFlag: 'defeatedVex3',
  },

  // ─── Canopy Trail: Zara Lux — Encounter 2 ───
  'admin-zara-2': {
    id: 'admin-zara-2', name: 'Admin Zara', spriteKey: 'npc-zara',
    party: [
      { pokemonId: 97, level: 33, moves: ['psychic', 'hypnosis', 'dream-eater', 'night-shade'] },
      { pokemonId: 122, level: 32, moves: ['psychic', 'barrier', 'light-screen', 'confusion'] },
      { pokemonId: 36, level: 35, moves: ['body-slam', 'sing', 'minimize', 'metronome'] },
    ],
    dialogue: {
      before: ['You\'ve freed them? Do you have any idea how long—!', 'Fine. If words won\'t stop you...'],
      after: ['How can you be so strong already?', 'The Director warned me about trainers like you...'],
    },
    rewardMoney: 3200,
    victoryFlag: 'defeatedZara2',
  },

  // ─── Abyssal Spire F3: Zara Lux — Encounter 3 ───
  'admin-zara-3': {
    id: 'admin-zara-3', name: 'Admin Zara', spriteKey: 'npc-zara',
    party: [
      { pokemonId: 97, level: 42, moves: ['psychic', 'hypnosis', 'dream-eater', 'night-shade'] },
      { pokemonId: 122, level: 41, moves: ['psychic', 'barrier', 'light-screen', 'thunderbolt'] },
      { pokemonId: 36, level: 43, moves: ['body-slam', 'sing', 'minimize', 'metronome'] },
      { pokemonId: 124, level: 42, moves: ['blizzard', 'psychic', 'lovely-kiss', 'ice-punch'] },
    ],
    dialogue: {
      before: ['I can\'t let you pass. Not because I believe anymore...', 'but because I need to know you\'re strong enough to end it.'],
      after: ['You ARE strong enough. Take this keycard.', 'End it. For all of us.'],
    },
    rewardMoney: 4200,
    victoryFlag: 'defeatedZara3',
  },

  // ─── Abyssal Spire: Synthesis Elite Grunts ───
  'synth-elite-f1-1': {
    id: 'synth-elite-f1-1', name: 'Synth Elite', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 42, level: 38, moves: ['wing-attack', 'bite', 'confuse-ray', 'toxic'] },
      { pokemonId: 89, level: 39, moves: ['sludge', 'minimize', 'toxic', 'pound'] },
      { pokemonId: 82, level: 40, moves: ['thunderbolt', 'tri-attack', 'thunder-wave', 'sonic-boom'] },
    ],
    dialogue: {
      before: ['Intruder detected.', 'Deploying countermeasures.'],
      after: ['Systems... failing...'],
    },
    rewardMoney: 2000,
  },
  'synth-elite-f1-2': {
    id: 'synth-elite-f1-2', name: 'Synth Elite', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 110, level: 38, moves: ['sludge', 'smokescreen', 'explosion', 'toxic'] },
      { pokemonId: 93, level: 39, moves: ['night-shade', 'hypnosis', 'dream-eater', 'lick'] },
      { pokemonId: 101, level: 40, moves: ['thunderbolt', 'explosion', 'light-screen', 'swift'] },
    ],
    dialogue: {
      before: ['Subject shows combat proficiency.', 'Engaging.'],
      after: ['Combat data... recorded...'],
    },
    rewardMoney: 2000,
  },
  'synth-elite-f2-1': {
    id: 'synth-elite-f2-1', name: 'Synth Elite', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 73, level: 40, moves: ['hydro-pump', 'sludge', 'barrier', 'wrap'] },
      { pokemonId: 82, level: 41, moves: ['thunderbolt', 'tri-attack', 'thunder-wave', 'sonic-boom'] },
      { pokemonId: 24, level: 42, moves: ['sludge', 'earthquake', 'glare', 'bite'] },
    ],
    dialogue: {
      before: ['The Director\'s work must not be disturbed!'],
      after: ['The Director... will not be pleased...'],
    },
    rewardMoney: 2200,
  },
  'synth-elite-f2-2': {
    id: 'synth-elite-f2-2', name: 'Synth Elite', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 89, level: 40, moves: ['sludge', 'minimize', 'toxic', 'fire-blast'] },
      { pokemonId: 110, level: 41, moves: ['sludge', 'explosion', 'smokescreen', 'thunderbolt'] },
      { pokemonId: 42, level: 42, moves: ['wing-attack', 'bite', 'confuse-ray', 'toxic'] },
    ],
    dialogue: {
      before: ['You\'ll never reach the inner sanctum!'],
      after: ['Impossible... our elite forces...'],
    },
    rewardMoney: 2400,
  },

  // ─── Route 7 Grunt Gauntlet (5 grunts + Vex blockade) ───
  'synth-elite-r7-1': {
    id: 'synth-elite-r7-1', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 89, level: 34, moves: ['sludge', 'body-slam', 'minimize', 'toxic'] },
      { pokemonId: 82, level: 33, moves: ['thunderbolt', 'sonic-boom', 'thunder-wave', 'swift'] },
    ],
    dialogue: { before: ['Synthesis Grunt: No one passes this blockade!'], after: ['Synthesis Grunt: Impossible...'] },
    rewardMoney: 1360,
  },
  'synth-elite-r7-2': {
    id: 'synth-elite-r7-2', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 110, level: 35, moves: ['sludge', 'toxic', 'smokescreen', 'self-destruct'] },
      { pokemonId: 24, level: 34, moves: ['bite', 'wrap', 'acid', 'glare'] },
    ],
    dialogue: { before: ['Synthesis Grunt: Stand down, trainer!'], after: ['Synthesis Grunt: The Director will hear about this...'] },
    rewardMoney: 1400,
  },
  'synth-elite-r7-3': {
    id: 'synth-elite-r7-3', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 42, level: 36, moves: ['wing-attack', 'bite', 'confuse-ray', 'swift'] },
      { pokemonId: 73, level: 35, moves: ['surf', 'wrap', 'acid', 'toxic'] },
      { pokemonId: 93, level: 35, moves: ['night-shade', 'hypnosis', 'lick', 'confuse-ray'] },
    ],
    dialogue: { before: ['Synthesis Grunt: You\'re too late to stop us!'], after: ['Synthesis Grunt: Fine... but you can\'t defeat Dr. Vex!'] },
    rewardMoney: 1500,
  },

  // ─── Synthesis Collective: Verdantia Underground Lab Grunts ───
  'synth-grunt-verdantia-1': {
    id: 'synth-grunt-verdantia-1', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 44, level: 28, moves: ['acid', 'sleep-powder', 'absorb', 'poison-powder'] },
      { pokemonId: 88, level: 29, moves: ['sludge', 'pound', 'disable', 'minimize'] },
      { pokemonId: 69, level: 28, moves: ['vine-whip', 'wrap', 'sleep-powder', 'poison-powder'] },
    ],
    dialogue: {
      before: ['Synthesis Grunt: How did you find this lab?!'],
      after: ['Synthesis Grunt: The Director\'s research must not be stopped...'],
    },
    rewardMoney: 1120,
  },
  'synth-grunt-verdantia-2': {
    id: 'synth-grunt-verdantia-2', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 109, level: 30, moves: ['sludge', 'smokescreen', 'self-destruct', 'tackle'] },
      { pokemonId: 43, level: 29, moves: ['absorb', 'poison-powder', 'acid', 'sleep-powder'] },
      { pokemonId: 48, level: 30, moves: ['psybeam', 'poison-powder', 'leech-life', 'stun-spore'] },
    ],
    dialogue: {
      before: ['Synthesis Grunt: This area is restricted! Leave now!'],
      after: ['Synthesis Grunt: You\'ll regret interfering...'],
    },
    rewardMoney: 1200,
  },
  'synth-grunt-verdantia-3': {
    id: 'synth-grunt-verdantia-3', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 89, level: 32, moves: ['sludge', 'minimize', 'pound', 'toxic'] },
      { pokemonId: 70, level: 30, moves: ['razor-leaf', 'wrap', 'poison-powder', 'sleep-powder'] },
      { pokemonId: 110, level: 31, moves: ['sludge', 'smokescreen', 'toxic', 'self-destruct'] },
    ],
    dialogue: {
      before: ['Synthesis Grunt: The roots of this place hold unimaginable power!'],
      after: ['Synthesis Grunt: Impossible... our strongest couldn\'t stop you...'],
    },
    rewardMoney: 1280,
    victoryFlag: 'cleared_verdantia_lab',
  },

  // ─── Stern Engine Quest Grunts ───
  'stern-grunt-1': {
    id: 'stern-grunt-1', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 41, level: 14, moves: ['wing-attack', 'bite', 'supersonic', 'leech-life'] },
      { pokemonId: 109, level: 15, moves: ['sludge', 'smokescreen', 'tackle', 'poison-gas'] },
    ],
    dialogue: {
      before: ['Hey! This engine part belongs to the Collective now!', 'You want it? You\'ll have to battle me for it!'],
      after: ['Fine, take the stupid engine part!', 'The Director won\'t care about one piece of junk...'],
    },
    rewardMoney: 300,
  },
  'stern-grunt-2': {
    id: 'stern-grunt-2', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 88, level: 15, moves: ['sludge', 'pound', 'harden', 'disable'] },
      { pokemonId: 109, level: 15, moves: ['sludge', 'smokescreen', 'tackle', 'self-destruct'] },
    ],
    dialogue: {
      before: ['Another meddler? The Collective doesn\'t tolerate interference!'],
      after: ['Ugh... Take this part and get lost!'],
    },
    rewardMoney: 300,
  },
  'stern-grunt-3': {
    id: 'stern-grunt-3', name: 'Synthesis Grunt', spriteKey: 'npc-grunt',
    party: [
      { pokemonId: 23, level: 14, moves: ['bite', 'wrap', 'poison-sting', 'leer'] },
      { pokemonId: 41, level: 14, moves: ['wing-attack', 'bite', 'supersonic', 'leech-life'] },
      { pokemonId: 109, level: 15, moves: ['sludge', 'smokescreen', 'tackle', 'self-destruct'] },
    ],
    dialogue: {
      before: ['You again! I\'m not giving up the last part that easily!'],
      after: ['That\'s... all three parts. The Director will hear about this!'],
    },
    rewardMoney: 450,
  },
};
