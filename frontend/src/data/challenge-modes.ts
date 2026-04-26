// ─── Challenge Run Presets ───
// Optional rule layers applied on top of the base difficulty mode.
// Multiple challenge modes can be combined (e.g. Monotype + No Items).
// Each rule is enforced at a single, well-defined gate (party-add, item-use,
// etc.) so the rest of the game stays oblivious.

export type ChallengeMode = 'monotype' | 'soloRun' | 'noItems' | 'minimalCatches';

export interface ChallengeConfig {
  /** Stable id used in saves and UI lists. */
  id: ChallengeMode;
  /** Display name on the New Game checkbox. */
  name: string;
  /** Tooltip / help text shown on the New Game screen. */
  description: string;
  /** Achievement id unlocked when the run is completed under this rule. */
  achievementId: string;
}

export const CHALLENGE_CONFIGS: Record<ChallengeMode, ChallengeConfig> = {
  monotype: {
    id: 'monotype',
    name: 'Monotype',
    description: 'Only Pokémon sharing your starter\u2019s primary type may join your party.',
    achievementId: 'challenge-monotype',
  },
  soloRun: {
    id: 'soloRun',
    name: 'Solo Run',
    description: 'Only your starter Pokémon. No party members may be added or stored.',
    achievementId: 'challenge-solo',
  },
  noItems: {
    id: 'noItems',
    name: 'No Items',
    description: 'Items cannot be used outside Pokémon Centers.',
    achievementId: 'challenge-no-items',
  },
  minimalCatches: {
    id: 'minimalCatches',
    name: 'Minimal Catches',
    description: 'Beat the game with no more than 6 total Pokémon caught.',
    achievementId: 'challenge-minimal',
  },
};

/** Maximum Pokémon catches allowed in `minimalCatches` mode (party size). */
export const MINIMAL_CATCHES_LIMIT = 6;
