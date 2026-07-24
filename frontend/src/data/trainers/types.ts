import type { MoveId } from '@data/moves';

export interface TrainerData {
  id: string;
  name: string;
  spriteKey: string;
  party: { pokemonId: number; level: number; moves?: MoveId[] }[];
  dialogue: { before: string[]; after: string[] };
  rewardMoney: number;
  isDouble?: boolean;
  /** Flag to set when this trainer is defeated. */
  victoryFlag?: string;
  /** Badge to award when this trainer is defeated (gym leaders). */
  badgeReward?: string;
  /** If true, this is a post-game rematch variant. */
  isRematch?: boolean;
  /** If true, this trainer uses Synthesis Mode on one of their Pokémon. */
  useSynthesis?: boolean;
  /** Party slot index (0-based) for Synthesis activation. */
  synthesisSlot?: number;
}
