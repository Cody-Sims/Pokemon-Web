import { MapDefinition, parseMap } from '../shared';

// Cinderfall Gym — Fire type, Leader: Solara
// Puzzle: ash ground, ember vents, hot springs, lava rock
const ground = parseMap([
  'ÞÞÞÞÞÞÞÞÞÞÞÞ', // 0 - volcanic walls
  'Þw««««««««wÞ', // 1 - ash ground
  'Þ««»«««»«««Þ', // 2 - ember vents flanking
  'Þ««««««««««Þ', // 3
  'Þ«Ø«µ««µ«Ø«Þ', // 4 - lava rock + magma cracks
  'Þ««««««««««Þ', // 5
  'Þ«»«««««»««Þ', // 6 - ember vents
  'Þ««««««««««Þ', // 7
  'Þ«Ø«µ««µ«Ø«Þ', // 8 - lava rock + magma cracks
  'Þ««««««««««Þ', // 9
  'Þ«±±««««±±«Þ', // 10 - hot spring pools
  'Þ««««««««««Þ', // 11
  'Þ««««««««««Þ', // 12
  'ÞÞÞÞ«vv«ÞÞÞÞ', // 13 - exit
]);

export const cinderfallGym: MapDefinition = {
  key: 'cinderfall-gym',
  width: 12,
  height: 14,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Cinderfall Gym',
  battleBg: 'bg-gym-fire',
  npcs: [
    {
      id: 'cinderfall-gym-guide',
      name: 'Gym Guide',
      tileX: 3,
      tileY: 11,
      textureKey: 'npc-male-1',
      facing: 'up',
      dialogue: [
        'Solara\'s fire burns hot!',
        'Water, Ground, and Rock moves are super effective.',
      ],
      flagDialogue: [
        {
          flag: 'defeatedSolara',
          dialogue: [
            'You survived the heat! The Ember Badge is yours!',
          ],
        },
      ],
      behavior: { type: 'look-around' },
    },
  ],
  trainers: [
    { id: 'cinderfall-gym-leader', name: 'Solara', trainerId: 'gym-solara', tileX: 6, tileY: 2, textureKey: 'npc-gym-solara', facing: 'down', lineOfSight: 6 },
    { id: 'cinderfall-trainer-1', name: 'Kindler', trainerId: 'kindler-cinderfall-1', tileX: 3, tileY: 5, textureKey: 'npc-hiker', facing: 'right', lineOfSight: 3 },
    { id: 'cinderfall-trainer-2', name: 'Kindler', trainerId: 'kindler-cinderfall-2', tileX: 9, tileY: 8, textureKey: 'npc-ace-trainer-f', facing: 'left', lineOfSight: 3 },
  ],
  objects: [],
  warps: [
    { tileX: 5, tileY: 13, targetMap: 'cinderfall-town', targetSpawnId: 'from-gym' },
    { tileX: 6, tileY: 13, targetMap: 'cinderfall-town', targetSpawnId: 'from-gym' },
  ],
  spawnPoints: { 'default': { x: 5, y: 12, direction: 'up' } },
};
