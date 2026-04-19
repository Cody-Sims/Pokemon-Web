import { MapDefinition, parseMap } from '../shared';

// Voltara Gym — Electric type, Leader: Blitz
// Puzzle: circuit routing through narrow conduit corridors
const ground = parseMap([
  'ƜƜƜƜƜƜƜƜƜƜƜƜ', // 0 - metal walls
  'Ɯw§§§§§§§§wƯ', // 1 - wire floor
  'Ɯ§¦§§§§§¦§§Ɯ', // 2 - electric panels flanking
  'Ɯ§§§§§§§§§§Ɯ', // 3
  'Ɯ§§ƯƯ§§ƯƯ§§Ɯ', // 4 - metal wall barriers
  'Ɯ¥¥¥¥§§¥¥¥¥Ɯ', // 5 - conduit paths
  'Ɯ§§§§§§§§§§Ɯ', // 6
  'Ɯ§¦§§§§§§¦§Ɯ', // 7 - panels
  'Ɯ§§ƯƯ§§ƯƯ§§Ɯ', // 8 - more barriers
  'Ɯ¥¥¥¥§§¥¥¥¥Ɯ', // 9 - conduit paths
  'Ɯ§§§§§§§§§§Ɯ', // 10
  'Ɯ§§§§§§§§§§Ɯ', // 11
  'Ɯ§§§§§§§§§§Ɯ', // 12
  'ƜƜƜƜ_vv_ƜƜƜƜ', // 13 - exit with floor tiles
]);

export const voltaraGym: MapDefinition = {
  key: 'voltara-gym',
  width: 12,
  height: 14,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Voltara Gym',
  battleBg: 'bg-gym-electric',
  npcs: [
    {
      id: 'voltara-gym-guide',
      tileX: 3,
      tileY: 11,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'Blitz\'s electric Pokémon are lightning fast!',
        'Ground-type moves are your safest bet.',
      ],
      flagDialogue: [
        {
          flag: 'defeatedBlitz',
          dialogue: [
            'You short-circuited Blitz\'s team! The Volt Badge is yours!',
          ],
        },
      ],
    },
  ],
  trainers: [
    { id: 'voltara-gym-leader', trainerId: 'gym-blitz', tileX: 6, tileY: 2, textureKey: 'npc-gym-blitz', facing: 'down', lineOfSight: 6 },
    { id: 'voltara-trainer-1', trainerId: 'engineer-voltara-1', tileX: 3, tileY: 5, textureKey: 'npc-scientist', facing: 'right', lineOfSight: 3 },
    { id: 'voltara-trainer-2', trainerId: 'engineer-voltara-2', tileX: 9, tileY: 8, textureKey: 'npc-scientist', facing: 'left', lineOfSight: 3 },
  ],
  warps: [
    { tileX: 5, tileY: 13, targetMap: 'voltara-city', targetSpawnId: 'from-gym' },
    { tileX: 6, tileY: 13, targetMap: 'voltara-city', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 5, y: 12, direction: 'up' } },
};
