import { MoveData } from '../interfaces';

export const electricMoves: Record<string, MoveData> = {
  'thunder-shock':{ id: 'thunder-shock', name: 'Thunder Shock', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunderbolt':  { id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunder':      { id: 'thunder', name: 'Thunder', type: 'electric', category: 'special', power: 110, accuracy: 70, pp: 10, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'thunder-wave': { id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: null, accuracy: 90, pp: 20, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'thunder-punch':{ id: 'thunder-punch', name: 'Thunder Punch', type: 'electric', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'wild-charge':  { id: 'wild-charge', name: 'Wild Charge', type: 'electric', category: 'physical', power: 90, accuracy: 100, pp: 15, effect: { type: 'recoil', target: 'self', amount: 25 } },
  'electroweb':   { id: 'electroweb', name: 'Electroweb', type: 'electric', category: 'special', power: 55, accuracy: 95, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 100 } },
  'charge-beam':  { id: 'charge-beam', name: 'Charge Beam', type: 'electric', category: 'special', power: 50, accuracy: 90, pp: 10, effect: { type: 'stat-change', target: 'self', stat: 'spAttack', stages: 1, chance: 70 } },
  'spark':        { id: 'spark', name: 'Spark', type: 'electric', category: 'physical', power: 65, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
};
