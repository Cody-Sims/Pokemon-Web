import { describe, expect, it } from 'vitest';
import type { PokemonInstance } from '@data/interfaces';
import {
  aliveParty,
  getItemData,
  getMoveData,
  getPokemonData,
  hpRatio,
  isAlive,
  MissingDataError,
  partySlots,
  pokemonDisplayName,
} from '@data/selectors';

function makePokemon(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    dataId: 1,
    level: 5,
    currentHp: 20,
    stats: { hp: 20, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
    ivs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    nature: 'hardy',
    moves: [{ moveId: 'tackle', currentPp: 35 }],
    status: null,
    exp: 0,
    friendship: 70,
    ...overrides,
  };
}

describe('data selectors', () => {
  it('returns registry entries for valid Pokémon, move, and item IDs', () => {
    expect(getPokemonData(1).id).toBe(1);
    expect(getMoveData('tackle').id).toBe('tackle');
    expect(getItemData('potion').id).toBe('potion');
  });

  it('throws MissingDataError for invalid string-typed IDs', () => {
    expect(() => getPokemonData(99999)).toThrow(MissingDataError);
    expect(() => getMoveData('definitely-missing')).toThrow('Unknown move id: definitely-missing');
    expect(() => getItemData('missing-item')).toThrow('Unknown item id: missing-item');
  });

  it('prefers non-empty nicknames and falls back to species names', () => {
    expect(pokemonDisplayName(makePokemon({ nickname: 'Buddy' }))).toBe('Buddy');
    expect(pokemonDisplayName(makePokemon({ nickname: '   ' }))).toBe(getPokemonData(1).name);
    expect(pokemonDisplayName(makePokemon())).toBe(getPokemonData(1).name);
  });

  it('clamps HP ratios and handles zero or invalid max HP safely', () => {
    expect(hpRatio(makePokemon({ currentHp: 10 }))).toBe(0.5);
    expect(hpRatio(makePokemon({ currentHp: 50 }))).toBe(1);
    expect(hpRatio(makePokemon({ currentHp: -5 }))).toBe(0);
    expect(hpRatio(makePokemon({ currentHp: Number.NaN }))).toBe(0);
    expect(hpRatio(makePokemon({ stats: { hp: 0, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } }))).toBe(0);
  });

  it('filters alive party members by derived HP ratio', () => {
    const alive = makePokemon({ currentHp: 1 });
    const fainted = makePokemon({ currentHp: 0 });
    const invalid = makePokemon({ stats: { hp: 0, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });

    expect(isAlive(alive)).toBe(true);
    expect(isAlive(fainted)).toBe(false);
    expect(aliveParty([fainted, alive, invalid])).toEqual([alive]);
  });

  it('creates stable party slot view models for empty and overfull parties', () => {
    const emptySlots = partySlots([]);
    expect(emptySlots).toHaveLength(6);
    expect(emptySlots.every(slot => slot.isEmpty && !slot.isAlive)).toBe(true);

    const party = Array.from({ length: 7 }, (_, index) => makePokemon({ currentHp: index === 0 ? 0 : 5 }));
    const slots = partySlots(party);
    expect(slots).toHaveLength(7);
    expect(slots[0]).toMatchObject({ index: 0, isEmpty: false, isAlive: false });
    expect(slots[6]).toMatchObject({ index: 6, isEmpty: false, isAlive: true });
  });
});
