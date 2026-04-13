import { MoveData } from '../interfaces';

export const waterMoves: Record<string, MoveData> = {
  'water-gun':    { id: 'water-gun', name: 'Water Gun', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 25 },
  'hydro-pump':   { id: 'hydro-pump', name: 'Hydro Pump', type: 'water', category: 'special', power: 110, accuracy: 80, pp: 5 },
  'surf':         { id: 'surf', name: 'Surf', type: 'water', category: 'special', power: 90, accuracy: 100, pp: 15 },
  'bubble':       { id: 'bubble', name: 'Bubble', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 10 } },
  'bubble-beam':  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 10 } },
  'waterfall':    { id: 'waterfall', name: 'Waterfall', type: 'water', category: 'physical', power: 80, accuracy: 100, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 20 } },
  'crabhammer':   { id: 'crabhammer', name: 'Crabhammer', type: 'water', category: 'physical', power: 100, accuracy: 90, pp: 10 },
  'clamp':        { id: 'clamp', name: 'Clamp', type: 'water', category: 'physical', power: 35, accuracy: 85, pp: 15, effect: { type: 'trap', target: 'enemy', chance: 100 } },
  'withdraw':     { id: 'withdraw', name: 'Withdraw', type: 'water', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'water-pulse':  { id: 'water-pulse', name: 'Water Pulse', type: 'water', category: 'special', power: 60, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 20 } },
  'rain-dance':   { id: 'rain-dance', name: 'Rain Dance', type: 'water', category: 'status', power: null, accuracy: 100, pp: 5, effect: { type: 'weather', target: 'self', weather: 'rain' } },
};
