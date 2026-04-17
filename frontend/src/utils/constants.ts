// Tile and movement
export const TILE_SIZE = 32;
export const WALK_DURATION = 180; // ms per tile
export const MAX_PARTY_SIZE = 6;
export const MAX_MOVES = 4;

// Battle
export const CRIT_CHANCE = 0.0625; // 6.25%
export const STAB_MULTIPLIER = 1.5;
export const CRIT_MULTIPLIER = 1.5;
export const RANDOM_MIN = 0.85;
export const RANDOM_MAX = 1.0;

// Encounter
export const BASE_ENCOUNTER_RATE = 0.1; // 10% per step in grass
export const SHINY_CHANCE = 1 / 4096;
export const FISHING_ENCOUNTER_RATE = 0.5; // 50% chance on each cast

// EXP
export const TRAINER_EXP_MULTIPLIER = 1.5;

// Game dimensions — height is fixed; width adapts to the device aspect ratio
// so widescreen phones fill the screen instead of showing black bars.
export const GAME_HEIGHT = 600;

/** Compute a game width that matches the device aspect ratio (clamped 4:3 – 21:9). */
export function computeGameWidth(): number {
  if (typeof window === 'undefined') return 800; // SSR / test fallback
  const aspect = window.innerWidth / window.innerHeight;
  // Clamp between 4:3 (1.333) and 21:9 (2.333)
  const clamped = Math.max(4 / 3, Math.min(21 / 9, aspect));
  // Round to nearest even number for pixel-art rendering
  return Math.round((GAME_HEIGHT * clamped) / 2) * 2;
}

export const GAME_WIDTH = computeGameWidth();
