import { MapDefinition, parseMap } from '../shared';

// Ironvale Gym — Steel type, Leader: Ferris
// Puzzle: gear switches
const g = parseMap([
  '##########', '#wyyyyyyy#', '#yyyzyyyy#',
  '#yyyyyyyy#', '#yyyyqyyy#', '#yyyyyyyy#',
  '#yqyyyqyy#', '#yyyyyyyy#', '#yyQyyQyy#',
  '#yyyyyyyy#', '#yyyyyyyy#', '#yyQyyQyy#',
  '#yyyyyyyy#', '#yyvvvyyy#',
]);
export const ironvaleGym: MapDefinition = {
  key: 'ironvale-gym', width: 10, height: 14, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Ironvale Gym',
  battleBg: 'bg-gym-steel',
  npcs: [],
  trainers: [
    { id: 'ironvale-gym-blackbelt', name: 'Black Belt', trainerId: 'blackbelt-1', tileX: 3, tileY: 10,
      textureKey: 'npc-male-3', facing: 'right', lineOfSight: 3 },
    { id: 'ironvale-gym-worker', name: 'Worker', trainerId: 'worker-1', tileX: 7, tileY: 7,
      textureKey: 'npc-male-3', facing: 'left', lineOfSight: 3 },
    { id: 'ironvale-gym-leader', name: 'Ferris', trainerId: 'gym-ferris', tileX: 4, tileY: 2,
      textureKey: 'npc-gym-ferris', facing: 'down', lineOfSight: 6 },
  ],
  objects: [],
  warps: [
    { tileX: 3, tileY: 13, targetMap: 'ironvale-city', targetSpawnId: 'from-gym' },
    { tileX: 4, tileY: 13, targetMap: 'ironvale-city', targetSpawnId: 'from-gym' },
    { tileX: 5, tileY: 13, targetMap: 'ironvale-city', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 4, y: 12, direction: 'up' } },
};
