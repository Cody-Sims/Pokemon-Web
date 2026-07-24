export type MoveTarget = 'single-enemy' | 'both-enemies' | 'single-ally' | 'self' | 'all-adjacent' | 'all';

/** Moves that hit all adjacent Pokemon (both enemies in doubles, may also hit ally). */
export const SPREAD_MOVES = new Set<string>([
  'earthquake', 'surf', 'rock-slide', 'blizzard', 'dazzling-gleam',
  'discharge', 'heat-wave', 'muddy-water', 'sludge-wave', 'hyper-voice',
  'icy-wind', 'razor-leaf', 'swift', 'eruption', 'water-spout',
  'bubble', 'electroweb', 'breaking-swipe', 'bulldoze',
]);

/** Self-targeting moves (recovery, stat-boost on self, etc.) */
export const SELF_TARGET_MOVES = new Set<string>([
  'recover', 'softboiled', 'roost', 'synthesis', 'moonlight', 'morning-sun',
  'swords-dance', 'dragon-dance', 'calm-mind', 'nasty-plot', 'agility',
  'iron-defense', 'amnesia', 'bulk-up', 'quiver-dance', 'shell-smash',
  'curse', 'minimize', 'substitute', 'rest', 'stockpile',
]);
