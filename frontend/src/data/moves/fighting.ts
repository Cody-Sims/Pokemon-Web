import { MoveData } from '../interfaces';

export const fightingMoves: Record<string, MoveData> = {
  'karate-chop':  { id: 'karate-chop', name: 'Karate Chop', type: 'fighting', category: 'physical', power: 50, accuracy: 100, pp: 25 },
  'double-kick':  { id: 'double-kick', name: 'Double Kick', type: 'fighting', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
  'jump-kick':    { id: 'jump-kick', name: 'Jump Kick', type: 'fighting', category: 'physical', power: 100, accuracy: 95, pp: 10 },
  'high-jump-kick':{ id: 'high-jump-kick', name: 'High Jump Kick', type: 'fighting', category: 'physical', power: 130, accuracy: 90, pp: 10 },
  'rolling-kick': { id: 'rolling-kick', name: 'Rolling Kick', type: 'fighting', category: 'physical', power: 60, accuracy: 85, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'low-kick':     { id: 'low-kick', name: 'Low Kick', type: 'fighting', category: 'physical', power: 50, accuracy: 100, pp: 20 },
  'submission':   { id: 'submission', name: 'Submission', type: 'fighting', category: 'physical', power: 80, accuracy: 80, pp: 20, effect: { type: 'recoil', target: 'self', amount: 25 } },
  'counter':      { id: 'counter', name: 'Counter', type: 'fighting', category: 'physical', power: null, accuracy: 100, pp: 20 },
  'seismic-toss': { id: 'seismic-toss', name: 'Seismic Toss', type: 'fighting', category: 'physical', power: null, accuracy: 100, pp: 20, effect: { type: 'level-damage', target: 'enemy' } },
  'brick-break':  { id: 'brick-break', name: 'Brick Break', type: 'fighting', category: 'physical', power: 75, accuracy: 100, pp: 15 },
  'focus-punch':  { id: 'focus-punch', name: 'Focus Punch', type: 'fighting', category: 'physical', power: 150, accuracy: 100, pp: 20, priority: -3 },
  'cross-chop':   { id: 'cross-chop', name: 'Cross Chop', type: 'fighting', category: 'physical', power: 100, accuracy: 80, pp: 5 },
  'close-combat': { id: 'close-combat', name: 'Close Combat', type: 'fighting', category: 'physical', power: 120, accuracy: 100, pp: 5, effect: { type: 'stat-change', target: 'self', statChanges: [{ stat: 'defense', stages: -1 }, { stat: 'spDefense', stages: -1 }] } },
};
