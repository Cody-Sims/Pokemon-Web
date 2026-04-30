import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { getCombinedEffectiveness } from '@data/type-chart';
import { PokemonType } from '@utils/type-helpers';
import { randomInt } from '@utils/math-helpers';
import { GameManager } from '@managers/GameManager';

/** Enemy move selection logic. */
export class AIController {
  /** Select a move for a wild/trainer Pokemon. */
  static selectMove(pokemon: PokemonInstance, opponent: PokemonInstance, isTrainer: boolean): string {
    const availableMoves = pokemon.moves.filter(m => m.currentPp > 0);
    if (availableMoves.length === 0) return 'struggle'; // Struggle fallback

    if (!isTrainer) {
      // Wild: mostly random
      return availableMoves[randomInt(0, availableMoves.length - 1)].moveId;
    }

    const gm = GameManager.getInstance();
    const config = gm.getDifficultyConfig();

    if (config.smartAI) {
      return this.selectSmartMove(pokemon, opponent, availableMoves);
    }

    // Standard trainer: prefer super-effective moves
    return this.selectStandardMove(pokemon, opponent, availableMoves);
  }

  /** Standard trainer AI: pick highest damage super-effective move. */
  private static selectStandardMove(
    pokemon: PokemonInstance,
    opponent: PokemonInstance,
    availableMoves: { moveId: string; currentPp: number }[],
  ): string {
    const opponentData = pokemonData[opponent.dataId];
    if (!opponentData) {
      return availableMoves[randomInt(0, availableMoves.length - 1)].moveId;
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
      if (isNaN(score)) continue;
      if (score > bestScore) {
        bestScore = score;
        bestMove = m.moveId;
      }
    }

    return bestMove;
  }

  /** Smart trainer AI (Hard Mode): considers STAB, HP thresholds, status moves. */
  private static selectSmartMove(
    pokemon: PokemonInstance,
    opponent: PokemonInstance,
    availableMoves: { moveId: string; currentPp: number }[],
  ): string {
    const opponentData = pokemonData[opponent.dataId];
    const selfData = pokemonData[pokemon.dataId];
    if (!opponentData || !selfData) {
      return availableMoves[randomInt(0, availableMoves.length - 1)].moveId;
    }

    const opponentHpPct = opponent.currentHp / opponent.stats.hp;
    let bestMove = availableMoves[0].moveId;
    let bestScore = -1;

    for (const m of availableMoves) {
      const move = moveData[m.moveId];
      if (!move) continue;

      let score = 0;

      if (move.power !== null && move.power > 0) {
        // Damage move scoring
        const effectiveness = getCombinedEffectiveness(
          move.type as PokemonType,
          opponentData.types as [PokemonType] | [PokemonType, PokemonType]
        );
        // STAB bonus
        const stab = selfData.types.includes(move.type as PokemonType) ? 1.5 : 1;
        score = move.power * effectiveness * stab * ((move.accuracy ?? 100) / 100);

        // Prefer finishing moves when opponent is low
        if (opponentHpPct < 0.3) score *= 1.5;
      } else if (move.category === 'status') {
        // Status moves: use them early in battle, not when opponent is low
        if (opponentHpPct > 0.6 && !opponent.status) {
          // Prioritize status moves on healthy, unstatused opponents
          score = 60;
        } else {
          score = 5; // Low priority if opponent already has status or is weakened
        }
      }

      if (isNaN(score)) continue;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m.moveId;
      }
    }

    return bestMove;
  }
}
