import { TrainerData } from '../interfaces';

export const eliteFourTrainers: Record<string, TrainerData> = {
  // ─── Elite Four ───
  'elite-nerida': {
    id: 'elite-nerida', name: 'Elite Four Nerida', spriteKey: 'npc-female-7',
    party: [
      { pokemonId: 87, level: 50, moves: ['ice-beam', 'surf', 'body-slam', 'rest'] },
      { pokemonId: 91, level: 50, moves: ['ice-beam', 'clamp', 'supersonic', 'aurora-beam'] },
      { pokemonId: 131, level: 52, moves: ['ice-beam', 'surf', 'thunderbolt', 'sing'] },
      { pokemonId: 62, level: 50, moves: ['surf', 'body-slam', 'earthquake', 'hypnosis'] },
      { pokemonId: 121, level: 51, moves: ['surf', 'psychic', 'ice-beam', 'thunderbolt'] },
    ],
    dialogue: {
      before: ['Nerida: Welcome, challenger. The waters run deep here.', 'Nerida: Let us see how long you can hold your breath.'],
      after: ['Nerida: You swim against the current and prevail. Impressive.', 'Nerida: The next challenge awaits.'],
    },
    rewardMoney: 5000,
    victoryFlag: 'defeatedNerida',
  },

  // ─── Elite Four #2: Theron (Fighting/Rock) ───
  'elite-theron': {
    id: 'elite-theron', name: 'Elite Four Theron', spriteKey: 'npc-male-5',
    party: [
      { pokemonId: 68, level: 50, moves: ['karate-chop', 'seismic-toss', 'earthquake', 'rock-slide'] },
      { pokemonId: 76, level: 49, moves: ['rock-slide', 'earthquake', 'body-slam', 'explosion'] },
      { pokemonId: 62, level: 50, moves: ['hydro-pump', 'ice-punch', 'hypnosis', 'submission'] },
      { pokemonId: 95, level: 49, moves: ['earthquake', 'rock-slide', 'body-slam', 'bind'] },
      { pokemonId: 106, level: 50, moves: ['high-jump-kick', 'mega-kick', 'double-kick', 'meditate'] },
      { pokemonId: 34, level: 52, moves: ['earthquake', 'horn-attack', 'body-slam', 'thunder'] },
    ],
    dialogue: {
      before: [
        'Theron: So you\'ve made it this far! Impressive!',
        'Theron: But raw power is what decides battles here!',
        'Theron: Let\'s see if your strength is the real deal!',
      ],
      after: [
        'Theron: Ha! You\'ve got guts AND power!',
        'Theron: Go on — the next one won\'t be so straightforward.',
      ],
    },
    rewardMoney: 5200,
    victoryFlag: 'defeatedTheron',
  },

  // ─── Elite Four #3: Lysandra (Psychic/Dark) ───
  'elite-lysandra': {
    id: 'elite-lysandra', name: 'Elite Four Lysandra', spriteKey: 'npc-female-8',
    party: [
      { pokemonId: 65, level: 51, moves: ['psychic', 'night-shade', 'recover', 'reflect'] },
      { pokemonId: 94, level: 51, moves: ['night-shade', 'psychic', 'hypnosis', 'dream-eater'] },
      { pokemonId: 121, level: 50, moves: ['psychic', 'surf', 'thunderbolt', 'recover'] },
      { pokemonId: 80, level: 50, moves: ['psychic', 'surf', 'amnesia', 'body-slam'] },
      { pokemonId: 110, level: 51, moves: ['sludge', 'night-shade', 'thunderbolt', 'toxic'] },
      { pokemonId: 124, level: 53, moves: ['psychic', 'ice-beam', 'lovely-kiss', 'blizzard'] },
    ],
    dialogue: {
      before: [
        'Lysandra: The mind is the sharpest blade.',
        'Lysandra: Tell me... can yours hold its edge?',
        'Lysandra: Let us see what truths you hide.',
      ],
      after: [
        'Lysandra: Fascinating. Your will is stronger than I anticipated.',
        'Lysandra: Walk carefully. What awaits above... is not what you expect.',
      ],
    },
    rewardMoney: 5400,
    victoryFlag: 'defeatedLysandra',
  },

  // ─── Elite Four #4: Ashborne (Fire/Dragon) ───
  'elite-ashborne': {
    id: 'elite-ashborne', name: 'Elite Four Ashborne', spriteKey: 'npc-male-6',
    party: [
      { pokemonId: 59, level: 52, moves: ['flamethrower', 'take-down', 'fire-blast', 'agility'] },
      { pokemonId: 6, level: 52, moves: ['flamethrower', 'dragon-rage', 'slash', 'fire-spin'] },
      { pokemonId: 78, level: 51, moves: ['fire-blast', 'stomp', 'agility', 'fire-spin'] },
      { pokemonId: 38, level: 51, moves: ['flamethrower', 'confuse-ray', 'quick-attack', 'fire-spin'] },
      { pokemonId: 126, level: 52, moves: ['fire-blast', 'thunder-punch', 'psychic', 'confuse-ray'] },
      { pokemonId: 149, level: 54, moves: ['hyper-beam', 'fire-blast', 'thunder', 'dragon-rage'] },
    ],
    dialogue: {
      before: [
        'Ashborne: ...',
        'Ashborne: I\'ve waited for someone like you.',
        'Ashborne: But I need to warn you...',
        'Ashborne: Whatever you find up there... don\'t lose yourself.',
      ],
      after: [
        'Ashborne: ...Good. You\'re strong enough.',
        'Ashborne: The Champion awaits. And the truth with him.',
        'Ashborne: End this. For everyone\'s sake.',
      ],
    },
    rewardMoney: 5600,
    victoryFlag: 'defeatedAshborne',
  },

  // ─── Champion Aldric Maren ───
  'champion-aldric': {
    id: 'champion-aldric', name: 'Champion Aldric', spriteKey: 'npc-male-6',
    party: [
      { pokemonId: 94, level: 52, moves: ['lick', 'dream-eater', 'hypnosis', 'night-shade'] },
      { pokemonId: 65, level: 52, moves: ['psychic', 'recover', 'reflect', 'psybeam'] },
      { pokemonId: 130, level: 53, moves: ['hydro-pump', 'bite', 'dragon-rage', 'thrash'] },
      { pokemonId: 59, level: 53, moves: ['flamethrower', 'bite', 'take-down', 'fire-blast'] },
      { pokemonId: 149, level: 54, moves: ['dragon-rage', 'slam', 'agility', 'thunder-wave'] },
      { pokemonId: 150, level: 55, moves: ['psychic', 'recover', 'ice-beam', 'thunderbolt'] },
    ],
    dialogue: {
      before: [
        'Aldric: So you\'ve come.',
        'Aldric: I\'ve seen what nature does to the creatures we claim to love.',
        'Aldric: I choose to do better.',
        'Aldric: You fight to preserve a broken world. I fight to build a perfect one.',
        'Aldric: Let us settle this — Champion to challenger.',
      ],
      after: [
        'Aldric: ...Impossible.',
        'Aldric: Perhaps... perhaps I was wrong.',
        'Aldric: The bond between you and your Pokémon... it\'s real.',
        'Aldric: Something I forgot long ago.',
      ],
    },
    rewardMoney: 11000,
    victoryFlag: 'defeatedChampion',
  },
};
