import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeldItemHandler } from '../../../frontend/src/battle/effects/HeldItemHandler';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander
  level: 30,
  currentHp: 60,
  stats: { hp: 80, attack: 40, defense: 35, spAttack: 50, spDefense: 38, speed: 45 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('HeldItemHandler — weather rocks', () => {
  it('Heat Rock adds +3 turns to sun', () => {
    const p = makePokemon({ heldItem: 'heat-rock' });
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'sun')).toBe(3);
  });

  it('Heat Rock does not extend rain', () => {
    const p = makePokemon({ heldItem: 'heat-rock' });
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'rain')).toBe(0);
  });

  it('Damp Rock extends rain only', () => {
    const p = makePokemon({ heldItem: 'damp-rock' });
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'rain')).toBe(3);
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'sun')).toBe(0);
  });

  it('Smooth Rock extends sandstorm only', () => {
    const p = makePokemon({ heldItem: 'smooth-rock' });
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'sandstorm')).toBe(3);
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'hail')).toBe(0);
  });

  it('Icy Rock extends hail only', () => {
    const p = makePokemon({ heldItem: 'icy-rock' });
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'hail')).toBe(3);
    expect(HeldItemHandler.getWeatherDurationBonus(p, 'sandstorm')).toBe(0);
  });

  it('returns 0 when no item is held', () => {
    expect(HeldItemHandler.getWeatherDurationBonus(makePokemon(), 'sun')).toBe(0);
  });
});

describe('HeldItemHandler — Persim/Lum confusion cure', () => {
  it('Persim Berry cures confusion and is consumed', () => {
    const p = makePokemon({ heldItem: 'persim-berry' });
    const result = HeldItemHandler.onVolatileApplied(p, 'confusion');
    expect(result.cured).toBe(true);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(p.heldItem).toBeNull();
  });

  it('Lum Berry cures confusion and is consumed', () => {
    const p = makePokemon({ heldItem: 'lum-berry' });
    const result = HeldItemHandler.onVolatileApplied(p, 'confusion');
    expect(result.cured).toBe(true);
    expect(p.heldItem).toBeNull();
  });

  it('Persim does NOT cure flinch', () => {
    const p = makePokemon({ heldItem: 'persim-berry' });
    const result = HeldItemHandler.onVolatileApplied(p, 'flinch');
    expect(result.cured).toBe(false);
    expect(p.heldItem).toBe('persim-berry');
  });

  it('returns cured=false when no berry is held', () => {
    const result = HeldItemHandler.onVolatileApplied(makePokemon(), 'confusion');
    expect(result.cured).toBe(false);
  });
});
