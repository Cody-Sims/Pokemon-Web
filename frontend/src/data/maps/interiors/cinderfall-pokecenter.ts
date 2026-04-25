import { MapDefinition, parseMap } from '../shared';
const g = parseMap(['#########','#w#OOO#w#','#OOOKOO#O','#OOOOOOO#','#OOOOOOO#','#OOOOOOO#','#OOpOOhO#','#OOvvvOO#']);
export const cinderfallPokecenter: MapDefinition = {
  key: 'cinderfall-pokecenter', width: 9, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Cinderfall Pokémon Center',
  npcs: [{ id: 'cinderfall-nurse', name: 'Nurse Joy', tileX: 4, tileY: 2, textureKey: 'npc-nurse',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal' }],
  trainers: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'cinderfall-town', targetSpawnId: 'from-pokecenter' },
    { tileX: 4, tileY: 7, targetMap: 'cinderfall-town', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'cinderfall-town', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 4, y: 6, direction: 'up' } },
};
