import type { TrainerData } from './interfaces';

/**
 * A.1 Battle Tower — endless streak mode unlocked from the Pokémon League lobby.
 *
 * Each tier is a 7-battle gauntlet against curated trainer parties at a fixed
 * level cap. Every 7th battle is the **Tower Tycoon** for that tier — a
 * boss-flavoured trainer with unique flavour dialogue and a tougher team.
 *
 * Tiers
 * -----
 * - **Normal** (Lv 50 cap) — primary tier. Awards 3 BP per battle; 10 BP for
 *   the tycoon (full clear = 28 BP).
 * - **Super** (Lv 100 cap) — post-game. Awards 5 / 15 BP (full clear = 45 BP).
 * - **Rental** (Lv 50 cap, pre-built teams) — design-only stub for now;
 *   gameplay route TBD.
 *
 * Trainer parties below reuse `TrainerData['party']` shape so the existing
 * battle pipeline (encounter → BattleScene → reward handler) can run them
 * without changes. The `id` is namespaced `tower-<tier>-<index>` and not
 * registered in the global `trainerData` registry — `BattleTowerScene`
 * looks them up directly from this file.
 */
export type BattleTowerTier = 'normal' | 'super' | 'rental';

export interface TowerTrainer extends Pick<TrainerData, 'id' | 'name' | 'spriteKey' | 'party' | 'dialogue'> {
  /** True for the 7th-battle tycoon. Drives BP reward + unique flavour. */
  isTycoon?: boolean;
}

export interface BattleTowerTierConfig {
  tier: BattleTowerTier;
  /** Display name shown in the tier-select panel. */
  displayName: string;
  /** One-line description rendered under the tier name. */
  description: string;
  /** Maximum allowed level for any party Pokémon in this tier. */
  levelCap: number;
  /** Number of consecutive battles required to clear the tier. */
  battlesPerStreak: number;
  /** BP awarded per regular victory. */
  bpPerWin: number;
  /** BP awarded for defeating the tycoon (last battle). */
  bpForTycoon: number;
  /** Trainer roster, exactly `battlesPerStreak` long, ordered by appearance. */
  trainers: TowerTrainer[];
}

// ─── Normal tier (Lv 50 cap) ─────────────────────────────────────────

const normalTrainers: TowerTrainer[] = [
  {
    id: 'tower-normal-1', name: 'Pilot Aren', spriteKey: 'npc-male-2',
    party: [
      { pokemonId: 18, level: 50, moves: ['fly', 'quick-attack', 'whirlwind', 'agility'] }, // Pidgeot
      { pokemonId: 22, level: 50, moves: ['drill-peck', 'fly', 'agility', 'pursuit'] },     // Fearow
      { pokemonId: 65, level: 50, moves: ['psychic', 'recover', 'reflect', 'thunder-wave'] }, // Alakazam
    ],
    dialogue: {
      before: ['Pilot Aren: Up here, height beats type charts every time!'],
      after: ['Pilot Aren: Skies turbulent. You earned the airspace.'],
    },
  },
  {
    id: 'tower-normal-2', name: 'Pyromaniac Lex', spriteKey: 'npc-male-4',
    party: [
      { pokemonId: 6, level: 50, moves: ['flamethrower', 'fly', 'slash', 'earthquake'] },    // Charizard
      { pokemonId: 59, level: 50, moves: ['flamethrower', 'crunch', 'roar', 'reflect'] },    // Arcanine
      { pokemonId: 78, level: 50, moves: ['flamethrower', 'stomp', 'fire-spin', 'agility'] }, // Rapidash
    ],
    dialogue: {
      before: ['Pyromaniac Lex: I burn the rules along with the field!'],
      after: ['Pyromaniac Lex: Even my embers couldn\u2019t hold you.'],
    },
  },
  {
    id: 'tower-normal-3', name: 'Tide Master Wren', spriteKey: 'npc-swimmer',
    party: [
      { pokemonId: 9, level: 50, moves: ['surf', 'ice-beam', 'rain-dance', 'body-slam'] },   // Blastoise
      { pokemonId: 121, level: 50, moves: ['psychic', 'surf', 'thunderbolt', 'recover'] },   // Starmie
      { pokemonId: 131, level: 50, moves: ['surf', 'ice-beam', 'thunderbolt', 'sing'] },     // Lapras
    ],
    dialogue: {
      before: ['Tide Master Wren: Tides break stones. I\u2019ll break your streak.'],
      after: ['Tide Master Wren: A clean wave. The current is yours.'],
    },
  },
  {
    id: 'tower-normal-4', name: 'Brawler Hoss', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 68, level: 50, moves: ['cross-chop', 'earthquake', 'rock-slide', 'submission'] }, // Machamp
      { pokemonId: 106, level: 50, moves: ['high-jump-kick', 'mega-kick', 'meditate', 'mega-punch'] }, // Hitmonlee
      { pokemonId: 107, level: 50, moves: ['comet-punch', 'submission', 'mega-punch', 'thunder-punch'] }, // Hitmonchan
    ],
    dialogue: {
      before: ['Brawler Hoss: Strategy is for cowards! Show me your fists!'],
      after: ['Brawler Hoss: \u2026Heh. Fair fight. Fair loss.'],
    },
  },
  {
    id: 'tower-normal-5', name: 'Veil Witch Mira', spriteKey: 'npc-female-2',
    party: [
      { pokemonId: 94, level: 50, moves: ['shadow-ball', 'thunderbolt', 'hypnosis', 'dream-eater'] }, // Gengar
      { pokemonId: 65, level: 50, moves: ['psychic', 'recover', 'reflect', 'thunder-wave'] }, // Alakazam
      { pokemonId: 124, level: 50, moves: ['ice-beam', 'lovely-kiss', 'psychic', 'body-slam'] }, // Jynx
    ],
    dialogue: {
      before: ['Veil Witch Mira: Dream a little. The waking will hurt less.'],
      after: ['Veil Witch Mira: A waking trainer. Rare. Respected.'],
    },
  },
  {
    id: 'tower-normal-6', name: 'Mountaineer Dax', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 76, level: 50, moves: ['earthquake', 'rock-slide', 'explosion', 'body-slam'] }, // Golem
      { pokemonId: 95, level: 50, moves: ['earthquake', 'rock-slide', 'screech', 'body-slam'] }, // Onix
      { pokemonId: 142, level: 50, moves: ['rock-slide', 'fly', 'hyper-beam', 'earthquake'] }, // Aerodactyl
    ],
    dialogue: {
      before: ['Mountaineer Dax: My team carries the weight of mountains.'],
      after: ['Mountaineer Dax: The summit is yours, traveller.'],
    },
  },
  // ─── 7th battle: Tower Tycoon ─────────────────────────────────────
  {
    id: 'tower-normal-tycoon', name: 'Tower Tycoon Cadenza', spriteKey: 'npc-female-1',
    isTycoon: true,
    party: [
      { pokemonId: 143, level: 50, moves: ['body-slam', 'earthquake', 'rest', 'ice-beam'] }, // Snorlax
      { pokemonId: 65, level: 50, moves: ['psychic', 'recover', 'reflect', 'fire-punch'] },  // Alakazam
      { pokemonId: 130, level: 50, moves: ['hydro-pump', 'ice-beam', 'hyper-beam', 'dragon-rage'] }, // Gyarados
      { pokemonId: 149, level: 50, moves: ['outrage', 'hyper-beam', 'fire-blast', 'thunder'] }, // Dragonite
      { pokemonId: 6, level: 50, moves: ['flamethrower', 'fly', 'earthquake', 'slash'] },    // Charizard
      { pokemonId: 134, level: 50, moves: ['surf', 'ice-beam', 'body-slam', 'acid-armor'] }, // Vaporeon
    ],
    dialogue: {
      before: [
        'Tower Tycoon Cadenza: Six down. Now you face the conductor.',
        'Cadenza: My team rehearsed this fight while you slept.',
      ],
      after: [
        'Cadenza: Encore.',
        'Cadenza: The tower remembers your name. Come back any time.',
      ],
    },
  },
];

// ─── Super tier (Lv 100 cap) ──────────────────────────────────────────

const superTrainers: TowerTrainer[] = [
  {
    id: 'tower-super-1', name: 'Sky Marshal Ren', spriteKey: 'npc-male-3',
    party: [
      { pokemonId: 142, level: 100, moves: ['rock-slide', 'fly', 'hyper-beam', 'earthquake'] },
      { pokemonId: 18, level: 100, moves: ['fly', 'quick-attack', 'mirror-move', 'agility'] },
      { pokemonId: 149, level: 100, moves: ['outrage', 'hyper-beam', 'fire-blast', 'thunder'] },
    ],
    dialogue: { before: ['Sky Marshal Ren: Cleared for engagement.'], after: ['Sky Marshal Ren: All wings down. Yours stands.'] },
  },
  {
    id: 'tower-super-2', name: 'Magma Lord Vex', spriteKey: 'npc-male-4',
    party: [
      { pokemonId: 6, level: 100, moves: ['flamethrower', 'earthquake', 'fly', 'slash'] },
      { pokemonId: 59, level: 100, moves: ['flamethrower', 'crunch', 'quick-attack', 'roar'] },
      { pokemonId: 136, level: 100, moves: ['flamethrower', 'quick-attack', 'reflect', 'bite'] }, // Flareon
    ],
    dialogue: { before: ['Magma Lord Vex: Burn bright. Burn brief.'], after: ['Magma Lord Vex: A cold front. Unexpected.'] },
  },
  {
    id: 'tower-super-3', name: 'Reef Queen Marin', spriteKey: 'npc-female-2',
    party: [
      { pokemonId: 130, level: 100, moves: ['hydro-pump', 'ice-beam', 'hyper-beam', 'dragon-rage'] },
      { pokemonId: 131, level: 100, moves: ['surf', 'ice-beam', 'thunderbolt', 'sing'] },
      { pokemonId: 121, level: 100, moves: ['psychic', 'surf', 'thunderbolt', 'recover'] },
    ],
    dialogue: { before: ['Reef Queen Marin: The depths salute their ruler.'], after: ['Reef Queen Marin: A diver of rare nerve.'] },
  },
  {
    id: 'tower-super-4', name: 'Iron Saint Bram', spriteKey: 'npc-hiker',
    party: [
      { pokemonId: 76, level: 100, moves: ['earthquake', 'rock-slide', 'explosion', 'body-slam'] },
      { pokemonId: 68, level: 100, moves: ['cross-chop', 'earthquake', 'rock-slide', 'submission'] },
      { pokemonId: 112, level: 100, moves: ['earthquake', 'rock-slide', 'horn-drill', 'body-slam'] },
    ],
    dialogue: { before: ['Iron Saint Bram: Steel meets stone. Choose a side.'], after: ['Iron Saint Bram: My armour cracks. My respect does not.'] },
  },
  {
    id: 'tower-super-5', name: 'Phantom Choir Liriel', spriteKey: 'npc-female-7',
    party: [
      { pokemonId: 94, level: 100, moves: ['shadow-ball', 'thunderbolt', 'hypnosis', 'dream-eater'] },
      { pokemonId: 153, level: 100, moves: ['shadow-ball', 'dark-pulse', 'crunch', 'nasty-plot'] }, // Noctharion
      { pokemonId: 65, level: 100, moves: ['psychic', 'recover', 'reflect', 'thunder-wave'] },
    ],
    dialogue: { before: ['Phantom Choir Liriel: Sing with us. Or in spite of us.'], after: ['Phantom Choir Liriel: A solo voice. Beautifully loud.'] },
  },
  {
    id: 'tower-super-6', name: 'Plagueblade Onix', spriteKey: 'npc-male-5',
    party: [
      { pokemonId: 89, level: 100, moves: ['sludge', 'earthquake', 'explosion', 'body-slam'] }, // Muk
      { pokemonId: 73, level: 100, moves: ['hydro-pump', 'ice-beam', 'sludge', 'wrap'] }, // Tentacruel
      { pokemonId: 49, level: 100, moves: ['psychic', 'sludge', 'giga-drain', 'sleep-powder'] }, // Venomoth
    ],
    dialogue: { before: ['Plagueblade Onix: Toxin opens every lock.'], after: ['Plagueblade Onix: Antidote applied. Match.'] },
  },
  {
    id: 'tower-super-tycoon', name: 'Tower Tycoon Maestro', spriteKey: 'npc-male-2',
    isTycoon: true,
    party: [
      { pokemonId: 149, level: 100, moves: ['outrage', 'hyper-beam', 'fire-blast', 'thunder'] },
      { pokemonId: 65, level: 100, moves: ['psychic', 'recover', 'reflect', 'fire-punch'] },
      { pokemonId: 143, level: 100, moves: ['body-slam', 'earthquake', 'rest', 'ice-beam'] },
      { pokemonId: 6, level: 100, moves: ['flamethrower', 'fly', 'earthquake', 'slash'] },
      { pokemonId: 130, level: 100, moves: ['hydro-pump', 'ice-beam', 'hyper-beam', 'dragon-rage'] },
      { pokemonId: 152, level: 100, moves: ['psychic', 'flamethrower', 'shadow-ball', 'recover'] }, // Solatheon
    ],
    dialogue: {
      before: [
        'Tower Tycoon Maestro: You\u2019ve outpaced my orchestra. Now play me.',
        'Maestro: My final movement is no metaphor.',
      ],
      after: [
        'Maestro: Bravo. Bravissimo.',
        'Maestro: The tower is a stage. You\u2019re tonight\u2019s headliner.',
      ],
    },
  },
];

export const battleTowerData: Record<BattleTowerTier, BattleTowerTierConfig> = {
  normal: {
    tier: 'normal',
    displayName: 'Normal Tier',
    description: 'Lv 50 cap. 7-battle gauntlet. Recommended after Hall of Fame.',
    levelCap: 50,
    battlesPerStreak: 7,
    bpPerWin: 3,
    bpForTycoon: 10,
    trainers: normalTrainers,
  },
  super: {
    tier: 'super',
    displayName: 'Super Tier',
    description: 'Lv 100 cap. Veteran-grade teams. Late post-game.',
    levelCap: 100,
    battlesPerStreak: 7,
    bpPerWin: 5,
    bpForTycoon: 15,
    trainers: superTrainers,
  },
  rental: {
    tier: 'rental',
    displayName: 'Rental Tier (Coming soon)',
    description: 'Lv 50 cap with pre-built rental parties. Roster TBA.',
    levelCap: 50,
    battlesPerStreak: 7,
    bpPerWin: 4,
    bpForTycoon: 12,
    trainers: [], // intentionally empty — UI marks the tier as locked.
  },
};

/** Compute the maximum BP awarded for a full clear of a tier. */
export function fullClearBpReward(tier: BattleTowerTier): number {
  const cfg = battleTowerData[tier];
  if (cfg.trainers.length === 0) return 0;
  return cfg.bpPerWin * (cfg.battlesPerStreak - 1) + cfg.bpForTycoon;
}
