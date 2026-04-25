import { MapDefinition, parseMap } from '../shared';

// Route 8 — Stormbreak Pass. Connects Cinderfall Town to Victory Road area.
// A mountain pass battered by storms, with rocky terrain and strong trainers.
const route8Ground = parseMap([
  'TTTTTTT.PP.TTTTTTTTT',
  'T........PP........T',
  'T..^^....PP.....^^.T',
  '^..^^..~.PP.....^^.^',
  '^.....PPPPPP.......^',
  '^..,..PP........~..^',
  'T..GG.PP....GGG....T',
  'T..GG.PP....GGG..~.T',
  'T.....PP..4........T',
  'T.....PPPPPPPPPP...T',
  'T..~.......PP......T',
  '^...^^.....PP..^^..^',
  '^...^^.....PP..^^..^',
  'T..........PP..,...T',
  'T..GGG.PPPPPP.GGG..T',
  'T..GGG.PP.....GGG..T',
  'T......PP..........T',
  '^.4....PP....^^..~.^',
  '^..^^..PP....^^....^',
  '^..^^..PP.....q....^',
  'T......PPPPPPPP....T',
  'T....~.....PP......T',
  'T..4GG.....PP..GGG.T',
  'T..GGG.....PP..4GG.T',
  'T..........PP......T',
  'T.f........PP....f.T',
  'T..........PP......T',
  'T..........PP......T',
  'T..........PP......T',
  'TTTTTTT.PP.TTTTTTTTT',
]);

export const route8: MapDefinition = {
  key: 'route-8', width: 20, height: 30, ground: route8Ground,
  encounterTableKey: 'route-8', battleBg: 'bg-mountain',
  displayName: 'Route 8 — Stormbreak Pass',
  weather: 'fog',
  npcs: [
    { id: 'route8-sign', tileX: 11, tileY: 1, textureKey: 'generic-trainer', facing: 'down',
      dialogue: ['ROUTE 8 — STORMBREAK PASS', 'Victory Road →  Cinderfall Town ↑'] },
    { id: 'route8-hiker-npc', name: 'Townsperson', tileX: 5, tileY: 14, textureKey: 'npc-hiker', facing: 'right',
      dialogue: [
        'The storms here are fierce. They say the Aether flow',
        'is disrupted by something deep underground.',
        'Strong Pokémon gather here to feed on the energy.',
      ] },
  ],
  trainers: [
    { id: 'route8-ace-1', name: 'Ace Trainer', trainerId: 'ace-trainer-4', tileX: 14, tileY: 6, textureKey: 'npc-male-3', facing: 'left', lineOfSight: 4 },
    { id: 'route8-ace-2', name: 'Ace Trainer', trainerId: 'ace-trainer-5', tileX: 6, tileY: 11, textureKey: 'npc-female-3', facing: 'right', lineOfSight: 4 },
    { id: 'route8-grunt-9', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 14, tileY: 18, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 3 },
    { id: 'route8-kael-4', name: 'Kael', trainerId: 'rival-4', tileX: 10, tileY: 22, textureKey: 'rival', facing: 'up', lineOfSight: 5,
      condition: '!rival-4' },
  ],
  warps: [
    { tileX: 8, tileY: 0, targetMap: 'cinderfall-town', targetSpawnId: 'from-route-8' },
    { tileX: 9, tileY: 0, targetMap: 'cinderfall-town', targetSpawnId: 'from-route-8' },
    { tileX: 8, tileY: 29, targetMap: 'victory-road', targetSpawnId: 'from-route-8' },
    { tileX: 9, tileY: 29, targetMap: 'victory-road', targetSpawnId: 'from-route-8' },
  ],
  spawnPoints: {
    'default': { x: 9, y: 15, direction: 'down' },
    'from-cinderfall': { x: 9, y: 1, direction: 'down' },
    'from-victory-road': { x: 9, y: 28, direction: 'up' },
    'from-abyssal-spire': { x: 10, y: 1, direction: 'down' },
  },
};
