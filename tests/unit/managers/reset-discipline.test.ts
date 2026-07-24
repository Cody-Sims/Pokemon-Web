import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  AchievementManager,
  EventManager,
  GameManager,
  PlayerStateManager,
  SaveManager,
  resetManagerSingletons,
} from '@managers';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

describe('manager reset discipline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetManagerSingletons();
  });

  it('resets GameManager and its StatsManager dependency together', () => {
    const gm = GameManager.getInstance();
    gm.addMoney(500);
    expect(gm.getStat('moneyEarned')).toBe(500);

    GameManager.resetInstance();

    const next = GameManager.getInstance();
    expect(next).not.toBe(gm);
    expect(next.getMoney()).toBe(3000);
    expect(next.getStat('moneyEarned')).toBe(0);
  });

  it('resets SaveManager blocked/error state without private field access', () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    const sm = SaveManager.getInstance();
    SaveManager.blockSaves();
    expect(sm.importJson('not-json')).toBe('Save file is not valid JSON.');
    expect(SaveManager.canSave()).toBe(false);
    expect(sm.getLastError()?.type).toBe('json');

    SaveManager.resetInstance();

    const next = SaveManager.getInstance();
    expect(next).not.toBe(sm);
    expect(SaveManager.canSave()).toBe(true);
    expect(next.getLastError()).toBeNull();
  });

  it('clears EventManager listeners when resetting the singleton', () => {
    const handler = vi.fn();
    EventManager.getInstance().on('party-changed', handler);

    EventManager.resetInstance();
    EventManager.getInstance().emit('party-changed');

    expect(handler).not.toHaveBeenCalled();
  });

  it('drops AchievementManager unlock callbacks across reset', () => {
    const callback = vi.fn();
    const manager = AchievementManager.getInstance();
    const achievementId = manager.getAll()[0].id;
    manager.setOnUnlock(callback);

    AchievementManager.resetInstance();
    AchievementManager.getInstance().unlock(achievementId);

    expect(callback).not.toHaveBeenCalled();
  });

  it('constructs PlayerStateManager without touching localStorage until settings are read', () => {
    vi.stubGlobal('localStorage', undefined);
    const player = new PlayerStateManager();

    expect(player.getPlayerName()).toBe('Red');
    expect(() => player.getSettings()).not.toThrow();
  });
});
