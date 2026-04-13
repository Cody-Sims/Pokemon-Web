import { encounterTables } from '@data/encounter-tables';
import { BASE_ENCOUNTER_RATE } from '@utils/constants';
import { weightedRandom, randomInt } from '@utils/math-helpers';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';

/** Step counter → random wild encounter trigger. */
export class EncounterSystem {
  private stepCount = 0;
  private repelSteps = 0;

  /** Call on each step in an encounter zone. Returns a wild Pokemon if triggered, else null. */
  checkEncounter(mapKey: string): PokemonInstance | null {
    if (this.repelSteps > 0) {
      this.repelSteps--;
      return null;
    }

    this.stepCount++;

    if (Math.random() > BASE_ENCOUNTER_RATE) {
      return null;
    }

    const table = encounterTables[mapKey];
    if (!table || table.length === 0) return null;

    // Weighted random selection
    const weights = table.map(e => e.weight);
    const index = weightedRandom(weights);
    const entry = table[index];

    // Generate wild Pokemon
    const level = randomInt(entry.levelRange[0], entry.levelRange[1]);
    return EncounterSystem.createWildPokemon(entry.pokemonId, level);
  }

  /** Create a PokemonInstance for a wild encounter. */
  static createWildPokemon(pokemonId: number, level: number): PokemonInstance {
    const data = pokemonData[pokemonId];
    if (!data) {
      throw new Error(`Pokemon data not found for id: ${pokemonId}`);
    }

    // Generate random IVs (0-31)
    const ivs = {
      hp: randomInt(0, 31), attack: randomInt(0, 31), defense: randomInt(0, 31),
      spAttack: randomInt(0, 31), spDefense: randomInt(0, 31), speed: randomInt(0, 31),
    };

    const evs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };

    // Calculate stats
    const stats = {
      hp: Math.floor(((2 * data.baseStats.hp + ivs.hp) * level) / 100) + level + 10,
      attack: Math.floor(((2 * data.baseStats.attack + ivs.attack) * level) / 100) + 5,
      defense: Math.floor(((2 * data.baseStats.defense + ivs.defense) * level) / 100) + 5,
      spAttack: Math.floor(((2 * data.baseStats.spAttack + ivs.spAttack) * level) / 100) + 5,
      spDefense: Math.floor(((2 * data.baseStats.spDefense + ivs.spDefense) * level) / 100) + 5,
      speed: Math.floor(((2 * data.baseStats.speed + ivs.speed) * level) / 100) + 5,
    };

    // Determine moves (up to 4 most recent)
    const learnedMoves = data.learnset
      .filter(entry => entry.level <= level)
      .slice(-4)
      .map(entry => ({
        moveId: entry.moveId,
        currentPp: moveData[entry.moveId]?.pp ?? 10,
      }));

    return {
      dataId: pokemonId,
      level,
      currentHp: stats.hp,
      stats,
      ivs,
      evs,
      nature: 'hardy',
      moves: learnedMoves,
      status: null,
      exp: ExperienceCalculator.expForLevel(level),
      friendship: 70,
    };
  }

  useRepel(steps: number): void {
    this.repelSteps = steps;
  }

  resetSteps(): void {
    this.stepCount = 0;
  }
}
