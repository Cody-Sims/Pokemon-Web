import { TrainerData } from '../interfaces';

/**
 * Post-game rematch teams for all 8 Gym Leaders, 4 Elite Four members,
 * Champion Aldric, and rival Kael. Available after entering the Hall of Fame.
 *
 * Gym Leaders: Lv 60–65, full teams of 6.
 * Elite Four: Lv 70–75, upgraded movesets.
 * Champion Aldric: Lv 72–78, uses Synthesis-eligible ace.
 * Kael: Lv 60–65, Champion challenger.
 */
export const rematchTrainers: Record<string, TrainerData> = {
  // ─── Gym Leader Rematches (Lv 60–65) ───

  'rematch-brock': {
    id: 'rematch-brock', name: 'Gym Leader Brock', spriteKey: 'npc-gym-brock',
    party: [
      { pokemonId: 76, level: 60, moves: ['earthquake', 'rock-slide', 'explosion', 'body-slam'] },
      { pokemonId: 95, level: 60, moves: ['earthquake', 'rock-slide', 'body-slam', 'screech'] },
      { pokemonId: 139, level: 61, moves: ['surf', 'ice-beam', 'rock-slide', 'body-slam'] },
      { pokemonId: 141, level: 61, moves: ['slash', 'surf', 'rock-slide', 'swords-dance'] },
      { pokemonId: 142, level: 62, moves: ['hyper-beam', 'rock-slide', 'earthquake', 'fly'] },
      { pokemonId: 112, level: 63, moves: ['earthquake', 'rock-slide', 'horn-drill', 'body-slam'] },
    ],
    dialogue: {
      before: ['Brock: Back for a rematch? My team has grown since we last met!', 'Brock: Prepare for rock-solid defenses!'],
      after: ['Brock: You\'re even stronger than before. Impressive!'],
    },
    rewardMoney: 6300,
  },

  'rematch-coral': {
    id: 'rematch-coral', name: 'Gym Leader Coral', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 121, level: 60, moves: ['surf', 'psychic', 'thunderbolt', 'recover'] },
      { pokemonId: 91, level: 60, moves: ['ice-beam', 'surf', 'clamp', 'explosion'] },
      { pokemonId: 131, level: 61, moves: ['ice-beam', 'surf', 'thunderbolt', 'body-slam'] },
      { pokemonId: 99, level: 61, moves: ['surf', 'crabhammer', 'swords-dance', 'body-slam'] },
      { pokemonId: 73, level: 62, moves: ['surf', 'sludge', 'ice-beam', 'wrap'] },
      { pokemonId: 134, level: 63, moves: ['surf', 'ice-beam', 'body-slam', 'acid-armor'] },
    ],
    dialogue: {
      before: ['Coral: The tides have changed, challenger!', 'Coral: My Water Pokémon and I are unstoppable now!'],
      after: ['Coral: You ride the waves better than ever!'],
    },
    rewardMoney: 6300,
  },

  'rematch-ferris': {
    id: 'rematch-ferris', name: 'Gym Leader Ferris', spriteKey: 'npc-gym-ferris',
    party: [
      { pokemonId: 82, level: 60, moves: ['thunderbolt', 'swift', 'tri-attack', 'thunder-wave'] },
      { pokemonId: 95, level: 61, moves: ['earthquake', 'rock-slide', 'body-slam', 'screech'] },
      { pokemonId: 76, level: 61, moves: ['earthquake', 'rock-slide', 'body-slam', 'explosion'] },
      { pokemonId: 101, level: 62, moves: ['thunderbolt', 'explosion', 'swift', 'screech'] },
      { pokemonId: 65, level: 62, moves: ['psychic', 'recover', 'reflect', 'thunder-wave'] },
      { pokemonId: 143, level: 63, moves: ['body-slam', 'earthquake', 'rest', 'ice-beam'] },
    ],
    dialogue: {
      before: ['Ferris: My forge has tempered even stronger steel!', 'Ferris: Think you can handle the heat?'],
      after: ['Ferris: You break through every defense I raise!'],
    },
    rewardMoney: 6300,
  },

  'rematch-ivy': {
    id: 'rematch-ivy', name: 'Gym Leader Ivy', spriteKey: 'npc-female-1',
    party: [
      { pokemonId: 3, level: 61, moves: ['solar-beam', 'sleep-powder', 'sludge', 'growth'] },
      { pokemonId: 71, level: 60, moves: ['razor-leaf', 'sleep-powder', 'swords-dance', 'wrap'] },
      { pokemonId: 45, level: 61, moves: ['petal-dance', 'sleep-powder', 'mega-drain', 'sludge'] },
      { pokemonId: 47, level: 61, moves: ['spore', 'mega-drain', 'slash', 'growth'] },
      { pokemonId: 103, level: 62, moves: ['psychic', 'solar-beam', 'sleep-powder', 'leech-seed'] },
      { pokemonId: 114, level: 63, moves: ['solar-beam', 'sleep-powder', 'growth', 'slam'] },
    ],
    dialogue: {
      before: ['Ivy: The forest has grown strong, young one.', 'Ivy: Let me show you how deep its roots go.'],
      after: ['Ivy: Your bond with your Pokémon is truly remarkable.'],
    },
    rewardMoney: 6300,
  },

  'rematch-blitz': {
    id: 'rematch-blitz', name: 'Gym Leader Blitz', spriteKey: 'npc-gym-blitz',
    party: [
      { pokemonId: 125, level: 61, moves: ['thunderbolt', 'thunder-punch', 'ice-punch', 'screech'] },
      { pokemonId: 26, level: 60, moves: ['thunderbolt', 'quick-attack', 'surf', 'thunder-wave'] },
      { pokemonId: 101, level: 61, moves: ['thunderbolt', 'swift', 'explosion', 'screech'] },
      { pokemonId: 82, level: 62, moves: ['thunderbolt', 'tri-attack', 'thunder-wave', 'swift'] },
      { pokemonId: 135, level: 62, moves: ['thunderbolt', 'pin-missile', 'quick-attack', 'thunder-wave'] },
      { pokemonId: 145, level: 63, moves: ['thunderbolt', 'drill-peck', 'thunder-wave', 'agility'] },
    ],
    dialogue: {
      before: ['Blitz: YOOO! Ready for round two?!', 'Blitz: My circuits are overloaded with power!'],
      after: ['Blitz: You shorted me out AGAIN?! Respect!'],
    },
    rewardMoney: 6300,
  },

  'rematch-morwen': {
    id: 'rematch-morwen', name: 'Gym Leader Morwen', spriteKey: 'npc-female-2',
    party: [
      { pokemonId: 94, level: 61, moves: ['shadow-ball', 'psychic', 'hypnosis', 'dream-eater'] },
      { pokemonId: 93, level: 60, moves: ['shadow-ball', 'hypnosis', 'dream-eater', 'confuse-ray'] },
      { pokemonId: 110, level: 61, moves: ['sludge', 'night-shade', 'thunderbolt', 'toxic'] },
      { pokemonId: 42, level: 62, moves: ['wing-attack', 'bite', 'confuse-ray', 'leech-life'] },
      { pokemonId: 89, level: 62, moves: ['sludge', 'body-slam', 'toxic', 'explosion'] },
      { pokemonId: 94, level: 63, moves: ['shadow-ball', 'thunderbolt', 'ice-punch', 'hypnosis'] },
    ],
    dialogue: {
      before: ['Morwen: The spirits called for your return...', 'Morwen: Face the veil once more.'],
      after: ['Morwen: The spirits bow to you, Champion.'],
    },
    rewardMoney: 6300,
  },

  'rematch-drake': {
    id: 'rematch-drake', name: 'Gym Leader Drake', spriteKey: 'npc-male-3',
    party: [
      { pokemonId: 149, level: 62, moves: ['hyper-beam', 'dragon-rage', 'thunder', 'ice-beam'] },
      { pokemonId: 130, level: 61, moves: ['hydro-pump', 'ice-beam', 'earthquake', 'dragon-rage'] },
      { pokemonId: 148, level: 60, moves: ['dragon-rage', 'thunder-wave', 'ice-beam', 'surf'] },
      { pokemonId: 142, level: 61, moves: ['hyper-beam', 'fly', 'earthquake', 'rock-slide'] },
      { pokemonId: 131, level: 62, moves: ['ice-beam', 'surf', 'thunderbolt', 'body-slam'] },
      { pokemonId: 149, level: 64, moves: ['hyper-beam', 'fire-blast', 'thunder', 'blizzard'] },
    ],
    dialogue: {
      before: ['Drake: Champion! My dragons are eager for another test!', 'Drake: Show us the fire in your spirit!'],
      after: ['Drake: You remain worthy. The ley lines are in safe hands.'],
    },
    rewardMoney: 6400,
  },

  'rematch-solara': {
    id: 'rematch-solara', name: 'Gym Leader Solara', spriteKey: 'npc-female-4',
    party: [
      { pokemonId: 6, level: 62, moves: ['flamethrower', 'dragon-rage', 'slash', 'earthquake'] },
      { pokemonId: 59, level: 61, moves: ['flamethrower', 'fire-blast', 'take-down', 'agility'] },
      { pokemonId: 126, level: 61, moves: ['fire-blast', 'thunder-punch', 'psychic', 'confuse-ray'] },
      { pokemonId: 78, level: 62, moves: ['fire-blast', 'stomp', 'agility', 'hyper-beam'] },
      { pokemonId: 38, level: 62, moves: ['flamethrower', 'confuse-ray', 'quick-attack', 'fire-spin'] },
      { pokemonId: 146, level: 64, moves: ['fire-blast', 'hyper-beam', 'agility', 'fire-spin'] },
    ],
    dialogue: {
      before: ['Solara: The flames of rematch burn brighter!', 'Solara: Let\'s go — for old times\' sake!'],
      after: ['Solara: You truly are the Champion. No doubt about it.'],
    },
    rewardMoney: 6400,
  },

  // ─── Elite Four Rematches (Lv 70–75) ───

  'rematch-nerida': {
    id: 'rematch-nerida', name: 'Elite Four Nerida', spriteKey: 'npc-female-7',
    party: [
      { pokemonId: 131, level: 72, moves: ['ice-beam', 'surf', 'thunderbolt', 'body-slam'] },
      { pokemonId: 87, level: 70, moves: ['ice-beam', 'surf', 'body-slam', 'rest'] },
      { pokemonId: 91, level: 71, moves: ['ice-beam', 'surf', 'explosion', 'clamp'] },
      { pokemonId: 62, level: 71, moves: ['surf', 'earthquake', 'hypnosis', 'body-slam'] },
      { pokemonId: 121, level: 72, moves: ['surf', 'psychic', 'thunderbolt', 'recover'] },
      { pokemonId: 134, level: 73, moves: ['surf', 'ice-beam', 'body-slam', 'acid-armor'] },
    ],
    dialogue: {
      before: ['Nerida: The waters welcome you back, Champion.', 'Nerida: But they are deeper now.'],
      after: ['Nerida: Once again, you surface victoriously.'],
    },
    rewardMoney: 7200,
  },

  'rematch-theron': {
    id: 'rematch-theron', name: 'Elite Four Theron', spriteKey: 'npc-male-3',
    party: [
      { pokemonId: 68, level: 70, moves: ['karate-chop', 'earthquake', 'rock-slide', 'body-slam'] },
      { pokemonId: 76, level: 71, moves: ['earthquake', 'rock-slide', 'explosion', 'body-slam'] },
      { pokemonId: 106, level: 71, moves: ['high-jump-kick', 'mega-kick', 'double-kick', 'body-slam'] },
      { pokemonId: 107, level: 71, moves: ['thunder-punch', 'ice-punch', 'fire-punch', 'body-slam'] },
      { pokemonId: 34, level: 72, moves: ['earthquake', 'rock-slide', 'thunder', 'body-slam'] },
      { pokemonId: 112, level: 73, moves: ['earthquake', 'rock-slide', 'horn-drill', 'surf'] },
    ],
    dialogue: {
      before: ['Theron: HA! Back for more punishment?!', 'Theron: My fists have only gotten harder!'],
      after: ['Theron: You punch way above your weight class!'],
    },
    rewardMoney: 7400,
  },

  'rematch-lysandra': {
    id: 'rematch-lysandra', name: 'Elite Four Lysandra', spriteKey: 'npc-female-3',
    party: [
      { pokemonId: 65, level: 72, moves: ['psychic', 'shadow-ball', 'recover', 'reflect'] },
      { pokemonId: 94, level: 71, moves: ['shadow-ball', 'psychic', 'hypnosis', 'dream-eater'] },
      { pokemonId: 121, level: 71, moves: ['psychic', 'surf', 'thunderbolt', 'recover'] },
      { pokemonId: 80, level: 72, moves: ['psychic', 'surf', 'ice-beam', 'amnesia'] },
      { pokemonId: 124, level: 72, moves: ['psychic', 'ice-beam', 'lovely-kiss', 'blizzard'] },
      { pokemonId: 150, level: 74, moves: ['psychic', 'ice-beam', 'thunderbolt', 'recover'] },
    ],
    dialogue: {
      before: ['Lysandra: Your mind has sharpened. Let us test its edge again.'],
      after: ['Lysandra: You continue to defy expectation.'],
    },
    rewardMoney: 7600,
  },

  'rematch-ashborne': {
    id: 'rematch-ashborne', name: 'Elite Four Ashborne', spriteKey: 'npc-male-6',
    party: [
      { pokemonId: 6, level: 72, moves: ['flamethrower', 'dragon-rage', 'earthquake', 'slash'] },
      { pokemonId: 59, level: 71, moves: ['flamethrower', 'fire-blast', 'take-down', 'agility'] },
      { pokemonId: 126, level: 72, moves: ['fire-blast', 'thunder-punch', 'psychic', 'confuse-ray'] },
      { pokemonId: 78, level: 71, moves: ['fire-blast', 'stomp', 'agility', 'hyper-beam'] },
      { pokemonId: 146, level: 73, moves: ['fire-blast', 'hyper-beam', 'agility', 'fire-spin'] },
      { pokemonId: 149, level: 75, moves: ['hyper-beam', 'fire-blast', 'thunder', 'dragon-rage'] },
    ],
    dialogue: {
      before: ['Ashborne: Champion... once more.', 'Ashborne: This time, I hold nothing back.'],
      after: ['Ashborne: ...Still unbroken. As it should be.'],
    },
    rewardMoney: 7800,
  },

  // ─── Champion Aldric Rematch (Lv 72–78) ───

  'rematch-aldric': {
    id: 'rematch-aldric', name: 'Champion Aldric', spriteKey: 'npc-male-6',
    party: [
      { pokemonId: 94, level: 72, moves: ['shadow-ball', 'psychic', 'hypnosis', 'dream-eater'] },
      { pokemonId: 65, level: 73, moves: ['psychic', 'recover', 'reflect', 'shadow-ball'] },
      { pokemonId: 130, level: 74, moves: ['hydro-pump', 'ice-beam', 'earthquake', 'dragon-rage'] },
      { pokemonId: 59, level: 74, moves: ['flamethrower', 'fire-blast', 'take-down', 'agility'] },
      { pokemonId: 149, level: 76, moves: ['hyper-beam', 'fire-blast', 'thunder', 'dragon-rage'] },
      { pokemonId: 150, level: 78, moves: ['psychic', 'recover', 'ice-beam', 'thunderbolt'] },
    ],
    dialogue: {
      before: [
        'Aldric: You\'ve returned... Champion.',
        'Aldric: I\'ve had time to reflect. My methods were wrong.',
        'Aldric: But my strength remains. Let me test yours once more.',
      ],
      after: [
        'Aldric: ...Still unmatched. You truly are the Champion of Aurum.',
      ],
    },
    rewardMoney: 15000,
    /** Boss synthesis: Aldric uses Synthesis on Mewtwo. */
    useSynthesis: true,
    synthesisSlot: 5,
  },

  // ─── Rival Kael — Champion Challenger (Lv 60–65) ───

  'rematch-kael': {
    id: 'rematch-kael', name: 'Kael', spriteKey: 'rival',
    party: [
      { pokemonId: 6, level: 65, moves: ['flamethrower', 'fire-blast', 'dragon-rage', 'earthquake'] },
      { pokemonId: 18, level: 62, moves: ['fly', 'quick-attack', 'mirror-move', 'agility'] },
      { pokemonId: 20, level: 62, moves: ['hyper-fang', 'super-fang', 'bite', 'body-slam'] },
      { pokemonId: 57, level: 63, moves: ['karate-chop', 'seismic-toss', 'thunder-punch', 'earthquake'] },
      { pokemonId: 65, level: 63, moves: ['psychic', 'recover', 'reflect', 'shadow-ball'] },
      { pokemonId: 130, level: 64, moves: ['hydro-pump', 'ice-beam', 'earthquake', 'dragon-rage'] },
    ],
    dialogue: {
      before: [
        'Kael: Hey, Champion! Ready for our weekly showdown?',
        'Kael: My team and I have been grinding — no way you beat us this time!',
      ],
      after: [
        'Kael: Ugh! So close!',
        'Kael: ...Same time next week?',
      ],
    },
    rewardMoney: 6500,
  },
};
