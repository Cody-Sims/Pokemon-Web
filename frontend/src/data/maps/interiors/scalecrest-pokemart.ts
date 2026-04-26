import { MapDefinition, parseMap } from '../shared';
const g = parseMap([
  '############',
  '#w________w#',
  '#IIkkkkkIII#',
  '#IIIIIIIIII#',
  '#IYIIYYIIYI#',
  '#IYIIYYIIYI#',
  '#IIIIIIIIII#',
  '#____vv____#',
]);
export const scalecrestPokemart: MapDefinition = {
  key: 'scalecrest-pokemart', width: 12, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Scalecrest Poké Mart',
  npcs: [{
    id: 'scalecrest-clerk', tileX: 5, tileY: 1, textureKey: 'npc-clerk',
    name: 'Clerk',
    facing: 'down', dialogue: ['Welcome to the Poké Mart!'], interactionType: 'shop',
  }, {
    id: 'scalecrest-shopper', name: 'Shopper', tileX: 8, tileY: 5, textureKey: 'npc-male-1',
    facing: 'left', dialogue: ['I came all the way here for Dragon Scale items. Worth the trip!'],
  }],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 5, tileY: 7, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-pokemart' },
    { tileX: 6, tileY: 7, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: { 'default': { x: 6, y: 6, direction: 'up' } },
};
