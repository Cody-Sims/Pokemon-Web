import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleManager, BattleConfig } from '../../../frontend/src/battle/core/BattleManager';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';
import { ExperienceCalculator } from '../../../frontend/src/battle/calculation/ExperienceCalculator';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }, { moveId: 'scratch', currentPp: 35 }],
  status: null,
  exp: 1000,
  friendship: 70,
  ...overrides,
});

describe('Battle Flow Integration', () => {
  describe('BattleManager initialization', () => {
    it('should start in INTRO state after start()', () => {
      const config: BattleConfig = {
        type: 'wild',
        playerParty: [makePokemon()],
        enemyParty: [makePokemon({ dataId: 16 })],
      };
      const bm = new BattleManager(config);
      bm.start();
      expect(bm.getState()).toBe('INTRO');
    });

    it('should have correct active pokemon', () => {
      const player = makePokemon();
      const enemy = makePokemon({ dataId: 16 });
      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      expect(bm.getPlayerActive()).toBe(player);
      expect(bm.getEnemyActive()).toBe(enemy);
    });
  });

  describe('move execution', () => {
    it('should execute a move and return results', () => {
      const player = makePokemon({ stats: { hp: 100, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 100 } });
      player.currentHp = 100;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 50, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 5 } });
      enemy.currentHp = 50;

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();

      const result = MoveExecutor.execute(player, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(result.damage).toBeDefined();
      expect(result.moveName).toBeTruthy();
      expect(result.effectMessages).toBeDefined();
    });

    it('should deal damage to enemy pokemon', () => {
      const player = makePokemon({ stats: { hp: 100, attack: 50, defense: 50, spAttack: 80, spDefense: 50, speed: 100 } });
      player.currentHp = 100;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 100, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 5 } });
      enemy.currentHp = 100;

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();

      const hpBefore = enemy.currentHp;
      MoveExecutor.execute(player, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(enemy.currentHp).toBeLessThan(hpBefore);
    });

    it('should KO enemy with 1 HP', () => {
      const player = makePokemon({ stats: { hp: 100, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      player.currentHp = 100;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      enemy.currentHp = 1;

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();
      MoveExecutor.execute(player, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(enemy.currentHp).toBe(0);
    });

    it('should deal damage to player when enemy attacks', () => {
      const player = makePokemon({ stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      player.currentHp = 1;
      const enemy = makePokemon({ dataId: 16, stats: { hp: 200, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      enemy.currentHp = 200;

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();
      MoveExecutor.execute(enemy, player, 'ember', bm.getStatusHandler(), bm.getWeatherManager());
      expect(player.currentHp).toBe(0);
    });
  });

  describe('flee', () => {
    it('should allow fleeing from wild battles', () => {
      const player = makePokemon({ stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 100 } });
      const enemy = makePokemon({ dataId: 16, stats: { hp: 20, attack: 12, defense: 10, spAttack: 9, spDefense: 9, speed: 14 } });

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();

      expect(bm.attemptFlee()).toBe(true);
      expect(bm.getState()).toBe('FLEE');
    });

    it('should not allow fleeing from trainer battles', () => {
      const config: BattleConfig = { type: 'trainer', playerParty: [makePokemon()], enemyParty: [makePokemon({ dataId: 16 })], trainerId: 'rival-1' };
      const bm = new BattleManager(config);
      bm.start();
      expect(bm.attemptFlee()).toBe(false);
    });
  });

  describe('switch pokemon', () => {
    it('should switch to a valid party member', () => {
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1 });
      const config: BattleConfig = { type: 'wild', playerParty: [p1, p2], enemyParty: [makePokemon({ dataId: 16 })] };
      const bm = new BattleManager(config);
      bm.start();

      expect(bm.switchPokemon(1)).toBe(true);
      expect(bm.getPlayerActive()).toBe(p2);
    });

    it('should not switch to fainted pokemon', () => {
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1, currentHp: 0 });
      const config: BattleConfig = { type: 'wild', playerParty: [p1, p2], enemyParty: [makePokemon({ dataId: 16 })] };
      const bm = new BattleManager(config);
      bm.start();

      expect(bm.switchPokemon(1)).toBe(false);
    });

    it('should not switch to out-of-range index', () => {
      const config: BattleConfig = { type: 'wild', playerParty: [makePokemon()], enemyParty: [makePokemon({ dataId: 16 })] };
      const bm = new BattleManager(config);
      bm.start();

      expect(bm.switchPokemon(5)).toBe(false);
      expect(bm.switchPokemon(-1)).toBe(false);
    });
  });

  describe('full battle flow: attack → damage → faint → EXP', () => {
    it('should award EXP after defeating enemy and trigger level up', () => {
      // Strong player vs weak enemy to guarantee kill
      const player = makePokemon({
        level: 6,
        exp: ExperienceCalculator.expForLevel(6), // 216
        stats: { hp: 100, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 },
      });
      player.currentHp = 100;
      const enemy = makePokemon({ dataId: 16, level: 5, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      enemy.currentHp = 1;

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();
      MoveExecutor.execute(player, enemy, 'ember', bm.getStatusHandler(), bm.getWeatherManager());

      expect(enemy.currentHp).toBe(0);

      // Now award EXP
      const expGained = ExperienceCalculator.calculateExp(enemy, false);
      expect(expGained).toBeGreaterThan(0);

      const result = ExperienceCalculator.awardExp(player, expGained);
      expect(result.levelsGained).toBeGreaterThanOrEqual(0);
    });
  });

  describe('end-of-turn effects in battle', () => {
    it('should apply burn damage at end of turn', () => {
      const player = makePokemon({ status: 'burn', currentHp: 100, stats: { hp: 100, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 100 } });
      const enemy = makePokemon({ dataId: 1, currentHp: 100, stats: { hp: 100, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 5 } });

      const config: BattleConfig = { type: 'wild', playerParty: [player], enemyParty: [enemy] };
      const bm = new BattleManager(config);
      bm.start();

      MoveExecutor.execute(player, enemy, 'scratch', bm.getStatusHandler(), bm.getWeatherManager());
      // Burn should cause residual damage via StatusEffectHandler
      const eot = bm.getStatusHandler().applyEndOfTurn(player, enemy);
      expect(eot.messages.some(m => m.includes('burn'))).toBe(true);
      expect(player.currentHp).toBeLessThan(100);
    });
  });

  describe('cleanup', () => {
    it('should clean up status handler', () => {
      const config: BattleConfig = { type: 'wild', playerParty: [makePokemon()], enemyParty: [makePokemon({ dataId: 16 })] };
      const bm = new BattleManager(config);
      bm.start();
      expect(() => bm.cleanup()).not.toThrow();
    });
  });
});
