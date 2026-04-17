import { PokemonInstance, MoveData } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { PokemonType, WeatherCondition } from '@utils/type-helpers';
import type { StatusEffectHandler } from './StatusEffectHandler';

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
  ): { messages: string[]; weather?: WeatherCondition } {
    const ability = AbilityHandler.getAbility(pokemon);
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];
    let weather: WeatherCondition | undefined;

    switch (ability) {
      case 'intimidate': {
        const state = statusHandler.getState(opponent);
        const old = state.statStages.attack;
        state.statStages.attack = Math.max(-6, old - 1);
        if (state.statStages.attack < old) {
          const oppName = opponent.nickname ?? pokemonData[opponent.dataId]?.name ?? '???';
          messages.push(`${name}'s Intimidate cut ${oppName}'s Attack!`);
        }
        break;
      }
      case 'drizzle':
        weather = 'rain';
        messages.push(`${name}'s Drizzle made it rain!`);
        break;
      case 'drought':
        weather = 'sun';
        messages.push(`${name}'s Drought intensified the sun!`);
        break;
      case 'sand-stream':
        weather = 'sandstorm';
        messages.push(`${name}'s Sand Stream whipped up a sandstorm!`);
        break;
      case 'snow-warning':
        weather = 'hail';
        messages.push(`${name}'s Snow Warning summoned a hailstorm!`);
        break;
      case 'trace': {
        const oppAbility = AbilityHandler.getAbility(opponent);
        if (oppAbility) {
          pokemon.ability = oppAbility;
          messages.push(`${name} traced ${opponent.nickname ?? pokemonData[opponent.dataId]?.name}'s ${oppAbility}!`);
        }
        break;
      }
    }

    return { messages, weather };
  }

  /** Called after a move deals damage to the defender. May inflict contact effects. */
  static onAfterDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    damage: number,
  ): { messages: string[] } {
    const defAbility = AbilityHandler.getAbility(defender);
    const atkName = attacker.nickname ?? pokemonData[attacker.dataId]?.name ?? '???';
    const messages: string[] = [];

    // Contact-triggered abilities (only for physical moves)
    if (move.category === 'physical' && damage > 0) {
      switch (defAbility) {
        case 'static':
          if (!attacker.status && Math.random() < 0.3) {
            const atkData = pokemonData[attacker.dataId];
            if (!atkData?.types.includes('electric' as PokemonType)) {
              attacker.status = 'paralysis';
              messages.push(`${atkName} was paralyzed by Static!`);
            }
          }
          break;
        case 'flame-body':
          if (!attacker.status && Math.random() < 0.3) {
            const atkData = pokemonData[attacker.dataId];
            if (!atkData?.types.includes('fire' as PokemonType)) {
              attacker.status = 'burn';
              messages.push(`${atkName} was burned by Flame Body!`);
            }
          }
          break;
        case 'poison-point':
          if (!attacker.status && Math.random() < 0.3) {
            const atkData = pokemonData[attacker.dataId];
            if (!atkData?.types.includes('poison' as PokemonType) && !atkData?.types.includes('steel' as PokemonType)) {
              attacker.status = 'poison';
              messages.push(`${atkName} was poisoned by Poison Point!`);
            }
          }
          break;
        case 'rough-skin':
        case 'iron-barbs': {
          const recoil = Math.max(1, Math.floor(attacker.stats.hp / 8));
          attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
          messages.push(`${atkName} was hurt by ${defAbility === 'rough-skin' ? 'Rough Skin' : 'Iron Barbs'}!`);
          break;
        }
      }
    }

    return { messages };
  }

  /** Called at end of turn for passive abilities. */
  static onEndOfTurn(pokemon: PokemonInstance, statusHandler?: StatusEffectHandler): { messages: string[] } {
    const ability = AbilityHandler.getAbility(pokemon);
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];

    if (pokemon.currentHp <= 0) return { messages };

    switch (ability) {
      case 'speed-boost': {
        // Boost speed stat stage via StatusEffectHandler
        if (statusHandler) {
          const state = statusHandler.getState(pokemon);
          if (state.statStages.speed < 6) {
            state.statStages.speed = Math.min(6, state.statStages.speed + 1);
            messages.push(`${name}'s Speed Boost raised its Speed!`);
          }
        } else {
          messages.push(`${name}'s Speed Boost raised its Speed!`);
        }
        break;
      }
      case 'poison-heal':
        if (pokemon.status === 'poison' || pokemon.status === 'bad-poison') {
          const heal = Math.max(1, Math.floor(pokemon.stats.hp / 8));
          pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
          messages.push(`${name} restored HP with Poison Heal!`);
        }
        break;
      case 'rain-dish':
        // Weather check happens in caller
        break;
    }

    return { messages };
  }

  /** Modify damage output. Returns a multiplier. */
  static modifyDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
  ): number {
    let multiplier = 1.0;

    const atkAbility = AbilityHandler.getAbility(attacker);
    const defAbility = AbilityHandler.getAbility(defender);

    // Attacker abilities
    switch (atkAbility) {
      case 'blaze':
        if (move.type === 'fire' && attacker.currentHp <= attacker.stats.hp / 3)
          multiplier *= 1.5;
        break;
      case 'torrent':
        if (move.type === 'water' && attacker.currentHp <= attacker.stats.hp / 3)
          multiplier *= 1.5;
        break;
      case 'overgrow':
        if (move.type === 'grass' && attacker.currentHp <= attacker.stats.hp / 3)
          multiplier *= 1.5;
        break;
      case 'swarm':
        if (move.type === 'bug' && attacker.currentHp <= attacker.stats.hp / 3)
          multiplier *= 1.5;
        break;
      case 'guts':
        if (attacker.status && move.category === 'physical')
          multiplier *= 1.5;
        break;
      case 'huge-power':
      case 'pure-power':
        if (move.category === 'physical')
          multiplier *= 2.0;
        break;
    }

    // Defender abilities
    switch (defAbility) {
      case 'thick-fat':
        if (move.type === 'fire' || move.type === 'ice')
          multiplier *= 0.5;
        break;
      case 'marvel-scale':
        if (defender.status && move.category === 'physical')
          multiplier *= 0.5;
        break;
    }

    return multiplier;
  }

  /** Check if the defender's ability grants immunity to the move's type. */
  static checkImmunity(
    defender: PokemonInstance,
    move: MoveData,
  ): { immune: boolean; message?: string } {
    const ability = AbilityHandler.getAbility(defender);
    const name = defender.nickname ?? pokemonData[defender.dataId]?.name ?? '???';

    switch (ability) {
      case 'levitate':
        if (move.type === 'ground')
          return { immune: true, message: `${name}'s Levitate made it immune!` };
        break;
      case 'volt-absorb':
        if (move.type === 'electric') {
          const heal = Math.max(1, Math.floor(defender.stats.hp / 4));
          defender.currentHp = Math.min(defender.stats.hp, defender.currentHp + heal);
          return { immune: true, message: `${name}'s Volt Absorb restored HP!` };
        }
        break;
      case 'water-absorb':
        if (move.type === 'water') {
          const heal = Math.max(1, Math.floor(defender.stats.hp / 4));
          defender.currentHp = Math.min(defender.stats.hp, defender.currentHp + heal);
          return { immune: true, message: `${name}'s Water Absorb restored HP!` };
        }
        break;
      case 'flash-fire':
        if (move.type === 'fire')
          return { immune: true, message: `${name}'s Flash Fire activated!` };
        break;
      case 'soundproof':
        // Would need move flag for sound-based moves
        break;
    }

    return { immune: false };
  }
}
