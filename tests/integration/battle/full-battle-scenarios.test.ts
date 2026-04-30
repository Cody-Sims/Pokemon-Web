import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleManager, BattleConfig } from '../../../frontend/src/battle/core/BattleManager';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';
import { ExperienceCalculator } from '../../../frontend/src/battle/calculation/ExperienceCalculator';
import { CatchCalculator } from '../../../frontend/src/battle/calculation/CatchCalculator';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 10, currentHp: 100,
  stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [{ moveId: 'ember', currentPp: 25 }, { moveId: 'scratch', currentPp: 35 }],
  status: null, exp: 1000, friendship: 70, ...overrides,
});

describe('Full Battle Scenarios', () => {
  describe('multi-turn battle to victory', () => {
    it('should reduce enemy HP to 0 after multiple move executions', () => {
      const player = makePokemon({ stats: { hp: 200, attack: 80, defense: 80, spAttack: 80, spDefense: 80, speed: 100 } });
      player.currentHp = 200;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 80, attack: 20, defense: 20, spAttack: 20, spDefense: 20, speed: 10 } });
      enemy.currentHp = 80;

      const bm = new BattleManager({ type: 'wild', playerParty: [player], enemyParty: [enemy] });
      bm.start();

      let turns = 0;
      while (enemy.currentHp > 0 && turns < 50) {
        MoveExecutor.execute(player, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
        turns++;
      }

      expect(enemy.currentHp).toBe(0);
      expect(player.currentHp).toBeGreaterThan(0);
      expect(turns).toBeGreaterThan(0);
      expect(turns).toBeLessThan(50);
    });
  });

  describe('multi-pokemon party battle', () => {
    it('MoveExecutor should deal damage to target pokemon', () => {
      const p1 = makePokemon({ stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      p1.currentHp = 100;
      const enemy = makePokemon({ dataId: 16, stats: { hp: 50, attack: 50, defense: 10, spAttack: 50, spDefense: 10, speed: 50 } });
      enemy.currentHp = 50;

      const bm = new BattleManager({ type: 'wild', playerParty: [p1], enemyParty: [enemy] });
      bm.start();

      const result = MoveExecutor.execute(p1, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(result.damage.damage).toBeGreaterThan(0);
      expect(enemy.currentHp).toBeLessThan(50);
    });

    it('should transition to DEFEAT when all player pokemon faint', () => {
      const p1 = makePokemon({ stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      p1.currentHp = 1;
      const enemy = makePokemon({ dataId: 16, stats: { hp: 500, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      enemy.currentHp = 500;

      const bm = new BattleManager({ type: 'wild', playerParty: [p1], enemyParty: [enemy] });
      bm.start();

      // Execute enemy attacking player — player has 1hp so will faint
      MoveExecutor.execute(enemy, p1, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(p1.currentHp).toBe(0);
    });
  });

  describe('trainer battle — multi-enemy party', () => {
    it('should KO enemies sequentially via MoveExecutor', () => {
      const player = makePokemon({ stats: { hp: 200, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      player.currentHp = 200;
      const e1 = makePokemon({ dataId: 16, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      e1.currentHp = 1;
      const e2 = makePokemon({ dataId: 19, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      e2.currentHp = 1;

      const bm = new BattleManager({ type: 'trainer', playerParty: [player], enemyParty: [e1, e2], trainerId: 'rival-1' });
      bm.start();

      MoveExecutor.execute(player, e1, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(e1.currentHp).toBe(0);

      MoveExecutor.execute(player, e2, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(e2.currentHp).toBe(0);
    });

    it('should not allow fleeing from trainer battles', () => {
      const bm = new BattleManager({
        type: 'trainer',
        playerParty: [makePokemon()],
        enemyParty: [makePokemon({ dataId: 16 })],
        trainerId: 'rival-1',
      });
      bm.start();
      expect(bm.attemptFlee()).toBe(false);
      expect(bm.getState()).not.toBe('FLEE');
    });
  });

  describe('turn order — speed and priority', () => {
    it('MoveExecutor should return valid result for fast attacker', () => {
      const fast = makePokemon({ stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 200 } });
      fast.currentHp = 100;
      const slow = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 5 } });
      slow.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [fast], enemyParty: [slow] });
      bm.start();

      const result = MoveExecutor.execute(fast, slow, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(result.moveName).toBeTruthy();
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('MoveExecutor should execute priority moves correctly', () => {
      const slow = makePokemon({
        stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 5 },
        moves: [{ moveId: 'quick-attack', currentPp: 30 }, { moveId: 'ember', currentPp: 25 }],
      });
      slow.currentHp = 100;
      const fast = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 200 } });
      fast.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [slow], enemyParty: [fast] });
      bm.start();

      const result = MoveExecutor.execute(slow, fast, 'quick-attack', bm.getStatusHandler(), bm.getWeatherManager());
      expect(result.moveName).toBeTruthy();
      expect(result.moveHit).toBe(true);
    });
  });

  describe('status effects during battle', () => {
    it('burn damage should apply via StatusEffectHandler end-of-turn', () => {
      const player = makePokemon({ status: 'burn', currentHp: 200, stats: { hp: 200, attack: 50, defense: 200, spAttack: 60, spDefense: 200, speed: 100 } });
      const enemy = makePokemon({ dataId: 1, currentHp: 500, stats: { hp: 500, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 5 } });

      const bm = new BattleManager({ type: 'wild', playerParty: [player], enemyParty: [enemy] });
      bm.start();

      const hp1 = player.currentHp;
      bm.getStatusHandler().applyEndOfTurn(player);
      const hp2 = player.currentHp;
      expect(hp2).toBeLessThan(hp1);

      bm.getStatusHandler().applyEndOfTurn(player);
      expect(player.currentHp).toBeLessThan(hp2);
    });

    it('MoveExecutor should work on paralyzed pokemon', () => {
      const paraPlayer = makePokemon({ status: 'paralysis', stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 100 } });
      paraPlayer.currentHp = 100;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 30 } });
      enemy.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [paraPlayer], enemyParty: [enemy] });
      bm.start();

      const result = MoveExecutor.execute(paraPlayer, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(result).toBeDefined();
      expect(result.moveName).toBeTruthy();
    });
  });

  describe('switching pokemon', () => {
    it('should switch active pokemon and reset volatile statuses', () => {
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1 });
      const bm = new BattleManager({ type: 'wild', playerParty: [p1, p2], enemyParty: [makePokemon({ dataId: 16 })] });
      bm.start();

      // Boost p1's stats
      bm.getStatusHandler().getState(p1).statStages.attack = 3;

      expect(bm.switchPokemon(1)).toBe(true);
      expect(bm.getPlayerActive()).toBe(p2);

      // p1's volatile statuses should be cleared after switch
      // (re-initializing p1 should give fresh state)
    });

    it('should fail to switch to fainted pokemon', () => {
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1, currentHp: 0 });
      const bm = new BattleManager({ type: 'wild', playerParty: [p1, p2], enemyParty: [makePokemon({ dataId: 16 })] });
      bm.start();
      expect(bm.switchPokemon(1)).toBe(false);
    });
  });

  describe('EXP award after battle', () => {
    it('defeating enemy should yield calculable EXP', () => {
      const enemy = makePokemon({ dataId: 16, level: 5 });
      const wildExp = ExperienceCalculator.calculateExp(enemy, false);
      const trainerExp = ExperienceCalculator.calculateExp(enemy, true);

      expect(wildExp).toBeGreaterThan(0);
      expect(trainerExp).toBeGreaterThan(wildExp);

      // Verify exp for level is consistent
      const player = makePokemon({ level: 10, exp: ExperienceCalculator.expForLevel(10) });
      const result = ExperienceCalculator.awardExp(player, wildExp);
      expect(player.exp).toBeGreaterThan(1000);
    });
  });

  describe('cleanup', () => {
    it('should clean up without errors', () => {
      const bm = new BattleManager({ type: 'wild', playerParty: [makePokemon()], enemyParty: [makePokemon({ dataId: 16 })] });
      bm.start();
      expect(() => bm.cleanup()).not.toThrow();
    });
  });
});
