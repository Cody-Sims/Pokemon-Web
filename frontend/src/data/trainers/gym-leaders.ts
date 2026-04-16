import { TrainerData } from '../interfaces';

export const gymLeaderTrainers: Record<string, TrainerData> = {
  // ─── Gym 1: Brock (Rock-type Gym Leader) ───
  'gym-brock': {
    id: 'gym-brock', name: 'Gym Leader Brock', spriteKey: 'npc-gym-brock',
    party: [
      { pokemonId: 74, level: 12, moves: ['tackle', 'defense-curl'] },
      { pokemonId: 95, level: 14, moves: ['tackle', 'rock-throw', 'bind'] },
    ],
    dialogue: {
      before: [
        'Brock: I\'m Brock! I\'m Pewter\'s Gym Leader!',
        'Brock: I believe in rock-hard defense and determination!',
        'Brock: That\'s why my Pokémon are all the Rock type!',
        'Brock: Do you still want to challenge me? Fine then! Show me your best!',
      ],
      after: [
        'Brock: I took you for granted. And so I lost.',
        'Brock: As proof of your victory, here\'s the Boulder Badge!',
      ],
    },
    rewardMoney: 1400,
    victoryFlag: 'defeatedBrock',
    badgeReward: 'boulder',
  },

  // ─── Gym 2: Coral (Water-type Gym Leader) ───
  'gym-coral': {
    id: 'gym-coral', name: 'Gym Leader Coral', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 120, level: 18, moves: ['water-gun', 'tackle', 'harden', 'swift'] },
      { pokemonId: 90, level: 18, moves: ['tackle', 'withdraw', 'ice-beam', 'clamp'] },
      { pokemonId: 121, level: 21, moves: ['water-gun', 'swift', 'recover', 'psychic'] },
    ],
    dialogue: {
      before: [
        'Coral: Hey there, challenger! Welcome to the Coral Harbor Gym!',
        'Coral: The ocean is my home and Water Pokémon are my family!',
        'Coral: I\'ve noticed the tides have been strange lately...',
        'Coral: Something in the water isn\'t right. But first — let\'s battle!',
      ],
      after: [
        'Coral: Whoa! You ride the waves like a pro!',
        'Coral: Here\'s the Tide Badge — you earned it!',
        'Coral: Hey, listen... Pokémon have been disappearing near the reef.',
        'Coral: I don\'t have proof, but I think those "researchers" are involved.',
        'Coral: If you find anything, let me know.',
      ],
    },
    rewardMoney: 2100,
    victoryFlag: 'defeatedCoral',
    badgeReward: 'tide',
  },

  // ─── Gym 3: Ferris (Steel-type Gym Leader) ───
  'gym-ferris': {
    id: 'gym-ferris', name: 'Gym Leader Ferris', spriteKey: 'npc-gym-ferris',
    party: [
      { pokemonId: 81, level: 24, moves: ['thunder-shock', 'sonic-boom', 'supersonic', 'tackle'] },
      { pokemonId: 82, level: 24, moves: ['thunder-shock', 'sonic-boom', 'tri-attack'] },
      { pokemonId: 95, level: 27, moves: ['rock-throw', 'bind', 'slam', 'screech'] },
    ],
    dialogue: {
      before: [
        'Ferris: So you\'re the trainer who\'s been causing trouble for the Collective.',
        'Ferris: Good. We need strong trainers right now.',
        'Ferris: But first, you\'ll need to prove yourself against my Steel Pokémon!',
        'Ferris: My forge has tempered them to perfection!',
      ],
      after: [
        'Ferris: Ha! You\'re as strong as the stories say!',
        'Ferris: Take the Anvil Badge — you\'ve earned it!',
        'Ferris: Those Collective agents tried to take my forge.',
        'Ferris: The ley line beneath it powers everything here.',
        'Ferris: If they get it, Ironvale is finished.',
      ],
    },
    rewardMoney: 2700,
    victoryFlag: 'defeatedFerris',
    badgeReward: 'anvil',
  },

  // ─── Gym 4: Ivy (Grass-type Gym Leader) ───
  'gym-ivy': {
    id: 'gym-ivy', name: 'Gym Leader Ivy', spriteKey: 'npc-female-5',
    party: [
      { pokemonId: 70, level: 28, moves: ['razor-leaf', 'sleep-powder', 'vine-whip', 'wrap'] },
      { pokemonId: 47, level: 28, moves: ['spore', 'mega-drain', 'slash', 'growth'] },
      { pokemonId: 3, level: 31, moves: ['solar-beam', 'sleep-powder', 'razor-leaf', 'growth'] },
    ],
    dialogue: {
      before: [
        'Ivy: Welcome to my sanctuary, young one.',
        'Ivy: The plants here grow strong because of the Aether in the soil.',
        'Ivy: ...Or they did, until recently.',
        'Ivy: Show me the strength of your bond with your Pokémon.',
      ],
      after: [
        'Ivy: Such gentle power... Your Pokémon trust you completely.',
        'Ivy: The Canopy Badge is yours.',
        'Ivy: I discovered something terrible beneath the village...',
        'Ivy: A hidden laboratory. They\'ve been here all along.',
        'Ivy: Please... root them out.',
      ],
    },
    rewardMoney: 3100,
    victoryFlag: 'defeatedIvy',
    badgeReward: 'canopy',
  },

  // ─── Gym 5: Blitz (Electric-type Gym Leader) ───
  'gym-blitz': {
    id: 'gym-blitz', name: 'Gym Leader Blitz', spriteKey: 'npc-gym-blitz',
    party: [
      { pokemonId: 100, level: 32, moves: ['thunderbolt', 'swift', 'self-destruct', 'screech'] },
      { pokemonId: 26, level: 33, moves: ['thunderbolt', 'quick-attack', 'double-team', 'thunder-wave'] },
      { pokemonId: 101, level: 33, moves: ['thunderbolt', 'swift', 'explosion', 'screech'] },
      { pokemonId: 125, level: 35, moves: ['thunderbolt', 'thunder-punch', 'screech', 'swift'] },
    ],
    dialogue: {
      before: [
        'Blitz: YOOO! Welcome to Voltara Gym!',
        'Blitz: I built this place with my own two hands!',
        'Blitz: My Electric Pokémon run on pure Aether energy!',
        'Blitz: Let\'s see if you can handle the VOLTAGE!',
      ],
      after: [
        'Blitz: WHAAAT?! You shorted my whole circuit!',
        'Blitz: Here — the Circuit Badge! You earned it, champ!',
        'Blitz: Listen, I traced a massive power drain to coordinates in the eastern sea.',
        'Blitz: That\'s gotta be the Synthesis Collective\'s base.',
        'Blitz: I\'ll upload the coordinates to your map.',
      ],
    },
    rewardMoney: 3500,
    victoryFlag: 'defeatedBlitz',
    badgeReward: 'circuit',
  },

  // ─── Gym 6: Morwen (Ghost-type Gym Leader) ───
  'gym-morwen': {
    id: 'gym-morwen', name: 'Gym Leader Morwen', spriteKey: 'npc-female-6',
    party: [
      { pokemonId: 93, level: 38, moves: ['lick', 'hypnosis', 'dream-eater', 'confuse-ray'] },
      { pokemonId: 94, level: 40, moves: ['lick', 'hypnosis', 'dream-eater', 'night-shade'] },
      { pokemonId: 93, level: 38, moves: ['night-shade', 'confuse-ray', 'hypnosis', 'lick'] },
    ],
    dialogue: {
      before: ['Morwen: The spirits whisper of your coming...', 'Morwen: Let us see if you can face what lies beyond the veil.'],
      after: ['Morwen: The spirits approve. Take the Phantom Badge.', 'Morwen: The sleeper beneath the spire will not distinguish between savior and destroyer.', 'Morwen: Be certain of your resolve.'],
    },
    rewardMoney: 4000,
    victoryFlag: 'defeatedMorwen',
    badgeReward: 'phantom',
  },

  // ─── Gym 7: Drake (Dragon-type Gym Leader) ───
  'gym-drake': {
    id: 'gym-drake', name: 'Gym Leader Drake', spriteKey: 'npc-male-5',
    party: [
      { pokemonId: 148, level: 42, moves: ['dragon-rage', 'slam', 'thunder-wave', 'agility'] },
      { pokemonId: 130, level: 42, moves: ['hydro-pump', 'bite', 'dragon-rage', 'thrash'] },
      { pokemonId: 149, level: 45, moves: ['dragon-rage', 'slam', 'thunder-wave', 'agility'] },
    ],
    dialogue: {
      before: ['Drake: My ancestors swore to protect the ley lines.', 'Drake: Only the worthy may pass. Prove yourself!'],
      after: ['Drake: You have proven your worth. The Scale Badge is yours.', 'Drake: My dragons sense a great disturbance. The final battle approaches.'],
    },
    rewardMoney: 4500,
    victoryFlag: 'defeatedDrake',
    badgeReward: 'scale',
  },

  // ─── Gym 8: Solara (Fire-type Gym Leader) ───
  'gym-solara': {
    id: 'gym-solara', name: 'Gym Leader Solara', spriteKey: 'npc-female-9',
    party: [
      { pokemonId: 78, level: 44, moves: ['fire-spin', 'stomp', 'agility', 'fire-blast'] },
      { pokemonId: 59, level: 44, moves: ['flamethrower', 'bite', 'take-down', 'agility'] },
      { pokemonId: 126, level: 46, moves: ['flamethrower', 'fire-punch', 'smokescreen', 'fire-blast'] },
      { pokemonId: 6, level: 48, moves: ['flamethrower', 'slash', 'dragon-rage', 'fire-blast'] },
    ],
    dialogue: {
      before: ['Solara: Aldric was my teacher. The greatest trainer I ever knew.', 'Solara: But the man he became...', 'Solara: Show me the fire in your heart!'],
      after: ['Solara: The Ember Badge is yours.', 'Solara: End this. For his sake as much as ours.'],
    },
    rewardMoney: 4800,
    victoryFlag: 'defeatedSolara',
    badgeReward: 'ember',
  },
};
