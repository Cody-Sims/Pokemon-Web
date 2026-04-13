import { MoveData } from '../interfaces';

export const psychicMoves: Record<string, MoveData> = {
  'confusion':    { id: 'confusion', name: 'Confusion', type: 'psychic', category: 'special', power: 50, accuracy: 100, pp: 25, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 10 } },
  'psybeam':      { id: 'psybeam', name: 'Psybeam', type: 'psychic', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 10 } },
  'psychic':      { id: 'psychic', name: 'Psychic', type: 'psychic', category: 'special', power: 90, accuracy: 100, pp: 10, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'psywave':      { id: 'psywave', name: 'Psywave', type: 'psychic', category: 'special', power: null, accuracy: 100, pp: 15, effect: { type: 'level-damage', target: 'enemy' } },
  'dream-eater':  { id: 'dream-eater', name: 'Dream Eater', type: 'psychic', category: 'special', power: 100, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
  'hypnosis':     { id: 'hypnosis', name: 'Hypnosis', type: 'psychic', category: 'status', power: null, accuracy: 60, pp: 20, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'meditate':     { id: 'meditate', name: 'Meditate', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1 } },
  'agility':      { id: 'agility', name: 'Agility', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'speed', stages: 2 } },
  'amnesia':      { id: 'amnesia', name: 'Amnesia', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'spDefense', stages: 2 } },
  'barrier':      { id: 'barrier', name: 'Barrier', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 2 } },
  'light-screen': { id: 'light-screen', name: 'Light Screen', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'spDefense', stages: 1 } },
  'reflect':      { id: 'reflect', name: 'Reflect', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'rest':         { id: 'rest', name: 'Rest', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'heal', target: 'self', amount: 100 } },
  'teleport':     { id: 'teleport', name: 'Teleport', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20 },
  'kinesis':      { id: 'kinesis', name: 'Kinesis', type: 'psychic', category: 'status', power: null, accuracy: 80, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },
};
