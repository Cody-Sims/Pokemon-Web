import { MapDefinition, parseMap } from '../shared';

const martGround = parseMap([
  '#########',
  '#w#III#w#',
  '#IIkIII#I',
  '#IIIIIII#',
  '#IYIIYI##',
  '#IIIIIII#',
  '#IYIIYI##',
  '#IIvvvII#',
]);

export const coralPokemart: MapDefinition = {
  key: 'coral-pokemart',
  width: 9,
  height: 8,
  ground: martGround,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Coral Harbor Poké Mart',
  npcs: [
    {
      id: 'coral-mart-clerk',
      tileX: 3,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['Welcome to the Poké Mart!'],
      interactionType: 'shop',
    },
  ],
  trainers: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokemart' },
    { tileX: 4, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokemart' },
    { tileX: 5, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: {
    'default': { x: 4, y: 6, direction: 'up' },
  },
};
