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
    id: 'marina-1', name: 'Marina', spriteKey: 'generic-trainer',
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
    id: 'marina-4', name: 'Marina', spriteKey: 'generic-trainer',
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
    id: 'synthesis-grunt-1', name: 'Synthesis Grunt', spriteKey: 'generic-trainer',
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
    id: 'synthesis-grunt-2', name: 'Synthesis Grunt', spriteKey: 'generic-trainer',
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
    id: 'synthesis-grunt-3', name: 'Synthesis Grunt', spriteKey: 'generic-trainer',
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
    id: 'hiker-1', name: 'Hiker Marcus', spriteKey: 'generic-trainer',
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
    id: 'hiker-2', name: 'Hiker Bruno', spriteKey: 'generic-trainer',
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
    id: 'hiker-3', name: 'Hiker Cliff', spriteKey: 'generic-trainer',
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
    id: 'swimmer-1', name: 'Swimmer Derek', spriteKey: 'generic-trainer',
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
    id: 'lass-2', name: 'Lass Cynthia', spriteKey: 'generic-trainer',
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
    id: 'youngster-3', name: 'Youngster Kevin', spriteKey: 'generic-trainer',
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
    id: 'gym-coral', name: 'Gym Leader Coral', spriteKey: 'generic-trainer',
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
    id: 'gym-ferris', name: 'Gym Leader Ferris', spriteKey: 'generic-trainer',
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
    id: 'gym-ivy', name: 'Gym Leader Ivy', spriteKey: 'generic-trainer',
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
    id: 'gym-blitz', name: 'Gym Leader Blitz', spriteKey: 'generic-trainer',
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
    id: 'admin-vex-1', name: 'Admin Vex', spriteKey: 'generic-trainer',
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
    id: 'hiker-4', name: 'Hiker Raymond', spriteKey: 'generic-trainer',
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
    id: 'bug-catcher-4', name: 'Bug Catcher Tommy', spriteKey: 'generic-trainer',
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
    id: 'lass-3', name: 'Lass Fiona', spriteKey: 'generic-trainer',
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

  // ─── Route 1 / Viridian Forest: Original trainers ───
  'bug-catcher-1': {
    id: 'bug-catcher-1', name: 'Bug Catcher Rick', spriteKey: 'generic-trainer',
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
    id: 'bug-catcher-2', name: 'Bug Catcher Doug', spriteKey: 'generic-trainer',
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
    id: 'bug-catcher-3', name: 'Bug Catcher Sammy', spriteKey: 'generic-trainer',
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
    id: 'youngster-1', name: 'Youngster Joey', spriteKey: 'generic-trainer',
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
    id: 'lass-1', name: 'Lass Janice', spriteKey: 'generic-trainer',
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
    id: 'youngster-2', name: 'Youngster Ben', spriteKey: 'generic-trainer',
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
    id: 'gym-brock', name: 'Gym Leader Brock', spriteKey: 'generic-trainer',
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
};
