import { MapDefinition, parseMap } from '../shared';
const g = parseMap([
  '#############',
  '#w_________w#',
  '#OKKKhKKK_Op#',
  '#OOOOOOOOOOO#',
  '#OOOOOOOOOOO#',
  '#OOt_____tOO#',
  '#OOi_____iOO#',
  '#_____v_____#',
]);
export const scalecrestPokecenter: MapDefinition = {
  key: 'scalecrest-pokecenter', width: 13, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Scalecrest Pokémon Center',
  npcs: [{
    id: 'scalecrest-nurse', tileX: 5, tileY: 1, textureKey: 'npc-nurse',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }, {
    id: 'scalecrest-pc', tileX: 11, tileY: 2, textureKey: 'generic-trainer',
    facing: 'down', dialogue: ['Someone\'s PC is booted up.', 'Access the Pokémon Storage System?'], interactionType: 'pc',
  }, {
    id: 'scalecrest-center-npc', tileX: 9, tileY: 5, textureKey: 'npc-female-1',
    facing: 'left', dialogue: ['Dragon tamers from all over Aurum come to challenge Drake.'],
  }],
  trainers: [],
  warps: [
    { tileX: 6, tileY: 7, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 6, y: 6, direction: 'up' } },
};
