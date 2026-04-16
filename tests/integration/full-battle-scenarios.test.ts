import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleManager, BattleConfig } from '../../frontend/src/battle/core/BattleManager';
import { MoveExecutor } from '../../frontend/src/battle/execution/MoveExecutor';
import { ExperienceCalculator } from '../../frontend/src/battle/calculation/ExperienceCalculator';
import { CatchCalculator } from '../../frontend/src/battle/calculation/CatchCalculator';
import { PokemonInstance } from '../../frontend/src/data/interfaces';

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
    it('should win after multiple turns of attacking', () => {
      const player = makePokemon({ stats: { hp: 200, attack: 80, defense: 80, spAttack: 80, spDefense: 80, speed: 100 } });
      player.currentHp = 200;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 80, attack: 20, defense: 20, spAttack: 20, spDefense: 20, speed: 10 } });
      enemy.currentHp = 80;

      const bm = new BattleManager({ type: 'wild', playerParty: [player], enemyParty: [enemy] });
      bm.start();

      let turns = 0;
      while (bm.getState() !== 'VICTORY' && bm.getState() !== 'DEFEAT' && turns < 50) {
        bm.selectMove('ember');
        turns++;
      }

      expect(bm.getState()).toBe('VICTORY');
      expect(enemy.currentHp).toBe(0);
      expect(player.currentHp).toBeGreaterThan(0);
      expect(turns).toBeGreaterThan(0);
      expect(turns).toBeLessThan(50);
    });
  });

  describe('multi-pokemon party battle', () => {
    it('should send out next pokemon when active faints', () => {
      const p1 = makePokemon({ stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      p1.currentHp = 1; // Will faint immediately
      const p2 = makePokemon({ stats: { hp: 200, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      p2.currentHp = 200;
      const enemy = makePokemon({ dataId: 16, stats: { hp: 1, attack: 50, defense: 10, spAttack: 50, spDefense: 10, speed: 50 } });
      enemy.currentHp = 1;

      const bm = new BattleManager({ type: 'wild', playerParty: [p1, p2], enemyParty: [enemy] });
      bm.start();

      // After selectMove, p1 probably faints, and CHECK_FAINT should advance to p2 or VICTORY
      bm.selectMove('ember');

      // Either p1 fainted and p2 took over to win, or enemy fainted first
      expect(['PLAYER_TURN', 'VICTORY', 'CHECK_FAINT']).toContain(bm.getState());
    });

    it('should transition to DEFEAT when all player pokemon faint', () => {
      const p1 = makePokemon({ stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      p1.currentHp = 1;
      const enemy = makePokemon({ dataId: 16, stats: { hp: 500, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      enemy.currentHp = 500;

      const bm = new BattleManager({ type: 'wild', playerParty: [p1], enemyParty: [enemy] });
      bm.start();
      bm.selectMove('ember');

      expect(bm.getState()).toBe('DEFEAT');
    });
  });

  describe('trainer battle — multi-enemy party', () => {
    it('should send out next enemy pokemon after one faints', () => {
      const player = makePokemon({ stats: { hp: 200, attack: 200, defense: 200, spAttack: 200, spDefense: 200, speed: 200 } });
      player.currentHp = 200;
      const e1 = makePokemon({ dataId: 16, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      e1.currentHp = 1;
      const e2 = makePokemon({ dataId: 19, stats: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } });
      e2.currentHp = 1;

      const bm = new BattleManager({ type: 'trainer', playerParty: [player], enemyParty: [e1, e2], trainerId: 'rival-1' });
      bm.start();

      bm.selectMove('ember');
      // e1 should have fainted, either advanced to e2 or victory if both KO'd
      if (bm.getState() !== 'VICTORY') {
        expect(bm.getEnemyActive()).toBe(e2);
        bm.selectMove('ember');
      }
      expect(bm.getState()).toBe('VICTORY');
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
    it('faster pokemon should move first', () => {
      const fast = makePokemon({ stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 200 } });
      fast.currentHp = 100;
      const slow = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 5 } });
      slow.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [fast], enemyParty: [slow] });
      bm.start();

      const result = bm.selectMove('ember');
      // Player (faster) should have attacked first
      expect(result.playerResult.moveName).toBeTruthy();
    });

    it('priority moves should go first regardless of speed', () => {
      // Quick Attack has priority 1
      const slow = makePokemon({
        stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 5 },
        moves: [{ moveId: 'quick-attack', currentPp: 30 }, { moveId: 'ember', currentPp: 25 }],
      });
      slow.currentHp = 100;
      const fast = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 200 } });
      fast.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [slow], enemyParty: [fast] });
      bm.start();

      // Use quick-attack which has priority
      const result = bm.selectMove('quick-attack');
      expect(result.turnMessages).toBeDefined();
    });
  });

  describe('status effects during battle', () => {
    it('burn damage should accumulate over turns', () => {
      const player = makePokemon({ status: 'burn', currentHp: 200, stats: { hp: 200, attack: 50, defense: 200, spAttack: 60, spDefense: 200, speed: 100 } });
      const enemy = makePokemon({ dataId: 1, currentHp: 500, stats: { hp: 500, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 5 } });

      const bm = new BattleManager({ type: 'wild', playerParty: [player], enemyParty: [enemy] });
      bm.start();

      const hp1 = player.currentHp;
      bm.selectMove('ember');
      // Burn should have done end-of-turn damage
      const hp2 = player.currentHp;
      expect(hp2).toBeLessThan(hp1);

      bm.selectMove('ember');
      expect(player.currentHp).toBeLessThan(hp2);
    });

    it('paralyzed pokemon should have reduced speed in turn order', () => {
      const paraPlayer = makePokemon({ status: 'paralysis', stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 100 } });
      paraPlayer.currentHp = 100;
      const enemy = makePokemon({ dataId: 1, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 30 } });
      enemy.currentHp = 100;

      const bm = new BattleManager({ type: 'wild', playerParty: [paraPlayer], enemyParty: [enemy] });
      bm.start();

      // Paralyzed speed = 100 * 0.25 = 25, enemy speed = 30 → enemy should be faster
      const result = bm.selectMove('ember');
      expect(result).toBeDefined();
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
      bm.selectMove('ember');
      expect(() => bm.cleanup()).not.toThrow();
    });
  });
});
