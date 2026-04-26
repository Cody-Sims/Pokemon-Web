import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';

describe('GameManager — speed-run splits', () => {
  beforeEach(() => {
    // @ts-expect-error reset singleton for isolation
    GameManager.instance = undefined;
  });

  it('records a split the first time a badge is added and ignores duplicates', () => {
    const gm = GameManager.getInstance();
    gm.addBadge('flame');
    gm.addBadge('flame'); // duplicate
    gm.addBadge('tide');

    const splits = gm.getSpeedrunSplits();
    expect(splits.map(s => s.id)).toEqual(['badge:flame', 'badge:tide']);
    expect(splits[0].label).toBe('Flame Badge');
    expect(splits[1].label).toBe('Tide Badge');
  });

  it('records a champion split and is idempotent', () => {
    const gm = GameManager.getInstance();
    gm.addHallOfFameEntry();
    gm.addHallOfFameEntry();

    const championSplits = gm.getSpeedrunSplits().filter(s => s.id === 'champion');
    expect(championSplits.length).toBe(1);
    expect(championSplits[0].label).toBe('Champion Defeated');
  });

  it('captures playtime at split time', () => {
    const gm = GameManager.getInstance();
    gm.addPlaytime(120);
    gm.addBadge('flame');
    gm.addPlaytime(60);
    gm.addBadge('tide');

    const splits = gm.getSpeedrunSplits();
    expect(splits[0].playtime).toBe(120);
    expect(splits[1].playtime).toBe(180);
  });

  it('manual recordSpeedrunSplit is rejected for duplicate ids', () => {
    const gm = GameManager.getInstance();
    expect(gm.recordSpeedrunSplit('milestone:1', 'First Town')).not.toBeNull();
    expect(gm.recordSpeedrunSplit('milestone:1', 'First Town again')).toBeNull();
  });

  it('reset clears recorded splits', () => {
    const gm = GameManager.getInstance();
    gm.addBadge('flame');
    expect(gm.getSpeedrunSplits().length).toBeGreaterThan(0);
    gm.reset();
    expect(gm.getSpeedrunSplits().length).toBe(0);
  });
});
