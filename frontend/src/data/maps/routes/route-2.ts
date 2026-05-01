import { MapDefinition, parseMap } from '../shared';

const route2Ground = parseMap([
  // 012345678901234567890123
  '^^^^^^^TTTTTTTTTTT.PPTTT', // 0  north exit to Viridian Forest
  '^^^^^^TT.....PP......TTT', // 1
  '^^^^^^..GGG..PP.GGG..TTT', // 2  grass patches
  '^^^^^^...GGG.PP.GGG..TTT', // 3
  '^^^^^^....GG.PP......TTT', // 4
  '^^^^^^..~....PP...^^^^^^', // 5  cliff + cave approach
  '^^^^^^..PPPPPPPP..^^^^^^', // 6  path branches east
  '^^^^^^..PP...PP..,,,^^^^', // 7  cave mouth
  '^^^^^^..PP...PP.;,,,;^^^', // 8  cave entrance
  '^^^^^^..PP...PP...^^^^^^', // 9  below cave
  '^^^^^^..PPPPPPPP..^^^^^^', // 10 path reconnects
  '^^^^^^..ff...PP.44...TTT', // 11 flowers + dark grass
  '^^^^^^.......PP......TTT', // 12 marina clearing
  '^^^^^^.PPPPPPPPP.....TTT', // 13 L-bend horizontal path
  '^^^^^^.PP.JJU^^^^^...TTT', // 14 cliff edge + stairs
  'T......PP..RRRRR.....TTT', // 15 lone house roof
  'T..>...PP..HH&HH.....TTT', // 16 cut tree 1 + house wall
  'T......PP..HHDHH.....TTT', // 17 house door
  'T......PP....PP......TTT', // 18 path from house
  'T.GGG..PP......GGG...TTT', // 19 grass blocks
  'T.GGG..PP.4....GGG...TTT', // 20 grass + dark grass
  'T.GGG..PP............TTT', // 21
  'T.JJJJ.PP.....>......TTT', // 22 ledge + cut tree 2
  'T.~....PP......%.....TTT', // 23 rock + bush
  'T..4...PP............TTT', // 24 dark grass
  'T......PP...~........TTT', // 25
  'T....%.PP............TTT', // 26 bush
  'T..GGG.PP............TTT', // 27 grass approach
  'T......PP............TTT', // 28
  'FFFFFF.PP.FFFFFFFFFFFFFF', // 29 fence border to Viridian City
]);

export const route2: MapDefinition = {
  key: 'route-2',
  width: 24,
  height: 30,
  ground: route2Ground,
  encounterTableKey: 'route-2',
  npcs: [
    {
      id: 'route2-npc-1',
      name: 'Townsperson',
      tileX: 10,
      tileY: 18,
      textureKey: 'npc-male-2',
      facing: 'left',
      dialogue: [
        'Viridian Forest is just ahead!',
        'Watch out for Bug Catchers in there.',
      ],
    }
  ],
  trainers: [
    {
      id: 'route2-marina',
      name: 'Marina',
      trainerId: 'marina-1',
      tileX: 8,
      tileY: 12,
      textureKey: 'npc-marina',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-youngster-4',
      name: 'Youngster',
      trainerId: 'youngster-4',
      tileX: 16,
      tileY: 3,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route2-lass-4',
      name: 'Lass',
      trainerId: 'lass-4',
      tileX: 4,
      tileY: 19,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-camper-1',
      name: 'Camper',
      trainerId: 'camper-1',
      tileX: 10,
      tileY: 24,
      textureKey: 'npc-male-1',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  objects: [
    {
      id: 'route2-sign',
      tileX: 12,
      tileY: 1,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['ROUTE 2', 'VIRIDIAN FOREST ↑  VIRIDIAN CITY ↓'] },
    {
      id: 'route2-cavern-sign',
      tileX: 11,
      tileY: 5,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['CRYSTAL CAVERN →', 'Caution: Strong Pokémon dwell within!'] },
    {
      id: 'route2-awakening',
      tileX: 3,
      tileY: 17,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found an Awakening!'],
      givesItem: 'awakening',
      requireFlag: 'badge_2',
    },
  ],
  warps: [
    // South exit → Viridian City
    { tileX: 7, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    { tileX: 8, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    // North exit → Viridian Forest
    { tileX: 19, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    { tileX: 20, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    // East cave entrance → Crystal Cavern (cave floor tiles)
    { tileX: 17, tileY: 7, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 18, tileY: 7, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 19, tileY: 7, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 17, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 18, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 19, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
  ],
  spawnPoints: {
    'default':        { x: 8, y: 15, direction: 'up' },
    'from-viridian':  { x: 8, y: 28, direction: 'up' },
    'from-forest':    { x: 19, y: 1,  direction: 'down' },
    'from-cavern':    { x: 15, y: 7,  direction: 'left' },
  },
};
