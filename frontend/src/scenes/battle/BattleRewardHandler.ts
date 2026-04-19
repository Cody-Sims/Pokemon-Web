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

  return { messages };
}

export function getContinueMessage(): string {
  return isMobile() ? 'Tap to continue...' : 'Press Enter to continue...';
}
