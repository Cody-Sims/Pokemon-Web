import { MapDefinition, parseMap } from '../shared';

// Route 4 — Basalt Ridge.
// Volcanic terrain connecting Coral Harbor to Ember Mines / Ironvale.
// C.1 polish (2026-04-26): replaced generic cliff borders with explicit
// volcanic geology — VOLCANIC_WALL (Þ) flanks, MAGMA_CRACK (µ) seams,
// LAVA_ROCK (Ø) outcrops, and ASH_GROUND (≪) patches around the cave mouth.
// Tile legend:
//   Ø = LAVA_ROCK     « = ASH_GROUND     µ = MAGMA_CRACK    Þ = VOLCANIC_WALL
//   ^ = CLIFF_FACE    , = CAVE_FLOOR     ; = CAVE_WALL
const route4Ground = parseMap([
  // 01234567890123456789
  'TTTTTTT.PP.TTTTTTTTT', // 0  north exit
  'T..~.....PP.....«..T', // 1  ash patch near sign
  'T..GGG..«PP«..4GG..T', // 2  dark grass + ash beside the path
  'T..GGG.Ø.PP.Ø.G4G..T', // 3  lava-rock outcrops
  'T.µØ«....PP....«Øµ.T', // 4  paired lava-rock + magma-crack edges
  'T....PPPPPPPPPP....T', // 5  road junction
  'Þ..Ø.PP....«...ÞÞ..T', // 6  volcanic walls flanking the cliff
  'Þ.µ..PP.Ø....ÞÞÞÞ..T', // 7
  'Þ....PP..«..ÞÞÞÞÞ..T', // 8
  'Þ.«ØµPP..,,,,,,ÞÞ..T', // 9  ash + magma seam alongside cave entry
  'Þ....PP..,,,,,,,Þ..T', // 10
  'Þ..«.PPPP,,,,,,,,..T', // 11
  'T....«...,;,,,,,,..T', // 12 cave warp at (17,12)
  'T..ÞÞ.«..,;;,,,,,..T', // 13
  'T..ÞÞÞ.µ.,;,,,,,,..T', // 14
  'T..ÞÞ.«..,,,,,;,,..T', // 15
  'T....«...,,,,,;;,..T', // 16
  'Þ....PPPP,,,,,,,,..T', // 17
  'Þ.µ..PP..,,,,,,,Þ..T', // 18
  'Þ.«ØµPP..,,,,,,ÞÞ..T', // 19
  'Þ....PP..«..ÞÞÞÞÞ..T', // 20
  'Þ.µ..PP.Ø....ÞÞÞÞ..T', // 21
  'Þ..Ø.PP....«...ÞÞ..T', // 22
  'T....PPPPPPPPPP....T', // 23
  'T.µØ«....PP....«Øµ.T', // 24 mirror of row 4
  'T..4GG.Ø.PP.Ø.44G..T', // 25
  'T..G4G..«PP«..GGG..T', // 26
  'T..~.....PP.....~..T', // 27
  'T...«....PP....«...T', // 28
  'TTTTTTT.PP.TTTTTTTTT', // 29 south exit
]);

export const route4: MapDefinition = {
  key: 'route-4',
  width: 20,
  height: 30,
  ground: route4Ground,
  encounterTableKey: 'route-4',
  battleBg: 'bg-volcanic',
  weather: 'sandstorm',
  npcs: [
    {
      id: 'route4-rook',
      name: 'Rook',
      tileX: 12,
      tileY: 12,
      textureKey: 'npc-male-5',
      facing: 'left',
      dialogue: [
        '???: ...That creature was no ordinary Pokémon.',
        '???: It was glowing. Unstable. Suffering.',
        '???: Someone did that to it.',
        '???: Follow the white coats underground.',
        '???: You\'ll find what you\'re looking for.',
      ],
      requireFlag: 'receivedStarter',
      setsFlag: 'met_rook_basalt',
    }
  ],
  trainers: [
    {
      id: 'route4-hiker-4',
      name: 'Hiker',
      trainerId: 'hiker-4',
      tileX: 6,
      tileY: 15,
      textureKey: 'npc-hiker',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'route4-grunt-1',
      name: 'Synthesis Grunt',
      trainerId: 'synthesis-grunt-1',
      tileX: 14,
      tileY: 10,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 4,
    },
    {
      id: 'route4-hiker-6',
      name: 'Hiker',
      trainerId: 'hiker-6',
      tileX: 10,
      tileY: 22,
      textureKey: 'npc-hiker',
      facing: 'up',
      lineOfSight: 3,
    },
    {
      id: 'route4-youngster-5',
      name: 'Youngster',
      trainerId: 'youngster-5',
      tileX: 5,
      tileY: 8,
      textureKey: 'npc-male-2',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'route4-grunt-4',
      name: 'Synthesis Grunt',
      trainerId: 'synthesis-grunt-4',
      tileX: 12,
      tileY: 18,
      textureKey: 'npc-grunt',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  objects: [
    {
      id: 'route4-sign',
      tileX: 11,
      tileY: 1,
      textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['ROUTE 4 — BASALT RIDGE', 'Ironvale City ↑  Coral Harbor ↓'] }
  ],
  warps: [
    // North exit → Ironvale City
    { tileX: 8, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-4' },
    { tileX: 9, tileY: 0, targetMap: 'ironvale-city', targetSpawnId: 'from-route-4' },
    // South exit → Coral Harbor
    { tileX: 8, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-route-4' },
    { tileX: 9, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-route-4' },
    // East cave entrance → Ember Mines
    { tileX: 17, tileY: 12, targetMap: 'ember-mines', targetSpawnId: 'from-route-4' },
    { tileX: 17, tileY: 13, targetMap: 'ember-mines', targetSpawnId: 'from-route-4' },
  ],
  spawnPoints: {
    'default':       { x: 9, y: 15, direction: 'up' },
    'from-coral':    { x: 9, y: 28, direction: 'up' },
    'from-ironvale': { x: 9, y: 1,  direction: 'down' },
    'from-mines':    { x: 16, y: 12, direction: 'left' },
  },
};
