import { trainerData } from '@data/trainer-data';
import { GameManager } from '@managers/GameManager';
import { EventManager } from '@managers/EventManager';
import { AchievementManager } from '@managers/AchievementManager';
import { isMobile } from '@ui/theme';

export interface RewardResult {
  messages: string[];
}

/** Process trainer battle rewards (money, badges, flags) and return messages. */
export function processTrainerRewards(trainerId: string, victoryFlag?: string): RewardResult {
  const messages: string[] = [];
  const gm = GameManager.getInstance();
  const am = AchievementManager.getInstance();

  const tData = trainerData[trainerId];
  if (tData) {
    gm.defeatTrainer(trainerId);
    EventManager.getInstance().emit('trainer-defeated', trainerId);
    gm.addMoney(tData.rewardMoney);
    messages.push(`You defeated ${tData.name}!`);
    messages.push(`Got ¥${tData.rewardMoney} for winning!`);

    if (tData.victoryFlag) {
      gm.setFlag(tData.victoryFlag);
      EventManager.getInstance().emit('flag-set', tData.victoryFlag);
    }
    if (tData.badgeReward) {
      gm.addBadge(tData.badgeReward);
      const badgeName = tData.badgeReward.charAt(0).toUpperCase() + tData.badgeReward.slice(1);
      messages.push(`You received the ${badgeName} Badge!`);
      // AUDIT-045: Unlock badge achievement
      const badgeCount = gm.getBadges().length;
      AchievementManager.getInstance().unlock(`badge-${badgeCount}`);
    }
    if (tData.dialogue.after.length > 0) {
      messages.push(...tData.dialogue.after);
    }
  }

  if (victoryFlag) {
    gm.setFlag(victoryFlag);
    EventManager.getInstance().emit('flag-set', victoryFlag);
  }

  // ── Battle win achievements ──
  gm.incrementStat('totalBattlesWon');
  const wins = gm.getStat('totalBattlesWon');
  am.unlock('first-battle');
  if (wins >= 10) am.unlock('win-10');
  if (wins >= 50) am.unlock('win-50');
  if (wins >= 100) am.unlock('win-100');

  // Champion achievement: triggered when champion's victoryFlag is set
  if (tData?.victoryFlag === 'defeatedChampion' || victoryFlag === 'defeatedChampion') {
    am.unlock('champion');
    gm.addHallOfFameEntry();
    // Challenge achievements for champion defeat
    if (gm.getDifficulty() === 'nuzlocke') am.unlock('nuzlocke-win');
    if (gm.getDifficulty() === 'hard') am.unlock('hard-mode-win');
    if (gm.getPlaytime() < 36000) am.unlock('under-10-hours');
  }

  // Rival defeat achievement: trainerId starts with 'rival-'
  if (trainerId.startsWith('rival-')) {
    am.unlock('rival-defeat');
  }

  // Sweep achievement: beat a trainer without any party member fainting
  if (tData) {
    const party = gm.getParty();
    if (party.length > 0 && party.every(p => p.currentHp > 0)) {
      am.unlock('sweep-trainer');
      // No-faint gym run: perfect gym leader battle
      if (tData.badgeReward) {
        am.unlock('no-faint-gym');
      }
    }
  }

  return { messages };
}

export function getContinueMessage(): string {
  return isMobile() ? 'Tap to continue...' : 'Press Enter to continue...';
}
