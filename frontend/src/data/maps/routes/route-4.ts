import { MapDefinition, parseMap } from '../shared';

// Route 4 — Basalt Ridge
// Volcanic terrain connecting Coral Harbor to Ember Mines / Ironvale
// Features: lava rock, volcanic walls, ash ground, magma cracks
const W = 20;
const pad = (s: string) => s.length < W ? s.slice(0, -1) + '.'.repeat(W - s.length) + s.slice(-1) : s.slice(0, W);
const route4Ground = parseMap([
  'TTTTTTT.PP.TTTTTTTTT', // 0  north exit
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T........PP........T', // 4
  'T....PPPPPPPPPP....T', // 5
  'T....PP........^^..T', // 6  cliffs start
  'T....PP......^^^^..T', // 7
  'T....PP.....^^^^^..T', // 8
  'T....PP..,,,,,,^^..T', // 9  cave floor starts
  'T....PP..,,,,,,,^..T', // 10
  'T....PPPP,,,,,,,,..T', // 11
  'T........,;,,,,,,..T', // 12 cave walls
  'T..^^....,;;,,,,,..T', // 13
  'T..^^^...,;,,,,,,..T', // 14
  'T..^^....,,,,,;,,..T', // 15
  'T........,,,,,;;,..T', // 16
  'T....PPPP,,,,,,,,..T', // 17
  'T....PP..,,,,,,,^..T', // 18
  'T....PP..,,,,,,^^..T', // 19
  'T....PP.....^^^^^..T', // 20
  'T....PP......^^^^..T', // 21
  'T....PP........^^..T', // 22
  'T....PPPPPPPPPP....T', // 23
  'T........PP........T', // 24
  'T..GGG...PP...GGG..T', // 25
  'T..GGG...PP...GGG..T', // 26
  'T........PP........T', // 27
  'T........PP........T', // 28
  'TTTTTTT.PP.TTTTTTTTT', // 29 south exit
]);

export const route4: MapDefinition = {
  key: 'route-4',
  width: 20,
  height: 30,
  ground: route4Ground,
  encounterTableKey: 'route-4',
  battleBg: 'bg-volcanic',
  npcs: [
    {
      id: 'route4-sign',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 4 — BASALT RIDGE', 'Ironvale City ↑  Coral Harbor ↓'],
    },
    // Rook saves player from Synthetic Pokémon
    {
      id: 'route4-rook',
      tileX: 12,
      tileY: 12,
      textureKey: 'npc-male-6',
      facing: 'left',
      dialogue: [
        '???: ...That creature was no ordinary Pokémon.',
        '???: It was glowing. Unstable. Suffering.',
        '???: Someone did that to it.',
        '???: Follow the white coats underground.',
        '???: You\'ll find what you\'re looking for.',
      ],
      requireFlag: 'receivedStarter',
      setsFlag: 'met_rook_basalt',
    },
  ],
  trainers: [
    {
      id: 'route4-hiker-4',
      trainerId: 'hiker-4',
      tileX: 6,
      tileY: 15,
      textureKey: 'npc-hiker',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route4-grunt-1',
      trainerId: 'synthesis-grunt-1',
      tileX: 14,
      tileY: 10,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route4-hiker-6',
      trainerId: 'hiker-6',
      tileX: 10,
      tileY: 22,
      textureKey: 'npc-hiker',
      facing: 'up',
      lineOfSight: 3,
    },
    {
      id: 'route4-youngster-5',
      trainerId: 'youngster-5',
      tileX: 5,
      tileY: 8,
      textureKey: 'npc-male-2',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route4-grunt-4',
      trainerId: 'synthesis-grunt-4',
      tileX: 12,
      tileY: 18,
      textureKey: 'npc-grunt',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  warps: [
    // North exit → Ironvale City
    { tileX: 8, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-4' },
    { tileX: 9, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-4' },
    // South exit → Coral Harbor
    { tileX: 8, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-route-4' },
    { tileX: 9, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-route-4' },
    // East cave entrance → Ember Mines
    { tileX: 17, tileY: 12, targetMap: 'ember-mines', targetSpawnId: 'from-route-4' },
    { tileX: 17, tileY: 13, targetMap: 'ember-mines', targetSpawnId: 'from-route-4' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 15, direction: 'up' },
    'from-coral':    { x: 9, y: 28, direction: 'up' },
    'from-ironvale': { x: 9, y: 1,  direction: 'down' },
    'from-mines':    { x: 16, y: 12, direction: 'left' },
  },
};
