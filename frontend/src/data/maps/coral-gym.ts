import { MapDefinition, parseMap } from './shared';

// Coral Harbor Gym — Water type, Leader: Coral
// Puzzle: "Rising tides" — walkable water tiles form paths
const gymGround = parseMap([
  '##########',
  '#wyyyyyyy#',
  '#yyyzyyyy#',
  '#yyyWyyyy#',
  '#yWWyWWyy#',
  '#yyyyyyyyW',
  '#yWWyWWyy#',
  '#yyyWyyyy#',
  '#yyyyyyyy#',
  '#yyQyyQyy#',
  '#yyyyyyyy#',
  '#yyQyyQyy#',
  '#yyyyyyyy#',
  '#yyvvvyyy#',
]);

export const coralGym: MapDefinition = {
  key: 'coral-gym',
  width: 10,
  height: 14,
  ground: gymGround,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Coral Harbor Gym',
  battleBg: 'bg-gym-water',
  npcs: [],
  trainers: [
    {
      id: 'coral-gym-trainer-1',
      trainerId: 'swimmer-1',
      tileX: 3,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'coral-gym-trainer-2',
      trainerId: 'swimmer-3',
      tileX: 7,
      tileY: 6,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'coral-gym-leader',
      trainerId: 'gym-coral',
      tileX: 4,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      lineOfSight: 6,
    },
  ],
  warps: [
    { tileX: 3, tileY: 13, targetMap: 'coral-harbor', targetSpawnId: 'from-gym' },
    { tileX: 4, tileY: 13, targetMap: 'coral-harbor', targetSpawnId: 'from-gym' },
    { tileX: 5, tileY: 13, targetMap: 'coral-harbor', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: {
    'default': { x: 4, y: 12, direction: 'up' },
  },
};
