import { MoveData } from '../interfaces';

export const steelMoves: Record<string, MoveData> = {
  'iron-tail':    { id: 'iron-tail', name: 'Iron Tail', type: 'steel', category: 'physical', power: 100, accuracy: 75, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'defense', stages: -1, chance: 30 } },
  'steel-wing':   { id: 'steel-wing', name: 'Steel Wing', type: 'steel', category: 'physical', power: 70, accuracy: 90, pp: 25, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1, chance: 10 } },
  'metal-claw':   { id: 'metal-claw', name: 'Metal Claw', type: 'steel', category: 'physical', power: 50, accuracy: 95, pp: 35, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1, chance: 10 } },
  'meteor-mash':  { id: 'meteor-mash', name: 'Meteor Mash', type: 'steel', category: 'physical', power: 90, accuracy: 90, pp: 10, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1, chance: 20 } },
  'flash-cannon': { id: 'flash-cannon', name: 'Flash Cannon', type: 'steel', category: 'special', power: 80, accuracy: 100, pp: 10, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'bullet-punch': { id: 'bullet-punch', name: 'Bullet Punch', type: 'steel', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1 },
  'iron-head':    { id: 'iron-head', name: 'Iron Head', type: 'steel', category: 'physical', power: 80, accuracy: 100, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'gyro-ball':    { id: 'gyro-ball', name: 'Gyro Ball', type: 'steel', category: 'physical', power: 60, accuracy: 100, pp: 5 },
  'iron-defense': { id: 'iron-defense', name: 'Iron Defense', type: 'steel', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 2 } },
};
