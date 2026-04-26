import { MapDefinition, parseMap } from '../shared';

// Route 3 — Tide Pool Path
// Coastal route connecting Pewter City (north) to Coral Harbor (south)
// Coast is on the WEST side: water → tide pool → wet sand → sand → path → inland
const route3Ground = parseMap([
  'TTTTTTT.PP.TTTTTTTTT', // 0  north exit from Pewter
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2  grass near Pewter
  'T..GGG...PP...GGG..T', // 3
  'T........PP........T', // 4
  'T.5...PPPPP........T', // 5  light grass near coast
  'T.5...PP.......%...T', // 6  light grass + bush inland
  'T.ss..PP...........T', // 7  sand appears near path
  'W67sssPP.....GGG...T', // 8  coast: water→tide→wetsand→sand
  'WW67ssPP.....GGG...T', // 9  deeper coast
  'WW667sPP..........~T', // 10 tide pool cluster + rock
  'WW67ssPP.......~...T', // 11 rock inland
  'W67sssPP...3.......T', // 12 palm on sand
  'T.ss..PP.......%...T', // 13 sand tapers + bush
  'T.5...PP...........T', // 14 light grass near coast
  'T.....PPPPPPPPP....T', // 15 path bends east  (inland meadow)
  'T...........PP..~..T', // 16 rock inland
  'T..GGG..f...PP..%..T', // 17 grass, flowers, bush
  'T..GGG......PP.....T', // 18
  'T...........PP..~..T', // 19 rock
  'T.....PPPPPPPPP....T', // 20 path bends back west
  'T.5...PP...........T', // 21 light grass
  'T.3s..PP.......~...T', // 22 rock near coast
  'W67sssPP...........T', // 23 coastline resumes
  'WW67ssPP.....GGG...T', // 24
  'WW667sPP.....GGG...T', // 25 tide pools at shore
  'WW67ssPP........%..T', // 26 bush inland
  'W67sssPP...3.......T', // 27 palm
  'T.ss..PP.......~...T', // 28 rock near coast
  'T.5...PP...........T', // 29 light grass
  'T.....PPPPP........T', // 30 path jogs back to center
  'T........PP........T', // 31
  'T..f.....PP....f...T', // 32 flowers near Coral Harbor
  'T..GGG...PP..GGG...T', // 33
  'T..GGG...PP..GGG...T', // 34
  'T........PP........T', // 35
  'T........PP........T', // 36
  'T........PP........T', // 37
  'T........PP........T', // 38
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
      id: 'route3-fisherman',
      name: 'Fisherman',
      tileX: 4,
      tileY: 9,
      textureKey: 'npc-sailor',
      facing: 'left',
      dialogue: [
        'The tide pools here are full of Water Pokémon!',
        'Try fishing near the shore if you have a rod.',
      ],
    },
    {
      id: 'route3-hiker',
      name: 'Hiker',
      tileX: 15,
      tileY: 17,
      textureKey: 'npc-hiker',
      facing: 'left',
      dialogue: [
        'I saw people in white lab coats heading south...',
        'They were carrying some kind of purple Poké Balls.',
        'Strange, don\'t you think?',
      ],
    }
  ],
  trainers: [
    {
      id: 'route3-rival-kael',
      name: 'Kael',
      trainerId: 'rival-2',
      tileX: 10,
      tileY: 4,
      textureKey: 'rival',
      facing: 'down',
      lineOfSight: 4,
    },
    {
      id: 'route3-swimmer-1',
      name: 'Swimmer',
      trainerId: 'swimmer-1',
      tileX: 4,
      tileY: 11,
      textureKey: 'npc-swimmer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-lass-2',
      name: 'Lass',
      trainerId: 'lass-2',
      tileX: 9,
      tileY: 31,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route3-youngster-3',
      name: 'Youngster',
      trainerId: 'youngster-3',
      tileX: 14,
      tileY: 35,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route3-swimmer-2',
      name: 'Swimmer',
      trainerId: 'swimmer-2',
      tileX: 4,
      tileY: 25,
      textureKey: 'npc-swimmer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-fisherman-1',
      name: 'Fisherman',
      trainerId: 'fisherman-1',
      tileX: 3,
      tileY: 23,
      textureKey: 'npc-sailor',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-sailor-1',
      name: 'Sailor',
      trainerId: 'sailor-1',
      tileX: 10,
      tileY: 27,
      textureKey: 'npc-sailor',
      facing: 'down',
      lineOfSight: 4,
    },
    // Stern Engine quest grunts
    {
      id: 'route3-stern-grunt-1',
      name: 'Synthesis Grunt',
      trainerId: 'stern-grunt-1',
      tileX: 14,
      tileY: 15,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 3,
      condition: '!stern-grunt-1',
    },
  ],
  objects: [
    {
      id: 'route3-sign-north',
      tileX: 11,
      tileY: 1,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['ROUTE 3 — TIDE POOL PATH', 'Coral Harbor ↓  Pewter City ↑'] }
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
