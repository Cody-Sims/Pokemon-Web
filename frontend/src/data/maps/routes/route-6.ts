import { MapDefinition, parseMap } from '../shared';

// Route 6 — Voltara → Wraithmoor.
// C.1 polish (2026-04-26): explicit tech-to-ruins gradient.
//   Rows  0–6: Voltara tech remnants (PIPE, GEAR, ELECTRIC_PANEL, WIRE_FLOOR,
//              CONDUIT) thinning out as the road heads south.
//   Rows  7–14: transition — dark grass and autumn trees overtake broken metal
//              panels and rusted conduit fragments.
//   Rows 15–22: ruined moor — CRACKED_FLOOR breaks through the path,
//              RUIN_PILLAR and MIST creep in along the verges.
//   Rows 23–29: full Wraithmoor approach — RUIN_WALL fragments, GRAVE_MARKER
//              cluster on the east side, MIST blanketing the south.
const route6Ground = parseMap([
  // 01234567890123456789
  'TTTTTTT.PP.TTTTTTTTT', // 0  border to Voltara
  'T.§..π...PP....π.§.T', // 1  pipes flanking the road
  'T.§§.....PP.....§§.T', // 2
  'T.¥.§.Ω..PP..Ω.§.¥.T', // 3  conduit + gear shrines
  'T.¥.§....PP....§.¥.T', // 4
  'T....¦...PP...¦....T', // 5  control panels
  'T..Ʃ§....PP....§Ʃ..T', // 6  cracked metal floor — last tech
  // ─── transition: nature reclaiming the corridor ───
  'T.4..§...PP...§..4.T', // 7
  'T.4Ʃ.....PP.....Ʃ4.T', // 8  broken panel slabs
  'T.GG..2..PP..2..GG.T', // 9  first autumn trees
  'T.GG.....PP.....GG.T', // 10
  'T.4..2..§PP§..2..4.T', // 11 last conduit fragments
  'T.4.GG...PP...GG.4.T', // 12
  'T...GG2..PP..2GG...T', // 13
  'T.4.....‡PP‡.....4.T', // 14 first cracked-floor breaks
  // ─── ruined moor ───
  'T..2.‡...PP...‡.2..T', // 15
  'T..°.....PP.....°..T', // 16 mist begins
  'T.‡..2°..PP..°2..‡.T', // 17
  'T...‡....PP....‡...T', // 18
  'T.°...©..PP..©...°.T', // 19 first ruin pillars
  'T.‡.2....PP....2.‡.T', // 20
  'T.°..©.‡.PP.‡.©..°.T', // 21
  // ─── Wraithmoor approach ───
  '2..°..©..PP..©..°..2', // 22
  '2.‡....†.PP.†....‡.2', // 23 grave markers cluster
  '2.°®.....PP.....®°.2', // 24 ruin walls
  '2.‡.†©°..PP..°©†.‡.2', // 25
  '2.®.°.‡..PP..‡.°.®.2', // 26
  '2.°©.....PP.....©°.2', // 27
  '2.‡.®°..°PP°..°®.‡.2', // 28
  '2222222.PP.222222222', // 29 border to Wraithmoor
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
    dialogue: ['ROUTE 6', 'Wraithmoor Town ↓  Voltara City ↑'] },
    // Lore-rich sign at the transition midpoint marking the gradient.
    { id: 'route6-sign-mid', tileX: 6, tileY: 14, textureKey: 'sign-post', objectType: 'sign',
    dialogue: [
      'WARNING — Aether infrastructure ends here.',
      'Beyond this point, Voltara has no service contract.',
      'Walk at your own risk.',
    ] }
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
