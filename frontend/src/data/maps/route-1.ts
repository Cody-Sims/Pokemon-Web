import { MapDefinition, parseMap } from './shared';

const route1Ground = parseMap([
  // 01234567890123456789
  'TTTTTTTTPPTTTTTTTTTT', // 0  - north exit to Viridian
  'T........PP........T', // 1
  'T..GGG...PP...GGG..T', // 2
  'T..GGG...PP...GGG..T', // 3
  'T..GGG...PP...GGG..T', // 4
  'T........PP........T', // 5
  'T........PP........T', // 6
  'T.....PPPPPPPP.....T', // 7  - bend in path
  'T.....PP...........T', // 8
  'T.....PP...........T', // 9
  'T..GGGPP....GGG....T', // 10
  'T..GGGPP....GGG....T', // 11
  'T..GGGPP....GGG....T', // 12
  'T.....PP...........T', // 13
  'T.....PP...........T', // 14
  'T.....PPPPPPPP.....T', // 15 - bend back
  'T........PP........T', // 16
  'T........PP........T', // 17
  'T...GGG..PP..GGG...T', // 18
  'T...GGG..PP..GGG...T', // 19
  'T...GGG..PP..GGG...T', // 20
  'T...GGG..PP..GGG...T', // 21
  'T........PP........T', // 22
  'T........PP........T', // 23
  'T..f.....PP.....f..T', // 24
  'T........PP........T', // 25
  'T....PPPPPPPPPP....T', // 26 - another bend
  'T....PP............T', // 27
  'T....PP............T', // 28
  'T..GGPP.....GGG....T', // 29
  'T..GGPP.....GGG....T', // 30
  'T..GGPP.....GGG....T', // 31
  'T....PP............T', // 32
  'T....PPPPPPPPPP....T', // 33 - bend back
  'T........PP........T', // 34
  'T........PP........T', // 35
  'T..GG....PP....GG..T', // 36
  'T..GG....PP....GG..T', // 37
  'T........PP........T', // 38
  'TTTTTTTTPPTTTTTTTTTT', // 39 - south exit to Pallet
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
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        'I\'ve heard Pikachu live on this route...',
        'But they\'re really rare!',
      ],
    },
  ],
  trainers: [
    {
      id: 'route1-youngster',
      trainerId: 'youngster-1',
      tileX: 14,
      tileY: 18,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-lass',
      trainerId: 'lass-1',
      tileX: 5,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route1-youngster-2',
      trainerId: 'youngster-2',
      tileX: 10,
      tileY: 28,
      textureKey: 'generic-trainer',
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
