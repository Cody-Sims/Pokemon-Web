import { ACHIEVEMENTS } from '@data/achievement-data';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: 'story' | 'collection' | 'battle' | 'exploration' | 'challenge';
  icon?: string;
}

/** Singleton manager for tracking unlocked achievements. */
export class AchievementManager {
  private static instance: AchievementManager;
  private unlocked: Set<string> = new Set();
  private onUnlockCallback?: (achievement: AchievementDef) => void;

  private constructor() {}

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Unlock an achievement by id. Returns true if newly unlocked.
   * MED-46: Callers should check the return value — false means the
   * achievement was already unlocked and no toast should be shown.
   */
  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    this.unlocked.add(id);
    if (this.onUnlockCallback) {
      this.onUnlockCallback(def);
    }
    // Check for completionist
    if (id !== 'all-achievements') {
      const nonMeta = ACHIEVEMENTS.filter(a => a.id !== 'all-achievements');
      if (nonMeta.every(a => this.unlocked.has(a.id))) {
        this.unlock('all-achievements');
      }
    }
    return true;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  getAll(): AchievementDef[] {
    return ACHIEVEMENTS;
  }

  getUnlocked(): AchievementDef[] {
    return ACHIEVEMENTS.filter(a => this.unlocked.has(a.id));
  }

  getProgress(): { unlocked: number; total: number } {
    return { unlocked: this.unlocked.size, total: ACHIEVEMENTS.length };
  }

  setOnUnlock(callback: (achievement: AchievementDef) => void): void {
    this.onUnlockCallback = callback;
  }

  // Serialization
  serialize(): string[] {
    return [...this.unlocked];
  }

  deserialize(data: string[]): void {
    this.unlocked = new Set(data);
  }

  reset(): void {
    this.unlocked.clear();
    // AUDIT-048: Clear callback to avoid referencing destroyed scene UI
    this.onUnlockCallback = undefined;
  }
}
