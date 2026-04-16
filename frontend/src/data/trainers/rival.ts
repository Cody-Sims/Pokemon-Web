import { TrainerData } from '../interfaces';

export const rivalTrainers: Record<string, TrainerData> = {
  // ─── Rival: Kael Ashford ───
  // Encounter 1: Professor Willow's Lab (starter advantage over player)
  'rival-1': {
    id: 'rival-1', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 4, level: 5, moves: ['scratch', 'growl'] }, // Adapts to starter choice
    ],
    dialogue: {
      before: [
        'Kael: Hey! You got a Pokémon too? Sweet!',
        'Kael: Let\'s see which one of us picked better!',
      ],
      after: [
        'Kael: What?! No way! I\'ll get stronger, just watch!',
        'Kael: ...Next time, I won\'t lose!',
      ],
    },
    rewardMoney: 175,
    victoryFlag: 'defeatedKael1',
  },
  // Encounter 2: Route 3 (Tide Pool Path) — before Coral Harbor
  'rival-2': {
    id: 'rival-2', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 5, level: 16, moves: ['ember', 'scratch', 'smokescreen', 'fury-swipes'] },
      { pokemonId: 16, level: 14, moves: ['gust', 'quick-attack', 'sand-attack'] },
      { pokemonId: 19, level: 14, moves: ['tackle', 'quick-attack', 'bite'] },
    ],
    dialogue: {
      before: [
        'Kael: Took you long enough! I\'ve been waiting here for hours.',
        'Kael: ...Okay, twenty minutes. Whatever.',
        'Kael: Let\'s see how you\'ve grown since Willow\'s lab!',
      ],
      after: [
        'Kael: Tch... You\'ve gotten better. Fine.',
        'Kael: I heard there\'s weird stuff happening near the coast.',
        'Kael: People in lab coats catching Pokémon with purple balls.',
        'Kael: Watch yourself out there.',
      ],
    },
    rewardMoney: 480,
  },
  // Encounter 3: Ironvale City — tag-battle partner (not used as enemy)
  'rival-3': {
    id: 'rival-3', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 6, level: 28, moves: ['flamethrower', 'slash', 'smokescreen', 'dragon-rage'] },
      { pokemonId: 17, level: 25, moves: ['wing-attack', 'quick-attack', 'gust'] },
      { pokemonId: 20, level: 25, moves: ['hyper-fang', 'bite', 'quick-attack'] },
      { pokemonId: 57, level: 26, moves: ['karate-chop', 'fury-swipes', 'seismic-toss', 'low-kick'] },
    ],
    dialogue: {
      before: [
        'Kael: Those Synthesis creeps are trying to take the forge!',
        'Kael: I\'m not letting that happen. You with me?',
        'Kael: Let\'s take them down — together!',
      ],
      after: [
        'Kael: Ha! They didn\'t stand a chance against the two of us!',
        'Kael: ...Something about what they\'re doing to Pokémon really bugs me.',
        'Kael: It\'s not right. Pokémon aren\'t lab experiments.',
      ],
    },
    rewardMoney: 1,
  },
  // Encounter 4: Route 8 (Stormbreak Pass) — intense 1v1 rivalry
  'rival-4': {
    id: 'rival-4', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 6, level: 37, moves: ['flamethrower', 'slash', 'dragon-rage', 'fire-spin'] },
      { pokemonId: 18, level: 34, moves: ['wing-attack', 'quick-attack', 'mirror-move', 'agility'] },
      { pokemonId: 20, level: 34, moves: ['hyper-fang', 'super-fang', 'bite', 'body-slam'] },
      { pokemonId: 57, level: 35, moves: ['karate-chop', 'seismic-toss', 'fury-swipes', 'low-kick'] },
      { pokemonId: 65, level: 35, moves: ['psychic', 'confusion', 'recover', 'reflect'] },
    ],
    dialogue: {
      before: [
        'Kael: ...',
        'Kael: You\'re always one step ahead of me.',
        'Kael: Badges, battles, even that Collective stuff...',
        'Kael: I need to know — am I actually getting stronger?',
        'Kael: Battle me. For real this time. No holding back.',
      ],
      after: [
        'Kael: ...Yeah. I thought so.',
        'Kael: But you know what? I\'m not giving up.',
        'Kael: I\'ll be at the League before you. Count on it.',
      ],
    },
    rewardMoney: 1110,
  },
  // Encounter 5: Victory Road entrance — final test
  'rival-5': {
    id: 'rival-5', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 6, level: 48, moves: ['flamethrower', 'slash', 'dragon-rage', 'fire-blast'] },
      { pokemonId: 18, level: 45, moves: ['wing-attack', 'quick-attack', 'mirror-move', 'agility'] },
      { pokemonId: 20, level: 45, moves: ['hyper-fang', 'super-fang', 'bite', 'body-slam'] },
      { pokemonId: 57, level: 46, moves: ['karate-chop', 'seismic-toss', 'thunder-punch', 'double-kick'] },
      { pokemonId: 65, level: 46, moves: ['psychic', 'psybeam', 'recover', 'reflect'] },
      { pokemonId: 130, level: 47, moves: ['hydro-pump', 'dragon-rage', 'bite', 'thrash'] },
    ],
    dialogue: {
      before: [
        'Kael: So... this is it. Victory Road.',
        'Kael: The League is just beyond here.',
        'Kael: Before you go in — one last battle.',
        'Kael: I need to know I\'m giving it everything I\'ve got.',
      ],
      after: [
        'Kael: ...Go save the world.',
        'Kael: I\'ll hold the line here in case any Collective stragglers show up.',
        'Kael: And when you\'re Champion — I\'m coming for that title.',
      ],
    },
    rewardMoney: 2350,
    victoryFlag: 'defeatedKael5',
  },
  // Encounter 6: Post-game (Aether Sanctum) — friendly rematch
  'rival-6': {
    id: 'rival-6', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 6, level: 65, moves: ['flamethrower', 'fire-blast', 'dragon-rage', 'slash'] },
      { pokemonId: 18, level: 62, moves: ['fly', 'quick-attack', 'mirror-move', 'agility'] },
      { pokemonId: 20, level: 62, moves: ['hyper-fang', 'super-fang', 'bite', 'body-slam'] },
      { pokemonId: 57, level: 63, moves: ['karate-chop', 'seismic-toss', 'thunder-punch', 'earthquake'] },
      { pokemonId: 65, level: 63, moves: ['psychic', 'psybeam', 'recover', 'reflect'] },
      { pokemonId: 130, level: 64, moves: ['hydro-pump', 'ice-beam', 'bite', 'earthquake'] },
    ],
    dialogue: {
      before: [
        'Kael: Champion! Ready for a rematch?',
        'Kael: My team and I have been training non-stop.',
        'Kael: This time, I\'m taking that title!',
      ],
      after: [
        'Kael: Haha! Still can\'t beat you.',
        'Kael: But that\'s what makes it fun, right?',
        'Kael: Same time next week?',
      ],
    },
    rewardMoney: 6500,
  },

  // ─── Secondary Rival: Marina Oleander ───
  // Encounter 1: Route 2 — friendly challenge
  'marina-1': {
    id: 'marina-1', name: 'Marina', spriteKey: 'npc-marina',
    party: [
      { pokemonId: 7, level: 12, moves: ['tackle', 'tail-whip', 'water-gun', 'withdraw'] },
      { pokemonId: 43, level: 10, moves: ['absorb', 'growth', 'poison-powder'] },
    ],
    dialogue: {
      before: [
        'Marina: Oh! Hello! I\'m Marina — Professor Willow\'s research assistant.',
        'Marina: I picked the last starter. Mind if we have a quick battle?',
        'Marina: I want to test something about type matchups...',
      ],
      after: [
        'Marina: Fascinating! The damage variance was exactly as I predicted.',
        'Marina: Oh, right — good battle! You\'re quite skilled.',
        'Marina: I\'ve noticed some strange energy readings on this route.',
        'Marina: Keep an eye out for anything unusual, okay?',
      ],
    },
    rewardMoney: 240,
  },
  // ─── Marina — Encounter 3 Partner (Canopy Trail co-op) ───
  'marina-3-partner': {
    id: 'marina-3-partner', name: 'Marina', spriteKey: 'npc-marina',
    party: [
      { pokemonId: 8, level: 32, moves: ['water-gun', 'bite', 'ice-beam', 'withdraw'] },
      { pokemonId: 44, level: 30, moves: ['absorb', 'sleep-powder', 'poison-powder', 'acid'] },
      { pokemonId: 36, level: 31, moves: ['body-slam', 'sing', 'double-slap', 'defense-curl'] },
    ],
    dialogue: {
      before: [
        'Marina: These traps are draining the Pokémon\'s energy!',
        'Marina: We have to stop them — together!',
      ],
      after: [
        'Marina: The Aether readings are stabilizing.',
        'Marina: Thank you for helping. I couldn\'t have done this alone.',
      ],
    },
    rewardMoney: 1,
  },
  // Encounter 4: Post-game Crystal Cavern — optional research battle
  'marina-4': {
    id: 'marina-4', name: 'Marina', spriteKey: 'npc-marina',
    party: [
      { pokemonId: 9, level: 58, moves: ['hydro-pump', 'ice-beam', 'skull-bash', 'rain-dance'] },
      { pokemonId: 45, level: 55, moves: ['solar-beam', 'sludge', 'sleep-powder', 'petal-dance'] },
      { pokemonId: 36, level: 55, moves: ['body-slam', 'sing', 'double-slap', 'psychic'] },
      { pokemonId: 103, level: 56, moves: ['psychic', 'solar-beam', 'sleep-powder', 'leech-seed'] },
      { pokemonId: 131, level: 57, moves: ['ice-beam', 'surf', 'thunderbolt', 'sing'] },
    ],
    dialogue: {
      before: [
        'Marina: The Aether concentration here is 3.7 times the regional average.',
        'Marina: That\'s... that\'s really bad, actually.',
        'Marina: But first — I\'ve been wanting to test my team against yours.',
        'Marina: For science, of course.',
      ],
      after: [
        'Marina: Incredible power differential. I need to recalibrate my models.',
        'Marina: Thank you for the data — I mean, the battle!',
        'Marina: I\'ve discovered a new Pokémon habitat deeper in the cavern.',
        'Marina: You should check it out. Bring strong Pokémon.',
      ],
    },
    rewardMoney: 5800,
  },
};
