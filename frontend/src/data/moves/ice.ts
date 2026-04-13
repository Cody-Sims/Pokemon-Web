import { MoveData } from '../interfaces';

export const iceMoves: Record<string, MoveData> = {
  'ice-beam':     { id: 'ice-beam', name: 'Ice Beam', type: 'ice', category: 'special', power: 90, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'blizzard':     { id: 'blizzard', name: 'Blizzard', type: 'ice', category: 'special', power: 110, accuracy: 70, pp: 5, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'aurora-beam':  { id: 'aurora-beam', name: 'Aurora Beam', type: 'ice', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1, chance: 10 } },
  'ice-punch':    { id: 'ice-punch', name: 'Ice Punch', type: 'ice', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'mist':         { id: 'mist', name: 'Mist', type: 'ice', category: 'status', power: null, accuracy: 100, pp: 30 },
  'haze':         { id: 'haze', name: 'Haze', type: 'ice', category: 'status', power: null, accuracy: 100, pp: 30 },
};
