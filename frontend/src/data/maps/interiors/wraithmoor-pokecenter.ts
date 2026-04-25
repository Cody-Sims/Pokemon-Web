import { MapDefinition, parseMap } from '../shared';
const g = parseMap([
  '###########',
  '#w__OOO__w#',
  '#OKKKhKKKp#',
  '#OOOOOOOOO#',
  '#OOOOOOOOO#',
  '#Ot_____tO#',
  '#Oi_____iO#',
  '#OOOvvvOOO#',
]);
export const wraithmoorPokecenter: MapDefinition = {
  key: 'wraithmoor-pokecenter', width: 11, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Wraithmoor Pokémon Center',
  npcs: [{
    id: 'wraithmoor-nurse', tileX: 5, tileY: 2, textureKey: 'npc-nurse',
    name: 'Nurse Joy',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }, {
    id: 'wraithmoor-pc', tileX: 9, tileY: 2, textureKey: 'generic-trainer',
    facing: 'down', dialogue: ['Someone\'s PC is booted up.', 'Access the Pokémon Storage System?'], interactionType: 'pc',
  }, {
    id: 'wraithmoor-center-npc', tileX: 3, tileY: 5, textureKey: 'npc-female-1',
    name: 'Townsperson',
    facing: 'right', dialogue: ['Even ghosts need to rest... Well, their trainers do at least.'],
  }],
  trainers: [],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokecenter' },
    { tileX: 6, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 5, y: 6, direction: 'up' } },
};
