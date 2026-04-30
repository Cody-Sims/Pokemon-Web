import { PokemonInstance, MoveData } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { itemData } from '@data/item-data';
import { WeatherCondition } from '@utils/type-helpers';

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

  /** Check if the item is a berry (consumed on use). */
  private static isBerry(itemId: string): boolean {
    return itemId.endsWith('-berry');
  }

  private static isChoiceItem(itemId: string): boolean {
    return itemId === 'choice-band' || itemId === 'choice-specs' || itemId === 'choice-scarf';
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
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];

    switch (item) {
      case 'leftovers': {
        if (pokemon.currentHp < pokemon.stats.hp) {
          const heal = Math.max(1, Math.floor(pokemon.stats.hp / 16));
          pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
          messages.push(`${name} restored a little HP with Leftovers!`);
        }
        break;
      }
      case 'black-sludge': {
        const data = pokemonData[pokemon.dataId];
        if (data?.types.includes('poison')) {
          if (pokemon.currentHp < pokemon.stats.hp) {
            const heal = Math.max(1, Math.floor(pokemon.stats.hp / 16));
            pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
            messages.push(`${name} restored a little HP with Black Sludge!`);
          }
        } else {
          const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
          messages.push(`${name} was hurt by Black Sludge!`);
        }
        break;
      }
    }

    return { messages };
  }

  /** Called after a move deals damage to this Pokémon. Handles Focus Sash, Rocky Helmet, etc. */
  static onAfterDamage(
    pokemon: PokemonInstance,
    attacker: PokemonInstance,
    damage: number,
    hpBeforeHit: number,
  ): { messages: string[]; damagePrevented: number; rockyHelmetRecoil: number } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item) return { messages: [], damagePrevented: 0, rockyHelmetRecoil: 0 };
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];
    let damagePrevented = 0;
    let rockyHelmetRecoil = 0;

    switch (item) {
      case 'focus-sash': {
        // Survive a one-hit KO from full HP
        if (hpBeforeHit === pokemon.stats.hp && pokemon.currentHp <= 0) {
          pokemon.currentHp = 1;
          damagePrevented = 1;
          HeldItemHandler.consumeItem(pokemon);
          messages.push(`${name} hung on using its Focus Sash!`);
        }
        break;
      }
      case 'rocky-helmet': {
        // Damage the attacker for 1/6 of their max HP whenever the holder
        // takes damage from a move (assumed contact for simplicity).
        if (damage > 0 && attacker.currentHp > 0) {
          const attName = attacker.nickname ?? pokemonData[attacker.dataId]?.name ?? '???';
          rockyHelmetRecoil = Math.max(1, Math.floor(attacker.stats.hp / 6));
          attacker.currentHp = Math.max(0, attacker.currentHp - rockyHelmetRecoil);
          messages.push(`${attName} was hurt by ${name}'s Rocky Helmet!`);
        }
        break;
      }
    }

    return { messages, damagePrevented, rockyHelmetRecoil };
  }

  /** Called when attacker uses a damaging move. Handles Life Orb recoil. */
  static onAttackLanded(
    attacker: PokemonInstance,
    damage: number,
  ): { messages: string[]; recoilDamage: number } {
    const item = HeldItemHandler.getHeldItem(attacker);
    if (!item || damage <= 0) return { messages: [], recoilDamage: 0 };
    const name = attacker.nickname ?? pokemonData[attacker.dataId]?.name ?? '???';
    const messages: string[] = [];
    let recoilDamage = 0;

    switch (item) {
      case 'life-orb': {
        recoilDamage = Math.max(1, Math.floor(attacker.stats.hp / 10));
        attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
        messages.push(`${name} lost some HP due to Life Orb!`);
        break;
      }
    }

    return { messages, recoilDamage };
  }

  /** Called when a status condition is applied. Handles Lum Berry, specific cure berries. */
  static onStatusApplied(pokemon: PokemonInstance): { messages: string[]; cured: boolean } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item || !pokemon.status) return { messages: [], cured: false };
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];
    let cured = false;

    switch (item) {
      case 'lum-berry': {
        pokemon.status = null;
        pokemon.statusTurns = undefined;
        HeldItemHandler.consumeItem(pokemon);
        cured = true;
        messages.push(`${name}'s Lum Berry cured its status!`);
        break;
      }
      case 'cheri-berry':
        if (pokemon.status === 'paralysis') {
          pokemon.status = null;
          HeldItemHandler.consumeItem(pokemon);
          cured = true;
          messages.push(`${name}'s Cheri Berry cured its paralysis!`);
        }
        break;
      case 'rawst-berry':
        if (pokemon.status === 'burn') {
          pokemon.status = null;
          HeldItemHandler.consumeItem(pokemon);
          cured = true;
          messages.push(`${name}'s Rawst Berry cured its burn!`);
        }
        break;
      case 'aspear-berry':
        if (pokemon.status === 'freeze') {
          pokemon.status = null;
          HeldItemHandler.consumeItem(pokemon);
          cured = true;
          messages.push(`${name}'s Aspear Berry cured its freeze!`);
        }
        break;
      case 'chesto-berry':
        if (pokemon.status === 'sleep') {
          pokemon.status = null;
          pokemon.statusTurns = undefined;
          HeldItemHandler.consumeItem(pokemon);
          cured = true;
          messages.push(`${name}'s Chesto Berry woke it up!`);
        }
        break;
      case 'pecha-berry':
        if (pokemon.status === 'poison' || pokemon.status === 'bad-poison') {
          pokemon.status = null;
          pokemon.statusTurns = undefined;
          HeldItemHandler.consumeItem(pokemon);
          cured = true;
          messages.push(`${name}'s Pecha Berry cured its poison!`);
        }
        break;
    }

    return { messages, cured };
  }

  /** Called after HP changes. Handles Sitrus Berry (heal when below 50%). */
  static checkHPThreshold(pokemon: PokemonInstance): { messages: string[] } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item || pokemon.currentHp <= 0) return { messages: [] };
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const messages: string[] = [];

    const hpPct = pokemon.currentHp / pokemon.stats.hp;

    switch (item) {
      case 'sitrus-berry': {
        if (hpPct <= 0.5) {
          const heal = Math.max(1, Math.floor(pokemon.stats.hp / 4));
          pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
          HeldItemHandler.consumeItem(pokemon);
          messages.push(`${name} restored HP with its Sitrus Berry!`);
        }
        break;
      }
      case 'oran-berry': {
        if (hpPct <= 0.5) {
          pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + 10);
          HeldItemHandler.consumeItem(pokemon);
          messages.push(`${name} restored HP with its Oran Berry!`);
        }
        break;
      }
      // Pinch berries — restore 1/3 of max HP at low HP. Each flavour exists
      // for variety / breeding hooks; mechanically they share the heal.
      case 'figy-berry':
      case 'wiki-berry':
      case 'mago-berry':
      case 'aguav-berry':
      case 'iapapa-berry': {
        if (hpPct <= 0.5) {
          const heal = Math.max(1, Math.floor(pokemon.stats.hp / 3));
          pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
          const berryName = item.split('-')[0].replace(/^./, c => c.toUpperCase());
          HeldItemHandler.consumeItem(pokemon);
          messages.push(`${name} restored HP with its ${berryName} Berry!`);
        }
        break;
      }
    }

    return { messages };
  }

  /**
   * Called when a volatile status (confusion, etc.) is applied. Returns
   * `cured: true` if a held berry removed the volatile, in which case the
   * caller should also remove it from the Pokémon's volatile state set.
   */
  static onVolatileApplied(
    pokemon: PokemonInstance,
    volatile: 'confusion' | 'flinch' | 'leech-seed' | 'trapped' | 'protect',
  ): { messages: string[]; cured: boolean } {
    const item = HeldItemHandler.getHeldItem(pokemon);
    if (!item) return { messages: [], cured: false };
    const name = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';

    if (item === 'persim-berry' && volatile === 'confusion') {
      HeldItemHandler.consumeItem(pokemon);
      return {
        messages: [`${name}'s Persim Berry snapped it out of confusion!`],
        cured: true,
      };
    }
    if (item === 'lum-berry' && volatile === 'confusion') {
      HeldItemHandler.consumeItem(pokemon);
      return {
        messages: [`${name}'s Lum Berry cured its confusion!`],
        cured: true,
      };
    }

    return { messages: [], cured: false };
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
    const map: Record<string, WeatherCondition> = {
      'heat-rock': 'sun',
      'damp-rock': 'rain',
      'smooth-rock': 'sandstorm',
      'icy-rock': 'hail',
    };
    return map[item] === weather ? 3 : 0;
  }

  /** Modify damage output. Returns a multiplier for the attacker's held item. */
  static modifyDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
  ): number {
    const item = HeldItemHandler.getHeldItem(attacker);
    if (!item) return 1.0;

    switch (item) {
      case 'life-orb':
        return 1.3;
      case 'choice-band':
        if (move.category === 'physical') return 1.5;
        break;
      case 'choice-specs':
        if (move.category === 'special') return 1.5;
        break;
      case 'muscle-band':
        if (move.category === 'physical') return 1.1;
        break;
      case 'wise-glasses':
        if (move.category === 'special') return 1.1;
        break;
    }

    return 1.0;
  }
}
