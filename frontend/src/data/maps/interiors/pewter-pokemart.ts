import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 0123456789
  '##########', // 0 - north wall
  '#w______w#', // 1 - windows
  '#IkkkkkII#', // 2 - counter on mart floor
  '#IIIIIIII#', // 3 - mart floor
  '#IYYIIYYI#', // 4 - shelves
  '#IYYIIYYI#', // 5 - shelves
  '#IIIIIIII#', // 6
  '#____v___#', // 7 - exit mat
]);

export const pewterPokemart: MapDefinition = {
  key: 'pewter-pokemart',
  width: 10,
  height: 8,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'PokéMart',
  npcs: [
    {
      id: 'pewter-mart-clerk',
      tileX: 5,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Welcome to the Pewter City PokéMart!',
        'Take a look at our selection!',
      ],
      interactionType: 'shop',
    },
    {
      id: 'pewter-mart-shopper',
      tileX: 3,
      tileY: 5,
      textureKey: 'npc-female-1',
      facing: 'right',
      dialogue: [
        'I always stock up on Potions before heading out.',
        'The museum is worth visiting too!',
      ],
    },
  ],
  trainers: [],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-pokemart' },
    { tileX: 5, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 6, direction: 'up' },
  },
};
