import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { TargetingPolicy } from './BattleEngine';
import type { MoveTarget } from './targeting-data';
import { SELF_TARGET_MOVES, SPREAD_MOVES } from './targeting-data';

export interface DoubleTargetContext {
  attackerSlot: number;
  moveId: string;
  targetSlot?: number;
  activeBattlers: (PokemonInstance | null)[];
}

export class DoubleBattleTargetingPolicy implements TargetingPolicy<MoveTarget> {
  getMoveTarget(moveId: string): MoveTarget {
    if (SELF_TARGET_MOVES.has(moveId)) return 'self';
    if (SPREAD_MOVES.has(moveId)) return 'all-adjacent';

    const move = moveData[moveId];
    if (!move) return 'single-enemy';

    if (move.effect?.type === 'heal' && move.category === 'status') {
      return 'self';
    }

    return 'single-enemy';
  }

  resolveTargets(context: DoubleTargetContext): number[] {
    const moveTarget = this.getMoveTarget(context.moveId);
    const isPlayerSide = context.attackerSlot < 2;

    switch (moveTarget) {
      case 'self':
        return [context.attackerSlot];

      case 'single-ally': {
        const allySlot = isPlayerSide
          ? context.attackerSlot === 0
            ? 1
            : 0
          : context.attackerSlot === 2
            ? 3
            : 2;
        return [allySlot];
      }

      case 'both-enemies':
        return isPlayerSide ? [2, 3] : [0, 1];

      case 'all-adjacent': {
        const enemySlots = isPlayerSide ? [2, 3] : [0, 1];
        const allySlot = isPlayerSide
          ? context.attackerSlot === 0
            ? 1
            : 0
          : context.attackerSlot === 2
            ? 3
            : 2;
        return [...enemySlots, allySlot].filter(
          (i) => context.activeBattlers[i] && context.activeBattlers[i]!.currentHp > 0,
        );
      }

      case 'all':
        return [0, 1, 2, 3].filter((i) => i !== context.attackerSlot);

      case 'single-enemy':
      default:
        if (context.targetSlot !== undefined) return [context.targetSlot];
        return this.getFirstAliveEnemyTargets(isPlayerSide, context.activeBattlers);
    }
  }

  getValidTargets(
    slot: number,
    moveId: string,
    activeBattlers: (PokemonInstance | null)[],
  ): number[] {
    const moveTarget = this.getMoveTarget(moveId);
    const isPlayerSide = slot < 2;

    switch (moveTarget) {
      case 'self':
        return [slot];

      case 'single-ally': {
        const allySlot = isPlayerSide ? (slot === 0 ? 1 : 0) : slot === 2 ? 3 : 2;
        return activeBattlers[allySlot] && activeBattlers[allySlot]!.currentHp > 0
          ? [allySlot]
          : [];
      }

      case 'both-enemies':
      case 'all-adjacent':
      case 'single-enemy':
        return (isPlayerSide ? [2, 3] : [0, 1]).filter(
          (i) => activeBattlers[i] && activeBattlers[i]!.currentHp > 0,
        );

      case 'all':
        return [0, 1, 2, 3].filter(
          (i) => i !== slot && activeBattlers[i] && activeBattlers[i]!.currentHp > 0,
        );
    }
  }

  private getFirstAliveEnemyTargets(
    isPlayerSide: boolean,
    activeBattlers: (PokemonInstance | null)[],
  ): number[] {
    const firstSlot = isPlayerSide ? 2 : 0;
    const secondSlot = isPlayerSide ? 3 : 1;

    if (activeBattlers[firstSlot] && activeBattlers[firstSlot]!.currentHp > 0) return [firstSlot];
    if (activeBattlers[secondSlot] && activeBattlers[secondSlot]!.currentHp > 0)
      return [secondSlot];
    return [];
  }
}

export const defaultDoubleBattleTargetingPolicy = new DoubleBattleTargetingPolicy();
