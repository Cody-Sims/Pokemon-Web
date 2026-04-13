import { MoveData } from '../interfaces';

export const dragonMoves: Record<string, MoveData> = {
  'dragon-rage':  { id: 'dragon-rage', name: 'Dragon Rage', type: 'dragon', category: 'special', power: null, accuracy: 100, pp: 10, effect: { type: 'fixed-damage', target: 'enemy', amount: 40 } },
};
