import { MapDefinition, parseMap } from '../shared';

const route2Ground = parseMap([
  // 01234567890123456789
  '1TT1TTT.PP.TTTT1TT1T', // 0  north exit to Viridian Forest
  'T........PP........T', // 1
  // ═══ NORTH: forest-edge meadows ═══
  'T.GGGGG..PP..GGGGG.1', // 2  dense grass both sides
  '1.GGGGG..PP..GGGGG.T', // 3  contiguous meadow
  'T..GGG...PP...GGG..1', // 4  tapers toward path
  // ═══ CRYSTAL CAVERN: mountainside with dark mouth ═══
  'T..~.....PP...^^^^^T', // 5  rock near cliff area
  'T....PPPPPP..^^^^^^T', // 6  path branches east
  'T....PP..PPP.^^^^^^T', // 7  path leads to cliff face
  'T....PP..PPP.P,,,^.T', // 8  dark cave mouth (3 wide)
  'T....PP..PPP.^,,,^.T', // 9  entrance you walk into
  'T....PP..PPP.^^^^^^T', // 10 cliff below entrance
  'T..~.PPPPPP...^^^^.T', // 11 rock + path reconnects
  // ═══ MARINA CLEARING: open rival battle area ═══
  'T..4.....PP.....4..T', // 12 dark grass flanks
  'T..ff....PP....ff..T', // 13 flowers frame the clearing
  'T.ffff...PP...ffff.T', // 14 lush flower beds
  'T..ff....PP....ff..T', // 15 symmetrical clearing
  'T........PP........T', // 16
  // ═══ SOUTH MEADOWS: grass blocks + ledge ═══
  '1.GGGGG..PP........T', // 17 west meadow block
  'T.GGGGG..PP......%.T', // 18 bush near edge
  '1.GGGGG..PP..GGGGG.T', // 19 east meadow joins
  'T..4.....PP..GGGGG.T', // 20 dark grass patch
  'T........PP..GGGGG.1', // 21 pine border
  'TJJJJJ...PP........T', // 22 ledge shortcut
  'T.~......PP.......%T', // 23 rock + bush
  'T..%..~..PP........T', // 24 bush + rock accent
  'T..4.....PP....4...T', // 25 dark grass
  'T........PP.~......T', // 26 rock
  'T......%.PP........T', // 27 bush
  'T........PP........T', // 28
  'FFFFFFFF.PP.FFFFFFFF', // 29 fence border to Viridian City
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
      tileY: 16,
      textureKey: 'npc-male-2',
      facing: 'left',
      dialogue: [
        'Viridian Forest is just ahead!',
        'Watch out for Bug Catchers in there.',
      ],
    },
    {
      id: 'route2-cavern-sign',
      tileX: 7,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: ['CRYSTAL CAVERN →', 'Caution: Strong Pokémon dwell within!'],
    },
  ],
  trainers: [
    {
      id: 'route2-marina',
      trainerId: 'marina-1',
      tileX: 7,
      tileY: 14,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-youngster-4',
      trainerId: 'youngster-4',
      tileX: 14,
      tileY: 3,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'route2-lass-4',
      trainerId: 'lass-4',
      tileX: 3,
      tileY: 18,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route2-camper-1',
      trainerId: 'camper-1',
      tileX: 14,
      tileY: 20,
      textureKey: 'npc-male-1',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  warps: [
    // South exit → Viridian City
    { tileX: 8, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 29, targetMap: 'viridian-city', targetSpawnId: 'from-route-2' },
    // North exit → Viridian Forest
    { tileX: 8, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    { tileX: 9, tileY: 0, targetMap: 'viridian-forest', targetSpawnId: 'from-route-2' },
    // East cave entrance → Crystal Cavern (dark mouth tiles)
    { tileX: 14, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 15, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 16, tileY: 8, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 14, tileY: 9, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 15, tileY: 9, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
    { tileX: 16, tileY: 9, targetMap: 'crystal-cavern', targetSpawnId: 'from-route-2' },
  ],
  spawnPoints: {
    'default':        { x: 9, y: 15, direction: 'up' },
    'from-viridian':  { x: 9, y: 28, direction: 'up' },
    'from-forest':    { x: 9, y: 1,  direction: 'down' },
    'from-cavern':    { x: 13, y: 8,  direction: 'left' },
  },
};
