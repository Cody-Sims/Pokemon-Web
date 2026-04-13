import { MapDefinition, parseMap } from '../shared';

// Route 3 — Tide Pool Path
// Coastal route connecting Pewter City (north) to Coral Harbor (south)
// Features: sand, water, tide pools, palm trees, fishable tiles
const route3Ground = parseMap([
  'TTTTTTT.PP.TTTTTTTTT', // 0  north exit from Pewter
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T........PP........T', // 4
  'T....PPPPPPPPPP....T', // 5
  'T....PP........3...T', // 6  palm tree
  'T....PP....ss......T', // 7  sand starts
  'T....PP...ssss.....T', // 8
  'T....PP..sssss.....T', // 9
  'T....PPPPssssss....T', // 10
  'T........sssssss3..T', // 11 palm
  'WWWW..ss7sss6ssss..T', // 12 water, wet sand, tide pool
  'WWWWW.ss77ss66sss..T', // 13
  'WWWWW.sss7ss6ssss..T', // 14
  'WWWW..ssssssssss3..T', // 15 palm
  'T.....ssssssssss...T', // 16
  'T..GG.ssssPPsssss..T', // 17 path through sand
  'T..GG..ssPP.sss....T', // 18
  'T......ssPP........T', // 19
  'T......ssPP........T', // 20
  'T....PPPPPPPPPP....T', // 21
  'T....PP........ss..T', // 22
  'T....PP.......sss..T', // 23
  'T....PP......ssss3.T', // 24 palm
  'WWWW.PP.....sssss..T', // 25
  'WWWWWPP..ss7sss6s..T', // 26 more coast
  'WWWWWPP.sss77s66s..T', // 27
  'WWWW.PP.ssssssss...T', // 28
  'T....PP............T', // 29
  'T..f.PP......f.....T', // 30
  'T....PP............T', // 31
  'T..GGG.PP...GGG....T', // 32
  'T..GGG.PP...GGG....T', // 33
  'T......PP..........T', // 34
  'T......PP..........T', // 35
  'T......PP..........T', // 36
  'T......PP..........T', // 37
  'T......PP..........T', // 38
  'TTTTTTT.PP.TTTTTTTTT', // 39 south exit to Coral Harbor
]);

export const route3: MapDefinition = {
  key: 'route-3',
  width: 20,
  height: 40,
  ground: route3Ground,
  encounterTableKey: 'route-3',
  battleBg: 'bg-coastal',
  npcs: [
    {
      id: 'route3-sign-north',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 3 — TIDE POOL PATH', 'Coral Harbor ↓  Pewter City ↑'],
    },
    {
      id: 'route3-fisherman',
      tileX: 3,
      tileY: 14,
      textureKey: 'npc-sailor',
      facing: 'right',
      dialogue: [
        'The tide pools here are full of Water Pokémon!',
        'Try fishing near the shore if you have a rod.',
      ],
    },
    {
      id: 'route3-hiker',
      tileX: 15,
      tileY: 20,
      textureKey: 'npc-hiker',
      facing: 'left',
      dialogue: [
        'I saw people in white lab coats heading south...',
        'They were carrying some kind of purple Poké Balls.',
        'Strange, don\'t you think?',
      ],
    },
  ],
  trainers: [
    {
      id: 'route3-rival-kael',
      trainerId: 'rival-2',
      tileX: 10,
      tileY: 4,
      textureKey: 'rival',
      facing: 'down',
      lineOfSight: 4,
    },
    {
      id: 'route3-swimmer-1',
      trainerId: 'swimmer-1',
      tileX: 10,
      tileY: 10,
      textureKey: 'npc-swimmer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route3-lass-2',
      trainerId: 'lass-2',
      tileX: 6,
      tileY: 30,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route3-youngster-3',
      trainerId: 'youngster-3',
      tileX: 14,
      tileY: 35,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route3-swimmer-2',
      trainerId: 'swimmer-2',
      tileX: 15,
      tileY: 18,
      textureKey: 'npc-swimmer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route3-fisherman-1',
      trainerId: 'fisherman-1',
      tileX: 4,
      tileY: 22,
      textureKey: 'npc-sailor',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-sailor-1',
      trainerId: 'sailor-1',
      tileX: 10,
      tileY: 25,
      textureKey: 'npc-sailor',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  warps: [
    // North exit → Pewter City
    { tileX: 8, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-route-3' },
    { tileX: 9, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-route-3' },
    // South exit → Coral Harbor
    { tileX: 8, tileY: 39, targetMap: 'coral-harbor', targetSpawnId: 'from-route-3' },
    { tileX: 9, tileY: 39, targetMap: 'coral-harbor', targetSpawnId: 'from-route-3' },
  ],
  spawnPoints: {
    'default':         { x: 9, y: 20, direction: 'down' },
    'from-pewter':     { x: 9, y: 1,  direction: 'down' },
    'from-coral':      { x: 9, y: 38, direction: 'up' },
  },
};
