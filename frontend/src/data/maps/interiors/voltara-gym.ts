import { MapDefinition, parseMap } from '../shared';

// Voltara Gym — Electric type, Leader: Blitz
// Puzzle: circuit routing
const g = parseMap([
  '##########', '#wyyyyyyy#', '#yyyzyyyy#',
  '#yyyyyyyy#', '#yyyyyyyy#', '#yyyyyyyy#',
  '#yyyyyyyy#', '#yyyyyyyy#', '#yyQyyQyy#',
  '#yyyyyyyy#', '#yyyyyyyy#', '#yyQyyQyy#',
  '#yyyyyyyy#', '#yyvvvyyy#',
]);
export const voltaraGym: MapDefinition = {
  key: 'voltara-gym', width: 10, height: 14, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Voltara Gym',
  battleBg: 'bg-gym-electric',
  npcs: [],
  trainers: [
    { id: 'voltara-gym-engineer-1', trainerId: 'engineer-1', tileX: 7, tileY: 10,
      textureKey: 'npc-scientist', facing: 'left', lineOfSight: 3 },
    { id: 'voltara-gym-engineer-2', trainerId: 'engineer-2', tileX: 3, tileY: 6,
      textureKey: 'npc-scientist', facing: 'right', lineOfSight: 3 },
    { id: 'voltara-gym-leader', trainerId: 'gym-blitz', tileX: 4, tileY: 2,
      textureKey: 'npc-scientist', facing: 'down', lineOfSight: 6 },
  ],
  warps: [
    { tileX: 3, tileY: 13, targetMap: 'voltara-city', targetSpawnId: 'from-gym' },
    { tileX: 4, tileY: 13, targetMap: 'voltara-city', targetSpawnId: 'from-gym' },
    { tileX: 5, tileY: 13, targetMap: 'voltara-city', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 4, y: 12, direction: 'up' } },
};
