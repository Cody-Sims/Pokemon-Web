import { MoveData } from '../interfaces';

export const grassMoves: Record<string, MoveData> = {
  'vine-whip':    { id: 'vine-whip', name: 'Vine Whip', type: 'grass', category: 'physical', power: 45, accuracy: 100, pp: 25 },
  'razor-leaf':   { id: 'razor-leaf', name: 'Razor Leaf', type: 'grass', category: 'physical', power: 55, accuracy: 95, pp: 25 },
  'solar-beam':   { id: 'solar-beam', name: 'Solar Beam', type: 'grass', category: 'special', power: 120, accuracy: 100, pp: 10, effect: { type: 'two-turn', target: 'enemy', twoTurnMove: 'solar-beam' } },
  'absorb':       { id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, pp: 25, effect: { type: 'drain', target: 'self', chance: 100 } },
  'mega-drain':   { id: 'mega-drain', name: 'Mega Drain', type: 'grass', category: 'special', power: 40, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
  'leech-seed':   { id: 'leech-seed', name: 'Leech Seed', type: 'grass', category: 'status', power: null, accuracy: 90, pp: 10, effect: { type: 'leech-seed', target: 'enemy', chance: 100 } },
  'petal-dance':  { id: 'petal-dance', name: 'Petal Dance', type: 'grass', category: 'special', power: 120, accuracy: 100, pp: 10 },
  'energy-ball':  { id: 'energy-ball', name: 'Energy Ball', type: 'grass', category: 'special', power: 90, accuracy: 100, pp: 10, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'giga-drain':   { id: 'giga-drain', name: 'Giga Drain', type: 'grass', category: 'special', power: 75, accuracy: 100, pp: 10, effect: { type: 'drain', target: 'self', chance: 100 } },
  'stun-spore':   { id: 'stun-spore', name: 'Stun Spore', type: 'grass', category: 'status', power: null, accuracy: 75, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'sleep-powder': { id: 'sleep-powder', name: 'Sleep Powder', type: 'grass', category: 'status', power: null, accuracy: 75, pp: 15, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'spore':        { id: 'spore', name: 'Spore', type: 'grass', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
};
