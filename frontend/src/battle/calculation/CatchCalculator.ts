import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { seededRandom } from '@utils/math-helpers';

export interface CatchResult {
  caught: boolean;
  shakes: number; // 0-3 shakes before result
}

/** Poké Ball catch-rate formula. */
export class CatchCalculator {
  /**
   * Calculate whether a Pokemon is caught.
   * @param pokemon - The wild Pokemon to catch.
   * @param ballMultiplier - Catch rate multiplier of the ball used.
   * @returns CatchResult with number of shakes and whether caught.
   */
  static calculate(pokemon: PokemonInstance, ballMultiplier: number): CatchResult {
    const data = pokemonData[pokemon.dataId];
    if (!data) return { caught: false, shakes: 0 };

    const maxHp = Math.max(1, pokemon.stats.hp);
    const currentHp = pokemon.currentHp;
    const catchRate = data.catchRate;

    // Status bonus
    let statusBonus = 1;
    if (pokemon.status === 'sleep' || pokemon.status === 'freeze') {
      statusBonus = 2;
    } else if (pokemon.status === 'paralysis' || pokemon.status === 'burn' || pokemon.status === 'poison' || pokemon.status === 'bad-poison') {
      statusBonus = 1.5;
    }

    // Modified catch rate
    const modifiedRate = ((3 * maxHp - 2 * currentHp) * catchRate * ballMultiplier * statusBonus) / (3 * maxHp);

    // Guaranteed catch
    if (modifiedRate >= 255) {
      return { caught: true, shakes: 4 };
    }

    // Shake check probability (4 checks per Gen III+ formula)
    const shakeProbability = Math.sqrt(Math.sqrt(modifiedRate / 255));

    let shakes = 0;
    for (let i = 0; i < 4; i++) {
      if (seededRandom() < shakeProbability) {
        shakes++;
      } else {
        break;
      }
    }

    return { caught: shakes === 4, shakes };
  }
}
