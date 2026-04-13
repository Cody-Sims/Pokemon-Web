import { MoveData } from '../interfaces';

export const darkMoves: Record<string, MoveData> = {
  'bite':         { id: 'bite', name: 'Bite', type: 'dark', category: 'physical', power: 60, accuracy: 100, pp: 25, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
};
