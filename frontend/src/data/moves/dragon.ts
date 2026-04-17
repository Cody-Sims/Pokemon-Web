import { MoveData } from '../interfaces';

export const dragonMoves: Record<string, MoveData> = {
  'dragon-rage':  { id: 'dragon-rage', name: 'Dragon Rage', type: 'dragon', category: 'special', power: null, accuracy: 100, pp: 10, effect: { type: 'fixed-damage', target: 'enemy', amount: 40 } },
  'dragon-claw':  { id: 'dragon-claw', name: 'Dragon Claw', type: 'dragon', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  'dragon-pulse': { id: 'dragon-pulse', name: 'Dragon Pulse', type: 'dragon', category: 'special', power: 85, accuracy: 100, pp: 10 },
  'draco-meteor': { id: 'draco-meteor', name: 'Draco Meteor', type: 'dragon', category: 'special', power: 130, accuracy: 90, pp: 5, effect: { type: 'stat-change', target: 'self', stat: 'spAttack', stages: -2 } },
  'outrage':      { id: 'outrage', name: 'Outrage', type: 'dragon', category: 'physical', power: 120, accuracy: 100, pp: 10 },
  'dragon-dance': { id: 'dragon-dance', name: 'Dragon Dance', type: 'dragon', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', statChanges: [{ stat: 'attack', stages: 1 }, { stat: 'speed', stages: 1 }] } },
  'dragon-breath': { id: 'dragon-breath', name: 'Dragon Breath', type: 'dragon', category: 'special', power: 60, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'twister':      { id: 'twister', name: 'Twister', type: 'dragon', category: 'special', power: 40, accuracy: 100, pp: 20, effect: { type: 'flinch', target: 'enemy', chance: 20 } },
};
