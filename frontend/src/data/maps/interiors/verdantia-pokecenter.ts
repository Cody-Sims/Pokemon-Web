import { MapDefinition, parseMap } from '../shared';

const g = parseMap([
  '#########', '#w#OOO#w#', '#OOOKOO#O',
  '#OOOOOOO#', '#OOOOOOO#', '#OOOOOOO#',
  '#OOpOOhO#', '#OOvvvOO#',
]);
export const verdantiaPokecenter: MapDefinition = {
  key: 'verdantia-pokecenter', width: 9, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Verdantia Pokémon Center',
  npcs: [{
    id: 'verdantia-nurse', tileX: 4, tileY: 2, textureKey: 'npc-nurse',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }],
  trainers: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
    { tileX: 4, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 4, y: 6, direction: 'up' } },
};
