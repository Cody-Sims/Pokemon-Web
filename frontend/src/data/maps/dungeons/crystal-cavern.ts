import { MapDefinition, parseMap } from '../shared';

// Crystal Cavern — Optional dungeon off Route 2
// Structured cave with crystal veins, rooms, and passages
// Width: 20, Height: 30
const floor1Ground = parseMap([
  // ═══ BACK CHAMBER: crystal shrine ═══
  ';;;;;;;;;,,;;;;;;;;;', // 0  solid walls
  ';,,,,,,,,,,,,,,,,,,;', // 1
  ';,÷÷,,,,,,,,,,,,,÷÷;', // 2  crystal veins along walls
  ';,÷÷,,,,,,,,,,,,,÷÷;', // 3  thick crystal formations
  ';,,,,,,,,,,,,,,,,,,;', // 4
  ';,,,,÷÷÷÷÷÷÷÷÷÷,,,,;', // 5  crystal shrine arc
  ';,,,,,,,,,,,,,,,,,,;', // 6
  // ═══ UPPER PASSAGE: narrow squeeze ═══
  ';;;;;;,,,,,,,,;;;;;;', // 7  walls close in
  ';,,,,,,,,,,,,,,,,,,;', // 8
  ';;,,,,,,,,,,,,,,,,,;', // 9  west wall juts
  ';,,,,,,,,,,,,,,,,,;;', // 10 east wall juts
  ';,,,,,,,,,,,,,,,,,,;', // 11
  // ═══ CENTRAL CHAMBER: boulder maze ═══
  ';;;,,,,,,,,,,,,,;;;;', // 12 chamber opens
  ';,,,,q,,,,,,,,q,,,,;', // 13 sentinel boulders
  ';,,,,,,,,,,,,,,,,,,;', // 14
  ';,,q,,,,÷÷,,,,,,q,,;', // 15 boulders frame crystals
  ';,,,,,,,,÷÷,,,,,,,,;', // 16 crystal cluster center
  ';,,,,,,,,,,,,,,,,,,;', // 17
  ';,,q,,,,,,,,,,,,q,,;', // 18 boulders guard south
  ';;;,,,,,,,,,,,,,;;;;', // 19 chamber exit
  // ═══ LOWER PASSAGE: to entrance ═══
  ';,,,,,,,,,,,,,,,,,,;', // 20
  ';;,,,,,,,,,,,,,,,,;;', // 21 walls close
  ';,,,÷,,,,,,,,,,÷,,,;', // 22 crystal pair
  ';,,,,,,,,,,,,,,,,,,;', // 23
  ';;,,,,,,,,,,,,,,,,;;', // 24 walls close
  ';,,,,,,,,,,,,,,,,,,;', // 25
  // ═══ ENTRANCE HALL ═══
  ';;,,,,,,,,,,,,,,,,;;', // 26
  ';,,,,,,,,,,,,,,,,,,;', // 27
  ';,,,,,,,,,,,,,,,,,,;', // 28
  ';;;;;;,,,,,,,,;;;;;;', // 29 entrance
]);

export const crystalCavern: MapDefinition = {
  key: 'crystal-cavern',
  width: 20,
  height: 30,
  ground: floor1Ground,
  encounterTableKey: 'crystal-cavern',
  displayName: 'Crystal Cavern',
  battleBg: 'bg-cave',
  isDark: true,
  lightSources: [
    { tileX: 10, tileY: 5, radius: 80 },
    { tileX: 9, tileY: 16, radius: 64 },
    { tileX: 10, tileY: 28, radius: 72 },
  ],
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
      name: 'Hiker',
      tileX: 10,
      tileY: 8,
      textureKey: 'npc-hiker',
      facing: 'down',
      dialogue: [
        'This cave goes deep... I heard there\'s a rare Pokémon',
        'lurking somewhere in the darkness.',
        'Be careful of the boulders — some paths are blocked.',
      ],
    },
    {
      id: 'cavern-item-1',
      tileX: 4,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: ['You found a Revive!'],
      requireFlag: '!crystalCavernItem1',
      setsFlag: 'crystalCavernItem1',
    },
    {
      id: 'cavern-item-2',
      tileX: 15,
      tileY: 22,
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
      name: 'Hiker',
      trainerId: 'hiker-1',
      tileX: 10,
      tileY: 20,
      textureKey: 'npc-hiker',
      facing: 'up',
      lineOfSight: 4,
    },
    {
      id: 'cavern-hiker-2',
      name: 'Hiker',
      trainerId: 'hiker-2',
      tileX: 14,
      tileY: 14,
      textureKey: 'npc-hiker',
      facing: 'left',
      lineOfSight: 3,
    },
    {
      id: 'cavern-hiker-3',
      name: 'Hiker',
      trainerId: 'hiker-3',
      tileX: 5,
      tileY: 14,
      textureKey: 'npc-hiker',
      facing: 'right',
      lineOfSight: 3,
    },
    {
      id: 'cavern-hiker-5',
      name: 'Hiker',
      trainerId: 'hiker-5',
      tileX: 10,
      tileY: 4,
      textureKey: 'npc-hiker',
      facing: 'down',
      lineOfSight: 3,
    },
    {
      id: 'cavern-camper-2',
      name: 'Camper',
      trainerId: 'camper-2',
      tileX: 5,
      tileY: 9,
      textureKey: 'npc-male-1',
      facing: 'right',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South exit → Route 2
    { tileX: 8, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 9, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 10, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    { tileX: 11, tileY: 29, targetMap: 'route-2', targetSpawnId: 'from-cavern' },
    // North passage → Crystal Cavern Depths (post-game)
    { tileX: 9, tileY: 0, targetMap: 'crystal-cavern-depths', targetSpawnId: 'from-crystal-cavern' },
    { tileX: 10, tileY: 0, targetMap: 'crystal-cavern-depths', targetSpawnId: 'from-crystal-cavern' },
  ],
  spawnPoints: {
    'default':      { x: 10, y: 28, direction: 'up' },
    'from-route-2': { x: 10, y: 28, direction: 'up' },
    'from-depths':  { x: 10, y: 1, direction: 'down' },
  },
};
