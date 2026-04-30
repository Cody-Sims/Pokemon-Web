import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { getCombinedEffectiveness } from '@data/type-chart';
import { PokemonType } from '@utils/type-helpers';
import { SPREAD_MOVES } from './DoubleBattleManager';

/**
 * Smart move selection for NPC partner Pokémon in tag/double battles.
 * More sophisticated than standard AIController — considers ally safety,
 * avoids spread moves that hit allies, and prioritizes finishing low-HP targets.
 */
export class PartnerAI {
  /**
   * Select the best move for a partner Pokémon.
   * @param pokemon The partner's active Pokémon.
   * @param enemies Active enemy Pokémon [slot 0, slot 1].
   * @param ally The player's active Pokémon (to avoid hitting).
   * @returns The chosen move ID and preferred target slot (2 or 3 in double battle indexing).
   */
  static selectMove(
    pokemon: PokemonInstance,
    enemies: (PokemonInstance | null)[],
    ally: PokemonInstance | null,
  ): { moveId: string; targetSlot: number } {
    const availableMoves = pokemon.moves.filter(m => m.currentPp > 0);
    if (availableMoves.length === 0) return { moveId: 'struggle', targetSlot: 2 };

    const selfData = pokemonData[pokemon.dataId];

    // Find first alive enemy as default target
    const aliveEnemies = enemies.filter(e => e && e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      return { moveId: 'struggle', targetSlot: 2 };
    }
    let bestTarget = enemies.indexOf(aliveEnemies[0]) + 2; // slots start at 2

    let bestScore = -Infinity;
    let bestMoveId = availableMoves[0].moveId;

    // Find a live enemy target
    const primaryTarget = enemies[0] && enemies[0].currentHp > 0 ? 0 : 1;
    const secondaryTarget = primaryTarget === 0 ? 1 : 0;

    for (const m of availableMoves) {
      const move = moveData[m.moveId];
      if (!move) continue;

      // Evaluate against each alive enemy
      for (let ei = 0; ei < enemies.length; ei++) {
        const enemy = enemies[ei];
        if (!enemy || enemy.currentHp <= 0) continue;

        const targetSlot = ei + 2; // Double battle slots: 0-1 player side, 2-3 enemy side
        let score = 0;

        if (move.power !== null && move.power > 0) {
          const enemyData = pokemonData[enemy.dataId];
          if (!enemyData) {
            score = move.power;
          } else {
            const effectiveness = getCombinedEffectiveness(
              move.type as PokemonType,
              enemyData.types as [PokemonType] | [PokemonType, PokemonType],
            );

            // STAB bonus
            const stab = selfData?.types.includes(move.type as PokemonType) ? 1.5 : 1;

            score = move.power * effectiveness * stab * (move.accuracy / 100);

            // Finishing bonus: strongly prefer moves that can KO
            const enemyHpPct = enemy.currentHp / enemy.stats.hp;
            if (enemyHpPct < 0.25) score *= 2.0;
            else if (enemyHpPct < 0.5) score *= 1.3;

            // Penalize immune moves heavily
            if (effectiveness === 0) score = -100;
          }

          // Penalize spread moves that would hit our ally
          if (isSpreadMove(m.moveId) && ally && ally.currentHp > 0) {
            score *= 0.5; // Halve the score — risky to hit ally
          }
        } else if (move.category === 'status') {
          // Status moves: reasonable score early, low score if enemy already has status
          if (!enemy.status && enemy.currentHp / enemy.stats.hp > 0.5) {
            score = 45;
          } else {
            score = 5;
          }

          // Healing moves: prefer when own HP is low
          if (move.effect?.type === 'heal') {
            const ownHpPct = pokemon.currentHp / pokemon.stats.hp;
            score = ownHpPct < 0.4 ? 80 : ownHpPct < 0.7 ? 30 : 5;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMoveId = m.moveId;
          bestTarget = targetSlot;
        }
      }
    }

    return { moveId: bestMoveId, targetSlot: bestTarget };
  }
}

function isSpreadMove(moveId: string): boolean {
  return SPREAD_MOVES.has(moveId);
}
