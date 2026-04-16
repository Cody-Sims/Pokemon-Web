import { PokemonInstance } from '@data/interfaces';
import { PokemonType, Stats } from '@utils/type-helpers';
import { SYNTHESIS_ELIGIBLE, SynthesisFormData } from '@data/synthesis-data';

interface SynthesizedState {
  boosts: Partial<Stats>;
  originalTypes?: [PokemonType] | [PokemonType, PokemonType];
  originalAbility?: string;
}

export class SynthesisHandler {
  private synthesizedPokemon: Map<PokemonInstance, SynthesizedState> = new Map();
  private usedThisBattle = false;

  /** Check if the player can Synthesize (has bracelet, hasn't used this battle, pokemon is eligible). */
  canSynthesize(pokemon: PokemonInstance, hasItem: boolean): boolean {
    if (!hasItem) return false;
    if (this.usedThisBattle) return false;
    if (this.isSynthesized(pokemon)) return false;
    return this.isEligible(pokemon.dataId);
  }

  /** Check if a specific Pokemon is eligible for Synthesis. */
  isEligible(pokemonId: number): boolean {
    return pokemonId in SYNTHESIS_ELIGIBLE;
  }

  /** Activate Synthesis Mode on a Pokemon. Returns stat boost messages. */
  activate(pokemon: PokemonInstance): { messages: string[]; boosts: Partial<Stats> } {
    const formData = SYNTHESIS_ELIGIBLE[pokemon.dataId];
    if (!formData) {
      return { messages: ['This Pokémon cannot Synthesize!'], boosts: {} };
    }

    this.usedThisBattle = true;

    const boosts: Partial<Stats> = {};
    const messages: string[] = [];

    const name = pokemon.nickname ?? `Pokémon #${pokemon.dataId}`;
    messages.push(`${name} is surging with Synthesis energy!`);

    // Apply stat boosts
    const boostEntries = formData.boosts;
    if (boostEntries.attack) {
      pokemon.stats.attack += boostEntries.attack;
      boosts.attack = boostEntries.attack;
    }
    if (boostEntries.defense) {
      pokemon.stats.defense += boostEntries.defense;
      boosts.defense = boostEntries.defense;
    }
    if (boostEntries.spAttack) {
      pokemon.stats.spAttack += boostEntries.spAttack;
      boosts.spAttack = boostEntries.spAttack;
    }
    if (boostEntries.spDefense) {
      pokemon.stats.spDefense += boostEntries.spDefense;
      boosts.spDefense = boostEntries.spDefense;
    }
    if (boostEntries.speed) {
      pokemon.stats.speed += boostEntries.speed;
      boosts.speed = boostEntries.speed;
    }

    // Track original state for revert
    const state: SynthesizedState = { boosts };

    // Apply type override if present
    if (formData.typeOverride) {
      messages.push(`${name}'s type changed!`);
      state.originalTypes = undefined; // stored externally by the battle system if needed
    }

    // Apply ability override if present
    if (formData.abilityOverride) {
      state.originalAbility = pokemon.ability;
      pokemon.ability = formData.abilityOverride;
      messages.push(`${name}'s ability became ${formData.abilityOverride}!`);
    }

    this.synthesizedPokemon.set(pokemon, state);
    return { messages, boosts };
  }

  /** Check if a Pokemon is currently Synthesized. */
  isSynthesized(pokemon: PokemonInstance): boolean {
    return this.synthesizedPokemon.has(pokemon);
  }

  /** Get the Synthesis form data for a currently synthesized Pokemon. */
  getFormData(pokemon: PokemonInstance): SynthesisFormData | undefined {
    if (!this.isSynthesized(pokemon)) return undefined;
    return SYNTHESIS_ELIGIBLE[pokemon.dataId];
  }

  /** Revert Synthesis when switching out or battle ends. */
  revert(pokemon: PokemonInstance): void {
    const state = this.synthesizedPokemon.get(pokemon);
    if (!state) return;

    // Subtract stat boosts
    if (state.boosts.attack) pokemon.stats.attack -= state.boosts.attack;
    if (state.boosts.defense) pokemon.stats.defense -= state.boosts.defense;
    if (state.boosts.spAttack) pokemon.stats.spAttack -= state.boosts.spAttack;
    if (state.boosts.spDefense) pokemon.stats.spDefense -= state.boosts.spDefense;
    if (state.boosts.speed) pokemon.stats.speed -= state.boosts.speed;

    // Restore ability
    if (state.originalAbility !== undefined) {
      pokemon.ability = state.originalAbility;
    }

    this.synthesizedPokemon.delete(pokemon);
  }

  /** Clean up all synthesis state (call when battle ends). */
  cleanup(): void {
    for (const [pokemon] of this.synthesizedPokemon) {
      this.revert(pokemon);
    }
    this.synthesizedPokemon.clear();
    this.usedThisBattle = false;
  }
}
