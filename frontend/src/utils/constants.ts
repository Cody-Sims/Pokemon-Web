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

// Game dimensions — height adapts to screen size; width adapts to aspect ratio.
// On small screens (phones in landscape), use lower resolution so tiles appear larger.
function computeGameHeight(): number {
  if (typeof window === 'undefined') return 600;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  // Phone landscape: short side is ~390-430px → use 420 for bigger tiles
  // Tablet/desktop: short side is >500px → use 600 for more visible area
  if (shortSide <= 500) return 420;
  return 600;
}
export const GAME_HEIGHT = computeGameHeight();

/** Compute a game width that matches the device aspect ratio (clamped 4:3 – 21:9).
 *  Always uses landscape orientation (wider dimension) so the game starts correctly
 *  even if the page loads in portrait (phone before rotating). */
export function computeGameWidth(): number {
  if (typeof window === 'undefined') return 800; // SSR / test fallback
  // Use the larger dimension as width to always get a landscape aspect ratio
  const w = Math.max(window.innerWidth, window.innerHeight);
  const h = Math.min(window.innerWidth, window.innerHeight);
  const aspect = w / h;
  // Clamp between 4:3 (1.333) and 21:9 (2.333)
  const clamped = Math.max(4 / 3, Math.min(21 / 9, aspect));
  // Round to nearest even number for pixel-art rendering
  return Math.round((GAME_HEIGHT * clamped) / 2) * 2;
}

export const GAME_WIDTH = computeGameWidth();
