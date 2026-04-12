import { TrainerData } from './interfaces';

export const trainerData: Record<string, TrainerData> = {
  'rival-1': {
    id: 'rival-1', name: 'Blue', spriteKey: 'rival',
    party: [
      { pokemonId: 4, level: 5, moves: ['scratch', 'growl'] }, // If player chose Bulbasaur
    ],
    dialogue: {
      before: ['Blue: Hey! Let\'s see how your Pokémon does against mine!'],
      after: ['Blue: What?! I picked the wrong Pokémon!'],
    },
    rewardMoney: 175,
  },
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
