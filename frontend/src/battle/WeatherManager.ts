import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from "@data/pokemon";
import { PokemonType, WeatherCondition } from '@utils/type-helpers';

/**
 * Manages weather conditions during battle.
 * Tracks active weather, remaining turns, and applies weather effects.
 */
export class WeatherManager {
  private weather: WeatherCondition | null = null;
  private turnsRemaining = 0;

  /** Set a new weather condition. Default 5 turns. */
  setWeather(condition: WeatherCondition, duration = 5): string[] {
    const messages: string[] = [];
    if (this.weather === condition) {
      // Already active — no change
      return messages;
    }

    this.weather = condition;
    this.turnsRemaining = duration;

    const weatherMessages: Record<WeatherCondition, string> = {
      sun: 'The sunlight turned harsh!',
      rain: 'It started to rain!',
      sandstorm: 'A sandstorm brewed!',
      hail: 'It started to hail!',
    };
    messages.push(weatherMessages[condition]);
    return messages;
  }

  /** Clear weather. */
  clearWeather(): string[] {
    if (!this.weather) return [];
    const old = this.weather;
    this.weather = null;
    this.turnsRemaining = 0;

    const clearMessages: Record<WeatherCondition, string> = {
      sun: 'The harsh sunlight faded.',
      rain: 'The rain stopped.',
      sandstorm: 'The sandstorm subsided.',
      hail: 'The hail stopped.',
    };
    return [clearMessages[old]];
  }

  /** Get active weather condition (or null). */
  getWeather(): WeatherCondition | null {
    return this.weather;
  }

  /** Get remaining turns. */
  getTurnsRemaining(): number {
    return this.turnsRemaining;
  }

  /** Returns true if a type is immune to weather damage. */
  private isImmuneToWeatherDamage(pokemon: PokemonInstance, weather: WeatherCondition): boolean {
    const data = pokemonData[pokemon.dataId];
    if (!data) return false;
    const types = data.types as PokemonType[];

    if (weather === 'sandstorm') {
      return types.includes('rock') || types.includes('ground') || types.includes('steel');
    }
    if (weather === 'hail') {
      return types.includes('ice');
    }
    return false;
  }

  /** Get the damage multiplier weather applies to a move type. */
  getWeatherDamageMultiplier(moveType: PokemonType): number {
    if (!this.weather) return 1.0;

    switch (this.weather) {
      case 'sun':
        if (moveType === 'fire') return 1.5;
        if (moveType === 'water') return 0.5;
        break;
      case 'rain':
        if (moveType === 'water') return 1.5;
        if (moveType === 'fire') return 0.5;
        break;
    }
    return 1.0;
  }

  /**
   * Called at end of turn. Decrements weather timer and applies weather damage.
   * Returns messages for each affected Pokémon.
   */
  applyEndOfTurn(pokemon: PokemonInstance): { messages: string[]; damage: number } {
    if (!this.weather || pokemon.currentHp <= 0) return { messages: [], damage: 0 };

    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];
    let damage = 0;

    // Sandstorm: 1/16 HP damage (Rock, Ground, Steel immune)
    if (this.weather === 'sandstorm') {
      if (!this.isImmuneToWeatherDamage(pokemon, 'sandstorm')) {
        damage = Math.max(1, Math.floor(pokemon.stats.hp / 16));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        messages.push(`${name} is buffeted by the sandstorm! ${damage} dmg.`);
      }
    }

    // Hail: 1/16 HP damage (Ice immune)
    if (this.weather === 'hail') {
      if (!this.isImmuneToWeatherDamage(pokemon, 'hail')) {
        damage = Math.max(1, Math.floor(pokemon.stats.hp / 16));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        messages.push(`${name} is buffeted by the hail! ${damage} dmg.`);
      }
    }

    return { messages, damage };
  }

  /**
   * Tick weather at end of full turn (after both Pokémon have acted).
   * Returns messages about weather expiring.
   */
  tickTurn(): string[] {
    if (!this.weather) return [];

    this.turnsRemaining--;
    if (this.turnsRemaining <= 0) {
      return this.clearWeather();
    }
    return [];
  }

  /** Reset weather state (for battle end). */
  cleanup(): void {
    this.weather = null;
    this.turnsRemaining = 0;
  }
}
