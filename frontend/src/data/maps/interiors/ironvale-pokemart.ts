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
export const ironvalePokemart: MapDefinition = {
  key: 'ironvale-pokemart', width: 12, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Ironvale Poké Mart',
  npcs: [{
    id: 'ironvale-clerk', tileX: 5, tileY: 1, textureKey: 'generic-trainer',
    name: 'Clerk',
    facing: 'down', dialogue: ['Welcome to the Poké Mart!'], interactionType: 'shop',
  }, {
    id: 'ironvale-shopper', name: 'Shopper', tileX: 3, tileY: 5, textureKey: 'npc-female-1',
    facing: 'right', dialogue: ['Steel-type trainers need lots of Full Heals. This shop has a great selection.'],
  }],
  trainers: [],
  warps: [
    { tileX: 5, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokemart' },
    { tileX: 6, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokemart' },
  ],
  spawnPoints: { 'default': { x: 6, y: 6, direction: 'up' } },
};
