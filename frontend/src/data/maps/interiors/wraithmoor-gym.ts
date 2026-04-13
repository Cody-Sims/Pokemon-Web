import { MapDefinition, parseMap } from '../shared';
const g = parseMap(['##########','#wyyyyyyy#','#yyyzyyyy#','#yyyyyyyy#','#yyyyyyyy#','#yyyyyyyy#','#yyyyyyyy#','#yyyyyyyy#','#yyQyyQyy#','#yyyyyyyy#','#yyyyyyyy#','#yyQyyQyy#','#yyyyyyyy#','#yyvvvyyy#']);
export const wraithmoorGym: MapDefinition = {
  key: 'wraithmoor-gym', width: 10, height: 14, ground: g,
  encounterTableKey: '', isInterior: true, displayName: 'Wraithmoor Gym', battleBg: 'bg-gym-ghost',
  npcs: [],
  trainers: [
    { id: 'wraithmoor-gym-leader', trainerId: 'gym-morwen', tileX: 4, tileY: 2, textureKey: 'generic-trainer', facing: 'down', lineOfSight: 6 },
  ],
  warps: [
    { tileX: 3, tileY: 13, targetMap: 'wraithmoor-town', targetSpawnId: 'from-gym' },
    { tileX: 4, tileY: 13, targetMap: 'wraithmoor-town', targetSpawnId: 'from-gym' },
    { tileX: 5, tileY: 13, targetMap: 'wraithmoor-town', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 4, y: 12, direction: 'up' } },
};
