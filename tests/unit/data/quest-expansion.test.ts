import { describe, it, expect } from 'vitest';
import { questData } from '../../../frontend/src/data/quest-data';
import { itemData } from '../../../frontend/src/data/item-data';

/**
 * A.2 Side-quest expansion — verifies the 8 new quests (#13–#20) are
 * registered with valid structure and that all referenced reward items exist.
 */
describe('Side-quest expansion (A.2)', () => {
  const newQuestIds = [
    'aether-anomalies',
    'photographer',
    'voltorb-tournament',
    'fossil-collector',
    'rooks-redemption',
    'gym-leader-gauntlet',
    'marinas-expedition',
    'synthesis-cure',
  ];

  it('all 8 expansion quests are registered', () => {
    for (const id of newQuestIds) {
      expect(questData[id], `quest ${id} should be defined`).toBeDefined();
    }
  });

  it('each expansion quest has a name, description, ≥1 step, and start/complete flags', () => {
    for (const id of newQuestIds) {
      const q = questData[id]!;
      expect(q.id).toBe(id);
      expect(q.name.length).toBeGreaterThan(0);
      expect(q.description.length).toBeGreaterThan(0);
      expect(q.startFlag).toMatch(/^quest_/);
      expect(q.completeFlag).toMatch(/^quest_/);
      expect(q.steps.length).toBeGreaterThan(0);
      // The overall completion flag must be reachable: at least one step
      // sets it as its completionFlag.
      const completionFlags = q.steps.map(s => s.completionFlag);
      expect(completionFlags, `quest ${id} completeFlag is not driven by any step`).toContain(q.completeFlag);
    }
  });

  it('every reward itemId resolves in item-data', () => {
    for (const id of newQuestIds) {
      const q = questData[id]!;
      for (const reward of q.rewards) {
        expect(itemData[reward.itemId], `quest ${id} rewards unknown item ${reward.itemId}`).toBeDefined();
        expect(reward.quantity).toBeGreaterThan(0);
      }
    }
  });

  it('total quest count is now 20 (12 prior + 8 expansion)', () => {
    expect(Object.keys(questData)).toHaveLength(20);
  });

  it('Fossil Collector cross-references the A.3 fossil item-ball flags', () => {
    const q = questData['fossil-collector']!;
    const triggerFlags = q.steps.map(s => s.triggerFlag);
    expect(triggerFlags).toContain('crystalDepthsClawFossil');
    expect(triggerFlags).toContain('emberMinesWingFossil');
  });

  it('Aether Anomalies covers six distinct survey sites', () => {
    const q = questData['aether-anomalies']!;
    const surveys = q.steps
      .map(s => s.completionFlag)
      .filter(f => /^quest_aetherAnomalies_a\d+$/.test(f));
    expect(new Set(surveys).size).toBe(6);
  });
});
