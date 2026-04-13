import { MapDefinition, parseMap } from '../shared';

const route2Ground = parseMap([
  // 01234567890123456789
  'TTTTTTT.PP.TTTTTTTTT', // 0  - north exit to Viridian Forest
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T..GGG...PP...GGG..T', // 4
  'T........PP........T', // 5
  'T....PPPPPPPPPP....T', // 6
  'T....PP............T', // 7
  'T....PP....GGG..^,,T', // 8  cave entrance east
  'T....PP....GGG..^,,T', // 9
  'T....PP.........^..T', // 10
  'T....PPPPPPPPPP....T', // 11
  'T........PP........T', // 12
  'T..GG....PP....GG..T', // 13
  'T..GG....PP....GG..T', // 14
  'T........PP........T', // 15
  'T........PP........T', // 16
  'T...GGG..PP..GGG...T', // 17
  'T...GGG..PP..GGG...T', // 18
  'T...GGG..PP..GGG...T', // 19
  'T........PP........T', // 20
  'T..f.....PP.....f..T', // 21
  'T........PP........T', // 22
  'T..GG....PP....GG..T', // 23
  'T..GG....PP....GG..T', // 24
  'T........PP........T', // 25
  'T........PP........T', // 26
  'T........PP........T', // 27
  'T........PP........T', // 28
  'TTTTTTT.PP.TTTTTTTTT', // 29 - south exit to Viridian City
]);

export const route2: MapDefinition = {
  key: 'route-2',
  width: 20,
  height: 30,
  ground: route2Ground,
  encounterTableKey: 'route-2',
  npcs: [
    {
      id: 'route2-sign',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 2', 'VIRIDIAN FOREST ↑  VIRIDIAN CITY ↓'],
    },
    {
      id: 'route2-npc-1',
      tileX: 14,
      tileY: 15,
      textureKey: 'npc-male-2',
      facing: 'left',
      dialogue: [
        'Viridian Forest is just ahead!',
        'Watch out for Bug Catchers in there.',
      ],
    },
    {
      id: 'route2-cavern-sign',
      tileX: 16,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['CRYSTAL CAVERN →', 'Caution: Strong Pokémon dwell within!'],
    },
  ],
  trainers: [
    {
      id: 'route2-marina',
      trainerId: 'marina-1',
      tileX: 7,
      tileY: 13,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-youngster-4',
      trainerId: 'youngster-4',
      tileX: 14,
      tileY: 10,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route2-lass-4',
      trainerId: 'lass-4',
      tileX: 5,
      tileY: 18,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-camper-1',
      trainerId: 'camper-1',
      tileX: 10,
      tileY: 24,
      textureKey: 'npc-male-1',
      facing: 'up',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Viridian City
    { tileX: 8, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    // North exit → Viridian Forest
    { tileX: 8, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    // East cave entrance → Crystal Cavern
    { tileX: 18, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 18, tileY: 9, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
  ],
  spawnPoints: {
    'default':        { x: 9, y: 15, direction: 'up' },
    'from-viridian':  { x: 9, y: 28, direction: 'up' },
    'from-forest':    { x: 9, y: 1,  direction: 'down' },
    'from-cavern':    { x: 17, y: 9,  direction: 'left' },
  },
};
