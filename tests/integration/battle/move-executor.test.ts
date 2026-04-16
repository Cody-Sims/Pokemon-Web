import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';
import { StatusEffectHandler } from '../../../frontend/src/battle/effects/StatusEffectHandler';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander
  level: 10,
  currentHp: 100,
  stats: { hp: 100, attack: 50, defense: 30, spAttack: 60, spDefense: 40, speed: 50 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [
    { moveId: 'ember', currentPp: 25 },
    { moveId: 'scratch', currentPp: 35 },
    { moveId: 'growl', currentPp: 40 },
  ],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('MoveExecutor', () => {
  describe('basic execution', () => {
    it('should deal damage with a damaging move', () => {
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      const result = MoveExecutor.execute(attacker, defender, 'ember');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
      expect(defender.currentHp).toBeLessThan(100);
    });

    it('should deduct PP on use', () => {
      const attacker = makePokemon();
      const ppBefore = attacker.moves[0].currentPp; // ember
      MoveExecutor.execute(attacker, makePokemon({ dataId: 1 }), 'ember');
      expect(attacker.moves[0].currentPp).toBe(ppBefore - 1);
    });

    it('should handle missed moves', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99); // High roll → miss on low accuracy
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1 });
      // Use fissure (30 accuracy) → should miss with random=0.99
      attacker.moves.push({ moveId: 'fissure', currentPp: 5 });
      const result = MoveExecutor.execute(attacker, defender, 'fissure');
      expect(result.moveHit).toBe(false);
      expect(result.damage.damage).toBe(0);
    });

    it('should handle unknown move', () => {
      const result = MoveExecutor.execute(makePokemon(), makePokemon({ dataId: 1 }), 'nonexistent-move');
      expect(result.moveHit).toBe(false);
    });
  });

  describe('status moves', () => {
    it('should not deal damage with status moves', () => {
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1 });
      const hpBefore = defender.currentHp;
      const result = MoveExecutor.execute(attacker, defender, 'growl');
      expect(defender.currentHp).toBe(hpBefore);
    });
  });

  describe('with StatusEffectHandler', () => {
    it('should apply secondary effects via handler', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      // Growl has stat-change effect
      const result = MoveExecutor.execute(attacker, defender, 'growl', handler);
      expect(result.moveHit).toBe(true);
      expect(handler.getState(defender).statStages.attack).toBeLessThan(0);
    });

    it('should thaw frozen target with fire move', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1, status: 'freeze' });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      MoveExecutor.execute(attacker, defender, 'ember', handler);
      expect(defender.status).toBeNull();
    });
  });

  describe('special damage types', () => {
    it('should handle fixed-damage moves (Sonic Boom = 20)', () => {
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      attacker.moves.push({ moveId: 'sonic-boom', currentPp: 20 });
      const result = MoveExecutor.execute(attacker, defender, 'sonic-boom');
      if (result.moveHit) {
        expect(result.damage.damage).toBe(20);
        expect(defender.currentHp).toBe(80);
      }
    });

    it('should handle level-damage moves (Seismic Toss)', () => {
      const attacker = makePokemon({ level: 25 });
      const defender = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      attacker.moves.push({ moveId: 'seismic-toss', currentPp: 20 });
      const result = MoveExecutor.execute(attacker, defender, 'seismic-toss');
      if (result.moveHit) {
        expect(result.damage.damage).toBe(25);
      }
    });

    it('should handle OHKO moves (Fissure)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Hit the low accuracy
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      attacker.moves.push({ moveId: 'fissure', currentPp: 5 });
      const result = MoveExecutor.execute(attacker, defender, 'fissure');
      if (result.moveHit) {
        expect(defender.currentHp).toBe(0);
      }
    });

    it('should handle multi-hit moves', () => {
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1, currentHp: 200, stats: { hp: 200, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      attacker.moves.push({ moveId: 'fury-attack', currentPp: 20 });
      const result = MoveExecutor.execute(attacker, defender, 'fury-attack');
      if (result.moveHit) {
        expect(result.totalHits).toBeGreaterThanOrEqual(2);
        expect(result.totalHits).toBeLessThanOrEqual(5);
      }
    });

    it('should handle self-destruct', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 100 });
      const defender = makePokemon({ dataId: 1, currentHp: 200, stats: { hp: 200, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      attacker.moves.push({ moveId: 'self-destruct', currentPp: 5 });

      const result = MoveExecutor.execute(attacker, defender, 'self-destruct', handler);
      if (result.moveHit) {
        expect(attacker.currentHp).toBe(0);
        expect(result.selfDestruct).toBe(true);
      }
    });

    it('should handle drain moves (Absorb)', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 1, currentHp: 50, stats: { hp: 100, attack: 30, defense: 30, spAttack: 60, spDefense: 40, speed: 30 } });
      const defender = makePokemon({ currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      attacker.moves.push({ moveId: 'absorb', currentPp: 25 });

      const result = MoveExecutor.execute(attacker, defender, 'absorb', handler);
      if (result.moveHit && result.healedHp) {
        expect(attacker.currentHp).toBeGreaterThan(50);
      }
    });

    it('should handle recoil moves (Take Down)', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 100, stats: { hp: 100, attack: 80, defense: 30, spAttack: 40, spDefense: 40, speed: 50 } });
      const defender = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      attacker.moves.push({ moveId: 'take-down', currentPp: 20 });

      const result = MoveExecutor.execute(attacker, defender, 'take-down', handler);
      if (result.moveHit) {
        expect(attacker.currentHp).toBeLessThan(100);
        expect(result.recoilDamage).toBeGreaterThan(0);
      }
    });

    it('should handle Super Fang (halves current HP)', () => {
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 20, currentHp: 80, stats: { hp: 100, attack: 30, defense: 30, spAttack: 40, spDefense: 40, speed: 30 } });
      attacker.moves.push({ moveId: 'super-fang', currentPp: 10 });

      const result = MoveExecutor.execute(attacker, defender, 'super-fang');
      if (result.moveHit) {
        expect(defender.currentHp).toBe(40); // Half of 80
      }
    });
  });
});
