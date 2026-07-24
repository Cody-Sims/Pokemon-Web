import { PokemonInstance, MoveData } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { WeatherCondition, VolatileStatus } from '@utils/type-helpers';
import { heldItems } from './registry/held-items';

/**
 * Held item effect system for Pokémon battles.
 * Each hook returns messages and optionally modifies battle state.
 * Berries are consumed after use; permanent items persist.
 */
export class HeldItemHandler {
  /** Per-pokemon choice lock state (move locked by Choice Band/Specs/Scarf). */
  private static choiceLocks = new Map<PokemonInstance, string>();

  /** Get the held item id (or null). */
  static getHeldItem(pokemon: PokemonInstance): string | null {
    return pokemon.heldItem ?? null;
  }

  /** Consume a held item (berry). */
  private static consumeItem(pokemon: PokemonInstance): void {
    pokemon.heldItem = null;
  }

  private static isChoiceItem(itemId: string): boolean {
    return itemId === 'choice-band' || itemId === 'choice-specs' || itemId === 'choice-scarf';
  }

  private static getContext(pokemon: PokemonInstance, item: string) {
    return {
      pokemon,
      item,
      name: pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???',
      consumeItem: HeldItemHandler.consumeItem,
    };
  }

  /**
   * Record the move used by a Choice-item holder, locking subsequent turns
   * to that move. Call after a Pokémon successfully uses a move.
   */
  static recordChoiceMove(pokemon: PokemonInstance, moveId: string): void {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (item && HeldItemHandler.isChoiceItem(item)) {
      HeldItemHandler.choiceLocks.set(pokemon, moveId);
    }
  }

  /**
   * Returns true if the Pokémon is Choice-locked to a different move.
   * The caller should prevent the Pokémon from selecting `moveId`.
   */
  static isChoiceLocked(pokemon: PokemonInstance, moveId: string): boolean {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item || !HeldItemHandler.isChoiceItem(item)) return false;
    const locked = HeldItemHandler.choiceLocks.get(pokemon);
    return locked !== undefined && locked !== moveId;
  }

  /** Clear the choice lock (call on switch-out or battle end). */
  static clearChoiceLock(pokemon: PokemonInstance): void {
    HeldItemHandler.choiceLocks.delete(pokemon);
  }

  /** Called at end of turn. Handles Leftovers, Black Sludge. */
  static onEndOfTurn(pokemon: PokemonInstance): { messages: string[] } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item || pokemon.currentHp <= 0) return { messages: [] };
    return heldItems[item]?.onEndOfTurn?.(HeldItemHandler.getContext(pokemon, item)) ?? { messages: [] };
  }

  /** Called after a move deals damage to this Pokémon. Handles Focus Sash, Rocky Helmet, etc. */
  static onAfterDamage(
    pokemon: PokemonInstance,
    attacker: PokemonInstance,
    damage: number,
    hpBeforeHit: number,
  ): { messages: string[]; damagePrevented: number; rockyHelmetRecoil: number } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    const fallback = { messages: [], damagePrevented: 0, rockyHelmetRecoil: 0 };
    if (!item) return fallback;
    return heldItems[item]?.onAfterDamage?.({
      ...HeldItemHandler.getContext(pokemon, item),
      attacker,
      damage,
      hpBeforeHit,
    }) ?? fallback;
  }

  /** Called when attacker uses a damaging move. Handles Life Orb recoil. */
  static onAttackLanded(
    attacker: PokemonInstance,
    damage: number,
  ): { messages: string[]; recoilDamage: number } {
    const item = HeldItemHandler.getHeldItem(attacker);
    const fallback = { messages: [], recoilDamage: 0 };
    if (!item) return fallback;
    return heldItems[item]?.onAttackLanded?.({
      ...HeldItemHandler.getContext(attacker, item),
      damage,
    }) ?? fallback;
  }

  /** Called when a status condition is applied. Handles Lum Berry, specific cure berries. */
  static onStatusApplied(pokemon: PokemonInstance): { messages: string[]; cured: boolean } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    const fallback = { messages: [], cured: false };
    if (!item || !pokemon.status) return fallback;
    return heldItems[item]?.onStatusApplied?.(HeldItemHandler.getContext(pokemon, item)) ?? fallback;
  }

  /** Called after HP changes. Handles Sitrus Berry (heal when below 50%). */
  static checkHPThreshold(pokemon: PokemonInstance): { messages: string[] } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item || pokemon.currentHp <= 0) return { messages: [] };
    return heldItems[item]?.checkHPThreshold?.(HeldItemHandler.getContext(pokemon, item)) ?? { messages: [] };
  }

  /**
   * Called when a volatile status (confusion, etc.) is applied. Returns
   * `cured: true` if a held berry removed the volatile, in which case the
   * caller should also remove it from the Pokémon's volatile state set.
   */
  static onVolatileApplied(
    pokemon: PokemonInstance,
    volatile: VolatileStatus,
  ): { messages: string[]; cured: boolean } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    const fallback = { messages: [], cured: false };
    if (!item) return fallback;
    return heldItems[item]?.onVolatileApplied?.({
      ...HeldItemHandler.getContext(pokemon, item),
      volatile,
    }) ?? fallback;
  }

  /**
   * Returns the bonus duration (in turns) that the attacker's held weather
   * rock adds when setting `weather`. Default rocks add 3 turns to the base 5.
   */
  static getWeatherDurationBonus(
    attacker: PokemonInstance,
    weather: WeatherCondition,
  ): number {
    const item = HeldItemHandler.getHeldItem(attacker);
    if (!item) return 0;
    return heldItems[item]?.weatherDurationBonus?.[weather] ?? 0;
  }

  /** Modify damage output. Returns a multiplier for the attacker's held item. */
  static modifyDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
  ): number {
    const item = HeldItemHandler.getHeldItem(attacker);
    if (!item) return 1.0;
    return heldItems[item]?.modifyDamage?.({ attacker, defender, move }) ?? 1.0;
  }
}
