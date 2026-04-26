import { MapDefinition, parseMap } from '../shared';

// Wraithmoor Gym — Ghost type, Leader: Morwen
// Puzzle: darkness & graves with mist-filled corridors
const ground = parseMap([
  '############', // 0
  '#w°°°°°°°°w#', // 1 - mist-filled
  '#°°†°°°°†°°#', // 2 - graves
  '#°°°°°°°°°°#', // 3
  '#°†°°##°°†°#', // 4 - graves + wall pillars
  '#°°°°##°°°°#', // 5 - split path around pillars
  '#°°°°°°°°°°#', // 6
  '#°†°°°°°°†°#', // 7 - graves
  '#°°°°°°°°°°#', // 8
  '#°°##°°##°°#', // 9 - more pillars
  '#°°°°°°°°°°#', // 10
  '#°°°°°°°°°°#', // 11
  '#°°°°°°°°°°#', // 12
  '####°vv°####', // 13 - exit
]);

export const wraithmoorGym: MapDefinition = {
  key: 'wraithmoor-gym',
  width: 12,
  height: 14,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Wraithmoor Gym',
  battleBg: 'bg-gym-ghost',
  npcs: [
    {
      id: 'wraithmoor-gym-guide',
      name: 'Gym Guide',
      tileX: 3,
      tileY: 11,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'Morwen\'s ghosts slip through walls...',
        'Ghost types are weak to Ghost and Dark moves!',
      ],
      flagDialogue: [
        {
          flag: 'defeatedMorwen',
          dialogue: [
            'You braved the mist! The Phantom Badge is yours!',
          ],
        },
      ],
      behavior: { type: 'look-around' },
    },
  ],
  trainers: [
    { id: 'wraithmoor-gym-leader', name: 'Morwen', trainerId: 'gym-morwen', tileX: 6, tileY: 2, textureKey: 'npc-female-2', facing: 'down', lineOfSight: 6 },
    { id: 'wraithmoor-trainer-1', name: 'Medium', trainerId: 'medium-wraithmoor-1', tileX: 3, tileY: 4, textureKey: 'npc-psychic', facing: 'right', lineOfSight: 3 },
    { id: 'wraithmoor-trainer-2', name: 'Medium', trainerId: 'medium-wraithmoor-2', tileX: 9, tileY: 9, textureKey: 'npc-psychic', facing: 'left', lineOfSight: 3 },
  ],
  objects: [],
  warps: [
    { tileX: 5, tileY: 13, targetMap: 'wraithmoor-town', targetSpawnId: 'from-gym' },
    { tileX: 6, tileY: 13, targetMap: 'wraithmoor-town', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 5, y: 12, direction: 'up' } },
};
