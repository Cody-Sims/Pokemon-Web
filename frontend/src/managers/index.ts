import { AchievementManager } from './AchievementManager';
import { AudioManager } from './AudioManager';
import { EventManager } from './EventManager';
import { GameManager } from './GameManager';
import { QuestManager } from './QuestManager';
import { SaveManager } from './SaveManager';
import { StatsManager } from './StatsManager';
import { TransitionManager } from './TransitionManager';

export { AchievementManager } from './AchievementManager';
export type { AchievementDef } from './AchievementManager';
export { AudioManager } from './AudioManager';
export { EventManager } from './EventManager';
export type { EventMap } from './EventManager';
export { GameManager, defaultStats } from './GameManager';
export type { GameStats, HallOfFameEntry, SpeedrunSplit } from './GameManager';
export { PartyManager } from './PartyManager';
export { PlayerStateManager } from './PlayerStateManager';
export { ProgressManager } from './ProgressManager';
export { QuestManager } from './QuestManager';
export {
  CURRENT_SAVE_VERSION,
  SaveDataDeserializationError,
  formatSaveValidationErrors,
  validateSaveData,
} from './SaveCodec';
export type { SaveValidationCode, SaveValidationError, SaveValidationResult } from './SaveCodec';
export { SaveManager } from './SaveManager';
export type { SaveManagerError } from './SaveManager';
export { StatsManager } from './StatsManager';
export { TransitionManager } from './TransitionManager';
export type { SaveData } from './save-types';

export function resetManagerSingletons(): void {
  GameManager.resetInstance();
  StatsManager.resetInstance();
  QuestManager.resetInstance();
  EventManager.resetInstance();
  AchievementManager.resetInstance();
  AudioManager.resetInstance();
  SaveManager.resetInstance();
  TransitionManager.resetInstance();
}
