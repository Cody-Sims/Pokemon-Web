import { MapDefinition, parseMap } from '../shared';

// Verdantia Underground Lab — Mini-dungeon (15 wide × 18 tall)
// Hidden Synthesis lab beneath Verdantia Village tree roots.
// Discovered after defeating Gym 4 (Ivy). Roots and vines clash with lab equipment.
const labGround = parseMap([
  'ĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦ', // 0
  'ĦŦŦŦŦĦ£,,£ĦŊŦŦĦ', // 1  north chamber: containment pods
  'ĦŦƫŦŦĦ£,,£ĦŦŦŦĦ', // 2  terminal
  'ĦŦŦŦŦĦ,¡¡,ĦŦƫŦĦ', // 3  vine corridor + terminal
  'ĦŦŦŦŦĐ,,,,ĐŦŦŦĦ', // 4  synthesis doors connect chambers
  'ĦĦĦĐĦĦĦĦĦĦĦĐĦĦĦ', // 5  wall with doors
  'Ħ£¡,,,,¡£,,,,¡Ħ', // 6  root-covered corridor
  'Ħ£,,,,,,,,,,,,Ħ', // 7
  'ĦĦĦĐĦĦĦĦĦĦĦĐĦĦĦ', // 8  wall with doors
  'ĦŦŦŦŦĐ,,,,ĐŦŦŦĦ', // 9  synthesis doors
  'ĦŦŊŦŦĦ,¡¡,ĦŦŦŊĦ', // 10 containment pods + vines
  'ĦŦŦƫŦĦ£,,£ĦŦƫŦĦ', // 11 terminals
  'ĦŦŦŦŦĦ£,,£ĦŦŦŦĦ', // 12
  'ĦĦĦĦĦĦ£,,£ĦĦĦĦĦ', // 13
  ';;;£,,,,,,,,£;;', // 14 cave transition to exit
  ';;;£,,,,,,,,£;¡', // 15
  ';;;;;;,,,,;;;;;', // 16
  ';;;;;;,,,,;;;;;', // 17 south exit (stairs up)
]);

export const verdantiaLab: MapDefinition = {
  key: 'verdantia-lab',
  width: 15,
  height: 18,
  ground: labGround,
  encounterTableKey: 'verdantia-lab',
  battleBg: 'bg-cave',
  displayName: 'Verdantia Underground Lab',
  npcs: [
    {
      id: 'lab-terminal-1',
      tileX: 2,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A Synthesis Collective data terminal...',
        'Log Entry 47: Aether infusion into plant-type subjects shows promise.',
        'The root network beneath this village is ideal for siphoning.',
      ],
    },
    {
      id: 'lab-terminal-2',
      tileX: 12,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A Synthesis Collective research terminal...',
        'Log Entry 113: Subject V-07 exhibiting unstable Aether mutations.',
        'Director has ordered containment protocols. Proceed with caution.',
      ],
    },
    {
      id: 'lab-terminal-3',
      tileX: 3,
      tileY: 11,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'A heavily encrypted terminal...',
        'Fragment: "...Solatheon\'s seal weakens as we harvest more Aether..."',
        'Fragment: "...the Director believes the Guardian can be controlled..."',
      ],
      setsFlag: 'found_lab_terminal_solatheon',
    },
  ],
  trainers: [
    {
      id: 'lab-grunt-1',
      trainerId: 'synth-grunt-verdantia-1',
      tileX: 3,
      tileY: 4,
      textureKey: 'npc-grunt',
      facing: 'down',
      lineOfSight: 3,
    },
    {
      id: 'lab-grunt-2',
      trainerId: 'synth-grunt-verdantia-2',
      tileX: 7,
      tileY: 7,
      textureKey: 'npc-grunt',
      facing: 'up',
      lineOfSight: 4,
    },
    {
      id: 'lab-grunt-3',
      trainerId: 'synth-grunt-verdantia-3',
      tileX: 11,
      tileY: 9,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  warps: [
    // South exit → Verdantia Village
    { tileX: 6, tileY: 17, targetMap: 'verdantia-village', targetSpawnId: 'from-verdantia-lab' },
    { tileX: 7, tileY: 17, targetMap: 'verdantia-village', targetSpawnId: 'from-verdantia-lab' },
    { tileX: 8, tileY: 17, targetMap: 'verdantia-village', targetSpawnId: 'from-verdantia-lab' },
    { tileX: 9, tileY: 17, targetMap: 'verdantia-village', targetSpawnId: 'from-verdantia-lab' },
  ],
  spawnPoints: {
    'default':                { x: 7, y: 16, direction: 'up' },
    'from-verdantia-village': { x: 7, y: 16, direction: 'up' },
  },
};
