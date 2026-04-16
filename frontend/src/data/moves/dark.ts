import { MoveData } from '../interfaces';

export const darkMoves: Record<string, MoveData> = {
  'bite':         { id: 'bite', name: 'Bite', type: 'dark', category: 'physical', power: 60, accuracy: 100, pp: 25, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'dark-pulse':   { id: 'dark-pulse', name: 'Dark Pulse', type: 'dark', category: 'special', power: 80, accuracy: 100, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 20 } },
  'crunch':       { id: 'crunch', name: 'Crunch', type: 'dark', category: 'physical', power: 80, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'defense', stages: -1, chance: 20 } },
  'sucker-punch': { id: 'sucker-punch', name: 'Sucker Punch', type: 'dark', category: 'physical', power: 70, accuracy: 100, pp: 5, priority: 1 },
  'nasty-plot':   { id: 'nasty-plot', name: 'Nasty Plot', type: 'dark', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'spAttack', stages: 2 } },
  'pursuit':      { id: 'pursuit', name: 'Pursuit', type: 'dark', category: 'physical', power: 40, accuracy: 100, pp: 20 },
  'foul-play':    { id: 'foul-play', name: 'Foul Play', type: 'dark', category: 'physical', power: 95, accuracy: 100, pp: 15 },
};
