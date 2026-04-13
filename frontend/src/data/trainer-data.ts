import { TrainerData } from './interfaces';

export const trainerData: Record<string, TrainerData> = {
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

  // ─── Crystal Cavern: Hikers ───
  'hiker-1': {
    id: 'hiker-1', name: 'Hiker Marcus', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 74, level: 10, moves: ['tackle', 'defense-curl', 'rock-throw'] },
      { pokemonId: 74, level: 10, moves: ['tackle', 'defense-curl'] },
    ],
    dialogue: {
      before: ['These caves are full of tough Rock Pokémon!', 'Think you can handle them?'],
      after: ['Whoa! You\'re tougher than these rocks!'],
    },
    rewardMoney: 200,
  },
  'hiker-2': {
    id: 'hiker-2', name: 'Hiker Bruno', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 95, level: 11, moves: ['tackle', 'rock-throw', 'bind'] },
    ],
    dialogue: {
      before: ['My Onix and I own this tunnel!'],
      after: ['Even Onix couldn\'t stop you...'],
    },
    rewardMoney: 220,
  },
  'hiker-3': {
    id: 'hiker-3', name: 'Hiker Cliff', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 74, level: 11, moves: ['tackle', 'rock-throw', 'dig'] },
      { pokemonId: 50, level: 12, moves: ['dig', 'scratch', 'sand-attack'] },
      { pokemonId: 74, level: 11, moves: ['tackle', 'defense-curl', 'rock-throw'] },
    ],
    dialogue: {
      before: ['I\'ve been mining these caves for years!', 'No one passes without a battle!'],
      after: ['Looks like you\'ve carved a path right through me!'],
    },
    rewardMoney: 240,
  },

  // ─── Route 3: Tide Pool Path trainers ───
  'swimmer-1': {
    id: 'swimmer-1', name: 'Swimmer Derek', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 120, level: 13, moves: ['tackle', 'water-gun', 'harden'] },
      { pokemonId: 72, level: 13, moves: ['poison-sting', 'supersonic', 'wrap'] },
    ],
    dialogue: {
      before: ['The waves are perfect today!', 'Let\'s ride them into battle!'],
      after: ['Wipeout! You\'re pretty good!'],
    },
    rewardMoney: 260,
  },
  'lass-2': {
    id: 'lass-2', name: 'Lass Cynthia', spriteKey: 'npc-lass',
    party: [
      { pokemonId: 29, level: 12, moves: ['scratch', 'poison-sting', 'tail-whip'] },
      { pokemonId: 35, level: 13, moves: ['pound', 'growl', 'sing'] },
    ],
    dialogue: {
      before: ['I love walking along the shore!', 'Will your Pokémon play with mine?'],
      after: ['Oh no, they\'re too tired to play now...'],
    },
    rewardMoney: 260,
  },
  'youngster-3': {
    id: 'youngster-3', name: 'Youngster Kevin', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 27, level: 13, moves: ['scratch', 'sand-attack', 'slash'] },
      { pokemonId: 21, level: 12, moves: ['peck', 'leer', 'fury-attack'] },
      { pokemonId: 56, level: 13, moves: ['scratch', 'karate-chop', 'leer'] },
    ],
    dialogue: {
      before: ['I\'ve been training on the beach all day!', 'Come on, fight me!'],
      after: ['Sand got in my eyes... that\'s why I lost!'],
    },
    rewardMoney: 260,
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
  },

  // ─── Route 4 trainers ───
  'hiker-4': {
    id: 'hiker-4', name: 'Hiker Raymond', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 74, level: 16, moves: ['rock-throw', 'tackle', 'defense-curl'] },
      { pokemonId: 75, level: 17, moves: ['rock-throw', 'tackle', 'defense-curl'] },
    ],
    dialogue: {
      before: ['This ridge is treacherous!', 'Only the toughest trainers pass!'],
      after: ['You\'re tougher than basalt!'],
    },
    rewardMoney: 340,
  },

  // ─── Route 5 trainers ───
  'bug-catcher-4': {
    id: 'bug-catcher-4', name: 'Bug Catcher Tommy', spriteKey: 'npc-bug-catcher',
    party: [
      { pokemonId: 12, level: 23, moves: ['psybeam', 'sleep-powder', 'gust'] },
      { pokemonId: 15, level: 23, moves: ['twineedle', 'fury-attack', 'focus-energy'] },
    ],
    dialogue: {
      before: ['These forest bugs are fully evolved!', 'Think you can handle them?'],
      after: ['My beautiful bugs!'],
    },
    rewardMoney: 460,
  },
  'lass-3': {
    id: 'lass-3', name: 'Lass Fiona', spriteKey: 'npc-lass',
    party: [
      { pokemonId: 44, level: 24, moves: ['acid', 'sleep-powder', 'razor-leaf'] },
      { pokemonId: 36, level: 24, moves: ['sing', 'body-slam', 'double-slap'] },
    ],
    dialogue: {
      before: ['The forest air is so refreshing!', 'Let\'s have a battle to celebrate!'],
      after: ['You\'re really strong!'],
    },
    rewardMoney: 480,
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
  },

  // ─── Route 6 trainers ───
  'psychic-1': {
    id: 'psychic-1', name: 'Psychic Elena', spriteKey: 'npc-psychic',
    party: [
      { pokemonId: 65, level: 32, moves: ['psychic', 'psybeam', 'recover', 'reflect'] },
      { pokemonId: 97, level: 33, moves: ['psychic', 'hypnosis', 'dream-eater', 'confusion'] },
    ],
    dialogue: {
      before: ['I foresaw your arrival...', 'My Psychic Pokémon and I await your challenge!'],
      after: ['I did not foresee... my defeat.'],
    },
    rewardMoney: 660,
  },

  // ─── Victory Road Ace Trainers ───
  'ace-trainer-1': {
    id: 'ace-trainer-1', name: 'Ace Trainer Victor', spriteKey: 'npc-ace-trainer',
    party: [
      { pokemonId: 68, level: 42, moves: ['karate-chop', 'seismic-toss', 'submission', 'body-slam'] },
      { pokemonId: 76, level: 42, moves: ['earthquake', 'rock-throw', 'body-slam', 'explosion'] },
      { pokemonId: 18, level: 43, moves: ['wing-attack', 'quick-attack', 'mirror-move', 'agility'] },
    ],
    dialogue: {
      before: ['Only the strongest reach Victory Road!', 'Prove you belong here!'],
      after: ['You earned your place. Go get \'em!'],
    },
    rewardMoney: 2100,
  },
  'ace-trainer-2': {
    id: 'ace-trainer-2', name: 'Ace Trainer Luna', spriteKey: 'npc-ace-trainer-f',
    party: [
      { pokemonId: 121, level: 43, moves: ['psychic', 'surf', 'ice-beam', 'recover'] },
      { pokemonId: 103, level: 43, moves: ['psychic', 'solar-beam', 'sleep-powder', 'leech-seed'] },
      { pokemonId: 59, level: 44, moves: ['flamethrower', 'bite', 'take-down', 'agility'] },
    ],
    dialogue: {
      before: ['The Champion awaits beyond!', 'Do you have what it takes?'],
      after: ['You do. Go show them what you\'re made of!'],
    },
    rewardMoney: 2150,
  },
  'ace-trainer-3': {
    id: 'ace-trainer-3', name: 'Ace Trainer Rex', spriteKey: 'npc-ace-trainer',
    party: [
      { pokemonId: 130, level: 44, moves: ['hydro-pump', 'bite', 'dragon-rage', 'thrash'] },
      { pokemonId: 65, level: 44, moves: ['psychic', 'recover', 'reflect', 'psybeam'] },
      { pokemonId: 112, level: 45, moves: ['earthquake', 'rock-throw', 'body-slam', 'horn-attack'] },
    ],
    dialogue: {
      before: ['I\'m the last wall before the League!', 'Give me everything you\'ve got!'],
      after: ['The wall has fallen. Good luck in there!'],
    },
    rewardMoney: 2200,
  },

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
  },

  // ─── Route 1 / Viridian Forest: Original trainers ───
  'bug-catcher-1': {
    id: 'bug-catcher-1', name: 'Bug Catcher Rick', spriteKey: 'npc-bug-catcher',
    party: [
      { pokemonId: 10, level: 6 },
      { pokemonId: 13, level: 6 },
    ],
    dialogue: {
      before: ['Hey! You have Pokémon! Let\'s battle!'],
      after: ['Aw, my bugs lost...'],
    },
    rewardMoney: 60,
  },
  'bug-catcher-2': {
    id: 'bug-catcher-2', name: 'Bug Catcher Doug', spriteKey: 'npc-bug-catcher',
    party: [
      { pokemonId: 13, level: 7 },
      { pokemonId: 14, level: 7 },
      { pokemonId: 10, level: 7 },
    ],
    dialogue: {
      before: ['My bugs are the best! Come on!'],
      after: ['No way! My collection!'],
    },
    rewardMoney: 70,
  },
  'bug-catcher-3': {
    id: 'bug-catcher-3', name: 'Bug Catcher Sammy', spriteKey: 'npc-bug-catcher',
    party: [
      { pokemonId: 10, level: 9 },
      { pokemonId: 11, level: 9 },
    ],
    dialogue: {
      before: ['Caterpie and Metapod are all I need!'],
      after: ['They weren\'t enough...'],
    },
    rewardMoney: 90,
  },
  'youngster-1': {
    id: 'youngster-1', name: 'Youngster Joey', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 19, level: 6 },
    ],
    dialogue: {
      before: ['My Rattata is in the top percentage of Rattata!'],
      after: ['My Rattata lost?!'],
    },
    rewardMoney: 60,
  },
  'lass-1': {
    id: 'lass-1', name: 'Lass Janice', spriteKey: 'npc-lass',
    party: [
      { pokemonId: 16, level: 7 },
      { pokemonId: 43, level: 7 },
    ],
    dialogue: {
      before: ['Let me test my Pokémon against yours!'],
      after: ['Oh, you\'re pretty good!'],
    },
    rewardMoney: 70,
  },
  'youngster-2': {
    id: 'youngster-2', name: 'Youngster Ben', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 19, level: 9 },
      { pokemonId: 16, level: 9 },
    ],
    dialogue: {
      before: ['I just caught some cool Pokémon! Wanna see?'],
      after: ['Guess yours were cooler...'],
    },
    rewardMoney: 90,
  },
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
  },

  // ─── Route 2: Trainers near Crystal Cavern entrance ───
  'youngster-4': {
    id: 'youngster-4', name: 'Youngster Tim', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 32, level: 9, moves: ['leer', 'tackle', 'poison-sting'] },
      { pokemonId: 27, level: 9, moves: ['scratch', 'sand-attack'] },
    ],
    dialogue: {
      before: ['I\'ve been training near the cavern entrance!', 'Wanna see how tough I am?'],
      after: ['The cave Pokémon are even tougher than me...'],
    },
    rewardMoney: 90,
  },
  'lass-4': {
    id: 'lass-4', name: 'Lass Mira', spriteKey: 'npc-lass',
    party: [
      { pokemonId: 29, level: 10, moves: ['scratch', 'growl', 'poison-sting'] },
      { pokemonId: 39, level: 10, moves: ['sing', 'pound', 'defense-curl'] },
    ],
    dialogue: {
      before: ['I heard strange noises from the cavern last night...', 'It made my Pokémon nervous. Let\'s battle to calm them down!'],
      after: ['Maybe the cavern noises are nothing... but I\'m staying out here.'],
    },
    rewardMoney: 100,
  },
  'camper-1': {
    id: 'camper-1', name: 'Camper Ethan', spriteKey: 'npc-male-1',
    party: [
      { pokemonId: 21, level: 9, moves: ['peck', 'leer', 'fury-attack'] },
      { pokemonId: 19, level: 10, moves: ['tackle', 'quick-attack', 'tail-whip'] },
      { pokemonId: 56, level: 9, moves: ['scratch', 'leer', 'karate-chop'] },
    ],
    dialogue: {
      before: ['I\'m camping out here watching the cave entrance.', 'Some guys in white lab coats went in earlier...', 'Anyway, let\'s battle!'],
      after: ['Hmm, those lab coat people still haven\'t come out...'],
    },
    rewardMoney: 100,
  },

  // ─── Viridian Forest: Additional trainers ───
  'bug-catcher-5': {
    id: 'bug-catcher-5', name: 'Bug Catcher Leo', spriteKey: 'npc-bug-catcher',
    party: [
      { pokemonId: 13, level: 8, moves: ['poison-sting', 'string-shot'] },
      { pokemonId: 14, level: 8, moves: ['harden'] },
      { pokemonId: 10, level: 8, moves: ['tackle', 'string-shot'] },
    ],
    dialogue: {
      before: ['I found a weird metal device in the bushes...', 'But who cares about that! Let\'s battle!'],
      after: ['Do you think someone left that device on purpose?'],
    },
    rewardMoney: 80,
  },
  'lass-5': {
    id: 'lass-5', name: 'Lass Violet', spriteKey: 'npc-lass',
    party: [
      { pokemonId: 25, level: 9, moves: ['thunder-shock', 'growl', 'quick-attack'] },
      { pokemonId: 43, level: 8, moves: ['absorb', 'growth'] },
    ],
    dialogue: {
      before: ['I love the forest! The Pokémon here are so cute!', 'Oh, you want to battle? Sure!'],
      after: ['You\'re really strong for someone just starting out!'],
    },
    rewardMoney: 90,
  },

  // ─── Crystal Cavern: Additional trainers ───
  'hiker-5': {
    id: 'hiker-5', name: 'Hiker Garrett', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 66, level: 11, moves: ['karate-chop', 'leer', 'low-kick'] },
      { pokemonId: 74, level: 12, moves: ['tackle', 'rock-throw', 'defense-curl'] },
    ],
    dialogue: {
      before: ['The crystals down here are glowing brighter than usual...', 'Something\'s disturbing the ley line!'],
      after: ['Be careful deeper in — I heard machinery running.'],
    },
    rewardMoney: 240,
  },
  'camper-2': {
    id: 'camper-2', name: 'Camper Felix', spriteKey: 'npc-male-1',
    party: [
      { pokemonId: 27, level: 11, moves: ['scratch', 'sand-attack'] },
      { pokemonId: 41, level: 12, moves: ['leech-life', 'supersonic', 'bite'] },
      { pokemonId: 46, level: 11, moves: ['scratch', 'stun-spore', 'leech-life'] },
    ],
    dialogue: {
      before: ['I came in here exploring and got lost!', 'At least I can battle to pass the time!'],
      after: ['Which way is the exit again?'],
    },
    rewardMoney: 220,
  },

  // ─── Pewter Gym: Junior trainer ───
  'camper-3': {
    id: 'camper-3', name: 'Camper Liam', spriteKey: 'npc-male-1',
    party: [
      { pokemonId: 74, level: 10, moves: ['tackle', 'defense-curl'] },
      { pokemonId: 27, level: 11, moves: ['scratch', 'sand-attack'] },
    ],
    dialogue: {
      before: ['Brock taught me everything I know!', 'You\'ll have to get through me first!'],
      after: ['Brock is way tougher than me — good luck!'],
    },
    rewardMoney: 110,
  },

  // ─── Route 3: Tide Pool Path — additional coastal trainers ───
  'swimmer-2': {
    id: 'swimmer-2', name: 'Swimmer Lydia', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 72, level: 14, moves: ['poison-sting', 'supersonic', 'wrap'] },
      { pokemonId: 116, level: 14, moves: ['water-gun', 'smokescreen', 'bubble'] },
    ],
    dialogue: {
      before: ['Have you noticed the water tastes different lately?', 'The Pokémon in the reef are acting strange too.', 'Oh well — battle me!'],
      after: ['Something in the ocean isn\'t right... talk to Coral about it.'],
    },
    rewardMoney: 280,
  },
  'fisherman-1': {
    id: 'fisherman-1', name: 'Fisherman Barney', spriteKey: 'npc-sailor',
    party: [
      { pokemonId: 129, level: 12 },
      { pokemonId: 129, level: 13 },
      { pokemonId: 118, level: 14, moves: ['peck', 'tail-whip', 'water-gun'] },
    ],
    dialogue: {
      before: ['I\'ve been fishing here for thirty years!', 'My Magikarp are legendary!'],
      after: ['Okay, Magikarp aren\'t great battlers... but they\'re great eating! ...Kidding.'],
    },
    rewardMoney: 240,
  },
  'sailor-1': {
    id: 'sailor-1', name: 'Sailor Craig', spriteKey: 'npc-sailor',
    party: [
      { pokemonId: 66, level: 14, moves: ['karate-chop', 'leer', 'low-kick'] },
      { pokemonId: 72, level: 14, moves: ['poison-sting', 'supersonic', 'acid'] },
    ],
    dialogue: {
      before: ['I sail these waters every day.', 'Lately I\'ve seen boats with no lights heading to the eastern islands.', 'Anyway — let\'s throw down!'],
      after: ['You fight like the sea — wild and unstoppable!', 'Watch out for those mystery boats, kid.'],
    },
    rewardMoney: 280,
  },

  // ─── Coral Gym: Additional swimmer trainer ───
  'swimmer-3': {
    id: 'swimmer-3', name: 'Swimmer Nami', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 90, level: 17, moves: ['tackle', 'withdraw', 'clamp'] },
      { pokemonId: 118, level: 17, moves: ['peck', 'water-gun', 'horn-attack'] },
      { pokemonId: 120, level: 18, moves: ['water-gun', 'harden', 'tackle'] },
    ],
    dialogue: {
      before: ['Coral trained me personally!', 'The ocean gives us strength!'],
      after: ['The tide turns... Coral won\'t go down so easily though!'],
    },
    rewardMoney: 360,
  },

  // ─── Route 4: Basalt Ridge — hikers and Synthesis presence ───
  'hiker-6': {
    id: 'hiker-6', name: 'Hiker Mason', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 66, level: 17, moves: ['karate-chop', 'low-kick', 'leer'] },
      { pokemonId: 75, level: 18, moves: ['rock-throw', 'tackle', 'defense-curl', 'self-destruct'] },
    ],
    dialogue: {
      before: ['The ridge path is dangerous — rockslides everywhere!', 'If you can beat me, you can handle it!'],
      after: ['Careful ahead — I saw people in white coats setting up equipment.'],
    },
    rewardMoney: 360,
  },
  'youngster-5': {
    id: 'youngster-5', name: 'Youngster Drake', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 28, level: 16, moves: ['slash', 'sand-attack', 'poison-sting'] },
      { pokemonId: 22, level: 17, moves: ['peck', 'fury-attack', 'leer', 'mirror-move'] },
    ],
    dialogue: {
      before: ['I\'m gonna be the strongest trainer on this mountain!', 'No one passes without battling me!'],
      after: ['Okay, maybe second strongest...'],
    },
    rewardMoney: 340,
  },
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

  // ─── Ironvale Gym: Steel-themed trainers ───
  'blackbelt-1': {
    id: 'blackbelt-1', name: 'Black Belt Koji', spriteKey: 'npc-male-4',
    party: [
      { pokemonId: 67, level: 23, moves: ['karate-chop', 'seismic-toss', 'low-kick', 'leer'] },
      { pokemonId: 75, level: 24, moves: ['rock-throw', 'self-destruct', 'defense-curl', 'dig'] },
    ],
    dialogue: {
      before: ['Steel is forged through fire and pressure!', 'I train my Fighting Pokémon the same way!', 'Show me your resolve!'],
      after: ['Your spirit burns brighter than the forge!', 'Ferris will test you further.'],
    },
    rewardMoney: 480,
  },
  'worker-1': {
    id: 'worker-1', name: 'Foundry Worker Gil', spriteKey: 'npc-male-4',
    party: [
      { pokemonId: 81, level: 22, moves: ['thunder-shock', 'sonic-boom', 'tackle'] },
      { pokemonId: 82, level: 23, moves: ['thunder-shock', 'sonic-boom', 'supersonic'] },
    ],
    dialogue: {
      before: ['I work the forge six days a week!', 'My Magnemite are tougher than any machine!'],
      after: ['Back to the anvil for me...'],
    },
    rewardMoney: 460,
  },

  // ─── Route 5: Verdant Path — nature trainers and Synthesis scout ───
  'camper-4': {
    id: 'camper-4', name: 'Camper Rosa', spriteKey: 'npc-female-4',
    party: [
      { pokemonId: 25, level: 24, moves: ['thunderbolt', 'quick-attack', 'double-team'] },
      { pokemonId: 44, level: 23, moves: ['acid', 'sleep-powder', 'razor-leaf'] },
      { pokemonId: 17, level: 24, moves: ['wing-attack', 'quick-attack', 'gust'] },
    ],
    dialogue: {
      before: ['The forest here is so peaceful...', 'I saw someone setting traps for Pokémon earlier though.', 'It made me angry! Let me blow off steam with a battle!'],
      after: ['Marina mentioned the traps too — she\'s investigating deeper in.'],
    },
    rewardMoney: 480,
  },
  'youngster-6': {
    id: 'youngster-6', name: 'Youngster Miles', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 20, level: 23, moves: ['hyper-fang', 'quick-attack', 'bite'] },
      { pokemonId: 22, level: 24, moves: ['fury-attack', 'peck', 'mirror-move', 'leer'] },
    ],
    dialogue: {
      before: ['I ran all the way from Pewter City to train here!', 'These forest Pokémon are amazing!'],
      after: ['Wow, you\'re way ahead of me. How many badges do you have?'],
    },
    rewardMoney: 480,
  },
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

  // ─── Verdantia Gym: Nature-themed trainers ───
  'beauty-1': {
    id: 'beauty-1', name: 'Beauty Lily', spriteKey: 'npc-female-3',
    party: [
      { pokemonId: 45, level: 27, moves: ['petal-dance', 'sleep-powder', 'acid', 'mega-drain'] },
      { pokemonId: 47, level: 27, moves: ['spore', 'slash', 'mega-drain', 'growth'] },
    ],
    dialogue: {
      before: ['The flowers in this gym bloom with Aether energy!', 'Their beauty hides their power — just like my Pokémon!'],
      after: ['Like petals in the wind... Ivy will be a bigger challenge.'],
    },
    rewardMoney: 540,
  },
  'picnicker-1': {
    id: 'picnicker-1', name: 'Picnicker Daisy', spriteKey: 'npc-female-4',
    party: [
      { pokemonId: 114, level: 28, moves: ['vine-whip', 'bind', 'sleep-powder', 'growth'] },
      { pokemonId: 2, level: 27, moves: ['razor-leaf', 'vine-whip', 'sleep-powder', 'growth'] },
    ],
    dialogue: {
      before: ['Ivy taught me that plants communicate through their roots!', 'My Grass Pokémon and I share that connection!'],
      after: ['Your bond with your Pokémon is something special.'],
    },
    rewardMoney: 560,
  },

  // ─── Voltara Gym: Electric-themed trainers ───
  'engineer-1': {
    id: 'engineer-1', name: 'Engineer Watts', spriteKey: 'npc-scientist',
    party: [
      { pokemonId: 100, level: 31, moves: ['thunderbolt', 'swift', 'screech', 'self-destruct'] },
      { pokemonId: 82, level: 32, moves: ['thunderbolt', 'sonic-boom', 'supersonic', 'tri-attack'] },
    ],
    dialogue: {
      before: ['I designed half the circuits in this gym!', 'My Pokémon ARE the other half!'],
      after: ['Short circuit! Blitz will fry you though — literally!'],
    },
    rewardMoney: 640,
  },
  'engineer-2': {
    id: 'engineer-2', name: 'Engineer Tesla', spriteKey: 'npc-scientist',
    party: [
      { pokemonId: 101, level: 32, moves: ['thunderbolt', 'swift', 'explosion', 'screech'] },
      { pokemonId: 26, level: 31, moves: ['thunderbolt', 'quick-attack', 'double-team', 'thunder-wave'] },
      { pokemonId: 125, level: 32, moves: ['thunder-punch', 'thunderbolt', 'swift', 'screech'] },
    ],
    dialogue: {
      before: ['Blitz recruited me from Voltara Tech to design the gym\'s power grid.', 'The Aether ley line here generates three times normal voltage!', 'Let me show you what that means in battle!'],
      after: ['You withstood the full voltage!', 'Blitz is gonna love fighting you.'],
    },
    rewardMoney: 640,
  },
};
