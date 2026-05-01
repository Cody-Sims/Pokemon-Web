import { MapDefinition, parseMap } from '../shared';

// Route 3 — Tide Pool Path
// Coastal cliffside route connecting Pewter City (north) to Coral Harbor (south)
// West coast: water → tide pool → wet sand → sand → cliff face → path → inland meadow
// Features: rope bridge, lone-palm-on-rock landmark, surf-only islet, ledge trainer gauntlet
const route3Ground = parseMap([
  // 0         1         2
  // 01234567890123456789012345
  'TTTTTTT.PP.TTTTTTTTTTTTTTT', // 0  north exit from Pewter
  'T.......PPP...5..........T', // 1  sign area, light grass
  'T..GGG..PPP...GGG...5....T', // 2  grass patches near Pewter
  'T..GGG..PPP...GGG........T', // 3  rival battle approach
  'T.......PPP..............T', // 4  open — rival encounter
  'T.5..ss.PPP...f..........T', // 5  sand appears, cliff starts below
  'WW67s^..PPP....GGG..~....T', // 6  coast: W→tide→wetsand→sand→cliff
  'WW67s^..PPP....GGG.......T', // 7  coastal continues
  'WW667^..PPP..~...........T', // 8  tide pool cluster + rock
  'WW67s^..PPP......%...~...T', // 9  bush + rock inland
  'Ws3Ws^..PPP..............T', // 10 LONE PALM ON ROCK landmark
  'WW67s^..PPP...GGG........T', // 11 coast continues
  'WW67s^..PPP...GGG........T', // 12 trainer lookout
  'T.sss^..PPP..........*...T', // 13 cracked rock (Rock Smash)
  'T.ss.^..PPP..f...........T', // 14 pre-bridge flowers
  'T..s...PPPP...GGGGG......T', // 15 cliff break, path bends
  'WW6677W88888888WWWWWW5...T', // 16 ROPE BRIDGE — dock planks over water
  'WW6677WPPP.....WWWWW.5...T', // 17 below bridge
  'WW67s^..PPP.......*..~...T', // 18 cracked rock + rock
  'WW67s^..PPP.......JJ.....T', // 19 ledge for trainer choice
  'WWsss...PPP....GGG.......T', // 20 cliff break — beach access
  'WssWW^..PPP....GGG.......T', // 21 surf-only islet (cols 1-2)
  'WW67s^..PPP..............T', // 22 coast resumes
  'T.ss.^..PPP.....JJ.......T', // 23 ledge for trainer gauntlet
  'T....^..PPP...GGG.PP.....T', // 24 meadow + secondary path
  'WW667^..PPP...GGG.PP.....T', // 25 tide pools at coast
  'WW67s^..PPP..f....PP.~...T', // 26 flowers + rock
  'WW67s^..PPP..3....PP.....T', // 27 palm tree + path
  'T.ss.^..PPP.......PP...*.T', // 28 cracked rock (Rock Smash)
  'T.5..^..PPP...5...PP.....T', // 29 light grass patches
  'T....^..PPPPP............T', // 30 path widens toward harbor
  'T.......PPP...GGG........T', // 31 approaching Coral Harbor
  'T...f...PPP...GGG........T', // 32 flowers
  'T.......PPP..............T', // 33
  'T.......PPP...f..........T', // 34 flowers
  'T.......PPP..............T', // 35
  'T.......PPP..............T', // 36
  'T.......PPP..............T', // 37
  'T.......PPP..............T', // 38
  'TTTTTTT.PP.TTTTTTTTTTTTTTT', // 39 south exit → Coral Harbor
]);

export const route3: MapDefinition = {
  key: 'route-3',
  width: 26,
  height: 40,
  ground: route3Ground,
  encounterTableKey: 'route-3',
  battleBg: 'bg-coastal',
  npcs: [
    {
      id: 'route3-fisherman',
      name: 'Fisherman',
      tileX: 6,
      tileY: 12,
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
      tileX: 17,
      tileY: 20,
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
      tileX: 6,
      tileY: 8,
      textureKey: 'npc-swimmer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-lass-2',
      name: 'Lass',
      trainerId: 'lass-2',
      tileX: 13,
      tileY: 31,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route3-youngster-3',
      name: 'Youngster',
      trainerId: 'youngster-3',
      tileX: 17,
      tileY: 35,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route3-swimmer-2',
      name: 'Swimmer',
      trainerId: 'swimmer-2',
      tileX: 6,
      tileY: 25,
      textureKey: 'npc-swimmer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-fisherman-1',
      name: 'Fisherman',
      trainerId: 'fisherman-1',
      tileX: 6,
      tileY: 22,
      textureKey: 'npc-sailor',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route3-sailor-1',
      name: 'Sailor',
      trainerId: 'sailor-1',
      tileX: 12,
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
      tileX: 16,
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
      dialogue: ['ROUTE 3 — TIDE POOL PATH', 'Coral Harbor ↓  Pewter City ↑'],
    },
    // Hidden items on beach / surf-only areas
    {
      id: 'route3-hidden-heart-scale-1',
      tileX: 1,
      tileY: 10,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Heart Scale!'],
      givesItem: 'heart-scale',
      setsFlag: 'route3_item_heart_scale_1',
      requireFlag: '!route3_item_heart_scale_1',
    },
    {
      id: 'route3-hidden-heart-scale-2',
      tileX: 1,
      tileY: 21,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Heart Scale!'],
      givesItem: 'heart-scale',
      setsFlag: 'route3_item_heart_scale_2',
      requireFlag: '!route3_item_heart_scale_2',
    },
    {
      id: 'route3-hidden-stardust',
      tileX: 2,
      tileY: 21,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Stardust!'],
      givesItem: 'stardust',
      setsFlag: 'route3_item_stardust',
      requireFlag: '!route3_item_stardust',
    },
    // Rock Smash item (behind cracked rock at row 13)
    {
      id: 'route3-hard-stone',
      tileX: 22,
      tileY: 13,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a Hard Stone!'],
      givesItem: 'hard-stone',
      setsFlag: 'route3_item_hard_stone',
      requireFlag: '!route3_item_hard_stone',
    },
  ],
  warps: [
    // North exit → Pewter City
    { tileX: 8, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-route-3' },
    { tileX: 9, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'from-route-3' },
    // South exit → Coral Harbor (UNCHANGED)
    { tileX: 8, tileY: 39, targetMap: 'coral-harbor', targetSpawnId: 'from-route-3' },
    { tileX: 9, tileY: 39, targetMap: 'coral-harbor', targetSpawnId: 'from-route-3' },
  ],
  spawnPoints: {
    'default':         { x: 9, y: 20, direction: 'down' },
    'from-pewter':     { x: 9, y: 1,  direction: 'down' },
    'from-coral':      { x: 9, y: 38, direction: 'up' },
  },
};
