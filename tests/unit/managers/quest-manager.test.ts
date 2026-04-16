import { describe, it, expect, beforeEach } from 'vitest';
import { QuestManager } from '../../../frontend/src/managers/QuestManager';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { questData } from '../../../frontend/src/data/quest-data';

describe('QuestManager', () => {
  let qm: QuestManager;
  let gm: GameManager;

  beforeEach(() => {
    // Reset singletons
    QuestManager.resetInstance();
    (GameManager as unknown as { instance: undefined }).instance = undefined;
    qm = QuestManager.getInstance();
    gm = GameManager.getInstance();
  });

  it('should be a singleton', () => {
    const qm2 = QuestManager.getInstance();
    expect(qm).toBe(qm2);
  });

  it('should return all quests', () => {
    const quests = qm.getAllQuests();
    expect(quests.length).toBeGreaterThan(0);
    expect(quests.length).toBe(Object.keys(questData).length);
  });

  it('should return not-started for new quests', () => {
    expect(qm.getQuestStatus('lost-delivery')).toBe('not-started');
    expect(qm.getQuestStatus('collectors-challenge')).toBe('not-started');
  });

  it('should start a quest and set its flag', () => {
    qm.startQuest('lost-delivery');
    expect(qm.getQuestStatus('lost-delivery')).toBe('active');
    expect(gm.getFlag('quest_lostDelivery_started')).toBe(true);
  });

  it('should track current step', () => {
    qm.startQuest('lost-delivery');
    expect(qm.getCurrentStep('lost-delivery')).toBe(0);

    qm.completeStep('lost-delivery', 0);
    expect(qm.getCurrentStep('lost-delivery')).toBe(1);

    qm.completeStep('lost-delivery', 1);
    expect(qm.getCurrentStep('lost-delivery')).toBe(2);
  });

  it('should complete a quest and grant rewards', () => {
    const initialMoney = gm.getMoney();
    qm.startQuest('lost-delivery');

    // Complete all steps
    qm.completeStep('lost-delivery', 0);
    qm.completeStep('lost-delivery', 1);
    qm.completeQuest('lost-delivery');

    expect(qm.getQuestStatus('lost-delivery')).toBe('complete');
    expect(gm.getMoney()).toBe(initialMoney + 1000);
    expect(gm.getItemCount('rare-candy')).toBe(1);
    expect(gm.getItemCount('super-potion')).toBe(5);
  });

  it('should list active and completed quests', () => {
    qm.startQuest('lost-delivery');
    qm.startQuest('lost-pokemon');

    expect(qm.getActiveQuests().length).toBe(2);
    expect(qm.getCompletedQuests().length).toBe(0);

    qm.completeQuest('lost-delivery');
    expect(qm.getActiveQuests().length).toBe(1);
    expect(qm.getCompletedQuests().length).toBe(1);
  });

  it('should return not-started for unknown quest ids', () => {
    expect(qm.getQuestStatus('nonexistent')).toBe('not-started');
  });

  it('should handle quest definitions correctly', () => {
    const quest = qm.getQuest('lost-delivery');
    expect(quest).toBeDefined();
    expect(quest!.name).toBe('The Lost Delivery');
    expect(quest!.steps.length).toBe(3);
  });

  it('should not fail when completing invalid step index', () => {
    qm.startQuest('lost-delivery');
    qm.completeStep('lost-delivery', -1);
    qm.completeStep('lost-delivery', 99);
    expect(qm.getCurrentStep('lost-delivery')).toBe(0); // unchanged
  });
});

describe('Quest Data Integrity', () => {
  it('all quests should have required fields', () => {
    for (const [id, quest] of Object.entries(questData)) {
      expect(quest.id, `Quest ${id} missing id`).toBe(id);
      expect(quest.name, `Quest ${id} missing name`).toBeTruthy();
      expect(quest.startFlag, `Quest ${id} missing startFlag`).toBeTruthy();
      expect(quest.completeFlag, `Quest ${id} missing completeFlag`).toBeTruthy();
      expect(quest.steps.length, `Quest ${id} has no steps`).toBeGreaterThan(0);
    }
  });

  it('quest flags should be unique', () => {
    const startFlags = new Set<string>();
    const completeFlags = new Set<string>();
    for (const quest of Object.values(questData)) {
      expect(startFlags.has(quest.startFlag), `Duplicate startFlag: ${quest.startFlag}`).toBe(false);
      expect(completeFlags.has(quest.completeFlag), `Duplicate completeFlag: ${quest.completeFlag}`).toBe(false);
      startFlags.add(quest.startFlag);
      completeFlags.add(quest.completeFlag);
    }
  });
});
