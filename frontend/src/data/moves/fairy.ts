import { MoveData } from '../interfaces';

export const fairyMoves: Record<string, MoveData> = {
  'moonblast':        { id: 'moonblast', name: 'Moonblast', type: 'fairy', category: 'special', power: 95, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'spAttack', stages: -1, chance: 30 } },
  'dazzling-gleam':   { id: 'dazzling-gleam', name: 'Dazzling Gleam', type: 'fairy', category: 'special', power: 80, accuracy: 100, pp: 10 },
  'play-rough':       { id: 'play-rough', name: 'Play Rough', type: 'fairy', category: 'physical', power: 90, accuracy: 90, pp: 10, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1, chance: 10 } },
  'fairy-wind':       { id: 'fairy-wind', name: 'Fairy Wind', type: 'fairy', category: 'special', power: 40, accuracy: 100, pp: 30 },
  'disarming-voice':  { id: 'disarming-voice', name: 'Disarming Voice', type: 'fairy', category: 'special', power: 40, accuracy: 100, pp: 15 },
  'charm':            { id: 'charm', name: 'Charm', type: 'fairy', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -2 } },
};
