import { MapDefinition, parseMap } from './shared';

const g = parseMap([
  '#########', '#w#OOO#w#', '#OOOKOO#O',
  '#OOOOOOO#', '#OOOOOOO#', '#OOOOOOO#',
  '#OOpOOhO#', '#OOvvvOO#',
]);
export const ironvalePokecenter: MapDefinition = {
  key: 'ironvale-pokecenter', width: 9, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Ironvale Pokémon Center',
  npcs: [{
    id: 'ironvale-nurse', tileX: 4, tileY: 2, textureKey: 'generic-trainer',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }],
  trainers: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokecenter' },
    { tileX: 4, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 4, y: 6, direction: 'up' } },
};
