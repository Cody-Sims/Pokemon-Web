import { MoveData } from '../interfaces';

export const groundMoves: Record<string, MoveData> = {
  'sand-attack':  { id: 'sand-attack', name: 'Sand Attack', type: 'ground', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'spAttack', stages: -1 } },
  'earthquake':   { id: 'earthquake', name: 'Earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, contact: false },
  'dig':          { id: 'dig', name: 'Dig', type: 'ground', category: 'physical', power: 80, accuracy: 100, pp: 10, effect: { type: 'two-turn', target: 'enemy', twoTurnMove: 'dig' } },
  'fissure':      { id: 'fissure', name: 'Fissure', type: 'ground', category: 'physical', power: null, accuracy: 30, pp: 5, effect: { type: 'ohko', target: 'enemy' } },
  'bone-club':    { id: 'bone-club', name: 'Bone Club', type: 'ground', category: 'physical', power: 65, accuracy: 85, pp: 20, contact: false, effect: { type: 'flinch', target: 'enemy', chance: 10 } },
  'bonemerang':   { id: 'bonemerang', name: 'Bonemerang', type: 'ground', category: 'physical', power: 50, accuracy: 90, pp: 10, contact: false, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
};
