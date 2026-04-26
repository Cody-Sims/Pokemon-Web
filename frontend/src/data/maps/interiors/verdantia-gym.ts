import { MapDefinition, parseMap } from '../shared';

// Verdantia Gym — Grass type, Leader: Ivy
// Puzzle: vine barriers
const g = parseMap([
  '##########', '#wyyyyyyy#', '#yyyzyyyy#',
  '#yyyyyyyy#', '#yGyyGyyy#', '#yyyyyyyy#',
  '#yyGyGyGy#', '#yyyyyyyy#', '#yGyyGyyy#',
  '#yyyyyyyy#', '#yyyyyyyy#', '#yyQyyQyy#',
  '#yyyyyyyy#', '#yyvvvyyy#',
]);
export const verdantiaGym: MapDefinition = {
  key: 'verdantia-gym', width: 10, height: 14, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Verdantia Gym',
  battleBg: 'bg-gym-grass',
  npcs: [],
  trainers: [
    { id: 'verdantia-gym-beauty', name: 'Beauty', trainerId: 'beauty-1', tileX: 7, tileY: 10,
      textureKey: 'npc-female-1', facing: 'left', lineOfSight: 3 },
    { id: 'verdantia-gym-picnicker', name: 'Picnicker', trainerId: 'picnicker-1', tileX: 3, tileY: 6,
      textureKey: 'npc-female-2', facing: 'right', lineOfSight: 3 },
    { id: 'verdantia-gym-leader', name: 'Ivy', trainerId: 'gym-ivy', tileX: 4, tileY: 2,
      textureKey: 'npc-female-1', facing: 'down', lineOfSight: 6 },
  ],
  objects: [],
  warps: [
    { tileX: 3, tileY: 13, targetMap: 'verdantia-village', targetSpawnId: 'from-gym' },
    { tileX: 4, tileY: 13, targetMap: 'verdantia-village', targetSpawnId: 'from-gym' },
    { tileX: 5, tileY: 13, targetMap: 'verdantia-village', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 4, y: 12, direction: 'up' } },
};
