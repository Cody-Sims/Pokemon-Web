import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamageCalculator } from '../../frontend/src/battle/DamageCalculator';
import { PokemonInstance, MoveData } from '../../frontend/src/data/interfaces';
import { StatusEffectHandler } from '../../frontend/src/battle/StatusEffectHandler';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makeAttacker = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander (fire)
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

const makeDefender = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 1, // Bulbasaur (grass/poison)
  level: 10,
  currentHp: 35,
  stats: { hp: 35, attack: 14, defense: 14, spAttack: 17, spDefense: 17, speed: 13 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'tackle', currentPp: 35 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

const ember: MoveData = { id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25 };
const tackle: MoveData = { id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 };
const growl: MoveData = { id: 'growl', name: 'Growl', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 40 };

describe('DamageCalculator', () => {
  describe('calculate', () => {
    it('should deal > 0 damage for an attacking move', () => {
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      expect(result.damage).toBeGreaterThan(0);
    });

    it('should return super effective multiplier for fire vs grass', () => {
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      expect(result.effectiveness).toBeGreaterThan(1);
    });

    it('should apply STAB for same-type attack bonus', () => {
      // Charmander (fire) using Ember (fire) = STAB
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      expect(result.isSTAB).toBe(true);
    });

    it('should not apply STAB for different-type moves', () => {
      // Charmander (fire) using Tackle (normal) = no STAB
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), tackle);
      expect(result.isSTAB).toBe(false);
    });

    it('should return 0 damage for status moves', () => {
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), growl);
      expect(result.damage).toBe(0);
      expect(result.isCritical).toBe(false);
      expect(result.isSTAB).toBe(false);
    });

    it('should deal at least 1 damage for damaging moves', () => {
      const weakAttacker = makeAttacker({ stats: { hp: 10, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      const tankDefender = makeDefender({ stats: { hp: 200, attack: 50, defense: 200, spAttack: 50, spDefense: 200, speed: 50 } });
      const result = DamageCalculator.calculate(weakAttacker, tankDefender, ember);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should detect critical hits based on Math.random', () => {
      // CRIT_CHANCE = 0.0625, mock random < 0.0625 → crit
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      expect(result.isCritical).toBe(true);
    });

    it('should not crit when random is above crit chance', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      expect(result.isCritical).toBe(false);
    });

    it('should return 0 damage for unknown attacker/defender data', () => {
      const unknownAttacker = makeAttacker({ dataId: 99999 });
      const result = DamageCalculator.calculate(unknownAttacker, makeDefender(), ember);
      expect(result.damage).toBe(0);
    });

    it('should use stat stages when StatusEffectHandler is provided', () => {
      const handler = new StatusEffectHandler();
      const attacker = makeAttacker();
      const defender = makeDefender();
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      const without = DamageCalculator.calculate(makeAttacker(), makeDefender(), ember);
      // Boost attacker's spAttack by 2 stages
      handler.getState(attacker).statStages.spAttack = 2;
      const withBoost = DamageCalculator.calculate(attacker, defender, ember, handler);
      expect(withBoost.damage).toBeGreaterThan(without.damage);
    });
  });

  describe('doesMoveHit', () => {
    it('should hit with 100% accuracy when random is < 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(DamageCalculator.doesMoveHit(ember)).toBe(true);
    });

    it('should miss low accuracy moves when random is high', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const lowAccuracy: MoveData = { id: 'fissure', name: 'Fissure', type: 'ground', category: 'physical', power: null, accuracy: 30, pp: 5 };
      expect(DamageCalculator.doesMoveHit(lowAccuracy)).toBe(false);
    });
  });
});
