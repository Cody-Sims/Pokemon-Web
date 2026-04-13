import { MapDefinition, parseMap } from './shared';

const g = parseMap([
  '#########', '#w#III#w#', '#IIkIII#I',
  '#IIIIIII#', '#IYIIYI##', '#IIIIIII#',
  '#IYIIYI##', '#IIvvvII#',
]);
export const voltaraPokemart: MapDefinition = {
  key: 'voltara-pokemart', width: 9, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Voltara Poké Mart',
  npcs: [{
    id: 'voltara-clerk', tileX: 3, tileY: 2, textureKey: 'generic-trainer',
    facing: 'down', dialogue: ['Welcome to the Poké Mart!'], interactionType: 'shop',
  }],
  trainers: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokemart' },
    { tileX: 4, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokemart' },
    { tileX: 5, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: { 'default': { x: 4, y: 6, direction: 'up' } },
};
