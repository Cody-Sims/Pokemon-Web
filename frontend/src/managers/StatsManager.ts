export interface GameStats {
  totalBattlesWon: number;
  totalBattlesLost: number;
  wildBattles: number;
  trainerBattles: number;
  totalCatches: number;
  totalSteps: number;
  moneyEarned: number;
  moneySpent: number;
  pokemonEvolved: number;
  criticalHits: number;
  highestDamage: number;
  superEffectiveHits: number;
}

export function defaultStats(): GameStats {
  return {
    totalBattlesWon: 0, totalBattlesLost: 0, wildBattles: 0,
    trainerBattles: 0, totalCatches: 0, totalSteps: 0,
    moneyEarned: 0, moneySpent: 0, pokemonEvolved: 0,
    criticalHits: 0, highestDamage: 0, superEffectiveHits: 0,
  };
}

/**
 * Manages game statistics and the step counter.
 * Extracted from GameManager to separate stats concerns.
 */
export class StatsManager {
  private static instance: StatsManager;
  private gameStats: GameStats = defaultStats();
  private stepCount = 0;

  static getInstance(): StatsManager {
    if (!StatsManager.instance) {
      StatsManager.instance = new StatsManager();
    }
    return StatsManager.instance;
  }

  /** Reset singleton (for testing). */
  static resetInstance(): void {
    StatsManager.instance = undefined as unknown as StatsManager;
  }

  /** Reset all stats for a new game. */
  reset(): void {
    this.gameStats = defaultStats();
    this.stepCount = 0;
  }

  // ── Game Stats ─────────────────────────────────────────

  getGameStats(): GameStats { return { ...this.gameStats }; }
  incrementStat(key: keyof GameStats, amount = 1): void {
    this.gameStats[key] += amount;
  }
  getStat(key: keyof GameStats): number { return this.gameStats[key]; }

  /** Record a max-value stat (e.g. highestDamage). Only updates if value exceeds current. */
  recordMax(key: keyof GameStats, value: number): void {
    if (value > (this.gameStats[key] ?? 0)) {
      this.gameStats[key] = value;
    }
  }

  // ── Step Counter ───────────────────────────────────────

  getStepCount(): number { return this.stepCount; }
  incrementStepCount(): number {
    this.stepCount++;
    this.incrementStat('totalSteps', 1);
    return this.stepCount;
  }

  // ── Serialization helpers ──────────────────────────────

  serialize() {
    return {
      gameStats: this.gameStats,
      stepCount: this.stepCount,
    };
  }

  deserialize(data: { gameStats?: Record<string, number> | Partial<GameStats>; stepCount?: number }): void {
    if (data.gameStats) {
      // Merge only known keys onto defaults so missing or extra fields
      // don't produce NaN on increment (fixes the `as GameStats` cast issue).
      const defaults = defaultStats();
      const merged = { ...defaults };
      for (const key of Object.keys(defaults) as (keyof GameStats)[]) {
        const val = (data.gameStats as Record<string, number>)[key];
        if (typeof val === 'number') merged[key] = val;
      }
      this.gameStats = merged;
    }
    if (data.stepCount != null) this.stepCount = data.stepCount;
  }
}
