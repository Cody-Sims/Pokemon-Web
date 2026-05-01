import { MoveData } from '../interfaces';

export const rockMoves: Record<string, MoveData> = {
  'rock-throw':   { id: 'rock-throw', name: 'Rock Throw', type: 'rock', category: 'physical', power: 50, accuracy: 90, pp: 15, contact: false },
  'rock-slide':   { id: 'rock-slide', name: 'Rock Slide', type: 'rock', category: 'physical', power: 75, accuracy: 90, pp: 10, contact: false, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'rock-tomb':    { id: 'rock-tomb', name: 'Rock Tomb', type: 'rock', category: 'physical', power: 60, accuracy: 95, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },
  'sandstorm':    { id: 'sandstorm', name: 'Sandstorm', type: 'rock', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'weather', target: 'self', weather: 'sandstorm' } },
  'power-gem':    { id: 'power-gem', name: 'Power Gem', type: 'rock', category: 'special', power: 80, accuracy: 100, pp: 20 },
  'head-smash':   { id: 'head-smash', name: 'Head Smash', type: 'rock', category: 'physical', power: 150, accuracy: 80, pp: 5, effect: { type: 'recoil', target: 'self', amount: 50 } },
  'accelerock':   { id: 'accelerock', name: 'Accelerock', type: 'rock', category: 'physical', power: 40, accuracy: 100, pp: 20, priority: 1 },
  'rock-polish':  { id: 'rock-polish', name: 'Rock Polish', type: 'rock', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'speed', stages: 2 } },
  'ancient-power':{ id: 'ancient-power', name: 'Ancient Power', type: 'rock', category: 'special', power: 60, accuracy: 100, pp: 5, effect: { type: 'stat-change', target: 'self', stat: 'spAttack', stages: 1, chance: 10 } },
};
