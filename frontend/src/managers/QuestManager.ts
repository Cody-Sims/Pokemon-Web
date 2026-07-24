import { EventManager } from './EventManager';
import { questData, QuestDefinition, QuestStatus } from '@data/quest-data';

interface QuestStateAccess {
  getFlag(flag: string): boolean;
  setFlag(flag: string, value?: boolean): void;
  addItem(itemId: string, qty?: number): boolean;
  addMoney(amount: number): void;
}

/**
 * QuestManager — Tracks quest progress using injected game-state flags.
 * Quests advance when their step completion flags are set.
 * No separate state: everything is derived from persistent game flags.
 */
export class QuestManager {
  private static instance: QuestManager | undefined;
  private static stateAccess?: QuestStateAccess;

  private constructor() {}

  static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  static configureStateAccess(stateAccess: QuestStateAccess): void {
    QuestManager.stateAccess = stateAccess;
  }

  private getStateAccess(): QuestStateAccess {
    if (!QuestManager.stateAccess) {
      throw new Error('QuestManager requires GameManager state access before use');
    }
    return QuestManager.stateAccess;
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

    const state = this.getStateAccess();
    if (state.getFlag(quest.completeFlag)) return 'complete';
    if (state.getFlag(quest.startFlag)) return 'active';
    return 'not-started';
  }

  /** Start a quest (sets its start flag). */
  startQuest(questId: string): void {
    const quest = questData[questId];
    if (!quest) return;
    this.getStateAccess().setFlag(quest.startFlag);
  }

  /** Get the current step index (0-based) for an active quest. */
  getCurrentStep(questId: string): number {
    const quest = questData[questId];
    if (!quest) return 0;

    const state = this.getStateAccess();
    for (let i = 0; i < quest.steps.length; i++) {
      if (!state.getFlag(quest.steps[i].completionFlag)) {
        return i;
      }
    }
    return quest.steps.length; // all steps done
  }

  /** Complete a quest step by setting its flag. */
  completeStep(questId: string, stepIndex: number): void {
    const quest = questData[questId];
    if (!quest || stepIndex < 0 || stepIndex >= quest.steps.length) return;
    this.getStateAccess().setFlag(quest.steps[stepIndex].completionFlag);
  }

  /** Complete an entire quest and apply rewards. Only awards if quest is currently active. */
  completeQuest(questId: string): void {
    const quest = questData[questId];
    if (!quest) return;

    // Guard: only complete if quest is active (prevents double rewards)
    if (this.getQuestStatus(questId) !== 'active') return;

    const state = this.getStateAccess();
    state.setFlag(quest.completeFlag);

    // Award items
    for (const reward of quest.rewards) {
      state.addItem(reward.itemId, reward.quantity);
    }

    // Award money
    if (quest.rewardMoney > 0) {
      state.addMoney(quest.rewardMoney);
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
    QuestManager.instance = undefined;
    QuestManager.stateAccess = undefined;
  }

  private automationInitialized = false;

  /** Reset automation flag so listeners can be re-registered after EventManager clear. */
  resetAutomation(): void {
    this.automationInitialized = false;
  }

  /** Initialize quest automation — call once on game start. Guards against duplicate registration. */
  initAutomation(): void {
    if (this.automationInitialized) return;
    this.automationInitialized = true;

    const em = EventManager.getInstance();

    em.on('flag-set', (flag) => {
      this.checkFlagTriggers(flag);
    });

    em.on('map-entered', (mapKey) => {
      this.checkEventTriggers(`map-entered:${mapKey}`);
    });

    em.on('trainer-defeated', (trainerId) => {
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
      }
    }
    // MED-45: Re-check all active quests for cascading flag completions
    this.checkAllQuestProgress();
  }

  /** Check all active quests for event-triggered step completions. */
  private checkEventTriggers(eventKey: string): void {
    for (const quest of this.getActiveQuests()) {
      const stepIdx = this.getCurrentStep(quest.id);
      if (stepIdx >= quest.steps.length) continue;

      const step = quest.steps[stepIdx];
      if (step.triggerEvent && step.triggerEvent === eventKey) {
        this.completeStep(quest.id, stepIdx);
      }
    }
    // MED-45: Re-check all active quests for cascading flag completions
    this.checkAllQuestProgress();
  }

  /**
   * MED-45: After any trigger, re-check ALL active quests to advance
   * steps whose triggerFlags are already set (handles out-of-order flag sets).
   */
  private checkAllQuestProgress(): void {
    const state = this.getStateAccess();
    for (const quest of this.getActiveQuests()) {
      let stepIdx = this.getCurrentStep(quest.id);
      let advanced = false;
      while (stepIdx < quest.steps.length) {
        const step = quest.steps[stepIdx];
        if (step.triggerFlag && state.getFlag(step.triggerFlag)) {
          this.completeStep(quest.id, stepIdx);
          stepIdx = this.getCurrentStep(quest.id);
          advanced = true;
        } else {
          break;
        }
      }
      if (advanced && stepIdx >= quest.steps.length) {
        this.completeQuest(quest.id);
        EventManager.getInstance().emit('quest-completed', quest.id);
      }
    }
  }
}
