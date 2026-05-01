import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { TRAINER_EXP_MULTIPLIER } from '@utils/constants';import { EvolutionCondition } from '@utils/type-helpers';
import { evolutionData } from '@data/evolution-data';
/** Nature stat modifiers: [increased stat, decreased stat]. Neutral natures omitted. */
const natureModifiers: Record<string, { up: keyof Omit<import('@utils/type-helpers').Stats, 'hp'>; down: keyof Omit<import('@utils/type-helpers').Stats, 'hp'> } | null> = {
  hardy: null, docile: null, serious: null, bashful: null, quirky: null,
  lonely:  { up: 'attack',    down: 'defense' },
  brave:   { up: 'attack',    down: 'speed' },
  adamant: { up: 'attack',    down: 'spAttack' },
  naughty: { up: 'attack',    down: 'spDefense' },
  bold:    { up: 'defense',   down: 'attack' },
  relaxed: { up: 'defense',   down: 'speed' },
  impish:  { up: 'defense',   down: 'spAttack' },
  lax:     { up: 'defense',   down: 'spDefense' },
  timid:   { up: 'speed',     down: 'attack' },
  hasty:   { up: 'speed',     down: 'defense' },
  jolly:   { up: 'speed',     down: 'spAttack' },
  naive:   { up: 'speed',     down: 'spDefense' },
  modest:  { up: 'spAttack',  down: 'attack' },
  mild:    { up: 'spAttack',  down: 'defense' },
  quiet:   { up: 'spAttack',  down: 'speed' },
  rash:    { up: 'spAttack',  down: 'spDefense' },
  calm:    { up: 'spDefense', down: 'attack' },
  gentle:  { up: 'spDefense', down: 'defense' },
  sassy:   { up: 'spDefense', down: 'speed' },
  careful: { up: 'spDefense', down: 'spAttack' },
};

/** Get the nature multiplier for a stat. Returns 1.1, 0.9, or 1.0. */
export function getNatureMultiplier(nature: string, stat: string): number {
  const mod = natureModifiers[nature];
  if (!mod) return 1.0;
  if (mod.up === stat) return 1.1;
  if (mod.down === stat) return 0.9;
  return 1.0;
}

/** Get nature description: which stat is boosted/lowered. */
export function getNatureDescription(nature: string): string {
  const mod = natureModifiers[nature];
  if (!mod) return 'Neutral';
  const statNames: Record<string, string> = { attack: 'Attack', defense: 'Defense', spAttack: 'Sp.Atk', spDefense: 'Sp.Def', speed: 'Speed' };
  return `+${statNames[mod.up]} / -${statNames[mod.down]}`;
}

export interface LevelUpResult {
  levelsGained: number;
  newLevel: number;
  newMoves: string[]; // moveIds learned
}

/** EXP yield calculation and level-up logic. */
export class ExperienceCalculator {
  /** Calculate EXP gained from defeating a Pokemon. */
  static calculateExp(defeated: PokemonInstance, isTrainerBattle: boolean): number {
    const data = pokemonData[defeated.dataId];
    if (!data) return 0;
    let exp = (data.expYield * defeated.level) / 7;
    if (isTrainerBattle) {
      exp *= TRAINER_EXP_MULTIPLIER;
    }
    return Math.floor(exp);
  }

  /** Get EXP required for a given level (medium-fast growth rate). */
  static expForLevel(level: number): number {
    return Math.floor(level * level * level);
  }

  /** Award EXP and handle level ups. Returns info about levels gained. */
  static awardExp(pokemon: PokemonInstance, expGained: number): LevelUpResult {
    // Bug #11: Skip EXP gain at level 100
    if (pokemon.level >= 100) {
      return { levelsGained: 0, newLevel: pokemon.level, newMoves: [] };
    }

    pokemon.exp += expGained;
    let levelsGained = 0;
    const newMoves: string[] = [];

    const data = pokemonData[pokemon.dataId];

    const MAX_LEVEL = 100;
    while (pokemon.level < MAX_LEVEL && pokemon.exp >= ExperienceCalculator.expForLevel(pokemon.level + 1)) {
      pokemon.level++;
      levelsGained++;

      // Check for new moves at this level
      if (data) {
        for (const entry of data.learnset) {
          if (entry.level === pokemon.level) {
            newMoves.push(entry.moveId);
          }
        }
      }

      // Recalculate stats (simplified)
      if (data) {
        ExperienceCalculator.recalculateStats(pokemon);
      }

      // Friendship gain on level up
      ExperienceCalculator.applyFriendshipGain(pokemon);
    }

    return { levelsGained, newLevel: pokemon.level, newMoves };
  }

  /** Recalculate stats from base stats + IVs + EVs + nature. */
  static recalculateStats(pokemon: PokemonInstance): void {
    const data = pokemonData[pokemon.dataId];
    if (!data) return;

    const level = pokemon.level;
    const base = data.baseStats;
    const iv = pokemon.ivs;
    const ev = pokemon.evs;

    // AUDIT-047: Increase currentHp by the HP stat gain on level-up
    const oldMaxHp = pokemon.stats.hp;

    // HP formula (nature does not affect HP)
    pokemon.stats.hp = Math.floor(((2 * base.hp + iv.hp + Math.floor(ev.hp / 4)) * level) / 100) + level + 10;

    // Increase currentHp by the amount the max HP grew (only for non-fainted Pokémon)
    const hpGain = pokemon.stats.hp - oldMaxHp;
    if (hpGain > 0 && pokemon.currentHp > 0) {
      pokemon.currentHp += hpGain;
    }

    // Other stats (with nature modifier)
    const statKeys = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
    for (const stat of statKeys) {
      const natureMod = getNatureMultiplier(pokemon.nature, stat);
      pokemon.stats[stat] = Math.floor(
        ((((2 * base[stat] + iv[stat] + Math.floor(ev[stat] / 4)) * level) / 100) + 5) * natureMod
      );
    }

    // Cap currentHp to max
    if (pokemon.currentHp > pokemon.stats.hp) {
      pokemon.currentHp = pokemon.stats.hp;
    }
  }

  /**
   * Check if a Pokémon meets any evolution condition after level-up.
   * Checks level, friendship, and move-known conditions.
   * Returns the evolvesTo id or null.
   */
  static checkLevelUpEvolution(pokemon: PokemonInstance): number | null {
    const evos = evolutionData[pokemon.dataId];
    if (!evos) return null;

    for (const evo of evos) {
      if (ExperienceCalculator.meetsCondition(pokemon, evo.condition)) {
        return evo.evolvesTo;
      }
    }
    return null;
  }

  /** Check if a Pokémon meets a single evolution condition. */
  static meetsCondition(pokemon: PokemonInstance, condition: EvolutionCondition): boolean {
    switch (condition.type) {
      case 'level':
        return condition.level != null && pokemon.level >= condition.level;
      case 'friendship':
        return condition.friendship != null && pokemon.friendship >= condition.friendship;
      case 'move-known':
        return condition.moveId != null && pokemon.moves.some(m => m.moveId === condition.moveId);
      case 'item':
        // Item evolutions are triggered from inventory, not level-up
        return false;
      case 'trade':
        // Trade evolutions handled by NPC interaction
        return false;
      case 'location':
        // Location evolutions need overworld checking
        return false;
      default:
        return false;
    }
  }

  /** Apply friendship gain on level up (+3 to +5 based on current friendship). */
  static applyFriendshipGain(pokemon: PokemonInstance): void {
    if (pokemon.friendship < 100) pokemon.friendship = Math.min(255, pokemon.friendship + 5);
    else if (pokemon.friendship < 200) pokemon.friendship = Math.min(255, pokemon.friendship + 3);
    else pokemon.friendship = Math.min(255, pokemon.friendship + 2);
  }

  /** Apply friendship loss on faint (-1). */
  static applyFriendshipLoss(pokemon: PokemonInstance): void {
    pokemon.friendship = Math.max(0, pokemon.friendship - 1);
  }
}
