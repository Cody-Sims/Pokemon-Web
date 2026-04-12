import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/move-data';
import { DamageCalculator, DamageResult } from './DamageCalculator';
import { StatusEffectHandler, EffectResult } from './StatusEffectHandler';
import { randomInt } from '@utils/math-helpers';

export interface MoveExecutionResult {
  damage: DamageResult;
  moveHit: boolean;
  moveName: string;
  attackerName: string;
  defenderName: string;
  effectMessages: string[];
  totalHits?: number;       // for multi-hit moves
  healedHp?: number;
  recoilDamage?: number;
  selfDestruct?: boolean;
}

/** Applies move effects: damage, status changes, stat changes. */
export class MoveExecutor {
  static execute(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    moveId: string,
    statusHandler?: StatusEffectHandler,
  ): MoveExecutionResult {
    const move = moveData[moveId];
    const attackerName = attacker.nickname ?? `Pokemon #${attacker.dataId}`;
    const defenderName = defender.nickname ?? `Pokemon #${defender.dataId}`;

    const miss = (): MoveExecutionResult => ({
      damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
      moveHit: false,
      moveName: move?.name ?? moveId,
      attackerName,
      defenderName,
      effectMessages: [],
    });

    if (!move) return miss();

    // Check accuracy
    if (!DamageCalculator.doesMoveHit(move)) return miss();

    // Deduct PP
    const moveInstance = attacker.moves.find(m => m.moveId === moveId);
    if (moveInstance && moveInstance.currentPp > 0) {
      moveInstance.currentPp--;
    }

    // ── Special damage types ──

    // OHKO moves
    if (move.effect?.type === 'ohko') {
      const dmg = defender.currentHp;
      defender.currentHp = 0;
      return {
        damage: { damage: dmg, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: ['It\'s a one-hit KO!'],
      };
    }

    // Fixed damage (Sonic Boom = 20, Dragon Rage = 40)
    if (move.effect?.type === 'fixed-damage') {
      const dmg = move.effect.amount ?? 0;
      defender.currentHp = Math.max(0, defender.currentHp - dmg);
      return {
        damage: { damage: dmg, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: [],
      };
    }

    // Level-based damage (Seismic Toss, Night Shade, Psywave)
    if (move.effect?.type === 'level-damage') {
      const dmg = attacker.level;
      defender.currentHp = Math.max(0, defender.currentHp - dmg);
      return {
        damage: { damage: dmg, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: [],
      };
    }

    // Super Fang (halves current HP)
    if (moveId === 'super-fang') {
      const dmg = Math.max(1, Math.floor(defender.currentHp / 2));
      defender.currentHp = Math.max(0, defender.currentHp - dmg);
      return {
        damage: { damage: dmg, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: [],
      };
    }

    // ── Multi-hit moves ──
    if (move.effect?.type === 'multi-hit') {
      const hits = move.effect.hits ?? MoveExecutor.rollMultiHit();
      let totalDamage = 0;
      let lastResult: DamageResult = { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false };

      for (let i = 0; i < hits; i++) {
        if (defender.currentHp <= 0) break;
        const dmgResult = DamageCalculator.calculate(attacker, defender, move, statusHandler);
        defender.currentHp = Math.max(0, defender.currentHp - dmgResult.damage);
        totalDamage += dmgResult.damage;
        lastResult = dmgResult;
      }

      return {
        damage: { ...lastResult, damage: totalDamage },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: [`Hit ${hits} time(s)!`],
        totalHits: hits,
      };
    }

    // ── Standard damage calculation ──
    const damage = DamageCalculator.calculate(attacker, defender, move, statusHandler);
    defender.currentHp = Math.max(0, defender.currentHp - damage.damage);

    // ── Apply secondary effects via StatusEffectHandler ──
    let effectResult: EffectResult = { messages: [] };
    if (statusHandler && move.effect) {
      effectResult = statusHandler.applyMoveEffect(attacker, defender, move, damage.damage);

      // Haze resets all stat stages
      if (moveId === 'haze') {
        statusHandler.resetAllStages();
        effectResult.messages.push('All stat changes were eliminated!');
      }
    }

    return {
      damage,
      moveHit: true,
      moveName: move.name,
      attackerName,
      defenderName,
      effectMessages: effectResult.messages,
      healedHp: effectResult.healedHp,
      recoilDamage: effectResult.recoilDamage,
      selfDestruct: effectResult.selfDestruct,
    };
  }

  /** Roll 2-5 hits for multi-hit moves (standard distribution). */
  private static rollMultiHit(): number {
    const roll = Math.random();
    if (roll < 0.375) return 2;
    if (roll < 0.75) return 3;
    if (roll < 0.875) return 4;
    return 5;
  }
}
