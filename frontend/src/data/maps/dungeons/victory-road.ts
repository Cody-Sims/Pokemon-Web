import { MapDefinition, parseMap } from '../shared';

// Victory Road — Final dungeon before Pokémon League
const victoryRoadGround = parseMap([
  ';;;;;;;,,,,;;;;;;;;;',
  ';,,,,,,,,,;,,,,,,,,;',
  ';,,q,,,,,;;,,,q,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,q,,,,,,,,,,q,,,;',
  ';,,,,,,,,;;,,,,,,,,;',
  ';,,,,,,,,;;,,,,,,,,;',
  ';;,,,,,,,,,,,,,,,,,;',
  ';;,,,,q,,,,,,q,,,,;;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,;;,,,,,,,,;',
  ';,,q,,,,,;;,,,q,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;,,,q,,,,,,,,,q,,;;',
  ';,,,,,,,,;;,,,,,,,,;',
  ';,,,,,,,,;;,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,q,,,,,,,,,,,q,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;;;;;,,,,,,,,;;;;;;',
]);

export const victoryRoad: MapDefinition = {
  key: 'victory-road', width: 20, height: 25, ground: victoryRoadGround,
  encounterTableKey: 'victory-road', battleBg: 'bg-cave', displayName: 'Victory Road',
  npcs: [
    { id: 'victory-sign', tileX: 10, tileY: 23, textureKey: 'generic-trainer', facing: 'up',
      dialogue: ['VICTORY ROAD', 'Only trainers with 8 Badges may pass!'] },
  ],
  trainers: [
    { id: 'vr-rival-kael', trainerId: 'rival-5', tileX: 10, tileY: 21, textureKey: 'rival', facing: 'up', lineOfSight: 4 },
    { id: 'vr-ace-1', trainerId: 'ace-trainer-1', tileX: 5, tileY: 5, textureKey: 'npc-male-5', facing: 'right', lineOfSight: 4 },
    { id: 'vr-ace-2', trainerId: 'ace-trainer-2', tileX: 14, tileY: 12, textureKey: 'npc-male-5', facing: 'left', lineOfSight: 4 },
    { id: 'vr-ace-3', trainerId: 'ace-trainer-3', tileX: 5, tileY: 19, textureKey: 'npc-male-5', facing: 'right', lineOfSight: 4 },
  ],
  warps: [
    { tileX: 8, tileY: 24, targetMap: 'cinderfall-town', targetSpawnId: 'from-victory-road' },
    { tileX: 9, tileY: 24, targetMap: 'cinderfall-town', targetSpawnId: 'from-victory-road' },
    { tileX: 10, tileY: 24, targetMap: 'cinderfall-town', targetSpawnId: 'from-victory-road' },
    { tileX: 11, tileY: 24, targetMap: 'cinderfall-town', targetSpawnId: 'from-victory-road' },
    { tileX: 8, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-victory-road' },
    { tileX: 9, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-victory-road' },
  ],
  spawnPoints: {
    'default': { x: 10, y: 23, direction: 'up' },
    'from-cinderfall': { x: 10, y: 23, direction: 'up' },
    'from-league': { x: 9, y: 1, direction: 'down' },
  },
};
