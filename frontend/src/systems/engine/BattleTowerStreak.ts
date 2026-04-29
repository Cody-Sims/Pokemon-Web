/**
 * A.1 Battle Tower — pure post-battle resume state machine.
 *
 * Extracted from {@link BattleTowerScene} so it can be unit-tested without
 * pulling in Phaser. The scene calls into this module on every return from
 * `BattleScene` to advance, end, or wrap up the streak.
 */
import type { BattleTowerTier, BattleTowerTierConfig, TowerTrainer } from '@data/battle-tower-data';

/** Volatile streak state passed through the battle return path. */
export interface TowerStreakState {
  tier: BattleTowerTier;
  /** Zero-based index of the battle the player is about to fight on entry,
   *  or just finished on resume. */
  battleIndex: number;
  /** BP accumulated so far in this run (paid out on full clear or wipeout). */
  accumulatedBp: number;
  /** Where to send the player after the streak ends (lobby return). */
  exitScene: string;
  /** Snapshot of party size at streak start (informational). */
  startedPartySize: number;
}

export type StreakOutcome = 'wipeout' | 'continue' | 'cleared';

export interface StreakResumeResult {
  /** New state to drive the next battle, or `null` once the streak ends. */
  nextState: TowerStreakState | null;
  outcome: StreakOutcome;
  /** BP to credit to the player. Zero for `'continue'`. */
  payout: number;
}

/**
 * Decide how a Battle Tower streak should advance after a battle return.
 *
 * - `aliveCount === 0` → wipeout: streak ends, pay out accumulated BP only.
 * - Otherwise victory: accumulate BP for this battle (tycoon vs regular),
 *   then either continue (next battleIndex) or pay out the full clear.
 */
export function computeStreakResume(
  state: TowerStreakState,
  aliveCount: number,
  cfg: BattleTowerTierConfig,
  trainer: TowerTrainer | undefined,
): StreakResumeResult {
  if (aliveCount === 0) {
    return { nextState: null, outcome: 'wipeout', payout: state.accumulatedBp };
  }
  const isTycoon = trainer?.isTycoon ?? false;
  const earned = isTycoon ? cfg.bpForTycoon : cfg.bpPerWin;
  const next: TowerStreakState = {
    ...state,
    accumulatedBp: state.accumulatedBp + earned,
    battleIndex: state.battleIndex + 1,
  };
  if (next.battleIndex >= cfg.battlesPerStreak) {
    return { nextState: null, outcome: 'cleared', payout: next.accumulatedBp };
  }
  return { nextState: next, outcome: 'continue', payout: 0 };
}
