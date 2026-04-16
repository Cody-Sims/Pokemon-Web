import { moveData } from '@data/moves';
import type { PokemonInstance } from '@data/interfaces';
import type { StatusEffectHandler } from '@battle/StatusEffectHandler';

/** Pick a random available move for an enemy Pokémon. */
export function pickEnemyMove(enemy: PokemonInstance): string {
  const avail = enemy.moves.filter(m => m.currentPp > 0);
  if (avail.length === 0) return 'tackle';
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
    || (playerPriority === enemyPriority && playerSpeed >= enemySpeed);

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
