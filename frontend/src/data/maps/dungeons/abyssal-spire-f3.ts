import { MapDefinition, parseMap } from '../shared';

// Abyssal Spire — Floor 3: Command Center
// Operations room with terminals and electric panels
const spireF3Ground = parseMap([
  'ĦĦĦĦĦĦĦĦŦŦĦĦĦĦĦĦĦĦ', // 0
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 1
  'ĦŦƫŦŦŦ¦ŦŦŦŦ¦ŦŦŦƫŦĦ', // 2  terminals & panels
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 3
  'ĦŦƫŦƫŦŦŦŦŦŦŦŦƫŦƫŦĦ', // 4  terminal cluster
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 5
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 6
  'ĦŦ¦ŦŦŦŦŦŦŦŦŦŦŦŦ¦ŦĦ', // 7  side panels
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 8
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 9
  'ĦŦ¦ŦŦƫŦŦŦŦŦŦƫŦŦ¦ŦĦ', // 10 more terminals
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 11
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 12
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 13
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 14
  'ĦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦŦĦ', // 15
  'ĦĦĦĦĦĦĦĦŦŦŦŦĦĦĦĦĦĦ', // 16
  'ĦĦĦĦĦĦĦĦŦŦŦŦĦĦĦĦĦĦ', // 17
]);

export const abyssalSpireF3: MapDefinition = {
  key: 'abyssal-spire-f3',
  width: 18,
  height: 18,
  ground: spireF3Ground,
  encounterTableKey: 'abyssal-spire',
  battleBg: 'bg-cave',
  displayName: 'Abyssal Spire — Command Center',
  npcs: [
    {
      id: 'zara-lux-f3',
      name: 'Zara',
      tileX: 9,
      tileY: 6,
      textureKey: 'npc-zara',
      facing: 'down',
      dialogue: [
        'Zara: ...You actually made it this far.',
        'Zara: I used to believe in what we were building here.',
        'Zara: But the things I\'ve seen... what Aldric is willing to sacrifice...',
        'Zara: I can\'t let you pass. Not because I believe anymore...',
        'Zara: ...but because I need to know you\'re strong enough to end it.',
      ],
      flagDialogue: [{
        flag: 'zara_defected',
        dialogue: [
          'Zara: You proved yourself at the Canopy Trail.',
          'Zara: Take this keycard. The inner sanctum is above.',
          'Zara: Aldric doesn\'t know I\'ve turned. Use that advantage.',
          'Zara: End this. For all the Pokemon they\'ve hurt.',
        ],
      }],
    },
  ],
  trainers: [
    {
      id: 'spire-zara',
      name: 'Zara',
      trainerId: 'admin-zara-3',
      tileX: 9,
      tileY: 8,
      textureKey: 'npc-zara',
      facing: 'down',
      lineOfSight: 4,
    },
  ],
  objects: [
    {
      id: 'keycard-hint',
      tileX: 5,
      tileY: 10,
      textureKey: 'pc-terminal',
      objectType: 'pc',
      dialogue: [
        'A security console...',
        '"Level 5 clearance required for upper floors."',
        '"Authorized personnel: Director Aldric, Admin Zara Lux."',
      ],
    },
  ],
  warps: [
    // South entrance → F2
    { tileX: 9, tileY: 17, targetMap: 'abyssal-spire-f2', targetSpawnId: 'default' },
    { tileX: 10, tileY: 17, targetMap: 'abyssal-spire-f2', targetSpawnId: 'default' },
    // North stairs → F4
    { tileX: 8, tileY: 0, targetMap: 'abyssal-spire-f4', targetSpawnId: 'from-f3' },
    { tileX: 9, tileY: 0, targetMap: 'abyssal-spire-f4', targetSpawnId: 'from-f3' },
  ],
  spawnPoints: {
    'default': { x: 10, y: 16, direction: 'up' },
    'from-f2': { x: 10, y: 16, direction: 'up' },
  },
};
