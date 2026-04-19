import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  '##############', // 0
  '#wuuuuuuuuuuw#', // 1
  '#uQQQuuuQQQuu#', // 2 - arena marks
  '#uuuuuuuuuuuu#', // 3
  '#uuuuuuuuuuuu#', // 4
  '#uQQuuuuuQQuu#', // 5 - arena marks
  '#uuuuuuuuuuuu#', // 6
  '#uquu____uuqu#', // 7 - boulders + floor path
  '#uu___zz___uu#', // 8 - statues
  '#uuuuuuuuuuuu#', // 9
  '#uuuuuuuuuuuu#', // 10
  '######vv######', // 11 - exit
]);

export const viridianGym: MapDefinition = {
  key: 'viridian-gym',
  width: 14,
  height: 12,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Viridian City Gym',
  npcs: [
    {
      id: 'viridian-gym-guide',
      tileX: 3,
      tileY: 9,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'This is the final Gym in the Aurum League!',
        'The Leader uses Ground-type Pokémon.',
        'Water, Grass, and Ice moves will carry you!',
      ],
      flagDialogue: [
        {
          flag: 'defeatedGiovanni',
          dialogue: [
            'You did it! The Earth Badge is yours!',
            'You can now challenge the Pokémon League!',
          ],
        },
      ],
      behavior: { type: 'look-around' },
    },
  ],
  trainers: [
    { id: 'viridian-gym-leader', trainerId: 'gym-giovanni', tileX: 7, tileY: 2, textureKey: 'generic-trainer', facing: 'down', lineOfSight: 4 },
    {
      id: 'viridian-trainer-1',
      trainerId: 'cooltrainer-viridian-1',
      tileX: 4,
      tileY: 5,
      textureKey: 'npc-ace-trainer',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'viridian-trainer-2',
      trainerId: 'cooltrainer-viridian-2',
      tileX: 10,
      tileY: 5,
      textureKey: 'npc-ace-trainer-f',
      facing: 'left',
      lineOfSight: 3,
    },
  ],
  warps: [
    { tileX: 6, tileY: 11, targetMap: 'viridian-city', targetSpawnId: 'from-gym' },
    { tileX: 7, tileY: 11, targetMap: 'viridian-city', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 10, direction: 'up' },
  },
};
