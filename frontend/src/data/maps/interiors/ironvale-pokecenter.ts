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
export const ironvalePokecenter: MapDefinition = {
  key: 'ironvale-pokecenter', width: 13, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Ironvale Pokémon Center',
  npcs: [{
    id: 'ironvale-nurse', tileX: 5, tileY: 1, textureKey: 'npc-nurse',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }, {
    id: 'ironvale-pc', tileX: 11, tileY: 2, textureKey: 'generic-trainer',
    facing: 'down', dialogue: ['Someone\'s PC is booted up.', 'Access the Pokémon Storage System?'], interactionType: 'pc',
  }, {
    id: 'ironvale-center-npc', tileX: 3, tileY: 5, textureKey: 'npc-male-1',
    facing: 'right', dialogue: ['The forge workers come here after long shifts. This center never sleeps!'],
  }],
  trainers: [],
  warps: [
    { tileX: 6, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 6, y: 6, direction: 'up' } },
};
