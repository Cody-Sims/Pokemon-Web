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

// Game dimensions — both width and height adapt to the device viewport.
// In landscape (desktop/tablet/phone), height is fixed at 600 and width
// scales to match the aspect ratio. In portrait, width is fixed at 400
// and height scales. This ensures zero black bars on any device/orientation.

/** Base height for landscape orientation. */
const LANDSCAPE_HEIGHT = 600;
/** Base width for portrait orientation. */
const PORTRAIT_WIDTH = 400;

/** Compute game dimensions that match the current viewport. */
export function computeGameDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 800, height: 600 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isPortrait = vh > vw;

  if (isPortrait) {
    // Portrait: lock width, compute height from aspect ratio
    const aspect = vh / vw; // > 1
    const clamped = Math.min(aspect, 2.5); // cap at 2.5:1
    const h = Math.round((PORTRAIT_WIDTH * clamped) / 2) * 2;
    return { width: PORTRAIT_WIDTH, height: h };
  }

  // Landscape / desktop: lock height, compute width from aspect ratio
  const aspect = vw / vh;
  const clamped = Math.max(4 / 3, Math.min(21 / 9, aspect));
  const w = Math.round((LANDSCAPE_HEIGHT * clamped) / 2) * 2;
  return { width: w, height: LANDSCAPE_HEIGHT };
}

/** @deprecated Use computeGameDimensions() instead — kept for backward compat. */
export function computeGameWidth(): number {
  return computeGameDimensions().width;
}

const _dims = computeGameDimensions();
export const GAME_WIDTH = _dims.width;
export const GAME_HEIGHT = _dims.height;
