import { MoveData } from '../interfaces';

export const flyingMoves: Record<string, MoveData> = {
  'gust':         { id: 'gust', name: 'Gust', type: 'flying', category: 'special', power: 40, accuracy: 100, pp: 35 },
  'peck':         { id: 'peck', name: 'Peck', type: 'flying', category: 'physical', power: 35, accuracy: 100, pp: 35 },
  'wing-attack':  { id: 'wing-attack', name: 'Wing Attack', type: 'flying', category: 'physical', power: 60, accuracy: 100, pp: 35 },
  'drill-peck':   { id: 'drill-peck', name: 'Drill Peck', type: 'flying', category: 'physical', power: 80, accuracy: 100, pp: 20 },
  'fly':          { id: 'fly', name: 'Fly', type: 'flying', category: 'physical', power: 90, accuracy: 95, pp: 15, effect: { type: 'two-turn', target: 'enemy', twoTurnMove: 'fly' } },
  'sky-attack':   { id: 'sky-attack', name: 'Sky Attack', type: 'flying', category: 'physical', power: 140, accuracy: 90, pp: 5, effect: { type: 'two-turn', target: 'enemy', twoTurnMove: 'sky-attack' } },
  'hurricane':    { id: 'hurricane', name: 'Hurricane', type: 'flying', category: 'special', power: 110, accuracy: 70, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 30 } },
  'mirror-move':  { id: 'mirror-move', name: 'Mirror Move', type: 'flying', category: 'status', power: null, accuracy: 100, pp: 20 },
  'aerial-ace':   { id: 'aerial-ace', name: 'Aerial Ace', type: 'flying', category: 'physical', power: 60, accuracy: 100, pp: 20 },
  'brave-bird':   { id: 'brave-bird', name: 'Brave Bird', type: 'flying', category: 'physical', power: 120, accuracy: 100, pp: 15, effect: { type: 'recoil', target: 'self', amount: 33 } },
  'air-slash':    { id: 'air-slash', name: 'Air Slash', type: 'flying', category: 'special', power: 75, accuracy: 95, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
};
