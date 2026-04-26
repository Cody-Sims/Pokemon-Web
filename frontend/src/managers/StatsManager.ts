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
  private gameStats: GameStats = defaultStats();
  private stepCount = 0;

  /** Reset all stats for a new game. */
  reset(): void {
    this.gameStats = defaultStats();
    this.stepCount = 0;
  }

  // ── Game Stats ─────────────────────────────────────────

  getGameStats(): GameStats { return this.gameStats; }
  incrementStat(key: keyof GameStats, amount = 1): void {
    this.gameStats[key] += amount;
  }
  getStat(key: keyof GameStats): number { return this.gameStats[key]; }

  // ── Step Counter ───────────────────────────────────────

  getStepCount(): number { return this.stepCount; }
  incrementStepCount(): number {
    this.stepCount++;
    return this.stepCount;
  }

  // ── Serialization helpers ──────────────────────────────

  serialize() {
    return {
      gameStats: this.gameStats,
      stepCount: this.stepCount,
    };
  }

  deserialize(data: { gameStats?: GameStats; stepCount?: number }): void {
    if (data.gameStats) this.gameStats = { ...defaultStats(), ...data.gameStats };
    if (data.stepCount != null) this.stepCount = data.stepCount;
  }
}
