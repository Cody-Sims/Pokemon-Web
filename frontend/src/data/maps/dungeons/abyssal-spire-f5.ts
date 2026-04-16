import { MapDefinition, parseMap } from '../shared';

// Abyssal Spire — Floor 5: The Altar
// Massive circular chamber with aether conduits and crystals
// Aldric confrontation — cutscene only, he escapes
const spireF5Ground = parseMap([
  'ĦĦĦĦĦĦĦĦĦĦĦĦĦĦĦ', // 0
  'ĦĦĦ÷ŦŦŦŦŦŦŦ÷ĦĦĦ', // 1
  'ĦĦŦŦŦƖŦŦŦƖŦŦŦĦĦ', // 2  aether conduits
  'Ħ÷ŦŦŦŦŦŦŦŦŦŦŦ÷Ħ', // 3
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 4
  'ĦŦƉŦŦŦŦŦŦŦŦŦƉŦĦ', // 5  conduit ring
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 6
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 7  center — Aldric stands here
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 8
  'ĦŦƉŦŦŦŦŦŦŦŦŦƉŦĦ', // 9  conduit ring
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 10
  'Ħ÷ŦŦŦƉŦŦŦƉŦŦŦ÷Ħ', // 11
  'ĦĦĦĦĦĦĦŦŦĦĦĦĦĦĦ', // 12
  'ĦĦĦĦĦĦĦŦŦĦĦĦĦĦĦ', // 13
]);

export const abyssalSpireF5: MapDefinition = {
  key: 'abyssal-spire-f5',
  width: 15,
  height: 14,
  ground: spireF5Ground,
  battleBg: 'bg-cave',
  encounterTableKey: 'abyssal-spire',
  displayName: 'Abyssal Spire — Altar',
  npcs: [
    {
      id: 'aldric-confrontation',
      tileX: 7,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Aldric: So you\'ve reached the Altar. Impressive.',
        'Aldric: Do you feel it? The raw power of the Aether?',
        'Aldric: This temple was built to contain it. I intend to wield it.',
        'Aldric: Join me. Together we could reshape the world.',
        '...',
        'Aldric: No? How disappointing.',
        'Aldric: It doesn\'t matter. I\'ve already absorbed what I need.',
        'Aldric: If you want to stop me... you\'ll have to beat me at the Pokemon League.',
        'Aldric: I\'ll be waiting in the Champion\'s chamber.',
        'Aldric vanished through a hidden passage!',
      ],
      setsFlag: 'aldric_escaped_to_league',
    },
  ],
  trainers: [],
  warps: [
    // South entrance → F4
    { tileX: 7, tileY: 13, targetMap: 'abyssal-spire-f4', targetSpawnId: 'default' },
    { tileX: 8, tileY: 13, targetMap: 'abyssal-spire-f4', targetSpawnId: 'default' },
    // Post-clear exit → Route 8
    { tileX: 7, tileY: 12, targetMap: 'route-8', targetSpawnId: 'from-abyssal-spire' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 12, direction: 'up' },
    'from-f4': { x: 7, y: 12, direction: 'up' },
  },
};
