import { MapDefinition, parseMap } from '../shared';

const route1Ground = parseMap([
  // 01234567890123456789
  'FFFFFFFF.PP.FFFFFFFF', // 0  fence border to Viridian
  'F........PP........F', // 1  open entry from Viridian
  'T.......PP.........T', // 2
  // ═══ NORTH ZONE: dense meadows flanking path ═══
  'T.GGGGG.PP..GGGGGG.T', // 3  thick grass both sides
  'T.GGGGG.PP..GGGGGG.T', // 4  contiguous meadow
  'T.GGGGG~PP..GGGGGG.T', // 5  rock marks west edge
  'T..GGG..PP...GGGGG.T', // 6  grass thins toward path
  'T....PPPPP....GGG..T', // 7  path bends west
  'T....PP...........%T', // 8  bush guards east edge
  // ═══ LEDGE ZONE: shortcut + east meadow ═══
  'T....PP....JJJJJJ..T', // 9  ledge shortcut #1
  'T....PP............T', // 10
  'T..%.PP............T', // 11 bush flanks path
  'T....PP...GGGGGG...T', // 12 east meadow starts
  'T....PP...GGGGGG...T', // 13 contiguous block
  'T....PP...GGGGGG...T', // 14 solid meadow
  'T....PPPPP..GGG....T', // 15 path bends east
  // ═══ FLOWER CLEARING: Rook rest area ═══
  'T.......PP.........T', // 16
  'T..ff...PP.........T', // 17 wildflowers begin
  'T.ffff..PP...fff...T', // 18 flower beds both sides
  'T.ffff..PP..ffff...T', // 19 lush heart of clearing
  'T..ff...PP...fff...T', // 20 flowers taper
  'T.......PP.........T', // 21 open rest area
  'T.......PP.......~.T', // 22 lone rock
  // ═══ SOUTH MEADOWS: big meadow, second ledge ═══
  'T.GGGGG.PP.........T', // 23 west meadow patch
  'T.GGGGG.PP....GG...T', // 24 + small east grass
  'T.......PPJJJJJJ...T', // 25 ledge shortcut #2
  'T...PPPPPP.........T', // 26 path bends west
  'T...PP.............T', // 27
  'T...PP..GGGGGGG..%.T', // 28 large east meadow
  'T...PP..GGGGGGG....T', // 29 contiguous block
  'T...PP..GGGGGGG..~.T', // 30 rock at meadow corner
  'T...PP..GGGGGGG....T', // 31
  'T...PPPPPP.........T', // 32 path bends east
  // ═══ SOUTH: open approach to Pallet ═══
  'T.......PP.........T', // 33
  'T..ff...PP.....f...T', // 34 sparse flowers
  'T.......PP.........T', // 35
  'T.......PP.........T', // 36
  'T.......PP.........T', // 37
  'T.......PP.........T', // 38
  'TTTTTTT.PP.TTTTTTTTT', // 39 south exit to Pallet
]);

export const route1: MapDefinition = {
  key: 'route-1',
  width: 20,
  height: 40,
  ground: route1Ground,
  encounterTableKey: 'route-1',
  npcs: [
    {
      id: 'route1-sign-north',
      tileX: 11,
      tileY: 1,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['ROUTE 1', 'VIRIDIAN CITY ↑  PALLET TOWN ↓'],
    },
    {
      id: 'route1-npc-1',
      tileX: 14,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'If your Pokémon are weak, don\'t go into the tall grass!',
        'Wild Pokémon will jump out at you!',
      ],
    },
    {
      id: 'route1-npc-2',
      tileX: 3,
      tileY: 23,
      textureKey: 'npc-female-3',
      facing: 'right',
      dialogue: [
        'I\'ve heard Pikachu live on this route...',
        'But they\'re really rare!',
      ],
      behavior: { type: 'wander', wanderRadius: 2 },
    },
    // ─── Story NPC: Rook's first appearance ───
    {
      id: 'route1-rook',
      tileX: 12,
      tileY: 21,
      textureKey: 'npc-male-6',
      facing: 'left',
      dialogue: [
        '???: ...',
        '???: You look like you just started out.',
        '???: Here — let me heal your Pokémon.',
        '???: The road ahead isn\'t as safe as it looks.',
        '???: ...Trust me on that.',
      ],
      requireFlag: 'receivedStarter',
      setsFlag: 'met_rook_route1',
      flagDialogue: [
        {
          flag: 'met_rook_route1',
          dialogue: [
            '???: You\'re still here? Keep moving.',
            '???: Something is stirring in these parts...',
          ],
        },
      ],
    },
  ],
  trainers: [
    {
      id: 'route1-youngster',
      trainerId: 'youngster-1',
      tileX: 14,
      tileY: 19,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-lass',
      trainerId: 'lass-1',
      tileX: 14,
      tileY: 13,
      textureKey: 'npc-lass',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-youngster-2',
      trainerId: 'youngster-2',
      tileX: 12,
      tileY: 29,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  warps: [
    // South exit → Pallet Town
    { tileX: 8, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    { tileX: 9, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    // North exit → Viridian City
    { tileX: 8, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
    { tileX: 9, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 37, direction: 'up' },
    'from-pallet':   { x: 9, y: 38, direction: 'up' },
    'from-viridian': { x: 9, y: 1,  direction: 'down' },
  },
};
