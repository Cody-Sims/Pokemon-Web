import { MapDefinition, parseMap } from '../shared';

const centerGround = parseMap([
  '#########',
  '#w#OOO#w#',
  '#OOOKOO#O',
  '#OOOOOOO#',
  '#OOOOOOO#',
  '#OOOOOOO#',
  '#OOpOOhO#',
  '#OOvvvOO#',
]);

export const coralPokecenter: MapDefinition = {
  key: 'coral-pokecenter',
  width: 9,
  height: 8,
  ground: centerGround,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Coral Harbor Pokémon Center',
  npcs: [
    {
      id: 'coral-center-nurse',
      name: 'Nurse Joy',
      tileX: 4,
      tileY: 2,
      textureKey: 'npc-nurse',
      facing: 'down',
      dialogue: ['Welcome to the Pokémon Center!', 'We\'ll restore your Pokémon to full health!'],
      interactionType: 'heal',
    },
  ],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 3, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokecenter' },
    { tileX: 4, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokecenter' },
    { tileX: 5, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-pokecenter' },
  ],
  spawnPoints: {
    'default': { x: 4, y: 6, direction: 'up' },
  },
};
