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
export const voltaraPokecenter: MapDefinition = {
  key: 'voltara-pokecenter', width: 11, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Voltara Pokémon Center',
  npcs: [
    {
    id: 'voltara-nurse', tileX: 5, tileY: 2, textureKey: 'npc-nurse',
    name: 'Nurse Joy',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  },
    {
    id: 'voltara-center-npc', tileX: 3, tileY: 5, textureKey: 'npc-male-1',
    name: 'Townsperson',
    facing: 'right', dialogue: ['The conduit network keeps the center running even during power surges.'],
  }
  ],
  trainers: [],
  objects: [
    {
    id: 'voltara-pc', tileX: 9, tileY: 2, textureKey: 'pc-terminal', objectType: 'pc', dialogue: ['Someone\'s PC is booted up.', 'Access the Pokémon Storage System?'], interactionType: 'pc' }
  ],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokecenter' },
    { tileX: 6, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 5, y: 6, direction: 'up' } },
};
