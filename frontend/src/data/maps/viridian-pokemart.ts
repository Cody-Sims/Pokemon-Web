import { MapDefinition, parseMap } from './shared';

const ground = parseMap([
  // 0123456789
  '##########', // 0 - north wall
  '#w______w#', // 1 - windows
  '#_kkkkkk_#', // 2 - counter
  '#________#', // 3
  '#_b____b_#', // 4 - shelves
  '#_b____b_#', // 5 - shelves
  '#________#', // 6
  '#____v___#', // 7 - exit mat
]);

export const viridianPokemart: MapDefinition = {
  key: 'viridian-pokemart',
  width: 10,
  height: 8,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'PokéMart',
  npcs: [
    {
      id: 'viridian-clerk-inside',
      tileX: 5,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Welcome to the PokéMart!',
        'Oh wait, I have a package for Prof. Oak.',
        'Would you deliver it for me?',
      ],
      flagDialogue: [
        {
          flag: 'deliveredParcel',
          dialogue: [
            'Welcome to the PokéMart!',
            'Take a look at our wares!',
          ],
        },
      ],
      setsFlag: 'hasParcel',
      interactionType: 'shop',
    },
    {
      id: 'viridian-mart-shopper',
      tileX: 3,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        "I always stock up on Potions before heading out.",
        "You never know what you'll encounter!",
      ],
    },
  ],
  trainers: [],
  warps: [
    { tileX: 5, tileY: 7, targetMap: 'viridian-city', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 6, direction: 'up' },
  },
};
