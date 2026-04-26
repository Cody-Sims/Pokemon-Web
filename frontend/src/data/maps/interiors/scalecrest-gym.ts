import { MapDefinition, parseMap } from '../shared';

// Scalecrest Gym — Dragon type, Leader: Drake
// Puzzle: fortress stone, dragon statues, scale floors
const ground = parseMap([
  'ÆÆÆÆÆÆÆÆÆÆÆÆ', // 0 - fortress walls
  'ÆwÐÐÐÐÐÐÐÐwÆ', // 1 - dragon scale floor
  'ÆÐðÐÐÐÐÐÐðÐÆ', // 2 - dragon statues flanking leader
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 3
  'ÆÐÐÐÆÆÆÐÐÐÐÆ', // 4 - fortress wall barriers
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 5
  'ÆÐðÐÐÐÐÐÐðÐÆ', // 6 - dragon statues
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 7
  'ÆÐÐÐÆÆÆÐÐÐÐÆ', // 8 - more fortress barriers
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 9
  'ÆÐðÐÐÐÐÐÐðÐÆ', // 10 - dragon statues
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 11
  'ÆÐÐÐÐÐÐÐÐÐÐÆ', // 12
  'ÆÆÆÆ_vv_ÆÆÆÆ', // 13 - exit with floor tiles
]);

export const scalecrestGym: MapDefinition = {
  key: 'scalecrest-gym',
  width: 12,
  height: 14,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Scalecrest Gym',
  battleBg: 'bg-gym-dragon',
  npcs: [
    {
      id: 'scalecrest-gym-guide',
      name: 'Gym Guide',
      tileX: 3,
      tileY: 11,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'Drake\'s dragons are fearsome!',
        'Ice, Dragon, and Fairy moves work best.',
      ],
      flagDialogue: [
        {
          flag: 'defeatedDrake',
          dialogue: [
            'You conquered the dragon! The Scale Badge is yours!',
          ],
        },
      ],
      behavior: { type: 'look-around' },
    },
  ],
  trainers: [
    { id: 'scalecrest-gym-leader', name: 'Drake', trainerId: 'gym-drake', tileX: 6, tileY: 2, textureKey: 'npc-male-3', facing: 'down', lineOfSight: 6 },
    { id: 'scalecrest-trainer-1', name: 'Ace Trainer', trainerId: 'ace-scalecrest-1', tileX: 3, tileY: 5, textureKey: 'npc-ace-trainer', facing: 'right', lineOfSight: 3 },
    { id: 'scalecrest-trainer-2', name: 'Ace Trainer', trainerId: 'ace-scalecrest-2', tileX: 9, tileY: 9, textureKey: 'npc-ace-trainer-f', facing: 'left', lineOfSight: 3 },
  ],
  warps: [
    { tileX: 5, tileY: 13, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-gym' },
    { tileX: 6, tileY: 13, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 5, y: 12, direction: 'up' } },
};
