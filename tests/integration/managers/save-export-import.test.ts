import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../../../frontend/src/managers/SaveManager';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

describe('SaveManager — export / import (plan.md D.6)', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // @ts-expect-error reset singletons
    GameManager.instance = undefined;
    // @ts-expect-error reset singletons
    SaveManager.instance = undefined;
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('exportJson returns valid JSON containing the player name', () => {
    const gm = GameManager.getInstance();
    gm.setPlayerName('Cody');
    gm.addBadge('flame');
    const sm = SaveManager.getInstance();

    const json = sm.exportJson();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.playerName).toBe('Cody');
    expect(parsed.badges).toContain('flame');
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('importJson rejects non-JSON input', () => {
    const sm = SaveManager.getInstance();
    expect(sm.importJson('not json{')).toMatch(/JSON/);
  });

  it('importJson rejects an array (must be top-level object)', () => {
    const sm = SaveManager.getInstance();
    expect(sm.importJson('[]')).toMatch(/object/);
  });

  it('importJson rejects a save missing required fields', () => {
    const sm = SaveManager.getInstance();
    const result = sm.importJson(JSON.stringify({ playerName: 'X' }));
    expect(result).toMatch(/missing required field/);
  });

  it('importJson rejects a save with a future version', () => {
    const sm = SaveManager.getInstance();
    const future = JSON.stringify({
      version: 9999, playerName: 'X', party: [], badges: [], flags: {},
    });
    expect(sm.importJson(future)).toMatch(/newer/);
  });

  it('export then import round-trips the player name and badges', () => {
    const gm = GameManager.getInstance();
    gm.setPlayerName('Echo');
    gm.addBadge('flame');
    gm.addBadge('tide');
    const sm = SaveManager.getInstance();
    const exported = sm.exportJson();

    // Reset and import
    // @ts-expect-error
    GameManager.instance = undefined;
    const err = sm.importJson(exported);
    expect(err).toBeNull();

    const restored = GameManager.getInstance();
    expect(restored.getPlayerName()).toBe('Echo');
    expect(restored.getBadges().sort()).toEqual(['flame', 'tide'].sort());
  });
});
