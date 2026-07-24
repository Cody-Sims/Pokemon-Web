import { PokemonInstance, MoveData } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { WeatherCondition } from '@utils/type-helpers';
import type { BattleRng } from '../core/BattleRng';
import { globalBattleRng } from '../core/BattleRng';
import type { StatusEffectHandler } from './StatusEffectHandler';
import { HeldItemHandler } from './HeldItemHandler';
import { abilities } from './registry/abilities';

// TODO: Ability suppress (Neutralizing Gas, Gastro Acid) is not yet
// distinguished from item suppress. Both should be tracked independently
// so that removing one suppression source doesn't re-enable abilities
// that are still suppressed by the other.

/**
 * Ability hook system for Pokémon battles.
 * Each hook returns messages to display and optionally modifies battle state.
 */
export class AbilityHandler {
  /** Get the ability name for a Pokémon (first ability or override). */
  static getAbility(pokemon: PokemonInstance): string {
    if (pokemon.ability) return pokemon.ability;
    const data = pokemonData[pokemon.dataId];
    return data?.abilities?.[0] ?? '';
  }

  /** Triggered when a Pokémon enters battle (switch-in). */
  static onSwitchIn(
    pokemon: PokemonInstance,
    opponent: PokemonInstance,
    statusHandler: StatusEffectHandler,
  ): { messages: string[]; weather?: WeatherCondition; weatherDuration?: number } {
    const switchState = statusHandler.getState(pokemon);
    if (switchState.switchInTriggered) return { messages: [] };
    switchState.switchInTriggered = true;

    const ability = AbilityHandler.getAbility(pokemon);
    const definition = abilities[ability];
    if (!definition?.onSwitchIn) return { messages: [] };

    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    return definition.onSwitchIn({
      pokemon,
      opponent,
      statusHandler,
      name,
      getAbility: AbilityHandler.getAbility,
      getWeatherDurationBonus: HeldItemHandler.getWeatherDurationBonus,
    });
  }

  /** Called after a move deals damage to the defender. May inflict contact effects. */
  static onAfterDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    damage: number,
    rng: BattleRng = globalBattleRng,
  ): { messages: string[] } {
    const ability = AbilityHandler.getAbility(defender);
    const definition = abilities[ability];
    if (!definition?.onAfterDamage) return { messages: [] };

    const attackerName = attacker.nickname ?? pokemonData[attacker.dataId]?.name ?? '???';
    return definition.onAfterDamage({
      attacker,
      defender,
      move,
      damage,
      isContact: move.category === 'physical' && move.contact !== false,
      attackerName,
      rng,
    });
  }

  /** Called at end of turn for passive abilities. */
  static onEndOfTurn(pokemon: PokemonInstance, statusHandler?: StatusEffectHandler): { messages: string[] } {
    const ability = AbilityHandler.getAbility(pokemon);
    const definition = abilities[ability];
    const messages: string[] = [];

    if (pokemon.currentHp <= 0) return { messages };
    if (!definition?.onEndTurn) return { messages };

    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    return definition.onEndTurn({ pokemon, statusHandler, name });
  }

  /** Modify damage output. Returns a multiplier. */
  static modifyDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
  ): number {
    const atkAbility = AbilityHandler.getAbility(attacker);
    const defAbility = AbilityHandler.getAbility(defender);
    const attackerMultiplier = abilities[atkAbility]?.modifyDamage?.({ attacker, defender, move, holder: 'attacker' }) ?? 1.0;
    const defenderMultiplier = abilities[defAbility]?.modifyDamage?.({ attacker, defender, move, holder: 'defender' }) ?? 1.0;
    return attackerMultiplier * defenderMultiplier;
  }

  /** Check if the defender's ability grants immunity to the move's type. */
  static checkImmunity(
    defender: PokemonInstance,
    move: MoveData,
  ): { immune: boolean; message?: string } {
    const ability = AbilityHandler.getAbility(defender);
    const definition = abilities[ability];
    if (!definition?.checkImmunity) return { immune: false };

    const name = defender.nickname ?? pokemonData[defender.dataId]?.name ?? '???';
    return definition.checkImmunity({ defender, move, name });
  }
}
