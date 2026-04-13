import { MoveData } from '../interfaces';

export const bugMoves: Record<string, MoveData> = {
  'string-shot':  { id: 'string-shot', name: 'String Shot', type: 'bug', category: 'status', power: null, accuracy: 95, pp: 40, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },
  'twineedle':    { id: 'twineedle', name: 'Twineedle', type: 'bug', category: 'physical', power: 25, accuracy: 100, pp: 20, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
  'pin-missile':  { id: 'pin-missile', name: 'Pin Missile', type: 'bug', category: 'physical', power: 25, accuracy: 95, pp: 20, effect: { type: 'multi-hit', target: 'enemy' } },
  'leech-life':   { id: 'leech-life', name: 'Leech Life', type: 'bug', category: 'physical', power: 20, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
};
