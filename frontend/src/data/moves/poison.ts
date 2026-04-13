import { MoveData } from '../interfaces';

export const poisonMoves: Record<string, MoveData> = {
  'poison-sting': { id: 'poison-sting', name: 'Poison Sting', type: 'poison', category: 'physical', power: 15, accuracy: 100, pp: 35, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 30 } },
  'acid':         { id: 'acid', name: 'Acid', type: 'poison', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'sludge':       { id: 'sludge', name: 'Sludge', type: 'poison', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 30 } },
  'smog':         { id: 'smog', name: 'Smog', type: 'poison', category: 'special', power: 30, accuracy: 70, pp: 20, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 40 } },
  'poison-powder':{ id: 'poison-powder', name: 'Poison Powder', type: 'poison', category: 'status', power: null, accuracy: 75, pp: 35, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 100 } },
  'poison-gas':   { id: 'poison-gas', name: 'Poison Gas', type: 'poison', category: 'status', power: null, accuracy: 90, pp: 40, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 100 } },
  'toxic':        { id: 'toxic', name: 'Toxic', type: 'poison', category: 'status', power: null, accuracy: 90, pp: 10, effect: { type: 'status', target: 'enemy', status: 'bad-poison', chance: 100 } },
  'acid-armor':   { id: 'acid-armor', name: 'Acid Armor', type: 'poison', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 2 } },
};
