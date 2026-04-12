import { describe, it, expect } from 'vitest';
import { getTypeEffectiveness, getCombinedEffectiveness } from '../../frontend/src/data/type-chart';
import { PokemonType } from '../../frontend/src/utils/type-helpers';

const ALL_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

describe('type-chart', () => {
  describe('getTypeEffectiveness', () => {
    // Super effective matchups
    it.each([
      ['fire', 'grass', 2],
      ['water', 'fire', 2],
      ['grass', 'water', 2],
      ['electric', 'water', 2],
      ['ice', 'grass', 2],
      ['fighting', 'normal', 2],
      ['poison', 'grass', 2],
      ['ground', 'fire', 2],
      ['flying', 'grass', 2],
      ['psychic', 'fighting', 2],
      ['bug', 'grass', 2],
      ['rock', 'fire', 2],
      ['ghost', 'psychic', 2],
      ['dragon', 'dragon', 2],
      ['dark', 'psychic', 2],
      ['steel', 'ice', 2],
      ['fairy', 'dragon', 2],
    ] as [PokemonType, PokemonType, number][])('%s vs %s should be %d', (atk, def, expected) => {
      expect(getTypeEffectiveness(atk, def)).toBe(expected);
    });

    // Not very effective
    it.each([
      ['fire', 'water', 0.5],
      ['water', 'grass', 0.5],
      ['grass', 'fire', 0.5],
      ['electric', 'grass', 0.5],
      ['normal', 'rock', 0.5],
      ['normal', 'steel', 0.5],
    ] as [PokemonType, PokemonType, number][])('%s vs %s should be %d', (atk, def, expected) => {
      expect(getTypeEffectiveness(atk, def)).toBe(expected);
    });

    // Immunities
    it.each([
      ['normal', 'ghost', 0],
      ['electric', 'ground', 0],
      ['fighting', 'ghost', 0],
      ['poison', 'steel', 0],
      ['ground', 'flying', 0],
      ['psychic', 'dark', 0],
      ['ghost', 'normal', 0],
      ['dragon', 'fairy', 0],
    ] as [PokemonType, PokemonType, number][])('%s vs %s should be immune (0)', (atk, def, expected) => {
      expect(getTypeEffectiveness(atk, def)).toBe(expected);
    });

    // Neutral
    it('should return 1 for neutral matchups', () => {
      expect(getTypeEffectiveness('normal', 'normal')).toBe(1);
      expect(getTypeEffectiveness('fire', 'fighting')).toBe(1);
    });

    // All types should return a valid multiplier (0, 0.5, 1, or 2)
    it('every type matchup returns valid multiplier', () => {
      for (const atk of ALL_TYPES) {
        for (const def of ALL_TYPES) {
          const mult = getTypeEffectiveness(atk, def);
          expect([0, 0.5, 1, 2]).toContain(mult);
        }
      }
    });
  });

  describe('getCombinedEffectiveness', () => {
    it('should work for single-type pokemon', () => {
      expect(getCombinedEffectiveness('fire', ['grass'])).toBe(2);
      expect(getCombinedEffectiveness('water', ['fire'])).toBe(2);
    });

    it('should multiply both type matchups for dual-type pokemon', () => {
      // Fire vs Grass/Poison → 2 × 1 = 2
      expect(getCombinedEffectiveness('fire', ['grass', 'poison'])).toBe(2);

      // Ground vs Fire/Flying → 2 × 0 = 0 (Flying immune to Ground)
      expect(getCombinedEffectiveness('ground', ['fire', 'flying'])).toBe(0);

      // Ice vs Grass/Ground → 2 × 2 = 4 (4x super effective)
      expect(getCombinedEffectiveness('ice', ['grass', 'ground'])).toBe(4);
    });

    it('should return 0.25 for double resistance', () => {
      // Fire vs Water/Rock → 0.5 × 0.5 = 0.25
      expect(getCombinedEffectiveness('fire', ['water', 'rock'])).toBe(0.25);
    });
  });
});
