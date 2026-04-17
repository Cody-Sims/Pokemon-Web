import { ItemData } from './interfaces';

export const itemData: Record<string, ItemData> = {
  // ─── Medicine ───
  'potion': {
    id: 'potion', name: 'Potion', category: 'medicine',
    description: 'Restores 20 HP to a single Pokémon.',
    buyPrice: 300,
    effect: { type: 'heal-hp', amount: 20 },
  },
  'super-potion': {
    id: 'super-potion', name: 'Super Potion', category: 'medicine',
    description: 'Restores 50 HP to a single Pokémon.',
    buyPrice: 700,
    effect: { type: 'heal-hp', amount: 50 },
  },
  'antidote': {
    id: 'antidote', name: 'Antidote', category: 'medicine',
    description: 'Cures a poisoned Pokémon.',
    buyPrice: 100,
    effect: { type: 'heal-status', status: 'poison' },
  },
  'paralyze-heal': {
    id: 'paralyze-heal', name: 'Paralyze Heal', category: 'medicine',
    description: 'Cures a paralyzed Pokémon.',
    buyPrice: 200,
    effect: { type: 'heal-status', status: 'paralysis' },
  },
  'burn-heal': {
    id: 'burn-heal', name: 'Burn Heal', category: 'medicine',
    description: 'Cures a burned Pokémon.',
    buyPrice: 250,
    effect: { type: 'heal-status', status: 'burn' },
  },
  'ice-heal': {
    id: 'ice-heal', name: 'Ice Heal', category: 'medicine',
    description: 'Cures a frozen Pokémon.',
    buyPrice: 250,
    effect: { type: 'heal-status', status: 'freeze' },
  },
  'awakening': {
    id: 'awakening', name: 'Awakening', category: 'medicine',
    description: 'Wakes up a sleeping Pokémon.',
    buyPrice: 250,
    effect: { type: 'heal-status', status: 'sleep' },
  },
  'full-heal': {
    id: 'full-heal', name: 'Full Heal', category: 'medicine',
    description: 'Cures all status conditions.',
    buyPrice: 600,
    effect: { type: 'heal-status', status: 'all' },
  },
  'revive': {
    id: 'revive', name: 'Revive', category: 'medicine',
    description: 'Revives a fainted Pokémon to half HP.',
    buyPrice: 1500,
    effect: { type: 'heal-hp', amount: -1 }, // -1 = half max HP
  },
  'hyper-potion': {
    id: 'hyper-potion', name: 'Hyper Potion', category: 'medicine',
    description: 'Restores 200 HP to a single Pokémon.',
    buyPrice: 1200,
    effect: { type: 'heal-hp', amount: 200 },
  },
  'max-potion': {
    id: 'max-potion', name: 'Max Potion', category: 'medicine',
    description: 'Fully restores the HP of a single Pokémon.',
    buyPrice: 2500,
    effect: { type: 'heal-hp', amount: 9999 },
  },
  'full-restore': {
    id: 'full-restore', name: 'Full Restore', category: 'medicine',
    description: 'Fully restores HP and cures all status conditions.',
    buyPrice: 3000,
    effect: { type: 'heal-hp', amount: 9999 },
  },
  'max-revive': {
    id: 'max-revive', name: 'Max Revive', category: 'medicine',
    description: 'Revives a fainted Pokémon to full HP.',
    buyPrice: 4000,
    effect: { type: 'heal-hp', amount: -2 }, // -2 = full max HP
  },

  // ─── Poké Balls ───
  'poke-ball': {
    id: 'poke-ball', name: 'Poké Ball', category: 'pokeball',
    description: 'A device for catching wild Pokémon.',
    buyPrice: 200,
    effect: { type: 'capture', catchRateMultiplier: 1 },
  },
  'great-ball': {
    id: 'great-ball', name: 'Great Ball', category: 'pokeball',
    description: 'A good, high-performance Poké Ball.',
    buyPrice: 600,
    effect: { type: 'capture', catchRateMultiplier: 1.5 },
  },
  'ultra-ball': {
    id: 'ultra-ball', name: 'Ultra Ball', category: 'pokeball',
    description: 'An ultra-performance Poké Ball.',
    buyPrice: 1200,
    effect: { type: 'capture', catchRateMultiplier: 2 },
  },

  // ─── Battle items ───
  'repel': {
    id: 'repel', name: 'Repel', category: 'battle',
    description: 'Prevents weak wild Pokémon from appearing for 100 steps.',
    buyPrice: 350,
    effect: { type: 'repel', steps: 100 },
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
  'old-rod': {
    id: 'old-rod', name: 'Old Rod', category: 'key',
    description: 'A basic fishing rod. Use it by water to catch Pokémon.',
    effect: { type: 'key' },
  },
  'good-rod': {
    id: 'good-rod', name: 'Good Rod', category: 'key',
    description: 'A decent fishing rod. Catches a wider variety of Pokémon.',
    effect: { type: 'key' },
  },
  'super-rod': {
    id: 'super-rod', name: 'Super Rod', category: 'key',
    description: 'The best fishing rod. Catches rare water Pokémon.',
    effect: { type: 'key' },
  },
  'bicycle': {
    id: 'bicycle', name: 'Bicycle', category: 'key',
    description: 'A folding bicycle for fast travel.',
    effect: { type: 'key' },
  },

  // ─── Held Items (battle effect handled by HeldItemHandler) ───
  'leftovers': {
    id: 'leftovers', name: 'Leftovers', category: 'battle',
    description: 'Restores 1/16 of max HP at the end of each turn in battle.',
    effect: { type: 'held-passive', held: 'leftovers' },
  },
  'life-orb': {
    id: 'life-orb', name: 'Life Orb', category: 'battle',
    description: 'Boosts move power by 30% but costs 10% HP per attack.',
    effect: { type: 'held-passive', held: 'life-orb' },
  },
  'choice-band': {
    id: 'choice-band', name: 'Choice Band', category: 'battle',
    description: 'Boosts Attack by 50% but locks into one move.',
    effect: { type: 'held-passive', held: 'choice-band' },
  },
  'choice-specs': {
    id: 'choice-specs', name: 'Choice Specs', category: 'battle',
    description: 'Boosts Sp. Atk by 50% but locks into one move.',
    effect: { type: 'held-passive', held: 'choice-specs' },
  },
  'focus-sash': {
    id: 'focus-sash', name: 'Focus Sash', category: 'battle',
    description: 'Survives a one-hit KO from full HP, leaving 1 HP. Single use.',
    effect: { type: 'held-passive', held: 'focus-sash' },
  },
  'sitrus-berry': {
    id: 'sitrus-berry', name: 'Sitrus Berry', category: 'medicine',
    description: 'Restores 25% of max HP. Consumed on use.',
    effect: { type: 'heal-hp', amount: -25 },
  },
  'oran-berry': {
    id: 'oran-berry', name: 'Oran Berry', category: 'medicine',
    description: 'Restores 10 HP when HP drops below 50%. Consumed on use.',
    effect: { type: 'heal-hp', amount: 10 },
  },
  'lum-berry': {
    id: 'lum-berry', name: 'Lum Berry', category: 'medicine',
    description: 'Cures any status condition when afflicted. Consumed on use.',
    effect: { type: 'heal-status', status: 'all' },
  },
  'cheri-berry': {
    id: 'cheri-berry', name: 'Cheri Berry', category: 'medicine',
    description: 'Cures paralysis when afflicted. Consumed on use.',
    effect: { type: 'heal-status', status: 'paralysis' },
  },
  'rawst-berry': {
    id: 'rawst-berry', name: 'Rawst Berry', category: 'medicine',
    description: 'Cures a burn when afflicted. Consumed on use.',
    effect: { type: 'heal-status', status: 'burn' },
  },
  'aspear-berry': {
    id: 'aspear-berry', name: 'Aspear Berry', category: 'medicine',
    description: 'Cures freeze when afflicted. Consumed on use.',
    effect: { type: 'heal-status', status: 'freeze' },
  },
  'chesto-berry': {
    id: 'chesto-berry', name: 'Chesto Berry', category: 'medicine',
    description: 'Wakes up when put to sleep. Consumed on use.',
    effect: { type: 'heal-status', status: 'sleep' },
  },
  'pecha-berry': {
    id: 'pecha-berry', name: 'Pecha Berry', category: 'medicine',
    description: 'Cures poison when afflicted. Consumed on use.',
    effect: { type: 'heal-status', status: 'poison' },
  },

  // ─── Evolution Stones ───
  'fire-stone': {
    id: 'fire-stone', name: 'Fire Stone', category: 'evolution',
    description: 'A stone that evolves certain Pokémon. It is colored orange.',
    effect: { type: 'evolution-stone', stone: 'fire-stone' },
  },
  'water-stone': {
    id: 'water-stone', name: 'Water Stone', category: 'evolution',
    description: 'A stone that evolves certain Pokémon. It is a blue shard.',
    effect: { type: 'evolution-stone', stone: 'water-stone' },
  },
  'thunder-stone': {
    id: 'thunder-stone', name: 'Thunder Stone', category: 'evolution',
    description: 'A stone that evolves certain Pokémon. It has a thunderbolt pattern.',
    effect: { type: 'evolution-stone', stone: 'thunder-stone' },
  },
  'leaf-stone': {
    id: 'leaf-stone', name: 'Leaf Stone', category: 'evolution',
    description: 'A stone that evolves certain Pokémon. It has a leaf pattern.',
    effect: { type: 'evolution-stone', stone: 'leaf-stone' },
  },
  'moon-stone': {
    id: 'moon-stone', name: 'Moon Stone', category: 'evolution',
    description: 'A stone that evolves certain Pokémon. It is found in caves.',
    effect: { type: 'evolution-stone', stone: 'moon-stone' },
  },

  // ─── Misc ───
  'heart-scale': {
    id: 'heart-scale', name: 'Heart Scale', category: 'key',
    description: 'A pretty heart-shaped scale. Needed by certain Move Tutors.',
    effect: { type: 'key' },
  },

  // ─── Synthesis ───
  'synthesis-bracelet': {
    id: 'synthesis-bracelet', name: 'Synthesis Bracelet', category: 'key',
    description: 'A bracelet infused with Aether energy. Allows Pokémon to enter Synthesis Mode.',
    effect: { type: 'key' },
  },
};
