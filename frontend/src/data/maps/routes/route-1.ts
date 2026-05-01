import { MapDefinition, parseMap } from '../shared';

// ═══ Route 1 (Phase 1 of docs/Map-improvements.md) ═══
// S-curve route between Littoral Town (south) and Viridian City (north).
// Layout intent:
//   • North entry at cols 8-9 (Viridian side warp)
//   • Path swings west to col 4-5 in the upper third (forces engagement
//     with the youngster trainer)
//   • Mid-route fork: main path continues SE; an east branch bends into a
//     Cut-tree gate (>) hiding a hidden item alcove (post-Badge-2 reward).
//   • Stream (W) crosses east→west through row 24 with a 3-plank wood bridge;
//     a Cracked-Rock (*) on the east bank gates a Surf-only east cove.
//   • Rook's flower clearing now sits in a bend (rows 30-34) tucked between
//     the east treeline and a curve in the path — feels discovered, not on rails.
//   • South exit at cols 8-9 (Pallet side warp).
const route1Ground = parseMap([
  // 01234567890123456789
  'FFFFFFFF.PP.FFFFFFFF', // 0  fence border to Viridian
  'F........PP........F', // 1  open entry from Viridian
  'T.......PPP........T', // 2  path widens slightly
  // ═══ NORTH BEND: path swings west, dense east meadow ═══
  'X.....GGPPP.GGGGGG.X', // 3  meadow east, thin west
  'X.....GGPP..GGGGGG.X', // 4
  'T.~...GGPP..GGGGGG.T', // 5  lone rock landmark west
  'T.....GGPP..GGGG~..T', // 6
  'T.....GGPP....GGG..T', // 7
  'T....PPPP....f.....T', // 8  path begins to curve west
  'T....PP....%.......T', // 9  bush flanks path
  'X....PPPPP.JJJJJJ..X', // 10 path completes west bend; ledge above east meadow
  // ═══ MID-ROUTE LEDGE & FORK ═══
  'T...PPP.PPPPPPP%...T', // 11 path crosses east; bush breaks sightline
  'T...PP........PPP..T', // 12 branch narrows instead of a rectangle
  'T...PP..GGGGG...PP.T', // 13 meadow island with crooked edge
  'T...PP..GGGGGG..P>.T', // 14 CUT_TREE gate with reward alcove beyond
  'T...PPP.GGGGG...PP.T', // 15 branch widens unevenly
  'T....PP.......PPP..T', // 16 branch turns back toward main path
  'X....PPPPPPPPPPP...X', // 17 fork rejoins; main path heads south
  'T...PP.............T', // 18
  // ═══ STREAM CROSSING ═══
  'T...PP.............T', // 19 east treeline
  'T...PP.5555........X', // 20 light grass cluster
  'T...PP.5555........T', // 21
  'T...PP.....~.......T', // 22 rock on south stream bank
  'WWW.PP.............T', // 23 stream encroaches from west
  'WWW.PP.WWWWWWWWWWWWW', // 24 stream crosses route — bridge at cols 3-4
  'WWW8PP8WWWWWWWWWWWWW', // 25 wooden plank bridge
  'WWW.PP.............T', // 26
  'T...PP..%.....*....X', // 27 cracked rock on east bank (Rock Smash gate)
  // ═══ FLOWER CLEARING / ROOK ═══
  'T...PP.............T', // 28
  'X...PP....f........T', // 29
  'T..PPP..fff........T', // 30 path wiggles west around clearing
  'T..PP..ffff........T', // 31
  'T..PP..ffff.....~..X', // 32 Rook stands here in original
  'T..PP...fff........T', // 33
  'T..PP....f.........T', // 34
  // ═══ SOUTH APPROACH ═══
  'T..PPP.............T', // 35
  'T....PPPPP.........T', // 36 path bends back east
  'T........PPP.GG.GG.T', // 37 small grass patches
  'T........PPP.GG.GG.T', // 38
  'TTTTTTTT.PP.TTTTTTTT', // 39 south exit to Pallet
]);

export const route1: MapDefinition = {
  key: 'route-1',
  width: 20,
  height: 40,
  ground: route1Ground,
  encounterTableKey: 'route-1',
  npcs: [
    {
      id: 'route1-npc-2',
      name: 'Townsperson',
      tileX: 15,
      tileY: 21,
      textureKey: 'npc-female-1',
      facing: 'left',
      dialogue: [
        'I\'ve heard Pikachu live on this route...',
        'But they\'re really rare!',
      ],
      behavior: { type: 'wander', wanderRadius: 2 },
    },
    {
      id: 'route1-rook',
      name: 'Rook',
      tileX: 10,
      tileY: 32,
      textureKey: 'npc-male-5',
      facing: 'right',
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
    }
  ],
  trainers: [
    {
      id: 'route1-youngster',
      name: 'Youngster',
      trainerId: 'youngster-1',
      tileX: 8,
      tileY: 19,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-lass',
      name: 'Lass',
      trainerId: 'lass-1',
      tileX: 11,
      tileY: 8,
      textureKey: 'npc-lass',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route1-youngster-2',
      name: 'Youngster',
      trainerId: 'youngster-2',
      tileX: 16,
      tileY: 13,
      textureKey: 'npc-male-2',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  objects: [
    {
      id: 'route1-sign-north',
      tileX: 11,
      tileY: 1,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['ROUTE 1', 'VIRIDIAN CITY ↑  LITTORAL TOWN ↓'] },
    {
      id: 'route1-npc-1',
      tileX: 14,
      tileY: 2,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: [
        'If your Pokémon are weak, don\'t go into the tall grass!',
        'Wild Pokémon will jump out at you!',
      ] },
    // ─── Hidden item-ball behind the Cut-tree alcove (post-Badge-2 reward). ───
    // Sits beyond the CUT_TREE at (17, 14); reachable only after Cut.
    {
      id: 'route1-cut-alcove-item',
      tileX: 18,
      tileY: 14,
      textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['Found a hidden Antidote!'] },
    // ─── Berry tree (A.5): regrows every ~240 game minutes (~24 real min). ───
    {
      id: 'route1-berry-tree-oran',
      tileX: 15,
      tileY: 32,
      textureKey: 'berry-tree-oran', objectType: 'item-ball',
      dialogue: ['A small berry tree sways in the breeze.'],
      interactionType: 'berry-tree',
      interactionData: 'oran-berry:240' }
  ],
  warps: [
    // South exit → Pallet Town
    { tileX: 9, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    { tileX: 10, tileY: 39, targetMap: 'pallet-town', targetSpawnId: 'from-route-1' },
    // North exit → Viridian City
    { tileX: 9, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
    { tileX: 10, tileY: 0, targetMap: 'viridian-city', targetSpawnId: 'from-route-1' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 37, direction: 'up' },
    'from-pallet':   { x: 9, y: 38, direction: 'up' },
    'from-viridian': { x: 9, y: 1,  direction: 'down' },
  },
};
