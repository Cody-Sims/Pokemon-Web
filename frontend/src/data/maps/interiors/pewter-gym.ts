import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 01234567890123
  '##############', // 0  - north wall
  '#w____uu____w#', // 1  - rock floor arena
  '#_uuuuQuuuuuu#', // 2  - arena markings
  '#_uuuuuuuu_uu#', // 3
  '#_uuuuQuuuuuu#', // 4
  '#zuuuuuuuuuz_#', // 5  - statues
  '#_uuuuuuuuuu_#', // 6
  '#_uuuuQuuuuuu#', // 7
  '#_uuuuuuuu_uu#', // 8
  '#zuuuqquuuuz_#', // 9  - statues + boulders
  '#_uuuuuuuuuu_#', // 10
  '#______v_____#', // 11 - exit mat
]);

export const pewterGym: MapDefinition = {
  key: 'pewter-gym',
  width: 14,
  height: 12,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Pewter City Gym',
  npcs: [
    {
      id: 'pewter-gym-guide-inside',
      tileX: 3,
      tileY: 10,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'This is the Pewter City Gym!',
        'The leader Brock uses Rock-type Pokémon.',
        'Water and Grass moves are super effective!',
      ],
      flagDialogue: [
        {
          flag: 'defeatedBrock',
          dialogue: [
            'You beat Brock! Amazing!',
            'The Boulder Badge is proof of your strength!',
          ],
        },
      ],
    },
  ],
  trainers: [
    {
      id: 'pewter-gym-camper',
      trainerId: 'camper-3',
      tileX: 4,
      tileY: 8,
      textureKey: 'npc-male-1',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'pewter-gym-brock-inside',
      trainerId: 'gym-brock',
      tileX: 7,
      tileY: 2,
      textureKey: 'npc-hiker',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  warps: [
    { tileX: 7, tileY: 11, targetMap: 'pewter-city', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 10, direction: 'up' },
  },
};
