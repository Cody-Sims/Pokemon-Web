import { MapDefinition, parseMap } from './shared';

const ground = parseMap([
  // 01234567890123
  '##############', // 0  - north wall
  '#w____yy____w#', // 1  - gym floor
  '#_yyyy_yyyyyy#', // 2
  '#_yyyyyyy_yyy#', // 3
  '#_yyyy_yyyyyy#', // 4
  '#zyyyyyyyyyz_#', // 5  - statues
  '#_yyyyyyyyyy_#', // 6
  '#_yyyy_yyyyyy#', // 7
  '#_yyyyyyy_yyy#', // 8
  '#zyyyyyyyyyz_#', // 9  - statues
  '#_yyyyyyyyyy_#', // 10
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
      textureKey: 'generic-trainer',
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
      id: 'pewter-gym-brock-inside',
      trainerId: 'gym-brock',
      tileX: 7,
      tileY: 2,
      textureKey: 'generic-trainer',
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
