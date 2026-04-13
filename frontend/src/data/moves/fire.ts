import { MoveData } from '../interfaces';

export const fireMoves: Record<string, MoveData> = {
  'ember':        { id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'flamethrower': { id: 'flamethrower', name: 'Flamethrower', type: 'fire', category: 'special', power: 90, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-blast':   { id: 'fire-blast', name: 'Fire Blast', type: 'fire', category: 'special', power: 110, accuracy: 85, pp: 5, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-spin':    { id: 'fire-spin', name: 'Fire Spin', type: 'fire', category: 'special', power: 35, accuracy: 85, pp: 15, effect: { type: 'trap', target: 'enemy', chance: 100 } },
  'fire-punch':   { id: 'fire-punch', name: 'Fire Punch', type: 'fire', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-fang':    { id: 'fire-fang', name: 'Fire Fang', type: 'fire', category: 'physical', power: 65, accuracy: 95, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
};
