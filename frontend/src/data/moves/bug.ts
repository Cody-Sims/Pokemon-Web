import { MoveData } from '../interfaces';

export const bugMoves: Record<string, MoveData> = {
  'string-shot':  { id: 'string-shot', name: 'String Shot', type: 'bug', category: 'status', power: null, accuracy: 95, pp: 40, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },
  'twineedle':    { id: 'twineedle', name: 'Twineedle', type: 'bug', category: 'physical', power: 25, accuracy: 100, pp: 20, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
  'pin-missile':  { id: 'pin-missile', name: 'Pin Missile', type: 'bug', category: 'physical', power: 25, accuracy: 95, pp: 20, effect: { type: 'multi-hit', target: 'enemy' } },
  'leech-life':   { id: 'leech-life', name: 'Leech Life', type: 'bug', category: 'physical', power: 20, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
  'megahorn':     { id: 'megahorn', name: 'Megahorn', type: 'bug', category: 'physical', power: 120, accuracy: 85, pp: 10 },
  'x-scissor':    { id: 'x-scissor', name: 'X-Scissor', type: 'bug', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  'signal-beam':  { id: 'signal-beam', name: 'Signal Beam', type: 'bug', category: 'special', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 10 } },
  'fury-cutter':  { id: 'fury-cutter', name: 'Fury Cutter', type: 'bug', category: 'physical', power: 40, accuracy: 95, pp: 20 },
  'lunge':        { id: 'lunge', name: 'Lunge', type: 'bug', category: 'physical', power: 80, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1, chance: 100 } },
};
