import { PokemonType } from '@utils/type-helpers';

/**
 * Data definition for a Pokemon's Synthesis Form.
 * Stat boosts total +100 BST, distributed thematically.
 */
export interface SynthesisFormData {
  pokemonId: number;
  boosts: { attack?: number; defense?: number; spAttack?: number; spDefense?: number; speed?: number };
  typeOverride?: [PokemonType] | [PokemonType, PokemonType];
  abilityOverride?: string;
}

/** Key item required to activate Synthesis Mode in battle. */
export const SYNTHESIS_ITEM = 'synthesis-bracelet';

/**
 * Map of Pokemon IDs eligible for Synthesis Mode.
 * Includes starter final evos, gym leader aces, key story Pokemon,
 * fan-favorites, and legendaries.
 */
export const SYNTHESIS_ELIGIBLE: Record<number, SynthesisFormData> = {
  // ─── Starter final evolutions ───
  3: {
    // Venusaur — Gym Leader Ivy's ace
    pokemonId: 3,
    boosts: { spAttack: 40, defense: 30, spDefense: 30 },
    abilityOverride: 'thick-fat',
  },
  6: {
    // Charizard — Gym Leader Solara's ace
    pokemonId: 6,
    boosts: { spAttack: 40, speed: 30, attack: 30 },
    typeOverride: ['fire', 'dragon'],
  },
  9: {
    // Blastoise
    pokemonId: 9,
    boosts: { spAttack: 40, spDefense: 30, defense: 30 },
    abilityOverride: 'mega-launcher',
  },

  // ─── Gym Leader aces ───
  95: {
    // Onix — Gym Leader Brock's ace (Rock)
    pokemonId: 95,
    boosts: { defense: 50, attack: 30, spDefense: 20 },
    typeOverride: ['rock', 'steel'],
  },
  121: {
    // Starmie — Gym Leader Coral's ace (Water)
    pokemonId: 121,
    boosts: { spAttack: 40, speed: 40, spDefense: 20 },
  },
  82: {
    // Magneton — Gym Leader Ferris's ace (Steel)
    pokemonId: 82,
    boosts: { spAttack: 50, spDefense: 30, defense: 20 },
    abilityOverride: 'filter',
  },
  125: {
    // Electabuzz — Gym Leader Blitz's ace (Electric)
    pokemonId: 125,
    boosts: { speed: 40, spAttack: 30, attack: 30 },
  },
  149: {
    // Dragonite — Gym Leader Drake's ace (Dragon)
    pokemonId: 149,
    boosts: { attack: 40, speed: 30, spAttack: 30 },
  },

  // ─── Fan-favorite Gen 1 Pokemon ───
  94: {
    // Gengar — Gym Leader Morwen's ace (Ghost)
    pokemonId: 94,
    boosts: { spAttack: 40, speed: 40, spDefense: 20 },
    typeOverride: ['ghost', 'poison'],
    abilityOverride: 'shadow-tag',
  },
  65: {
    // Alakazam
    pokemonId: 65,
    boosts: { spAttack: 50, speed: 30, spDefense: 20 },
  },
  68: {
    // Machamp
    pokemonId: 68,
    boosts: { attack: 50, defense: 30, speed: 20 },
    abilityOverride: 'iron-fist',
  },
  130: {
    // Gyarados
    pokemonId: 130,
    boosts: { attack: 40, speed: 30, defense: 30 },
    typeOverride: ['water', 'dark'],
  },
  59: {
    // Arcanine — Gym Leader Solara's party
    pokemonId: 59,
    boosts: { attack: 30, spAttack: 30, speed: 40 },
  },
  76: {
    // Golem
    pokemonId: 76,
    boosts: { attack: 40, defense: 40, spDefense: 20 },
  },

  // ─── Key story Pokemon ───
  150: {
    // Mewtwo — Legendary
    pokemonId: 150,
    boosts: { spAttack: 50, speed: 30, spDefense: 20 },
    abilityOverride: 'insomnia',
  },
  151: {
    // Mew — Legendary
    pokemonId: 151,
    boosts: { spAttack: 20, attack: 20, defense: 20, spDefense: 20, speed: 20 },
  },
  143: {
    // Snorlax — story roadblock Pokemon
    pokemonId: 143,
    boosts: { defense: 40, spDefense: 40, attack: 20 },
    abilityOverride: 'fur-coat',
  },
  131: {
    // Lapras — story transport Pokemon
    pokemonId: 131,
    boosts: { spAttack: 30, spDefense: 30, defense: 20, speed: 20 },
    typeOverride: ['water', 'ice'],
  },
  145: {
    // Zapdos — Legendary bird
    pokemonId: 145,
    boosts: { spAttack: 40, speed: 40, spDefense: 20 },
  },
};
