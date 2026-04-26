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
export const verdantiaPokecenter: MapDefinition = {
  key: 'verdantia-pokecenter', width: 11, height: 8, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Verdantia Pokémon Center',
  npcs: [{
    id: 'verdantia-nurse', tileX: 5, tileY: 2, textureKey: 'npc-nurse',
    name: 'Nurse Joy',
    facing: 'down', dialogue: ['Welcome! We\'ll heal your Pokémon!'], interactionType: 'heal',
  }, {
    id: 'verdantia-pc', tileX: 9, tileY: 2, textureKey: 'item-ball',
    facing: 'down', dialogue: ['Someone\'s PC is booted up.', 'Access the Pokémon Storage System?'], interactionType: 'pc',
  }, {
    id: 'verdantia-center-npc', tileX: 3, tileY: 5, textureKey: 'npc-female-1',
    name: 'Townsperson',
    facing: 'right', dialogue: ['The Berry farms produce amazing healing items! Stock up before the jungle.'],
  }],
  trainers: [],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
    { tileX: 6, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: { 'default': { x: 5, y: 6, direction: 'up' } },
};
