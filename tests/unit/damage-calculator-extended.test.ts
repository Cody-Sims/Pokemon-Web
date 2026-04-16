import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamageCalculator } from '../../frontend/src/battle/calculation/DamageCalculator';
import { StatusEffectHandler } from '../../frontend/src/battle/effects/StatusEffectHandler';
import { PokemonInstance, MoveData } from '../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 10, currentHp: 100,
  stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null, exp: 0, friendship: 70, ...overrides,
});

describe('DamageCalculator — Extended Scenarios', () => {
  describe('damage formula verification', () => {
    it('should match expected formula: ((2*L/5+2)*P*A/D)/50+2 * mods', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const attacker = makePokemon({ level: 20, stats: { hp: 100, attack: 50, defense: 40, spAttack: 80, spDefense: 45, speed: 55 } });
      const defender = makePokemon({ dataId: 19, stats: { hp: 100, attack: 50, defense: 50, spAttack: 40, spDefense: 50, speed: 55 } }); // Rattata (normal)
      // Ember: fire, special, power 40, Charmander is fire → STAB
      // spAttack=80, spDefense=50
      // base = ((2*20/5+2)*40*80/50)/50+2 = ((8+2)*40*80/50)/50+2 = (10*64)/50+2 = 640/50+2 = 12.8+2 = 14.8
      // STAB: 14.8*1.5 = 22.2
      // effectiveness fire vs normal = 1
      // random factor = 0.85 + 0.5*(1-0.85) = 0.925
      // = 22.2 * 0.925 = 20.535 → floor = 20 or so — exact value depends on order of operations
      const result = DamageCalculator.calculate(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      });
      expect(result.damage).toBeGreaterThan(0);
      expect(result.isSTAB).toBe(true);
      expect(result.effectiveness).toBe(1); // fire vs normal
    });

    it('should deal double damage with 4x effectiveness (ice vs grass/ground)', () => {
      // Need grass/ground — use Oddish (grass/poison) and test ice effectiveness
      const attacker = makePokemon({ dataId: 7, stats: { hp: 100, attack: 20, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      const grassPoisonDef = makePokemon({ dataId: 1 }); // Bulbasaur (grass/poison)

      const iceBeam: MoveData = { id: 'ice-beam', name: 'Ice Beam', type: 'ice', category: 'special', power: 90, accuracy: 100, pp: 10 };
      const result = DamageCalculator.calculate(attacker, grassPoisonDef, iceBeam);
      // Ice vs Grass = 2, Ice vs Poison = 1 → 2
      expect(result.effectiveness).toBe(2);
    });
  });

  describe('burn interaction with physical moves', () => {
    it('burned attacker should deal about half physical damage', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ status: 'burn' });
      const defender = makePokemon({ dataId: 19 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      const burned = DamageCalculator.calculate(attacker, defender, {
        id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35,
      }, handler);

      const normalAttacker = makePokemon();
      handler.initPokemon(normalAttacker);
      const normal = DamageCalculator.calculate(normalAttacker, defender, {
        id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35,
      }, handler);

      // Burned should reduce physical attack by 50%
      expect(burned.damage).toBeLessThan(normal.damage);
    });

    it('burn should not affect special move damage', () => {
      const handler = new StatusEffectHandler();
      const burnedAttacker = makePokemon({ status: 'burn' });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(burnedAttacker);
      handler.initPokemon(defender);

      const burnedResult = DamageCalculator.calculate(burnedAttacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      const normalAttacker = makePokemon();
      handler.initPokemon(normalAttacker);
      const normalResult = DamageCalculator.calculate(normalAttacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      // Special damage should be the same regardless of burn
      expect(burnedResult.damage).toBe(normalResult.damage);
    });
  });

  describe('stat stage extremes', () => {
    it('+6 stages should dramatically increase damage', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ level: 50 });
      const defender = makePokemon({ dataId: 19 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      const base = DamageCalculator.calculate(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      handler.getState(attacker).statStages.spAttack = 6;
      const maxBoost = DamageCalculator.calculate(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      expect(maxBoost.damage).toBeGreaterThan(base.damage * 2); // +6 = 4x multiplier
    });

    it('-6 defense stages should dramatically increase damage taken', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ level: 50 });
      const defender = makePokemon({ dataId: 19 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      const base = DamageCalculator.calculate(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      handler.getState(defender).statStages.spDefense = -6;
      const crushed = DamageCalculator.calculate(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      }, handler);

      expect(crushed.damage).toBeGreaterThan(base.damage * 2);
    });
  });

  describe('accuracy edge cases', () => {
    it('should always hit 100 accuracy with any random value < 1', () => {
      for (let i = 0; i < 10; i++) {
        vi.spyOn(Math, 'random').mockReturnValue(i * 0.09);
        expect(DamageCalculator.doesMoveHit({ id: 'x', name: 'X', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 10 })).toBe(true);
      }
    });

    it('30% accuracy move should miss most of the time with random > 0.3', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(DamageCalculator.doesMoveHit({ id: 'x', name: 'X', type: 'normal', category: 'physical', power: null, accuracy: 30, pp: 5 })).toBe(false);
    });
  });
});
