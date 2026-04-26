import { MapDefinition, parseMap } from '../shared';

const g = parseMap([
  '##########',
  '#w______w#',
  '#IkkkkkII#',
  '#IIIIIIII#',
  '#IYYIIYYI#',
  '#IYYIIYYI#',
  '#IIIIIIII#',
  '#___vv___#',
]);
export const voltaraPokemart: MapDefinition = {
  key: 'voltara-pokemart', width: 10, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Voltara Poké Mart',
  npcs: [{
    id: 'voltara-clerk', tileX: 5, tileY: 1, textureKey: 'npc-clerk',
    name: 'Clerk',
    facing: 'down', dialogue: ['Welcome to the Poké Mart!'], interactionType: 'shop',
  }, {
    id: 'voltara-shopper', name: 'Shopper', tileX: 3, tileY: 5, textureKey: 'npc-male-1',
    facing: 'right', dialogue: ['Picked up some Paralyze Heals. Electric types are rough...'],
  }],
  trainers: [],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokemart' },
    { tileX: 5, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: { 'default': { x: 5, y: 6, direction: 'up' } },
};
