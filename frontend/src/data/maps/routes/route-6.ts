import { MapDefinition, parseMap } from '../shared';

// Route 6 — connecting Voltara City to Wraithmoor Town
const route6Ground = parseMap([
  'TTTTTTT.PP.TTTTTTTTT',
  'T.§......PP........T',
  'T..GGG.§.PP...GGG..T',
  'T..GGG...PP.Ʃ.GGG..T',
  'T..¥.....PP....§...T',
  'T....PPPPPPPPPP....T',
  'T.Ʃ..PP........¥...T',
  'T....PP....GGG..§..T',
  'T.¥..PP....GGG.....T',
  'T....PP.........Ʃ..T',
  'T....PPPPPPPPPP....T',
  'T..4.....PP.....‡..T',
  'T..GG.4..PP..‡.GG..T',
  'T..GG....PP....GG..T',
  'T.‡..2...PP...2.4..T',
  'T..4.....PP.....4..T',
  'T...GGG..PP..GGG...T',
  'T.4.GGG..PP..GGG.4.T',
  'T.‡......PP....4...T',
  'T..4.2...PP...2.‡..T',
  '2..f..°..PP..°..f..2',
  '2.4..‡...PP...‡.4..2',
  '2..°.....PP..©..°..2',
  '2.4..©...PP.....4..2',
  '2..‡.....PP.‡...°..2',
  '2..GG.°..PP..°.GG..2',
  '2..GG.‡..PP..‡.GG..2',
  '2.°..4...PP...4.°..2',
  '2.‡......PP......‡.2',
  '2222222.PP.222222222',
]);

export const route6: MapDefinition = {
  key: 'route-6', width: 20, height: 30, ground: route6Ground,
  encounterTableKey: 'route-6', battleBg: 'bg-ruins',
  weather: 'rain',
  npcs: [],
  trainers: [
    { id: 'route6-psychic-1', name: 'Psychic', trainerId: 'psychic-1', tileX: 6, tileY: 12, textureKey: 'npc-psychic', facing: 'right', lineOfSight: 4 },
    { id: 'route6-grunt-5', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 14, tileY: 18, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 3 },
  ],
  objects: [
    { id: 'route6-sign', tileX: 11, tileY: 1, textureKey: 'sign-post', objectType: 'sign',
    dialogue: ['ROUTE 6', 'Wraithmoor Town ↓  Voltara City ↑'] }
  ],
  warps: [
    { tileX: 8, tileY: 0, targetMap: 'voltara-city', targetSpawnId: 'from-route-6' },
    { tileX: 9, tileY: 0, targetMap: 'voltara-city', targetSpawnId: 'from-route-6' },
    { tileX: 8, tileY: 29, targetMap: 'wraithmoor-town', targetSpawnId: 'from-route-6' },
    { tileX: 9, tileY: 29, targetMap: 'wraithmoor-town', targetSpawnId: 'from-route-6' },
  ],
  spawnPoints: {
    'default': { x: 9, y: 15, direction: 'down' },
    'from-voltara': { x: 9, y: 1, direction: 'down' },
    'from-wraithmoor': { x: 9, y: 28, direction: 'up' },
  },
};
