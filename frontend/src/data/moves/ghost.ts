import { MoveData } from '../interfaces';

export const ghostMoves: Record<string, MoveData> = {
  'lick':           { id: 'lick', name: 'Lick', type: 'ghost', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'night-shade':    { id: 'night-shade', name: 'Night Shade', type: 'ghost', category: 'special', power: null, accuracy: 100, pp: 15, effect: { type: 'level-damage', target: 'enemy' } },
  'confuse-ray':    { id: 'confuse-ray', name: 'Confuse Ray', type: 'ghost', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 100 } },
  'shadow-ball':    { id: 'shadow-ball', name: 'Shadow Ball', type: 'ghost', category: 'special', power: 80, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 20 } },
  'shadow-claw':    { id: 'shadow-claw', name: 'Shadow Claw', type: 'ghost', category: 'physical', power: 70, accuracy: 100, pp: 15 },
  'hex':            { id: 'hex', name: 'Hex', type: 'ghost', category: 'special', power: 65, accuracy: 100, pp: 10 },
  'phantom-force':  { id: 'phantom-force', name: 'Phantom Force', type: 'ghost', category: 'physical', power: 90, accuracy: 100, pp: 10 },
  'will-o-wisp':    { id: 'will-o-wisp', name: 'Will-O-Wisp', type: 'ghost', category: 'status', power: null, accuracy: 85, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 100 } },
  'destiny-bond':   { id: 'destiny-bond', name: 'Destiny Bond', type: 'ghost', category: 'status', power: null, accuracy: 100, pp: 5 },
};
