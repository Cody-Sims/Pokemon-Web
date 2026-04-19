import { PokemonInstance, MoveInstance } from '@data/interfaces';
import { MoveData } from '@data/interfaces';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { getCombinedEffectiveness } from '@data/type-chart';
import { STAB_MULTIPLIER, CRIT_CHANCE, CRIT_MULTIPLIER, RANDOM_MIN, RANDOM_MAX } from '@utils/constants';
import { randomFloat } from '@utils/math-helpers';
import { PokemonType } from '@utils/type-helpers';
import type { StatusEffectHandler } from '../effects/StatusEffectHandler';import { AbilityHandler } from '../effects/AbilityHandler';
import { HeldItemHandler } from '../effects/HeldItemHandler';
import type { WeatherManager } from '../effects/WeatherManager';

// Accuracy/evasion stage multipliers (Gen III+ formula)
const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 3 / 9, [-5]: 3 / 8, [-4]: 3 / 7, [-3]: 3 / 6,
  [-2]: 3 / 5, [-1]: 3 / 4,  [0]: 1,
  [1]: 4 / 3, [2]: 5 / 3, [3]: 6 / 3, [4]: 7 / 3, [5]: 8 / 3, [6]: 9 / 3,
};

export interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  isSTAB: boolean;
}

/** Calculates damage from standard Pokemon formula. */
export class DamageCalculator {
  static calculate(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    statusHandler?: StatusEffectHandler,
    weatherManager?: WeatherManager,
  ): DamageResult {
    if (move.power === null || move.category === 'status') {
      return { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false };
    }

    const attackerData = pokemonData[attacker.dataId];
    const defenderData = pokemonData[defender.dataId];
    if (!attackerData || !defenderData) {
      return { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false };
    }

    // Check ability-based immunities
    const immunityCheck = AbilityHandler.checkImmunity(defender, move);
    if (immunityCheck.immune) {
      return { damage: 0, effectiveness: 0, isCritical: false, isSTAB: false };
    }

    const level = attacker.level;
    const power = move.power;

    // Choose attack/defense stats based on move category, using stat stages if available
    let A: number;
    let D: number;
    // BUG-050: Foul Play uses the defender's Attack stat
    const isFoulPlay = move.id === 'foul-play';
    if (statusHandler) {
      A = move.category === 'physical'
        ? statusHandler.getEffectiveStat(isFoulPlay ? defender : attacker, 'attack')
        : statusHandler.getEffectiveStat(attacker, 'spAttack');
      D = move.category === 'physical'
        ? statusHandler.getEffectiveStat(defender, 'defense')
        : statusHandler.getEffectiveStat(defender, 'spDefense');
    } else {
      A = move.category === 'physical' ? (isFoulPlay ? defender : attacker).stats.attack : attacker.stats.spAttack;
      D = move.category === 'physical' ? defender.stats.defense : defender.stats.spDefense;
    }

    // AUDIT-002: Floor defense at 1 to prevent division by zero
    D = Math.max(1, D);

    // Base damage
    let damage = ((2 * level / 5 + 2) * power * A / D) / 50 + 2;

    // STAB
    const isSTAB = attackerData.types.includes(move.type as PokemonType);
    if (isSTAB) {
      damage *= STAB_MULTIPLIER;
    }

    // Type effectiveness
    const effectiveness = getCombinedEffectiveness(
      move.type as PokemonType,
      defenderData.types as [PokemonType] | [PokemonType, PokemonType]
    );
    damage *= effectiveness;

    // Critical hit
    const isCritical = Math.random() < CRIT_CHANCE;
    if (isCritical) {
      damage *= CRIT_MULTIPLIER;
    }

    // Random factor
    damage *= randomFloat(RANDOM_MIN, RANDOM_MAX);

    // Weather modifier
    if (weatherManager) {
      damage *= weatherManager.getWeatherDamageMultiplier(move.type as PokemonType);
    }

    // Ability modifier
    damage *= AbilityHandler.modifyDamage(attacker, defender, move);

    // Held item modifier
    damage *= HeldItemHandler.modifyDamage(attacker, defender, move);

    return {
      damage: Math.max(1, Math.floor(damage)),
      effectiveness,
      isCritical,
      isSTAB,
    };
  }

  /** Check if a move hits based on accuracy, incorporating stat stages. */
  static doesMoveHit(
    move: MoveData,
    attacker?: PokemonInstance,
    defender?: PokemonInstance,
    statusHandler?: StatusEffectHandler,
  ): boolean {
    // AUDIT-027: null accuracy means the move never misses (e.g. Swift)
    if (move.accuracy === null || move.accuracy === undefined) return true;

    let effectiveAccuracy = move.accuracy;

    // AUDIT-026: Apply accuracy/evasion stat stages
    if (statusHandler && attacker && defender) {
      const atkState = statusHandler.getState(attacker);
      const defState = statusHandler.getState(defender);
      const accStage = atkState.statStages.accuracy ?? 0;
      const evaStage = defState.statStages.evasion ?? 0;
      const netStage = Math.max(-6, Math.min(6, accStage - evaStage));
      const stageMultiplier = STAGE_MULTIPLIERS[netStage] ?? 1;
      effectiveAccuracy = Math.floor(effectiveAccuracy * stageMultiplier);
    }

    return Math.random() * 100 < effectiveAccuracy;
  }
}
