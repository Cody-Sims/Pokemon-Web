import { pokemonData } from '@data/pokemon';
import { AbilityHandler } from '@battle/AbilityHandler';
import { HeldItemHandler } from '@battle/HeldItemHandler';
import type { PokemonInstance } from '@data/interfaces';
import type { StatusEffectHandler } from '@battle/StatusEffectHandler';
import type { WeatherManager } from '@battle/WeatherManager';

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

  // Status effect end-of-turn (burn, poison, etc.)
  const eotResult = statusHandler.applyEndOfTurn(pokemon, opponent);
  messages.push(...eotResult.messages);

  // Ability end-of-turn (Speed Boost, Poison Heal, etc.)
  const abilityEot = AbilityHandler.onEndOfTurn(pokemon);
  messages.push(...abilityEot.messages);

  // Held item end-of-turn (Leftovers, Black Sludge, etc.)
  const itemEot = HeldItemHandler.onEndOfTurn(pokemon);
  messages.push(...itemEot.messages);

  // Weather end-of-turn damage (Sandstorm, Hail)
  const weatherEot = weatherManager.applyEndOfTurn(pokemon);
  messages.push(...weatherEot.messages);

  return { messages };
}
