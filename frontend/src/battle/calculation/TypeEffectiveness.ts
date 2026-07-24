import { typeChart } from '@data/type-chart';
import type { PokemonType } from '@utils/type-helpers';

/** Get the type effectiveness multiplier for an attacking type vs a defending type. */
export function getTypeEffectiveness(attackType: PokemonType, defendType: PokemonType): number {
  return typeChart[attackType]?.[defendType] ?? 1;
}

/** Get combined effectiveness for dual-type defenders. */
export function getCombinedEffectiveness(
  attackType: PokemonType,
  defendTypes: [PokemonType] | [PokemonType, PokemonType]
): number {
  let multiplier = getTypeEffectiveness(attackType, defendTypes[0]);
  if (defendTypes.length === 2) {
    multiplier *= getTypeEffectiveness(attackType, defendTypes[1]);
  }
  return multiplier;
}
