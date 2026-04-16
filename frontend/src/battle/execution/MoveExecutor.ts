import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { DamageCalculator, DamageResult } from '../calculation/DamageCalculator';
import { StatusEffectHandler, EffectResult } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
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
  weatherSet?: import('@utils/type-helpers').WeatherCondition;  // weather to set
  isCharging?: boolean;  // true if this is the charge turn of a two-turn move
}

/** Applies move effects: damage, status changes, stat changes. */
export class MoveExecutor {
  static execute(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    moveId: string,
    statusHandler?: StatusEffectHandler,
    weatherManager?: WeatherManager,
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

    // ── Two-turn move: charge turn ──
    if (move.effect?.type === 'two-turn' && statusHandler) {
      const charging = statusHandler.getChargingMove(attacker);
      if (!charging) {
        // Start charging — skip the attack this turn
        statusHandler.startCharging(attacker, moveId);
        // Deduct PP on the charge turn
        const moveInstance = attacker.moves.find(m => m.moveId === moveId);
        if (moveInstance && moveInstance.currentPp > 0) moveInstance.currentPp--;

        const chargeMessages: Record<string, string> = {
          'fly': `${attackerName} flew up high!`,
          'dig': `${attackerName} burrowed underground!`,
          'solar-beam': `${attackerName} absorbed light!`,
          'skull-bash': `${attackerName} lowered its head!`,
          'sky-attack': `${attackerName} is glowing!`,
          'razor-wind': `${attackerName} whipped up a whirlwind!`,
        };
        const msg = chargeMessages[moveId] ?? `${attackerName} is charging up!`;

        return {
          damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
          moveHit: true,
          moveName: move.name,
          attackerName,
          defenderName,
          effectMessages: [msg],
          isCharging: true,
        };
      }
      // Attack turn — clear charging and proceed with normal execution
      statusHandler.clearCharging(attacker);
    }

    // ── Protect / Detect: check if defender is protected ──
    if (statusHandler && move.effect?.type !== 'protect' && statusHandler.isProtected(defender)) {
      // Deduct PP even though the move is blocked
      const moveInstance = attacker.moves.find(m => m.moveId === moveId);
      if (moveInstance && moveInstance.currentPp > 0) moveInstance.currentPp--;

      return {
        damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: false,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: [`${defenderName} protected itself!`],
      };
    }

    // Reset protect success rate when using any non-protect move
    if (statusHandler && move.effect?.type !== 'protect') {
      statusHandler.resetProtectRate(attacker);
    }

    // ── Protect / Detect move itself ──
    if (move.effect?.type === 'protect' && statusHandler) {
      const moveInstance = attacker.moves.find(m => m.moveId === moveId);
      if (moveInstance && moveInstance.currentPp > 0) moveInstance.currentPp--;

      const effectResult = statusHandler.applyMoveEffect(attacker, defender, move, 0);
      return {
        damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: effectResult.messages,
      };
    }

    // ── Weather-setting moves ──
    if (move.effect?.type === 'weather') {
      const moveInstance = attacker.moves.find(m => m.moveId === moveId);
      if (moveInstance && moveInstance.currentPp > 0) moveInstance.currentPp--;

      const weatherCondition = move.effect.weather;
      const weatherMessages: string[] = [];
      if (weatherCondition && weatherManager) {
        weatherMessages.push(...weatherManager.setWeather(weatherCondition));
      }
      return {
        damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: true,
        moveName: move.name,
        attackerName,
        defenderName,
        effectMessages: weatherMessages,
        weatherSet: weatherCondition,
      };
    }

    // Check accuracy
    if (!DamageCalculator.doesMoveHit(move)) return miss();

    // Deduct PP
    const moveInstance = attacker.moves.find(m => m.moveId === moveId);
    if (moveInstance && moveInstance.currentPp > 0) {
      moveInstance.currentPp--;
    }

    // ── Fire-type thawing: fire moves thaw frozen targets ──
    const thawMessages: string[] = [];
    if (statusHandler) {
      const thawMsg = statusHandler.checkThaw(defender, move);
      if (thawMsg) thawMessages.push(thawMsg);
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
        effectMessages: [...thawMessages, 'It\'s a one-hit KO!'],
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
        effectMessages: [...thawMessages],
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
        effectMessages: [...thawMessages],
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
        effectMessages: [...thawMessages],
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
        effectMessages: [...thawMessages, `Hit ${hits} time(s)!`],
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
      effectMessages: [...thawMessages, ...effectResult.messages],
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
