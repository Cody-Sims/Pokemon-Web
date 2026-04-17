import { moveData } from '@data/moves';
import { AIController } from '@battle/core/AIController';
import type { PokemonInstance } from '@data/interfaces';
import type { StatusEffectHandler } from '@battle/effects/StatusEffectHandler';

/** Pick a move for an enemy Pokémon using AI when available. */
export function pickEnemyMove(enemy: PokemonInstance, opponent?: PokemonInstance, isTrainer?: boolean): string {
  if (opponent && isTrainer !== undefined) {
    return AIController.selectMove(enemy, opponent, isTrainer);
  }
  const avail = enemy.moves.filter(m => m.currentPp > 0);
  if (avail.length === 0) return 'struggle';
  return avail[Math.floor(Math.random() * avail.length)].moveId;
}

export interface TurnOrder {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  moveId: string;
  isPlayer: boolean;
}

/** Determine turn order based on move priority and effective speed. */
export function calculateTurnOrder(
  player: PokemonInstance,
  enemy: PokemonInstance,
  playerMoveId: string,
  enemyMoveId: string,
  statusHandler: StatusEffectHandler,
): TurnOrder[] {
  const playerSpeed = statusHandler.getEffectiveStat(player, 'speed');
  const enemySpeed = statusHandler.getEffectiveStat(enemy, 'speed');
  const playerMove = moveData[playerMoveId];
  const enemyMove = moveData[enemyMoveId];
  const playerPriority = playerMove?.priority ?? 0;
  const enemyPriority = enemyMove?.priority ?? 0;

  const playerFirst = playerPriority > enemyPriority
    || (playerPriority === enemyPriority && (playerSpeed > enemySpeed || (playerSpeed === enemySpeed && Math.random() < 0.5)));

  return playerFirst
    ? [
        { attacker: player, defender: enemy, moveId: playerMoveId, isPlayer: true },
        { attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false },
      ]
    : [
        { attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false },
        { attacker: player, defender: enemy, moveId: playerMoveId, isPlayer: true },
      ];
}
