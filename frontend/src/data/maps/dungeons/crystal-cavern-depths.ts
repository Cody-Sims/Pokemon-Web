import { MapDefinition, parseMap } from '../shared';

// Crystal Cavern Depths — Post-game deeper level of Crystal Cavern.
// Higher-level encounters, Marina encounter 4 placement.
const depthsGround = parseMap([
  ';;;;;;;;;;;;;;;;;;;;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,÷÷÷,,,,,,,,,,÷÷÷,;',
  ';,÷÷÷,,,,,,,,,,÷÷÷,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,÷÷÷÷÷÷÷÷÷÷,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;;;;;,,,,,,,,;;;;;;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,÷,,,,,,,,,,,,,,÷,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,q,,,,,,,,q,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,÷÷÷÷÷÷,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,q,,,,,,,,,,,,q,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;;;;;,,,,,,,,;;;;;;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,÷,,,,,,,,,,,,,,÷,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,q,,÷÷,,,,q,,,,;',
  ';,,,,,,÷÷÷÷,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;,,,,,,,,,,,,,,,,;;',
  ';,,,÷,,,,,,,,,,÷,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';,,,,,,,,,,,,,,,,,,;',
  ';;;;;;,,,,,,,,;;;;;;',
]);

export const crystalCavernDepths: MapDefinition = {
  key: 'crystal-cavern-depths', width: 20, height: 30, ground: depthsGround,
  encounterTableKey: 'crystal-cavern-depths', battleBg: 'bg-cave',
  displayName: 'Crystal Cavern — Depths',
  isDark: true,
  lightSources: [
    { tileX: 10, tileY: 5, radius: 72 },
    { tileX: 10, tileY: 13, radius: 64 },
    { tileX: 10, tileY: 22, radius: 64 },
  ],
  npcs: [
    { id: 'depths-sign', tileX: 10, tileY: 28, textureKey: 'generic-trainer', facing: 'up',
      dialogue: ['The crystals pulse with an eerie blue light...', 'The air is thick with Aether energy.'] },
    { id: 'depths-item-1', tileX: 3, tileY: 3, textureKey: 'generic-trainer', facing: 'down',
      dialogue: ['You found a Max Revive!'],
      requireFlag: '!crystalDepthsItem1', setsFlag: 'crystalDepthsItem1' },
    { id: 'depths-item-2', tileX: 16, tileY: 20, textureKey: 'generic-trainer', facing: 'down',
      dialogue: ['You found a Rare Candy!'],
      requireFlag: '!crystalDepthsItem2', setsFlag: 'crystalDepthsItem2' },
    // ─── Noctharion encounter in the deepest chamber ───
    { id: 'noctharion-depths', tileX: 10, tileY: 22, textureKey: 'generic-trainer', facing: 'down',
      requireFlag: '!noctharion_caught',
      dialogue: [
        'A chilling darkness coalesces before you...',
        'The shadow given form stares with hollow eyes!',
      ],
      interactionType: 'wild-encounter',
      interactionData: '153' },
  ],
  trainers: [
    { id: 'depths-hiker-1', trainerId: 'hiker-5', tileX: 14, tileY: 11, textureKey: 'npc-hiker', facing: 'left', lineOfSight: 3 },
    { id: 'depths-hiker-2', trainerId: 'hiker-5', tileX: 5, tileY: 15, textureKey: 'npc-hiker', facing: 'right', lineOfSight: 3 },
    { id: 'depths-marina-4', trainerId: 'marina-4', tileX: 10, tileY: 5, textureKey: 'npc-marina', facing: 'down', lineOfSight: 5,
      condition: '!marina-4' },
  ],
  warps: [
    // South exit → Crystal Cavern main floor
    { tileX: 8, tileY: 29, targetMap: 'crystal-cavern', targetSpawnId: 'from-depths' },
    { tileX: 9, tileY: 29, targetMap: 'crystal-cavern', targetSpawnId: 'from-depths' },
    { tileX: 10, tileY: 29, targetMap: 'crystal-cavern', targetSpawnId: 'from-depths' },
    { tileX: 11, tileY: 29, targetMap: 'crystal-cavern', targetSpawnId: 'from-depths' },
  ],
  spawnPoints: {
    'default': { x: 10, y: 28, direction: 'up' },
    'from-crystal-cavern': { x: 10, y: 28, direction: 'up' },
  },
};
