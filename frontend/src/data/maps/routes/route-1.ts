import { MapDefinition, parseMap } from '../shared';

const route1Ground = parseMap([
  // 01234567890123456789
  'TTTTTTT.PP.TTTTTTTTT', // 0  - north exit to Viridian
  'TFFFF...PP...FFFFF.T', // 1  - fence: Viridian City boundary
  'T.......PP.........T', // 2
  'T..GG...PP..GGG..%.T', // 3  - asymmetric grass, bush
  'T.GGGG.~PP.....GG..T', // 4  - rock off-path
  'T..GGG..PP.........T', // 5
  'T.......PP.....%...T', // 6
  'T....PPPPP.........T', // 7  - path bends west
  'T....PP....GG......T', // 8
  'T....PP....JJJJJJ..T', // 9  - ledge shortcut #1
  'T.GG.PP........GGG.T', // 10
  'T.GGGPP.........GG.T', // 11
  'T....PP..~...GGG...T', // 12 - rock near trainer
  'T....PP....GG......T', // 13
  'T..%.PP.........%..T', // 14 - bushes flanking route
  'T....PPPPP.........T', // 15 - path bends east
  'T.......PP.........T', // 16
  'T.......PP.........T', // 17
  'T..ff...PP.........T', // 18 - flower garden begins
  'T.ffff..PP..ff.....T', // 19 - flowers both sides
  'T..fff..PP.fff.%...T', // 20 - flower garden + bush
  'T...ff..PP..ff.....T', // 21 - flowers taper off
  'T.......PP.......~.T', // 22 - rock
  'T.GGGG..PP.....GG..T', // 23
  'T....GG.PP..GG.....T', // 24
  'T.......PPJJJJJJ...T', // 25 - ledge shortcut #2
  'T...PPPPPP.........T', // 26 - path bends west
  'T...PP.......GGG.%.T', // 27 - bush
  'T...PP....GGG......T', // 28
  'T.G.PP..~....GG....T', // 29 - grass + rock
  'TGGGPP.........GG..T', // 30 - dense grass edge
  'T.GGPP.....GGGG....T', // 31
  'T...PP.........GG..T', // 32
  'T...PPPPPP.........T', // 33 - path bends east
  'T.......PP.........T', // 34
  'T.......PP......%..T', // 35 - bush near Pallet
  'T..GG...PP...GG....T', // 36
  'T...GG..PP.........T', // 37
  'T.......PP.........T', // 38
  'TTTTTTT.PP.TTTTTTTTT', // 39 - south exit to Pallet
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
      tileY: 6,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'If your Pokémon are weak, don\'t go into the tall grass!',
        'Wild Pokémon will jump out at you!',
      ],
    },
    {
      id: 'route1-npc-2',
      tileX: 4,
      tileY: 24,
      textureKey: 'npc-female-3',
      facing: 'right',
      dialogue: [
        'I\'ve heard Pikachu live on this route...',
        'But they\'re really rare!',
      ],
    },
    // ─── Story NPC: Rook's first appearance ───
    {
      id: 'route1-rook',
      tileX: 12,
      tileY: 20,
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
      tileX: 13,
      tileY: 18,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-lass',
      trainerId: 'lass-1',
      tileX: 3,
      tileY: 12,
      textureKey: 'npc-lass',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route1-youngster-2',
      trainerId: 'youngster-2',
      tileX: 8,
      tileY: 28,
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
