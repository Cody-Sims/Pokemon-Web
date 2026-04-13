import { MoveData } from '../interfaces';

export const rockMoves: Record<string, MoveData> = {
  'rock-throw':   { id: 'rock-throw', name: 'Rock Throw', type: 'rock', category: 'physical', power: 50, accuracy: 90, pp: 15 },
  'rock-slide':   { id: 'rock-slide', name: 'Rock Slide', type: 'rock', category: 'physical', power: 75, accuracy: 90, pp: 10, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'rock-tomb':    { id: 'rock-tomb', name: 'Rock Tomb', type: 'rock', category: 'physical', power: 60, accuracy: 95, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },
};
