import { battleTowerData, type BattleTowerTier } from '@data/battle-tower-data';

/** Compute the maximum BP awarded for a full clear of a tier. */
export function fullClearBpReward(tier: BattleTowerTier): number {
  const cfg = battleTowerData[tier];
  if (cfg.trainers.length === 0) return 0;
  return cfg.bpPerWin * (cfg.battlesPerStreak - 1) + cfg.bpForTycoon;
}
