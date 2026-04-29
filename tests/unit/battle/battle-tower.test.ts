import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  battleTowerData,
  fullClearBpReward,
  type BattleTowerTier,
} from '../../../frontend/src/data/battle-tower-data';
import {
  computeStreakResume,
  type TowerStreakState,
} from '../../../frontend/src/systems/engine/BattleTowerStreak';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

/**
 * A.1 Battle Tower — verifies the data file shape, the BP-economy helpers
 * on PlayerStateManager, and the pure post-battle resume state-machine
 * (extracted via `BattleTowerScene.computeNextStateForTest`).
 */
describe('Battle Tower (A.1)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    GameManager.getInstance().reset();
  });

  describe('data integrity', () => {
    const cfgs: BattleTowerTier[] = ['normal', 'super', 'rental'];
    it.each(cfgs)('%s tier exposes the required config fields', (tier) => {
      const cfg = battleTowerData[tier];
      expect(cfg.tier).toBe(tier);
      expect(cfg.battlesPerStreak).toBeGreaterThan(0);
      expect(cfg.bpPerWin).toBeGreaterThan(0);
      expect(cfg.bpForTycoon).toBeGreaterThan(0);
    });

    it('Normal and Super tiers have a full roster ending in a tycoon', () => {
      for (const tier of ['normal', 'super'] as const) {
        const cfg = battleTowerData[tier];
        expect(cfg.trainers).toHaveLength(cfg.battlesPerStreak);
        const last = cfg.trainers[cfg.trainers.length - 1];
        expect(last.isTycoon).toBe(true);
      }
    });

    it('full clear reward sums per-win + tycoon correctly for Normal', () => {
      const cfg = battleTowerData.normal;
      expect(fullClearBpReward('normal')).toBe(cfg.bpPerWin * 6 + cfg.bpForTycoon);
    });

    it('rental tier is intentionally locked (empty roster)', () => {
      expect(battleTowerData.rental.trainers).toHaveLength(0);
      expect(fullClearBpReward('rental')).toBe(0);
    });
  });

  describe('BP economy helpers', () => {
    it('starts at 0 BP and addBattlePoints accumulates', () => {
      const gm = GameManager.getInstance();
      expect(gm.getBattlePoints()).toBe(0);
      gm.addBattlePoints(15);
      gm.addBattlePoints(7);
      expect(gm.getBattlePoints()).toBe(22);
    });

    it('addBattlePoints rejects negative / non-finite values', () => {
      const gm = GameManager.getInstance();
      gm.addBattlePoints(-5);
      gm.addBattlePoints(Number.NaN);
      gm.addBattlePoints(Number.POSITIVE_INFINITY);
      expect(gm.getBattlePoints()).toBe(0);
    });

    it('spendBattlePoints debits when funds suffice and refuses overdraft', () => {
      const gm = GameManager.getInstance();
      gm.addBattlePoints(20);
      expect(gm.spendBattlePoints(8)).toBe(true);
      expect(gm.getBattlePoints()).toBe(12);
      expect(gm.spendBattlePoints(50)).toBe(false);
      expect(gm.getBattlePoints()).toBe(12);
    });

    it('recordTowerStreak only updates when the new value is greater', () => {
      const gm = GameManager.getInstance();
      gm.recordTowerStreak('normal', 3);
      gm.recordTowerStreak('normal', 1);
      expect(gm.getTowerBestStreak('normal')).toBe(3);
      gm.recordTowerStreak('normal', 7);
      expect(gm.getTowerBestStreak('normal')).toBe(7);
    });

    it('recordTowerClear increments the lifetime counter', () => {
      const gm = GameManager.getInstance();
      gm.recordTowerClear('normal');
      gm.recordTowerClear('normal');
      expect(gm.getTowerClears('normal')).toBe(2);
      expect(gm.getTowerClears('super')).toBe(0);
    });
  });

  describe('post-battle resume state machine', () => {
    const cfg = battleTowerData.normal;
    const buildState = (): TowerStreakState => ({
      tier: 'normal' as BattleTowerTier,
      battleIndex: 0,
      accumulatedBp: 0,
      exitScene: 'OverworldScene',
      startedPartySize: 1,
    });

    it('wipeout returns no next state and pays out accumulated BP', () => {
      const state = { ...buildState(), battleIndex: 3, accumulatedBp: 9 };
      const out = computeStreakResume(state, 0, cfg, cfg.trainers[3]);
      expect(out.outcome).toBe('wipeout');
      expect(out.nextState).toBeNull();
      expect(out.payout).toBe(9);
    });

    it('mid-streak victory advances index and accumulates per-win BP', () => {
      const state = buildState();
      const out = computeStreakResume(state, 1, cfg, cfg.trainers[0]);
      expect(out.outcome).toBe('continue');
      expect(out.nextState!.battleIndex).toBe(1);
      expect(out.nextState!.accumulatedBp).toBe(cfg.bpPerWin);
      expect(out.payout).toBe(0);
    });

    it('final tycoon victory clears the tier and pays the full bonus', () => {
      const accumulatedBeforeTycoon = cfg.bpPerWin * (cfg.battlesPerStreak - 1);
      const state = {
        ...buildState(),
        battleIndex: cfg.battlesPerStreak - 1,
        accumulatedBp: accumulatedBeforeTycoon,
      };
      const tycoon = cfg.trainers[cfg.battlesPerStreak - 1];
      expect(tycoon.isTycoon).toBe(true);
      const out = computeStreakResume(state, 1, cfg, tycoon);
      expect(out.outcome).toBe('cleared');
      expect(out.nextState).toBeNull();
      expect(out.payout).toBe(accumulatedBeforeTycoon + cfg.bpForTycoon);
      expect(out.payout).toBe(fullClearBpReward('normal'));
    });

    it('non-tycoon battle on the regular slot pays bpPerWin only', () => {
      const state = { ...buildState(), battleIndex: 4, accumulatedBp: 12 };
      const out = computeStreakResume(state, 2, cfg, cfg.trainers[4]);
      expect(out.outcome).toBe('continue');
      expect(out.nextState!.accumulatedBp).toBe(12 + cfg.bpPerWin);
    });
  });
});
