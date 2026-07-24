import type { PokemonInstance } from '../../frontend/src/data/interfaces';
import { moveData } from '../../frontend/src/data/moves';

type PokemonPreset =
  | 'standard'
  | 'standard-exp'
  | 'ai-basic'
  | 'ai-extended'
  | 'battle-flow'
  | 'battle-rng'
  | 'battle-scenario'
  | 'effects-registry'
  | 'experience'
  | 'held-item'
  | 'move-effects'
  | 'move-executor'
  | 'move-executor-extended'
  | 'small-tackle'
  | 'status-extended';

const ivs15 = { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 };
const ivs0 = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
const evs0 = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };

const standard: PokemonInstance = {
  dataId: 4,
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: ivs15,
  evs: evs0,
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
};

const presets: Record<Exclude<PokemonPreset, 'move-executor-extended'>, PokemonInstance> = {
  standard,
  'standard-exp': { ...standard, exp: 1000 },
  'ai-basic': {
    ...standard,
    moves: [
      { moveId: 'ember', currentPp: 25 },
      { moveId: 'tackle', currentPp: 35 },
      { moveId: 'growl', currentPp: 40 },
    ],
  },
  'ai-extended': {
    ...standard,
    level: 20,
    currentHp: 100,
    stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
    moves: [
      { moveId: 'ember', currentPp: 25 },
      { moveId: 'scratch', currentPp: 35 },
      { moveId: 'flamethrower', currentPp: 15 },
      { moveId: 'growl', currentPp: 40 },
    ],
  },
  'battle-flow': {
    ...standard,
    moves: [
      { moveId: 'ember', currentPp: 25 },
      { moveId: 'scratch', currentPp: 35 },
    ],
    exp: 1000,
  },
  'battle-rng': {
    ...standard,
    level: 30,
    currentHp: 95,
    stats: { hp: 95, attack: 65, defense: 55, spAttack: 70, spDefense: 60, speed: 70 },
    moves: [{ moveId: 'fury-swipes', currentPp: 15 }],
  },
  'battle-scenario': {
    ...standard,
    currentHp: 100,
    stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
    moves: [
      { moveId: 'ember', currentPp: 25 },
      { moveId: 'scratch', currentPp: 35 },
    ],
    exp: 1000,
  },
  'effects-registry': {
    ...standard,
    dataId: 19,
    level: 30,
    currentHp: 80,
    stats: { hp: 100, attack: 50, defense: 45, spAttack: 55, spDefense: 50, speed: 60 },
    moves: [{ moveId: 'tackle', currentPp: 35 }],
  },
  experience: {
    ...standard,
    moves: [
      { moveId: 'scratch', currentPp: 35 },
      { moveId: 'growl', currentPp: 40 },
    ],
    exp: 1000,
  },
  'held-item': {
    ...standard,
    level: 30,
    currentHp: 60,
    stats: { hp: 80, attack: 40, defense: 35, spAttack: 50, spDefense: 38, speed: 45 },
  },
  'move-effects': {
    ...standard,
    level: 50,
    currentHp: 200,
    stats: { hp: 200, attack: 80, defense: 60, spAttack: 90, spDefense: 60, speed: 70 },
    moves: [{ moveId: 'tackle', currentPp: 35 }],
  },
  'move-executor': {
    ...standard,
    currentHp: 100,
    stats: { hp: 100, attack: 50, defense: 30, spAttack: 60, spDefense: 40, speed: 50 },
    moves: [
      { moveId: 'ember', currentPp: 25 },
      { moveId: 'scratch', currentPp: 35 },
      { moveId: 'growl', currentPp: 40 },
    ],
  },
  'small-tackle': {
    ...standard,
    dataId: 1,
    level: 5,
    currentHp: 20,
    stats: { hp: 20, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
    ivs: ivs0,
    moves: [{ moveId: 'tackle', currentPp: 35 }],
  },
  'status-extended': {
    ...standard,
    currentHp: 100,
    stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
  },
};

function clonePokemon(pokemon: PokemonInstance): PokemonInstance {
  return {
    ...pokemon,
    stats: { ...pokemon.stats },
    ivs: { ...pokemon.ivs },
    evs: { ...pokemon.evs },
    moves: pokemon.moves.map(move => ({ ...move })),
  };
}

function presetPokemon(preset: PokemonPreset): PokemonInstance {
  if (preset === 'move-executor-extended') {
    return {
      ...clonePokemon(presets.standard),
      level: 20,
      currentHp: 100,
      stats: { hp: 100, attack: 60, defense: 40, spAttack: 70, spDefense: 45, speed: 55 },
      moves: Object.keys(moveData).slice(0, 4).map(id => ({ moveId: id, currentPp: moveData[id].pp })),
    };
  }
  return clonePokemon(presets[preset]);
}

export function makePokemon(
  overrides: Partial<PokemonInstance> = {},
  preset: PokemonPreset = 'standard',
): PokemonInstance {
  return { ...presetPokemon(preset), ...overrides };
}

export function createPokemonFactory(preset: PokemonPreset): (overrides?: Partial<PokemonInstance>) => PokemonInstance {
  return (overrides: Partial<PokemonInstance> = {}) => makePokemon(overrides, preset);
}

export function createPokemonByIdFactory(
  preset: PokemonPreset,
): (dataId: number, overrides?: Partial<PokemonInstance>) => PokemonInstance {
  return (dataId: number, overrides: Partial<PokemonInstance> = {}) => makePokemon({ dataId, ...overrides }, preset);
}
