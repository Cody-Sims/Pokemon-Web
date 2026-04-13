import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { getCombinedEffectiveness } from '@data/type-chart';
import { PokemonType } from '@utils/type-helpers';

/** Enemy move selection logic. */
export class AIController {
  /** Select a move for a wild/trainer Pokemon. */
  static selectMove(pokemon: PokemonInstance, opponent: PokemonInstance, isTrainer: boolean): string {
    const availableMoves = pokemon.moves.filter(m => m.currentPp > 0);
    if (availableMoves.length === 0) return 'tackle'; // Struggle fallback

    if (!isTrainer) {
      // Wild: mostly random
      return availableMoves[Math.floor(Math.random() * availableMoves.length)].moveId;
    }

    // Trainer: prefer super-effective moves
    const opponentData = pokemonData[opponent.dataId];
    if (!opponentData) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)].moveId;
    }

    let bestMove = availableMoves[0].moveId;
    let bestScore = -1;

    for (const m of availableMoves) {
      const move = moveData[m.moveId];
      if (!move || move.power === null) continue;

      const effectiveness = getCombinedEffectiveness(
        move.type as PokemonType,
        opponentData.types as [PokemonType] | [PokemonType, PokemonType]
      );
      const score = move.power * effectiveness;
      if (score > bestScore) {
        bestScore = score;
        bestMove = m.moveId;
      }
    }

    return bestMove;
  }
}
