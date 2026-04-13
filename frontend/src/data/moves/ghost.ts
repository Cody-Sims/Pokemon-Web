import { MoveData } from '../interfaces';

export const ghostMoves: Record<string, MoveData> = {
  'lick':         { id: 'lick', name: 'Lick', type: 'ghost', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'night-shade':  { id: 'night-shade', name: 'Night Shade', type: 'ghost', category: 'special', power: null, accuracy: 100, pp: 15, effect: { type: 'level-damage', target: 'enemy' } },
  'confuse-ray':  { id: 'confuse-ray', name: 'Confuse Ray', type: 'ghost', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 100 } },
};
