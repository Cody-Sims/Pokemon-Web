import { MapDefinition, parseMap } from '../shared';

// Abyssal Spire — Floor 1: The Breach
// Ancient temple being repurposed by the Synthesis Collective
// Mix of ruins transitioning to Synthesis lab infrastructure
const spireF1Ground = parseMap([
  '®®®®®®®®®‡‡®®®®®®®®®', // 0
  '®‡‡‡‡®®ĦŦŦŦŦĦĦ®‡‡‡‡®', // 1
  '®‡°°‡®®ĦŦŦŦŦŦĦĦĦŧŦŦ®', // 2
  '®‡°°‡‡‡ĦŦŦŦŦŦŦĦ‡‡ŦŦ®', // 3
  '®‡‡‡‡‡‡ĐŦŦŦŦŦŦĐ‡‡‡‡®', // 4
  '®®®Đ®®®ĦĦĦĦĦĦĦĦ®®Đ®®', // 5
  '®‡‡‡‡®®®®®®®®®®‡‡‡‡®', // 6
  '®‡‡©‡‡‡‡‡‡‡‡‡‡‡‡©‡‡®', // 7
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 8
  '®‡‡‡‡©‡‡‡‡‡‡‡‡©‡‡‡‡®', // 9
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 10
  '®‡‡‡‡‡‡‡©‡‡©‡‡‡‡‡‡‡®', // 11
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 12
  '®‡‡©‡‡‡‡‡‡‡‡‡‡‡‡©‡‡®', // 13
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 14
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 15
  '®‡‡°°‡‡‡‡‡‡‡‡‡‡°°‡‡®', // 16
  '®‡‡°°°‡‡‡‡‡‡‡‡°°°‡‡®', // 17
  '®®®®®®®®‡‡‡‡®®®®®®®®', // 18
  '®®®®®®®®‡‡‡‡®®®®®®®®', // 19
]);

export const abyssalSpireF1: MapDefinition = {
  key: 'abyssal-spire-f1',
  width: 20,
  height: 20,
  ground: spireF1Ground,
  encounterTableKey: 'abyssal-spire',
  battleBg: 'bg-cave',
  displayName: 'Abyssal Spire — Entrance',
  npcs: [
    {
      id: 'spire-entrance-sign',
      tileX: 11,
      tileY: 18,
      textureKey: 'generic-trainer',
      facing: 'up',
      dialogue: ['ABYSSAL SPIRE', 'Ancient warnings are carved into the stone...', '"Turn back. The abyss consumes all."'],
    },
    {
      id: 'rook-partner-f1',
      tileX: 8,
      tileY: 16,
      textureKey: 'npc-rook',
      facing: 'up',
      dialogue: [
        'Rook: This is it. The Synthesis Collective\'s headquarters.',
        'Rook: They\'ve built their lab inside an ancient temple.',
        'Rook: Stay sharp — their elite forces guard this place.',
        'Rook: I\'ll scout ahead. Meet me on the upper floors.',
      ],
    },
  ],
  trainers: [
    {
      id: 'spire-grunt-f1-1',
      trainerId: 'synth-elite-f1-1',
      tileX: 5,
      tileY: 9,
      textureKey: 'npc-grunt',
      facing: 'right',
      lineOfSight: 4,
    },
    {
      id: 'spire-grunt-f1-2',
      trainerId: 'synth-elite-f1-2',
      tileX: 14,
      tileY: 12,
      textureKey: 'npc-grunt',
      facing: 'left',
      lineOfSight: 4,
    },
  ],
  warps: [
    // South entrance → Route 8
    { tileX: 9, tileY: 19, targetMap: 'route-8', targetSpawnId: 'from-abyssal-spire' },
    { tileX: 10, tileY: 19, targetMap: 'route-8', targetSpawnId: 'from-abyssal-spire' },
    // North stairs → F2
    { tileX: 9, tileY: 0, targetMap: 'abyssal-spire-f2', targetSpawnId: 'from-f1' },
    { tileX: 10, tileY: 0, targetMap: 'abyssal-spire-f2', targetSpawnId: 'from-f1' },
  ],
  spawnPoints: {
    'default':      { x: 10, y: 18, direction: 'up' },
    'from-route-8': { x: 10, y: 18, direction: 'up' },
  },
};
