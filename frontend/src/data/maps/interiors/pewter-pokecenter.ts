import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 0123456789012
  '#############', // 0 - north wall
  '#w_________w#', // 1 - windows
  '#OKKKhKKK_Op#', // 2 - pink counter + heal machine + PC
  '#OOOOOOOOOOO#', // 3 - center floor
  '#OOOOOOOOOOO#', // 4
  '#OOt_____tOO#', // 5 - benches/tables
  '#OOi_____iOO#', // 6 - chairs
  '#_____v_____#', // 7 - exit mat
]);

export const pewterPokecenter: MapDefinition = {
  key: 'pewter-pokecenter',
  width: 13,
  height: 8,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Pokémon Center',
  npcs: [
    {
      id: 'pewter-nurse-inside',
      name: 'Nurse Joy',
      tileX: 5,
      tileY: 1,
      textureKey: 'npc-nurse',
      facing: 'down',
      dialogue: [
        'Welcome to the Pokémon Center!',
        'Let me heal your Pokémon!',
      ],
      interactionType: 'heal',
    },
    {
      id: 'pewter-center-npc',
      name: 'Townsperson',
      tileX: 9,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'left',
      behavior: { type: 'look-around' },
      dialogue: [
        "Brock's Gym is tough!",
        'Make sure your Pokémon are healed before going!',
      ],
    },
    {
      id: 'pewter-pc',
      tileX: 11,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      behavior: { type: 'look-around' },
      dialogue: [
        'Someone\'s PC is booted up.',
        'Access the Pokémon Storage System?',
      ],
      interactionType: 'pc',
    },
  ],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 6, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: {
    'default': { x: 6, y: 6, direction: 'up' },
  },
};
