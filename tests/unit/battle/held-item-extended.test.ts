import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeldItemHandler } from '../../../frontend/src/battle/effects/HeldItemHandler';
import { createPokemonFactory } from '../../helpers/pokemon-factory';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});


const makePokemon = createPokemonFactory('held-item');

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
