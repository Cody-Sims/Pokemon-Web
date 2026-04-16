import { GameManager } from './GameManager';
import { EventManager } from './EventManager';
import { questData, QuestDefinition, QuestStatus } from '@data/quest-data';

/**
 * QuestManager — Tracks quest progress using GameManager flags.
 * Quests advance when their step completion flags are set.
 * No separate state: everything is derived from GameManager.flags.
 */
export class QuestManager {
  private static instance: QuestManager;

  private constructor() {}

  static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  /** Get a quest definition by id. */
  getQuest(questId: string): QuestDefinition | undefined {
    return questData[questId];
  }

  /** Get all quest definitions. */
  getAllQuests(): QuestDefinition[] {
    return Object.values(questData);
  }

  /** Get the status of a quest. */
  getQuestStatus(questId: string): QuestStatus {
    const quest = questData[questId];
    if (!quest) return 'not-started';

    const gm = GameManager.getInstance();
    if (gm.getFlag(quest.completeFlag)) return 'complete';
    if (gm.getFlag(quest.startFlag)) return 'active';
    return 'not-started';
  }

  /** Start a quest (sets its start flag). */
  startQuest(questId: string): void {
    const quest = questData[questId];
    if (!quest) return;
    GameManager.getInstance().setFlag(quest.startFlag);
  }

  /** Get the current step index (0-based) for an active quest. */
  getCurrentStep(questId: string): number {
    const quest = questData[questId];
    if (!quest) return 0;

    const gm = GameManager.getInstance();
    for (let i = 0; i < quest.steps.length; i++) {
      if (!gm.getFlag(quest.steps[i].completionFlag)) {
        return i;
      }
    }
    return quest.steps.length; // all steps done
  }

  /** Complete a quest step by setting its flag. */
  completeStep(questId: string, stepIndex: number): void {
    const quest = questData[questId];
    if (!quest || stepIndex < 0 || stepIndex >= quest.steps.length) return;
    GameManager.getInstance().setFlag(quest.steps[stepIndex].completionFlag);
  }

  /** Complete an entire quest and apply rewards. */
  completeQuest(questId: string): void {
    const quest = questData[questId];
    if (!quest) return;

    const gm = GameManager.getInstance();
    gm.setFlag(quest.completeFlag);

    // Award items
    for (const reward of quest.rewards) {
      gm.addItem(reward.itemId, reward.quantity);
    }

    // Award money
    if (quest.rewardMoney > 0) {
      gm.addMoney(quest.rewardMoney);
    }
  }

  /** Get all active quests. */
  getActiveQuests(): QuestDefinition[] {
    return this.getAllQuests().filter(q => this.getQuestStatus(q.id) === 'active');
  }

  /** Get all completed quests. */
  getCompletedQuests(): QuestDefinition[] {
    return this.getAllQuests().filter(q => this.getQuestStatus(q.id) === 'complete');
  }

  /** Reset singleton (for testing). */
  static resetInstance(): void {
    QuestManager.instance = undefined as unknown as QuestManager;
  }

  /** Initialize quest automation — call once on game start. */
  initAutomation(): void {
    const em = EventManager.getInstance();

    em.on('flag-set', (flag: unknown) => {
      this.checkFlagTriggers(flag as string);
    });

    em.on('map-entered', (mapKey: unknown) => {
      this.checkEventTriggers(`map-entered:${mapKey}`);
    });

    em.on('trainer-defeated', (trainerId: unknown) => {
      this.checkEventTriggers(`trainer-defeated:${trainerId}`);
    });
  }

  /** Check all active quests for flag-triggered step completions. */
  private checkFlagTriggers(flag: string): void {
    for (const quest of this.getActiveQuests()) {
      const stepIdx = this.getCurrentStep(quest.id);
      if (stepIdx >= quest.steps.length) continue;

      const step = quest.steps[stepIdx];
      if (step.triggerFlag && step.triggerFlag === flag) {
        this.completeStep(quest.id, stepIdx);

        if (this.getCurrentStep(quest.id) >= quest.steps.length) {
          this.completeQuest(quest.id);
          EventManager.getInstance().emit('quest-completed', quest.id);
        }
      }
    }
  }

  /** Check all active quests for event-triggered step completions. */
  private checkEventTriggers(eventKey: string): void {
    for (const quest of this.getActiveQuests()) {
      const stepIdx = this.getCurrentStep(quest.id);
      if (stepIdx >= quest.steps.length) continue;

      const step = quest.steps[stepIdx];
      if (step.triggerEvent && step.triggerEvent === eventKey) {
        this.completeStep(quest.id, stepIdx);

        if (this.getCurrentStep(quest.id) >= quest.steps.length) {
          this.completeQuest(quest.id);
          EventManager.getInstance().emit('quest-completed', quest.id);
        }
      }
    }
  }
}
