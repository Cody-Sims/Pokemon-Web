import { describe, it, expect } from 'vitest';
import { getTypeEffectiveness, getCombinedEffectiveness } from '../../frontend/src/data/type-chart';
import { PokemonType } from '../../frontend/src/utils/type-helpers';

const ALL_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

// Exhaustive correctness table from official Pokémon type chart
const EXPECTED_SUPER_EFFECTIVE: [PokemonType, PokemonType][] = [
  ['fire', 'grass'], ['fire', 'ice'], ['fire', 'bug'], ['fire', 'steel'],
  ['water', 'fire'], ['water', 'ground'], ['water', 'rock'],
  ['electric', 'water'], ['electric', 'flying'],
  ['grass', 'water'], ['grass', 'ground'], ['grass', 'rock'],
  ['ice', 'grass'], ['ice', 'ground'], ['ice', 'flying'], ['ice', 'dragon'],
  ['fighting', 'normal'], ['fighting', 'ice'], ['fighting', 'rock'], ['fighting', 'dark'], ['fighting', 'steel'],
  ['poison', 'grass'], ['poison', 'fairy'],
  ['ground', 'fire'], ['ground', 'electric'], ['ground', 'poison'], ['ground', 'rock'], ['ground', 'steel'],
  ['flying', 'grass'], ['flying', 'fighting'], ['flying', 'bug'],
  ['psychic', 'fighting'], ['psychic', 'poison'],
  ['bug', 'grass'], ['bug', 'psychic'], ['bug', 'dark'],
  ['rock', 'fire'], ['rock', 'ice'], ['rock', 'flying'], ['rock', 'bug'],
  ['ghost', 'psychic'], ['ghost', 'ghost'],
  ['dragon', 'dragon'],
  ['dark', 'psychic'], ['dark', 'ghost'],
  ['steel', 'ice'], ['steel', 'rock'], ['steel', 'fairy'],
  ['fairy', 'fighting'], ['fairy', 'dragon'], ['fairy', 'dark'],
];

const EXPECTED_IMMUNITIES: [PokemonType, PokemonType][] = [
  ['normal', 'ghost'], ['electric', 'ground'], ['fighting', 'ghost'],
  ['poison', 'steel'], ['ground', 'flying'], ['psychic', 'dark'],
  ['ghost', 'normal'], ['dragon', 'fairy'],
];

describe('Type Chart — Exhaustive Correctness', () => {
  describe('super effective matchups (2x)', () => {
    it.each(EXPECTED_SUPER_EFFECTIVE)('%s vs %s = 2', (atk, def) => {
      expect(getTypeEffectiveness(atk, def)).toBe(2);
    });
  });

  describe('immunities (0x)', () => {
    it.each(EXPECTED_IMMUNITIES)('%s vs %s = 0', (atk, def) => {
      expect(getTypeEffectiveness(atk, def)).toBe(0);
    });
  });

  describe('all 324 matchups produce valid multipliers', () => {
    const matchups = ALL_TYPES.flatMap(atk => ALL_TYPES.map(def => [atk, def] as [PokemonType, PokemonType]));
    it.each(matchups)('%s vs %s is 0, 0.5, 1, or 2', (atk, def) => {
      const mult = getTypeEffectiveness(atk, def);
      expect([0, 0.5, 1, 2]).toContain(mult);
    });
  });

  describe('symmetry violations (expected in Pokémon)', () => {
    it('fire vs water is not the same as water vs fire', () => {
      expect(getTypeEffectiveness('fire', 'water')).not.toBe(getTypeEffectiveness('water', 'fire'));
    });
  });

  describe('getCombinedEffectiveness — dual-type scenarios', () => {
    it('4x: ice vs grass/ground', () => {
      expect(getCombinedEffectiveness('ice', ['grass', 'ground'])).toBe(4);
    });

    it('0.25x: fire vs water/rock', () => {
      expect(getCombinedEffectiveness('fire', ['water', 'rock'])).toBe(0.25);
    });

    it('0x: ground vs fire/flying (flying immune)', () => {
      expect(getCombinedEffectiveness('ground', ['fire', 'flying'])).toBe(0);
    });

    it('1x: normal vs normal (single type)', () => {
      expect(getCombinedEffectiveness('normal', ['normal'])).toBe(1);
    });

    it('2x: fire vs grass/poison (2×1=2)', () => {
      expect(getCombinedEffectiveness('fire', ['grass', 'poison'])).toBe(2);
    });

    it('0.5x: fire vs fire (single type)', () => {
      expect(getCombinedEffectiveness('fire', ['fire'])).toBe(0.5);
    });

    it('1x: fire vs water/grass (0.5×2=1)', () => {
      expect(getCombinedEffectiveness('fire', ['water', 'grass'])).toBe(1);
    });
  });

  describe('most types have at least one super effective matchup', () => {
    // Normal type has no super-effective matchups (by design)
    const TYPES_WITH_SE = ALL_TYPES.filter(t => t !== 'normal');
    it.each(TYPES_WITH_SE)('%s is super effective against at least one type', (atk) => {
      const hasSuperEffective = ALL_TYPES.some(def => getTypeEffectiveness(atk, def) === 2);
      expect(hasSuperEffective).toBe(true);
    });

    it('normal type has no super effective matchups', () => {
      const hasSuperEffective = ALL_TYPES.some(def => getTypeEffectiveness('normal', def) === 2);
      expect(hasSuperEffective).toBe(false);
    });
  });

  describe('every type has at least one resistance or immunity', () => {
    it.each(ALL_TYPES)('%s is resisted by at least one type', (atk) => {
      const hasResistance = ALL_TYPES.some(def => {
        const mult = getTypeEffectiveness(atk, def);
        return mult < 1;
      });
      expect(hasResistance).toBe(true);
    });
  });
});
