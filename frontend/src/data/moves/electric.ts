import { MoveData } from '../interfaces';

export const electricMoves: Record<string, MoveData> = {
  'thunder-shock':{ id: 'thunder-shock', name: 'Thunder Shock', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunderbolt':  { id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunder':      { id: 'thunder', name: 'Thunder', type: 'electric', category: 'special', power: 110, accuracy: 70, pp: 10, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'thunder-wave': { id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: null, accuracy: 90, pp: 20, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'thunder-punch':{ id: 'thunder-punch', name: 'Thunder Punch', type: 'electric', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
};
