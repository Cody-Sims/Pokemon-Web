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

// Game dimensions — fixed internal resolution with 4:3 aspect ratio.
// Phaser's FIT scale mode handles fitting this to ANY screen size while
// preserving the aspect ratio. In landscape the height fills the screen;
// in portrait the width fills the screen. No dynamic resize is needed.
export const GAME_HEIGHT = 480;
export const GAME_WIDTH = 720;

// Keep computeGameWidth for backward compatibility (called by tests/other modules)
export function computeGameWidth(): number {
  return GAME_WIDTH;
}
