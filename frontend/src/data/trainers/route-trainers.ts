import { TrainerData } from '../interfaces';

export const routeTrainers: Record<string, TrainerData> = {
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

  // ─── Route 4: Basalt Ridge — hikers ───
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

  // ─── Ironvale Gym: Steel-themed trainers ───
  'blackbelt-1': {
    id: 'blackbelt-1', name: 'Black Belt Koji', spriteKey: 'npc-male-3',
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
    id: 'worker-1', name: 'Foundry Worker Gil', spriteKey: 'npc-male-3',
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

  // ─── Route 5: Verdant Path — nature trainers ───
  'camper-4': {
    id: 'camper-4', name: 'Camper Rosa', spriteKey: 'npc-female-2',
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

  // ─── Verdantia Gym: Nature-themed trainers ───
  'beauty-1': {
    id: 'beauty-1', name: 'Beauty Lily', spriteKey: 'npc-female-1',
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
    id: 'picnicker-1', name: 'Picnicker Daisy', spriteKey: 'npc-female-2',
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

  // ─── Route 8 Ace Trainers ───
  'ace-trainer-4': {
    id: 'ace-trainer-4', name: 'Ace Trainer Rex', spriteKey: 'npc-ace-trainer',
    party: [
      { pokemonId: 59, level: 38, moves: ['flamethrower', 'take-down', 'agility', 'roar'] },
      { pokemonId: 78, level: 37, moves: ['fire-blast', 'stomp', 'agility', 'fire-spin'] },
      { pokemonId: 112, level: 39, moves: ['earthquake', 'rock-slide', 'horn-drill', 'fury-attack'] },
    ],
    dialogue: {
      before: ['I\'ve trained on this pass for months!', 'Only the strongest make it past me!'],
      after: ['Impressive! The League awaits you.'],
    },
    rewardMoney: 1560,
  },
  'ace-trainer-5': {
    id: 'ace-trainer-5', name: 'Ace Trainer Luna', spriteKey: 'npc-ace-trainer-f',
    party: [
      { pokemonId: 121, level: 38, moves: ['psychic', 'hydro-pump', 'recover', 'swift'] },
      { pokemonId: 65, level: 37, moves: ['psychic', 'night-shade', 'recover', 'reflect'] },
      { pokemonId: 103, level: 38, moves: ['psychic', 'solar-beam', 'sleep-powder', 'leech-seed'] },
    ],
    dialogue: {
      before: ['The stars told me a powerful trainer would come today.', 'Let me see if the prophecy is true!'],
      after: ['The stars never lie. You\'re destined for greatness.'],
    },
    rewardMoney: 1520,
  },

  // ─── Rook Post-Game Battle (Lv 70+) ───
  'rook-postgame': {
    id: 'rook-postgame', name: 'Rook', spriteKey: 'npc-rook',
    party: [
      { pokemonId: 65, level: 72, moves: ['psychic', 'recover', 'reflect', 'thunder-wave'] },
      { pokemonId: 94, level: 71, moves: ['night-shade', 'hypnosis', 'dream-eater', 'psychic'] },
      { pokemonId: 95, level: 70, moves: ['earthquake', 'rock-slide', 'body-slam', 'bind'] },
      { pokemonId: 59, level: 72, moves: ['flamethrower', 'take-down', 'fire-blast', 'agility'] },
      { pokemonId: 130, level: 73, moves: ['hydro-pump', 'ice-beam', 'earthquake', 'hyper-beam'] },
      { pokemonId: 76, level: 74, moves: ['earthquake', 'rock-slide', 'explosion', 'body-slam'] },
    ],
    dialogue: {
      before: [
        'Rook: The wind doesn\'t ask permission to blow.',
        'Rook: Neither should you.',
        'Rook: But I need to know — have you truly grown strong enough?',
        'Rook: Show me everything you\'ve learned.',
      ],
      after: [
        'Rook: ...Yes. You are the real thing.',
        'Rook: The Shattered Isles hold one more secret.',
        'Rook: Your father... he\'s still out there.',
        'Rook: Find the temple. The answers are waiting.',
      ],
    },
    rewardMoney: 14000,
  },

  // ─── Voltara Gym (Electric, Gym 5, levels ~30-33) ───
  'engineer-voltara-1': {
    id: 'engineer-voltara-1', name: 'Engineer Watts', spriteKey: 'npc-scientist',
    party: [
      { pokemonId: 81, level: 30, moves: ['thunder-shock', 'sonic-boom', 'supersonic'] },
      { pokemonId: 100, level: 31, moves: ['thunderbolt', 'self-destruct', 'screech'] },
    ],
    dialogue: {
      before: ['The gym\'s circuits are live!', 'Hope you\'re grounded!'],
      after: ['Short-circuited...'],
    },
    rewardMoney: 700,
  },
  'engineer-voltara-2': {
    id: 'engineer-voltara-2', name: 'Engineer Spark', spriteKey: 'npc-scientist',
    party: [
      { pokemonId: 25, level: 31, moves: ['thunderbolt', 'quick-attack', 'double-team'] },
      { pokemonId: 82, level: 32, moves: ['thunder-shock', 'tri-attack', 'sonic-boom'] },
    ],
    dialogue: {
      before: ['I rewired this floor myself!', 'Let\'s see if you can navigate it!'],
      after: ['Guess you found the right path...'],
    },
    rewardMoney: 720,
  },

  // ─── Wraithmoor Gym (Ghost, Gym 6, levels ~36-39) ───
  'medium-wraithmoor-1': {
    id: 'medium-wraithmoor-1', name: 'Medium Elara', spriteKey: 'npc-psychic',
    party: [
      { pokemonId: 92, level: 36, moves: ['lick', 'confuse-ray', 'night-shade', 'hypnosis'] },
      { pokemonId: 93, level: 37, moves: ['lick', 'hypnosis', 'dream-eater', 'night-shade'] },
    ],
    dialogue: {
      before: ['The spirits sense your presence...', 'They are not pleased.'],
      after: ['The spirits... they accept you.'],
    },
    rewardMoney: 800,
  },
  'medium-wraithmoor-2': {
    id: 'medium-wraithmoor-2', name: 'Medium Dorian', spriteKey: 'npc-psychic',
    party: [
      { pokemonId: 104, level: 37, moves: ['bone-club', 'headbutt', 'leer', 'bonemerang'] },
      { pokemonId: 93, level: 38, moves: ['night-shade', 'confuse-ray', 'dream-eater', 'lick'] },
    ],
    dialogue: {
      before: ['I commune with those who have passed...', 'Your Pokémon\'s spirits burn bright.'],
      after: ['Such... vitality. The mist parts for you.'],
    },
    rewardMoney: 820,
  },

  // ─── Scalecrest Gym (Dragon, Gym 7, levels ~40-43) ───
  'ace-scalecrest-1': {
    id: 'ace-scalecrest-1', name: 'Dragon Tamer Ryuu', spriteKey: 'npc-ace-trainer',
    party: [
      { pokemonId: 147, level: 40, moves: ['dragon-rage', 'slam', 'thunder-wave', 'wrap'] },
      { pokemonId: 130, level: 41, moves: ['hydro-pump', 'bite', 'dragon-rage'] },
    ],
    dialogue: {
      before: ['The dragons test all who enter!', 'Only the worthy face Drake!'],
      after: ['You have the heart of a dragon tamer.'],
    },
    rewardMoney: 900,
  },
  'ace-scalecrest-2': {
    id: 'ace-scalecrest-2', name: 'Dragon Tamer Kira', spriteKey: 'npc-ace-trainer-f',
    party: [
      { pokemonId: 148, level: 41, moves: ['dragon-rage', 'slam', 'agility', 'thunder-wave'] },
      { pokemonId: 117, level: 41, moves: ['water-gun', 'ice-beam', 'smokescreen', 'hydro-pump'] },
    ],
    dialogue: {
      before: ['I\'ve trained here since childhood!', 'My dragons won\'t go easy on you!'],
      after: ['You\'ve earned your place before Drake.'],
    },
    rewardMoney: 920,
  },

  // ─── Cinderfall Gym (Fire, Gym 8, levels ~42-45) ───
  'kindler-cinderfall-1': {
    id: 'kindler-cinderfall-1', name: 'Kindler Ash', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 77, level: 42, moves: ['fire-spin', 'stomp', 'agility'] },
      { pokemonId: 58, level: 43, moves: ['flamethrower', 'bite', 'take-down'] },
    ],
    dialogue: {
      before: ['The heat in here is nothing!', 'Wait till you feel my Pokémon\'s flames!'],
      after: ['You didn\'t even break a sweat...'],
    },
    rewardMoney: 950,
  },
  'kindler-cinderfall-2': {
    id: 'kindler-cinderfall-2', name: 'Kindler Ember', spriteKey: 'npc-ace-trainer-f',
    party: [
      { pokemonId: 126, level: 43, moves: ['flamethrower', 'fire-punch', 'smokescreen'] },
      { pokemonId: 78, level: 44, moves: ['fire-spin', 'stomp', 'fire-blast'] },
    ],
    dialogue: {
      before: ['Solara taught me everything I know!', 'Her fire burns in all of us!'],
      after: ['Even Solara\'s training wasn\'t enough...'],
    },
    rewardMoney: 980,
  },

  // ─── Viridian Gym (Ground, Gym 9, levels ~48-50) ───
  'cooltrainer-viridian-1': {
    id: 'cooltrainer-viridian-1', name: 'Cooltrainer Rex', spriteKey: 'npc-ace-trainer',
    party: [
      { pokemonId: 51, level: 48, moves: ['earthquake', 'slash', 'sand-attack', 'dig'] },
      { pokemonId: 31, level: 48, moves: ['earthquake', 'body-slam', 'poison-sting', 'bite'] },
      { pokemonId: 76, level: 49, moves: ['earthquake', 'rock-throw', 'self-destruct', 'defense-curl'] },
    ],
    dialogue: {
      before: ['Giovanni doesn\'t accept weak challengers.', 'Let me see what you\'re made of!'],
      after: ['You\'re the real deal. Giovanni awaits.'],
    },
    rewardMoney: 1100,
  },
  'cooltrainer-viridian-2': {
    id: 'cooltrainer-viridian-2', name: 'Cooltrainer Luna', spriteKey: 'npc-ace-trainer-f',
    party: [
      { pokemonId: 28, level: 48, moves: ['earthquake', 'slash', 'sand-attack', 'fury-swipes'] },
      { pokemonId: 105, level: 49, moves: ['bonemerang', 'bone-club', 'headbutt', 'leer'] },
      { pokemonId: 34, level: 50, moves: ['earthquake', 'horn-drill', 'poison-sting', 'thrash'] },
    ],
    dialogue: {
      before: ['Only the strongest can stand before the final Gym Leader.', 'Prove your worth!'],
      after: ['Incredible power... Giovanni will be interested.'],
    },
    rewardMoney: 1150,
  },
};
