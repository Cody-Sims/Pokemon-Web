import { MapDefinition, parseMap } from '../shared';
const g = parseMap(['#########','#w#III#w#','#IIkIII#I','#IIIIIII#','#IYIIYI##','#IIIIIII#','#IYIIYI##','#IIvvvII#']);
export const wraithmoorPokemart: MapDefinition = {
  key: 'wraithmoor-pokemart', width: 9, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Wraithmoor Poké Mart',
  npcs: [{ id: 'wraithmoor-clerk', name: 'Clerk', tileX: 3, tileY: 2, textureKey: 'npc-clerk',
    facing: 'down', dialogue: ['Welcome to the Poké Mart!'], interactionType: 'shop' }],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokemart' },
    { tileX: 4, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokemart' },
    { tileX: 5, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: { 'default': { x: 4, y: 6, direction: 'up' } },
};
