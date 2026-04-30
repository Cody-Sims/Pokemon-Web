import { pokemonData } from '@data/pokemon';
import { AbilityHandler } from '@battle/effects/AbilityHandler';
import { HeldItemHandler } from '@battle/effects/HeldItemHandler';
import type { PokemonInstance } from '@data/interfaces';
import type { StatusEffectHandler } from '@battle/effects/StatusEffectHandler';
import type { WeatherManager } from '@battle/effects/WeatherManager';

export interface EndOfTurnEffects {
  messages: string[];
}

/** Collect all end-of-turn effect messages for a single Pokémon (status, ability, item, weather). */
export function collectEndOfTurnEffects(
  pokemon: PokemonInstance,
  opponent: PokemonInstance,
  isPlayer: boolean,
  statusHandler: StatusEffectHandler,
  weatherManager: WeatherManager,
): EndOfTurnEffects {
  const messages: string[] = [];

  // Friendship status cure: 10% chance for player's pokemon with friendship >= 220
  if (isPlayer && pokemon.status && pokemon.friendship >= 220 && Math.random() < 0.1) {
    const statusName =
      pokemon.status === 'paralysis' ? 'paralysis'
      : pokemon.status === 'burn' ? 'its burn'
      : pokemon.status === 'poison' || pokemon.status === 'bad-poison' ? 'the poison'
      : pokemon.status;
    const pokeName = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    pokemon.status = null;
    pokemon.statusTurns = undefined;
    messages.push(`${pokeName} shook off ${statusName} with sheer determination!`);
  }

  // Ability end-of-turn (Speed Boost, Poison Heal, etc.)
  // Poison Heal: skip normal poison damage entirely and heal 1/8 max HP instead.
  // This must happen BEFORE applyEndOfTurn so the toxic counter doesn't increment
  // and the wrong-formula undo problem is avoided.
  const ability = AbilityHandler.getAbility(pokemon);
  const isPoisonHealActive = ability === 'poison-heal' && (pokemon.status === 'poison' || pokemon.status === 'bad-poison');

  if (isPoisonHealActive) {
    // Skip the poison/toxic tick — run applyEndOfTurn only for non-poison statuses
    // (burn, leech seed, etc. are still applied normally)
    const eotResult = statusHandler.applyEndOfTurnSkipPoison(pokemon, opponent);
    messages.push(...eotResult.messages);

    const pokeName = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const heal = Math.max(1, Math.floor(pokemon.stats.hp / 8));
    pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
    messages.push(`${pokeName} restored HP with Poison Heal!`);
  } else {
    // Status effect end-of-turn (burn, poison, etc.)
    const eotResult = statusHandler.applyEndOfTurn(pokemon, opponent);
    messages.push(...eotResult.messages);

    const abilityEot = AbilityHandler.onEndOfTurn(pokemon, statusHandler);
    messages.push(...abilityEot.messages);
  }

  // Held item end-of-turn (Leftovers, Black Sludge, etc.)
  const itemEot = HeldItemHandler.onEndOfTurn(pokemon);
  messages.push(...itemEot.messages);

  // Weather end-of-turn damage (Sandstorm, Hail)
  const weatherEot = weatherManager.applyEndOfTurn(pokemon);
  messages.push(...weatherEot.messages);

  return { messages };
}
