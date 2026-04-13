import { MapDefinition, parseMap } from './shared';

// Ember Mines — 2-floor dungeon (represented as one map)
// Synthesis Collective Aether extraction lab hidden in a mine
// Dr. Vex boss battle #1
const mineGround = parseMap([
  ';;;;;;;;;;;;;;;;;;;;', // 0
  ';,,,,,,,,;;,,,,,,,,;', // 1
  ';,,=,,,,,;;,,,=,,,,;', // 2  mine tracks
  ';,,=,,,,,,,,,,=,,,,;', // 3
  ';,,=,,q,,,,,,,=,,,,;', // 4  boulders
  ';,,=,,,,,,,,,,=,,,,;', // 5
  ';,,,,,,,,;;,,,,,,,,;', // 6
  ';,,,q,,,,;;,,,,q,,,;', // 7
  ';,,,,,,,,,,,,,,,,,,;', // 8
  ';;,,,,,,,,,,,,,,,,,;', // 9
  ';;,,,,,,,,,,,,,,,,;;', // 10
  ';,,,,,,,,,,,,,,,,,;;', // 11
  ';,,,,,,,,,,,,,,,,,,;', // 12
  ';,,q,,,,,,,,,,,q,,,;', // 13
  ';,,,,,,,,;;,,,,,,,,;', // 14
  ';,,,,,,,,;;,,,,,,,,;', // 15
  ';,,=,,,,,;;,,,=,,,,;', // 16
  ';,,=,,,,,,,,,,=,,,,;', // 17
  ';,,=,,,,,,,,,,=,,,,;', // 18
  ';,,,,,,,,,,,,,,,,,,;', // 19
  ';,,,,,,,,,,,,,,,,,,;', // 20
  ';,,,q,,,,,,,,,q,,,,;', // 21
  ';,,,,,,,,,,,,,,,,,,;', // 22
  ';,,,,,,,,,,,,,,,,,,;', // 23
  ';;;;;;;;,,,,;;;;;;;;', // 24 entrance
]);

export const emberMines: MapDefinition = {
  key: 'ember-mines',
  width: 20,
  height: 25,
  ground: mineGround,
  encounterTableKey: 'ember-mines',
  battleBg: 'bg-mine',
  displayName: 'Ember Mines',
  npcs: [
    {
      id: 'mines-sign',
      tileX: 10,
      tileY: 23,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['EMBER MINES', 'DANGER — Synthesis Collective Activity Detected'],
    },
    // Story: Synthesis lab equipment
    {
      id: 'mines-terminal',
      tileX: 8,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A Synthesis Collective data terminal...',
        'The screen shows readings labeled "Aether Extraction Rate."',
        'The numbers are climbing rapidly.',
      ],
      setsFlag: 'found_mines_terminal',
    },
    // Caged Pokémon
    {
      id: 'mines-cage',
      tileX: 15,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Pokémon are trapped in strange containment pods!',
        'They\'re glowing with unstable energy...',
        'You need to stop whoever is doing this!',
      ],
      setsFlag: 'found_caged_pokemon',
    },
  ],
  trainers: [
    {
      id: 'mines-grunt-1',
      trainerId: 'synthesis-grunt-2',
      tileX: 5,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'mines-grunt-2',
      trainerId: 'synthesis-grunt-3',
      tileX: 14,
      tileY: 15,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 3,
    },
    // Dr. Vex boss battle #1
    {
      id: 'mines-vex',
      trainerId: 'admin-vex-1',
      tileX: 10,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'down',
      lineOfSight: 5,
    },
    {
      id: 'mines-grunt-3',
      trainerId: 'synthesis-grunt-5',
      tileX: 8,
      tileY: 12,
      textureKey: 'generic-trainer',
      facing: 'up',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Route 4
    { tileX: 8, tileY: 24, targetMap: 'route-4', targetSpawnId: 'from-mines' },
    { tileX: 9, tileY: 24, targetMap: 'route-4', targetSpawnId: 'from-mines' },
    { tileX: 10, tileY: 24, targetMap: 'route-4', targetSpawnId: 'from-mines' },
    { tileX: 11, tileY: 24, targetMap: 'route-4', targetSpawnId: 'from-mines' },
  ],
  spawnPoints: {
    'default':      { x: 10, y: 23, direction: 'up' },
    'from-route-4': { x: 10, y: 23, direction: 'up' },
  },
};
