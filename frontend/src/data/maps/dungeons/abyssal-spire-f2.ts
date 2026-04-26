import { MapDefinition, parseMap } from '../shared';

// Abyssal Spire — Floor 2: Lab Wing
// Full Synthesis Collective laboratory with containment pods and terminals
const spireF2Ground = parseMap([
  'ĦĦĦĦĦĦĦĦĦŦŦĦĦĦĦĦĦĦĦĦ', // 0
  'ĦŦŦŦŦŦĦŦŦŦŦŦŦĦŦŦŦŦŦĦ', // 1
  'ĦŦŊŦŊŦĦŦƫŦŦƫŦĦŦŊŦŊŦĦ', // 2  containment pods & terminals
  'ĦŦŦŦŦŦĦŦŦŦŦŦŦĦŦŦŦŦŦĦ', // 3
  'ĦŦŊŦŊŦĐŦŦŦŦŦŦĐŦŊŦŊŦĦ', // 4  doors between sections
  'ĦŦŦŦŦŦĦŦŦŦŦŦŦĦŦŦŦŦŦĦ', // 5
  'ĦĦĦĐĦĦĦŦ§§§§ŦĦĦĦĐĦĦĦ', // 6
  'ĦŦŦŦŦŦŦŦ§§§§ŦŦŦŦŦŦŦĦ', // 7
  'ĦŦƫŦŦŦŦŦ§§§§ŦŦŦŦŦŦŦĦ', // 8  terminal row
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 9
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 10
  'ĦŦƫŦŦŦŦŦŦŦŦŦŦŦŦŦŦƫŦĦ', // 11 terminal row
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 12
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 13
  'ĦŦŊŦŦŦŊŦŦŦŦŦŦŊŦŦŦŊŦĦ', // 14 more pods
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 15
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 16
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 17
  'ĦĦĦĦĦĦĦĦŦŦŦŦĦĦĦĦĦĦĦĦ', // 18
  'ĦĦĦĦĦĦĦĦŦŦŦŦĦĦĦĦĦĦĦĦ', // 19
]);

export const abyssalSpireF2: MapDefinition = {
  key: 'abyssal-spire-f2',
  width: 20,
  height: 20,
  ground: spireF2Ground,
  encounterTableKey: 'abyssal-spire',
  battleBg: 'bg-cave',
  displayName: 'Abyssal Spire — Lab Wing',
  npcs: [
    {
      id: 'lab-terminal-1',
      tileX: 8,
      tileY: 11,
      textureKey: 'sign-post',
      facing: 'down',
      dialogue: [
        'A Synthesis data terminal...',
        'PROJECT CHIMERA — Phase 3 Active',
        '"Aether infusion rates exceed projections. Subject survival at 73%."',
        'The data is horrifying...',
      ],
      setsFlag: 'read_chimera_logs',
    },
    {
      id: 'lab-terminal-2',
      tileX: 17,
      tileY: 11,
      textureKey: 'sign-post',
      facing: 'down',
      dialogue: [
        'Another terminal, still logged in...',
        '"Director Aldric demands accelerated timelines."',
        '"Dr. Vex protests — says the Pokemon can\'t handle more."',
        '"Overruled. The Convergence must proceed."',
      ],
    },
    {
      id: 'caged-pokemon-f2',
      tileX: 2,
      tileY: 2,
      textureKey: 'sign-post',
      facing: 'down',
      dialogue: [
        'Pokemon are locked in containment pods...',
        'They\'re surrounded by swirling aether energy.',
        'Their cries echo through the sterile lab.',
        'You have to stop this.',
      ],
    },
  ],
  trainers: [
    {
      id: 'spire-grunt-f2-1',
      name: 'Synthesis Elite',
      trainerId: 'synth-elite-f2-1',
      tileX: 4,
      tileY: 13,
      textureKey: 'npc-grunt',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'spire-grunt-f2-2',
      name: 'Synthesis Elite',
      trainerId: 'synth-elite-f2-2',
      tileX: 15,
      tileY: 9,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 4,
    },
    // Dr. Vex boss battle #3
    {
      id: 'spire-vex',
      name: 'Admin Vex',
      trainerId: 'admin-vex-3',
      tileX: 10,
      tileY: 5,
      textureKey: 'npc-vex',
      facing: 'down',
      lineOfSight: 5,
    },
  ],
  warps: [
    // South entrance → F1
    { tileX: 9, tileY: 19, targetMap: 'abyssal-spire-f1', targetSpawnId: 'default' },
    { tileX: 10, tileY: 19, targetMap: 'abyssal-spire-f1', targetSpawnId: 'default' },
    // North stairs → F3
    { tileX: 9, tileY: 0, targetMap: 'abyssal-spire-f3', targetSpawnId: 'from-f2' },
    { tileX: 10, tileY: 0, targetMap: 'abyssal-spire-f3', targetSpawnId: 'from-f2' },
  ],
  spawnPoints: {
    'default': { x: 10, y: 18, direction: 'up' },
    'from-f1': { x: 10, y: 18, direction: 'up' },
  },
};
