import { ItemData } from './interfaces';

export const itemData: Record<string, ItemData> = {
  // ─── Medicine ───
  'potion': {
    id: 'potion', name: 'Potion', category: 'medicine',
    description: 'Restores 20 HP to a single Pokémon.',
    effect: { type: 'heal-hp', amount: 20 },
  },
  'super-potion': {
    id: 'super-potion', name: 'Super Potion', category: 'medicine',
    description: 'Restores 50 HP to a single Pokémon.',
    effect: { type: 'heal-hp', amount: 50 },
  },
  'antidote': {
    id: 'antidote', name: 'Antidote', category: 'medicine',
    description: 'Cures a poisoned Pokémon.',
    effect: { type: 'heal-status', status: 'poison' },
  },
  'paralyze-heal': {
    id: 'paralyze-heal', name: 'Paralyze Heal', category: 'medicine',
    description: 'Cures a paralyzed Pokémon.',
    effect: { type: 'heal-status', status: 'paralysis' },
  },
  'burn-heal': {
    id: 'burn-heal', name: 'Burn Heal', category: 'medicine',
    description: 'Cures a burned Pokémon.',
    effect: { type: 'heal-status', status: 'burn' },
  },
  'ice-heal': {
    id: 'ice-heal', name: 'Ice Heal', category: 'medicine',
    description: 'Cures a frozen Pokémon.',
    effect: { type: 'heal-status', status: 'freeze' },
  },
  'awakening': {
    id: 'awakening', name: 'Awakening', category: 'medicine',
    description: 'Wakes up a sleeping Pokémon.',
    effect: { type: 'heal-status', status: 'sleep' },
  },
  'full-heal': {
    id: 'full-heal', name: 'Full Heal', category: 'medicine',
    description: 'Cures all status conditions.',
    effect: { type: 'heal-status', status: 'all' },
  },
  'revive': {
    id: 'revive', name: 'Revive', category: 'medicine',
    description: 'Revives a fainted Pokémon to half HP.',
    effect: { type: 'heal-hp', amount: -1 }, // -1 = half max HP
  },

  // ─── Poké Balls ───
  'poke-ball': {
    id: 'poke-ball', name: 'Poké Ball', category: 'pokeball',
    description: 'A device for catching wild Pokémon.',
    effect: { type: 'capture', catchRateMultiplier: 1 },
  },
  'great-ball': {
    id: 'great-ball', name: 'Great Ball', category: 'pokeball',
    description: 'A good, high-performance Poké Ball.',
    effect: { type: 'capture', catchRateMultiplier: 1.5 },
  },
  'ultra-ball': {
    id: 'ultra-ball', name: 'Ultra Ball', category: 'pokeball',
    description: 'An ultra-performance Poké Ball.',
    effect: { type: 'capture', catchRateMultiplier: 2 },
  },

  // ─── Battle items ───
  'repel': {
    id: 'repel', name: 'Repel', category: 'battle',
    description: 'Prevents weak wild Pokémon from appearing for 100 steps.',
    effect: { type: 'key' },
  },

  // ─── Key Items ───
  'oaks-parcel': {
    id: 'oaks-parcel', name: "Oak's Parcel", category: 'key',
    description: 'A parcel to be delivered to Prof. Oak from Viridian City.',
    effect: { type: 'key' },
  },
  'pokedex': {
    id: 'pokedex', name: 'Pokédex', category: 'key',
    description: 'A high-tech encyclopedia that records Pokémon data.',
    effect: { type: 'key' },
  },
};
