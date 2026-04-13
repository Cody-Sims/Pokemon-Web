import { MapDefinition, parseMap } from './shared';

// Crystal Cavern — Optional dungeon off Route 2
// Multi-floor cave with rock/ground encounters, boulder puzzles
// Width: 20, Height: 30
const floor1Ground = parseMap([
  ';;;;;;;;;;;;;;;;;;;;', // 0
  ';,,,,,,;;,,,,,,,,,,;', // 1
  ';,,q,,,;;,,,,,q,,,,;', // 2
  ';,,,,,,,,,,,,,,,,,;;', // 3
  ';,,,,,,,,,,,,,,,,,,;', // 4
  ';,,,q,,,,,,,,,q,,,,;', // 5
  ';,,,,,,;;;;;;,,,,,,;', // 6
  ';,,,,,,;;;;;,,,,,,,;', // 7
  ';,,,,,,,,,,,,,,,,,,;', // 8
  ';;,,,,,,,,,,,,,,,,,;', // 9
  ';;,,q,,,,,,,,,q,,,,;', // 10
  ';,,,,,,,,,,,,,,,,,,;', // 11
  ';,,,,,,,,;;,,,,,,,,;', // 12
  ';,,,,q,,,;;,,,,q,,,;', // 13
  ';,,,,,,,,;;,,,,,,,,;', // 14
  ';,,,,,,,,,,,,,,,,,,;', // 15
  ';,,,,,,,,,,,,,,,,,,;', // 16
  ';,,,q,,,,,,,,,,q,,,;', // 17
  ';;,,,,,,,,,,,,,,,,;;', // 18
  ';;,,,,,,;;,,,,,,,,;;', // 19
  ';,,,,,,,,,,,,,,,,,,;', // 20
  ';,,q,,,,,,,,,,,q,,,;', // 21
  ';,,,,,,,,,,,,,,,,,,;', // 22
  ';,,,,,,,,,,,,,,,,,,;', // 23
  ';,,,,,,,,,,,,,,,,,,;', // 24
  ';;,,,,,,,,,,,,,,,,;;', // 25
  ';;,,,,,,,,,,,,,,,,;;', // 26
  ';,,,,,,,,,,,,,,,,,,;', // 27
  ';,,,,,,,,,,,,,,,,,,;', // 28
  ';;;;;;;;,,,,;;;;;;;;', // 29 entrance
]);

export const crystalCavern: MapDefinition = {
  key: 'crystal-cavern',
  width: 20,
  height: 30,
  ground: floor1Ground,
  encounterTableKey: 'crystal-cavern',
  displayName: 'Crystal Cavern',
  npcs: [
    {
      id: 'cavern-sign',
      tileX: 10,
      tileY: 28,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['CRYSTAL CAVERN', 'Danger! Strong Pokémon inside!'],
    },
    {
      id: 'cavern-hiker',
      tileX: 14,
      tileY: 4,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'This cave goes deep... I heard there\'s a rare Pokémon',
        'lurking somewhere in the darkness.',
        'Be careful of the boulders — some paths are blocked.',
      ],
    },
    {
      id: 'cavern-item-1',
      tileX: 3,
      tileY: 13,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['You found a Revive!'],
      requireFlag: '!crystalCavernItem1',
      setsFlag: 'crystalCavernItem1',
    },
    {
      id: 'cavern-item-2',
      tileX: 16,
      tileY: 21,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['You found an Escape Rope!'],
      requireFlag: '!crystalCavernItem2',
      setsFlag: 'crystalCavernItem2',
    },
  ],
  trainers: [
    {
      id: 'cavern-hiker-1',
      trainerId: 'hiker-1',
      tileX: 5,
      tileY: 8,
      textureKey: 'generic-trainer',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'cavern-hiker-2',
      trainerId: 'hiker-2',
      tileX: 14,
      tileY: 15,
      textureKey: 'generic-trainer',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'cavern-hiker-3',
      trainerId: 'hiker-3',
      tileX: 8,
      tileY: 22,
      textureKey: 'generic-trainer',
      facing: 'up',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Route 2
    { tileX: 8, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 9, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 10, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 11, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
  ],
  spawnPoints: {
    'default':      { x: 10, y: 28, direction: 'up' },
    'from-route-2': { x: 10, y: 28, direction: 'up' },
  },
};
