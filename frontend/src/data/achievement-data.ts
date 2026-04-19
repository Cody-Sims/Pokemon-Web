import { AchievementDef } from '@managers/AchievementManager';

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Story (10) ──
  { id: 'first-pokemon', name: 'First Partner', description: 'Get your first Pokémon', category: 'story', icon: '🥚' },
  { id: 'badge-1', name: 'Boulder Badge', description: 'Earn the Boulder Badge', category: 'story', icon: '🪨' },
  { id: 'badge-2', name: 'Tide Badge', description: 'Earn the Tide Badge', category: 'story', icon: '💧' },
  { id: 'badge-3', name: 'Anvil Badge', description: 'Earn the Anvil Badge', category: 'story', icon: '⚡' },
  { id: 'badge-4', name: 'Canopy Badge', description: 'Earn the Canopy Badge', category: 'story', icon: '🌈' },
  { id: 'badge-5', name: 'Circuit Badge', description: 'Earn the Circuit Badge', category: 'story', icon: '💜' },
  { id: 'badge-6', name: 'Phantom Badge', description: 'Earn the Phantom Badge', category: 'story', icon: '🔮' },
  { id: 'badge-7', name: 'Scale Badge', description: 'Earn the Scale Badge', category: 'story', icon: '🌋' },
  { id: 'badge-8', name: 'Ember Badge', description: 'Earn the Ember Badge', category: 'story', icon: '🌍' },
  { id: 'champion', name: 'Champion', description: 'Become the Champion', category: 'story', icon: '👑' },

  // ── Collection (10) ──
  { id: 'catch-10', name: 'Bug Catcher', description: 'Catch 10 Pokémon', category: 'collection', icon: '🔟' },
  { id: 'catch-50', name: 'Collector', description: 'Catch 50 Pokémon', category: 'collection', icon: '📦' },
  { id: 'catch-100', name: 'Great Collector', description: 'Catch 100 Pokémon', category: 'collection', icon: '🏅' },
  { id: 'catch-all', name: 'Pokédex Complete', description: 'Complete the Pokédex (151)', category: 'collection', icon: '📕' },
  { id: 'shiny-catch', name: 'Shiny Hunter', description: 'Catch a Shiny Pokémon', category: 'collection', icon: '✨' },
  { id: 'full-party', name: 'Full House', description: 'Have a full party of 6', category: 'collection', icon: '🏠' },
  { id: 'evolve-first', name: 'Evolution!', description: 'Evolve a Pokémon for the first time', category: 'collection', icon: '🔄' },
  { id: 'all-starters', name: 'Starter Trio', description: 'Obtain all 3 starter Pokémon', category: 'collection', icon: '🌱' },
  { id: 'legendary-catch', name: 'Legendary Tamer', description: 'Catch a Legendary Pokémon', category: 'collection', icon: '⭐' },
  { id: 'synthesis-first', name: 'Synthesizer', description: 'Activate Synthesis Mode for the first time', category: 'collection', icon: '🧬' },

  // ── Battle (15) ──
  { id: 'first-battle', name: 'First Victory', description: 'Win your first battle', category: 'battle', icon: '⚔️' },
  { id: 'win-10', name: 'Battler', description: 'Win 10 battles', category: 'battle', icon: '🥊' },
  { id: 'win-50', name: 'Veteran', description: 'Win 50 battles', category: 'battle', icon: '🎖️' },
  { id: 'win-100', name: 'Battle Master', description: 'Win 100 battles', category: 'battle', icon: '🏆' },
  { id: 'critical-hit', name: 'Critical Strike', description: 'Land a critical hit', category: 'battle', icon: '💥' },
  { id: 'one-hit-ko', name: 'One-Hit KO', description: 'Defeat a Pokémon in one hit', category: 'battle', icon: '💀' },
  { id: 'survive-1hp', name: 'Clutch!', description: 'Survive with 1 HP (friendship)', category: 'battle', icon: '❤️' },
  { id: 'sweep-trainer', name: 'Flawless Victory', description: 'Beat a trainer without losing any Pokémon', category: 'battle', icon: '🧹' },
  { id: 'type-master', name: 'Type Master', description: 'Win using super effective moves only', category: 'battle', icon: '🎯' },
  { id: 'underdog-win', name: 'Underdog', description: 'Beat a Pokémon 10+ levels higher', category: 'battle', icon: '💪' },
  { id: 'catch-first-ball', name: 'Perfect Throw', description: 'Catch with the first ball thrown', category: 'battle', icon: '🎱' },
  { id: 'full-team-faint', name: 'White Out', description: 'All your Pokémon faint', category: 'battle', icon: '😵' },
  { id: 'status-master', name: 'Status Master', description: 'Win using only status moves', category: 'battle', icon: '🧪' },
  { id: 'first-double', name: 'Double Trouble', description: 'Win a double battle', category: 'battle', icon: '👥' },
  { id: 'rival-defeat', name: 'Rival Conquered', description: 'Beat your rival', category: 'battle', icon: '🤝' },

  // ── Exploration (10) ──
  { id: 'first-town', name: 'Explorer', description: 'Visit your first town', category: 'exploration', icon: '🏘️' },
  { id: 'all-towns', name: 'World Traveler', description: 'Visit all towns', category: 'exploration', icon: '🗺️' },
  { id: 'first-cave', name: 'Spelunker', description: 'Enter a cave', category: 'exploration', icon: '🕳️' },
  { id: 'hidden-item', name: 'Treasure Hunter', description: 'Find a hidden item', category: 'exploration', icon: '🔍' },
  { id: 'surf-first', name: 'Surfer', description: 'Use Surf for the first time', category: 'exploration', icon: '🏄' },
  { id: 'steps-1000', name: 'Walker', description: 'Walk 1,000 steps', category: 'exploration', icon: '👟' },
  { id: 'steps-10000', name: 'Hiker', description: 'Walk 10,000 steps', category: 'exploration', icon: '🥾' },
  { id: 'steps-100000', name: 'Marathon Runner', description: 'Walk 100,000 steps', category: 'exploration', icon: '🏃' },
  { id: 'use-bicycle', name: 'Cyclist', description: 'Ride the bicycle', category: 'exploration', icon: '🚲' },
  { id: 'fish-catch', name: 'Angler', description: 'Catch a Pokémon by fishing', category: 'exploration', icon: '🎣' },

  // ── Challenge (5) ──
  { id: 'nuzlocke-win', name: 'Nuzlocke Champion', description: 'Beat the Champion in Nuzlocke mode', category: 'challenge', icon: '☠️' },
  { id: 'hard-mode-win', name: 'Hard Mode Champion', description: 'Beat the Champion in Hard mode', category: 'challenge', icon: '🔥' },
  { id: 'under-10-hours', name: 'Speedrunner', description: 'Beat the Champion in under 10 hours', category: 'challenge', icon: '⏱️' },
  { id: 'no-faint-gym', name: 'Perfect Gym Run', description: 'Beat a gym without any fainting', category: 'challenge', icon: '🛡️' },
  { id: 'all-achievements', name: 'Completionist', description: 'Unlock all other achievements', category: 'challenge', icon: '💎' },
];
