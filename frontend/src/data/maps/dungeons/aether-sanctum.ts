import { MapDefinition, parseMap } from '../shared';

// Aether Sanctum — Post-game dungeon. Site of ancient Aether convergence.
// Where Kael encounter 6 takes place. High-level wild Pokémon.
const sanctumGround = parseMap([
  'ĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦƉƉŦŦŦŦŦŦŦŦŦŦŦŦƉƉŦĦ',
  'ĦŦƉƉŦŦŦŦŦŦŦŦŦŦŦŦƉƉŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŊŦŦŦŦŦŦŦŦŊŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦĦĦĦŦŦŦŦŦŦŦŦŦŦŦŦĦĦĦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦƉŦŦŦŦŦŦŦŦŦŦƉŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦƉƉƉƉƉƉŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦĦĦĦŦŦŦŦŦŦŦŦŦŦŦŦĦĦĦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŊŦŦŊŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦƉŦŦŦŦŦŦŦŦŦŦƉŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦĦĦĦĦĦĦĦŦŦŦŦĦĦĦĦĦĦĦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ',
]);

export const aetherSanctum: MapDefinition = {
  key: 'aether-sanctum', width: 20, height: 25, ground: sanctumGround,
  encounterTableKey: 'aether-sanctum', battleBg: 'bg-synthesis',
  displayName: 'Aether Sanctum',
  isInterior: true,
  npcs: [
    { id: 'sanctum-rook', name: 'Rook', tileX: 10, tileY: 2, textureKey: 'npc-male-5', facing: 'down',
      dialogue: [
        'Rook: You made it. This place is the convergence point.',
        'Rook: All the Aether in the region flows through here.',
        'Rook: The Collective tried to harness it. They failed.',
        'Rook: But the energy remains... and so do the powerful Pokémon it attracts.',
      ],
      requireFlag: 'champion_defeated' }
  ],
  trainers: [
    { id: 'sanctum-grunt-1', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 5, tileY: 9, textureKey: 'npc-grunt', facing: 'right', lineOfSight: 4 },
    { id: 'sanctum-grunt-2', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 14, tileY: 9, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 4 },
    { id: 'sanctum-grunt-3', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 10, tileY: 17, textureKey: 'npc-grunt', facing: 'up', lineOfSight: 3 },
    { id: 'sanctum-kael-6', name: 'Kael', trainerId: 'rival-6', tileX: 10, tileY: 5, textureKey: 'rival', facing: 'down', lineOfSight: 5,
      condition: '!rival-6' },
  ],
  objects: [
    { id: 'sanctum-sign', tileX: 10, tileY: 23, textureKey: 'item-ball', objectType: 'item-ball',
      dialogue: ['The air hums with raw Aether energy...', 'Ancient runes glow along the walls.'] }
  ],
  warps: [
    // South entrance — leads back to Victory Road
    { tileX: 9, tileY: 24, targetMap: 'victory-road', targetSpawnId: 'from-sanctum' },
    { tileX: 10, tileY: 24, targetMap: 'victory-road', targetSpawnId: 'from-sanctum' },
  ],
  spawnPoints: {
    'default': { x: 10, y: 23, direction: 'up' },
    'from-victory-road': { x: 10, y: 23, direction: 'up' },
  },
};
