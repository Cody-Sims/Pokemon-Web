import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeedrunRecords } from '../../../frontend/src/systems/engine/SpeedrunRecords';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

/**
 * B.3 — personal-best tracking + JSON export for speed-run splits.
 */
describe('Speed-run records (B.3)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    SpeedrunRecords.clear();
    GameManager.getInstance().reset();
  });

  describe('personal-best tracking', () => {
    it('starts empty', () => {
      expect(SpeedrunRecords.getAll()).toEqual({});
      expect(SpeedrunRecords.get('badge1')).toBeNull();
    });

    it('records a first-ever PB and refuses worse submissions', () => {
      const first = SpeedrunRecords.recordIfBetter('badge1', 'Boulder Badge', 1200);
      expect(first).not.toBeNull();
      expect(first!.playtime).toBe(1200);

      const slower = SpeedrunRecords.recordIfBetter('badge1', 'Boulder Badge', 1500);
      expect(slower).toBeNull();
      expect(SpeedrunRecords.get('badge1')!.playtime).toBe(1200);
    });

    it('overwrites only when strictly faster', () => {
      SpeedrunRecords.recordIfBetter('champion', 'Champion', 18000);
      const equal = SpeedrunRecords.recordIfBetter('champion', 'Champion', 18000);
      expect(equal).toBeNull();
      const faster = SpeedrunRecords.recordIfBetter('champion', 'Champion', 17000);
      expect(faster).not.toBeNull();
      expect(SpeedrunRecords.get('champion')!.playtime).toBe(17000);
    });

    it('rejects negative or non-finite playtimes', () => {
      expect(SpeedrunRecords.recordIfBetter('x', 'X', -1)).toBeNull();
      expect(SpeedrunRecords.recordIfBetter('x', 'X', NaN)).toBeNull();
      expect(SpeedrunRecords.recordIfBetter('x', 'X', Infinity)).toBeNull();
      expect(SpeedrunRecords.get('x')).toBeNull();
    });

    it('PlayerStateManager.recordSpeedrunSplit updates the lifetime PB store', () => {
      const gm = GameManager.getInstance();
      gm.addPlaytime(900);
      const split = gm.recordSpeedrunSplit('badge2', 'Cascade Badge');
      expect(split).not.toBeNull();
      const pb = SpeedrunRecords.get('badge2');
      expect(pb).not.toBeNull();
      expect(pb!.playtime).toBe(900);
    });
  });

  describe('JSON export', () => {
    it('produces a versioned payload combining run splits and PBs', () => {
      SpeedrunRecords.recordIfBetter('badge1', 'Boulder Badge', 1200);
      const splits = [{ id: 'badge1', label: 'Boulder Badge', playtime: 1500, timestamp: 9 }];
      const json = SpeedrunRecords.exportJson({ playerName: 'Red' }, splits);
      const parsed = JSON.parse(json);
      expect(parsed.schema).toBe('pokemon-aurum-speedrun/v1');
      expect(parsed.run.playerName).toBe('Red');
      expect(parsed.currentRunSplits).toHaveLength(1);
      expect(parsed.personalBests.badge1.playtime).toBe(1200);
      expect(typeof parsed.exportedAt).toBe('number');
    });
  });
});
