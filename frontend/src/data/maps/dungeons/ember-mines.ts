import { MapDefinition, parseMap } from '../shared';

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
  // Transition zone: mine → synthesis lab
  ';,,,,,,,,ĦĦ,,,,,,,,;', // 14  cave walls give way to synthesis walls
  ';,,,,,,,ĦŦŦ,,,,,,,,;', // 15  synthesis materials start appearing
  // Rows 16-24: Synthesis Collective hidden lab
  'ĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦ', // 16  lab outer wall
  'ĦŦŦŦŦŦŦƫŦŦŦŦƫŦŦŦŦŦŦĦ', // 17  terminals on north wall
  'ĦŦŦŊŦŦŦŦŦŦŦŦŦŦŊŦŦŦŦĦ', // 18  containment pods
  'ĦŦŦŦŦŦƉŦŦŦŦŦƉŦŦŦŦŦŦĦ', // 19  aether conduits
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 20  central lab area (Dr. Vex)
  'ĦŦŦŦŦŦƉŦŦŦŦŦƉŦŦŦŦŦŦĦ', // 21  aether conduits
  'ĦŦŦŊŦŦŦŦŦŦŦŦŦŦŊŦŦŦŦĦ', // 22  containment pods
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 23
  'ĦĦĦĦĦĦĦĦĐĐĐĐĦĦĦĦĦĦĦĦ', // 24  entrance doors from south
]);

export const emberMines: MapDefinition = {
  key: 'ember-mines',
  width: 20,
  height: 25,
  ground: mineGround,
  encounterTableKey: 'ember-mines',
  weather: 'sandstorm',
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
      tileX: 7,
      tileY: 17,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A Synthesis Collective data terminal...',
        'The screen shows readings labeled "Aether Extraction Rate."',
        'The numbers are climbing rapidly.',
      ],
      setsFlag: 'found_mines_terminal',
      triggerCutscene: 'ember-mines-discovery',
      flagDialogue: [
        { flag: 'found_mines_terminal', dialogue: [
          'The terminal shows more data about Project CONVERGENCE...',
          'The extraction rates are still climbing.',
        ]},
      ],
    },
    // Caged Pokémon — near containment pods in lab
    {
      id: 'mines-cage',
      tileX: 14,
      tileY: 18,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Pokémon are trapped in strange containment pods!',
        'They\'re glowing with unstable energy...',
        'You need to stop whoever is doing this!',
      ],
      setsFlag: 'found_caged_pokemon',
    },
    // Dragon's Lament quest: mineral pickup
    {
      id: 'mines-mineral',
      tileX: 3,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A vein of rare mineral glints in the torchlight...',
        'You extracted the Aether Crystal Mineral!',
      ],
      requireFlag: '!dragon-mineral-found',
      setsFlag: 'dragon-mineral-found',
    },
  ],
  trainers: [
    {
      id: 'mines-grunt-1',
      name: 'Synthesis Grunt',
      trainerId: 'synthesis-grunt-2',
      tileX: 5,
      tileY: 8,
      textureKey: 'npc-grunt',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'mines-grunt-2',
      name: 'Synthesis Grunt',
      trainerId: 'synthesis-grunt-3',
      tileX: 10,
      tileY: 14,
      textureKey: 'npc-grunt',
      facing: 'down',
      lineOfSight: 3,
    },
    // Dr. Vex boss battle #1 — center of synthesis lab
    {
      id: 'mines-vex',
      name: 'Admin Vex',
      trainerId: 'admin-vex-1',
      tileX: 10,
      tileY: 20,
      textureKey: 'npc-admin-vex',
      facing: 'down',
      lineOfSight: 5,
    },
    {
      id: 'mines-grunt-3',
      name: 'Synthesis Grunt',
      trainerId: 'synthesis-grunt-5',
      tileX: 8,
      tileY: 23,
      textureKey: 'npc-grunt',
      facing: 'up',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Route 4 (through synthesis doors)
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
