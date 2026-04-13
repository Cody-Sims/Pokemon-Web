// ─── Difficulty Mode System ───
// Defines difficulty presets that modify gameplay parameters.

export type DifficultyMode = 'classic' | 'nuzlocke' | 'hard';

export interface DifficultyConfig {
  name: string;
  description: string;
  /** Trainer level offset (added to all trainer Pokémon levels). */
  trainerLevelBoost: number;
  /** Money multiplier for trainer rewards. */
  moneyMultiplier: number;
  /** Whether player can use items during trainer battles. */
  allowItemsInTrainerBattle: boolean;
  /** Whether gym leaders use held items. */
  gymLeadersUseHeldItems: boolean;
  /** Whether AI uses smarter move selection. */
  smartAI: boolean;
  /** Nuzlocke: fainted Pokémon are released. */
  faintedIsReleased: boolean;
  /** Nuzlocke: only first encounter per route can be caught. */
  firstEncounterOnly: boolean;
  /** Nuzlocke: mandatory nicknames on catch. */
  mandatoryNicknames: boolean;
  /** Nuzlocke: game over on full party wipe. */
  gameOverOnWipe: boolean;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  classic: {
    name: 'Classic',
    description: 'The standard Pokémon experience.',
    trainerLevelBoost: 0,
    moneyMultiplier: 1,
    allowItemsInTrainerBattle: true,
    gymLeadersUseHeldItems: false,
    smartAI: false,
    faintedIsReleased: false,
    firstEncounterOnly: false,
    mandatoryNicknames: false,
    gameOverOnWipe: false,
  },
  hard: {
    name: 'Hard Mode',
    description: 'Trainers are stronger, AI is smarter, no items in trainer battles.',
    trainerLevelBoost: 4,
    moneyMultiplier: 0.75,
    allowItemsInTrainerBattle: false,
    gymLeadersUseHeldItems: true,
    smartAI: true,
    faintedIsReleased: false,
    firstEncounterOnly: false,
    mandatoryNicknames: false,
    gameOverOnWipe: false,
  },
  nuzlocke: {
    name: 'Nuzlocke',
    description: 'Fainted = released. First encounter per route only. Game over on wipe.',
    trainerLevelBoost: 0,
    moneyMultiplier: 1,
    allowItemsInTrainerBattle: true,
    gymLeadersUseHeldItems: false,
    smartAI: false,
    faintedIsReleased: true,
    firstEncounterOnly: true,
    mandatoryNicknames: true,
    gameOverOnWipe: true,
  },
};
