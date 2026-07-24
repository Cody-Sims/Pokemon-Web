import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { PokemonType } from '@utils/type-helpers';

const STATUS_IMMUNITIES: Partial<Record<string, PokemonType[]>> = {
  burn: ['fire'],
  paralysis: ['electric'],
  poison: ['poison', 'steel'],
  'bad-poison': ['poison', 'steel'],
  freeze: ['ice'],
};

export const statusMessages: Record<string, (targetName: string) => string> = {
  burn: targetName => `${targetName} was burned!`,
  paralysis: targetName => `${targetName} is paralyzed! It may be unable to move!`,
  poison: targetName => `${targetName} was poisoned!`,
  'bad-poison': targetName => `${targetName} was badly poisoned!`,
  sleep: targetName => `${targetName} fell asleep!`,
  freeze: targetName => `${targetName} was frozen solid!`,
};

export function isImmuneToStatus(target: PokemonInstance, status: string): boolean {
  const immuneTypes = STATUS_IMMUNITIES[status];
  if (!immuneTypes) return false;
  const types = pokemonData[target.dataId]?.types as PokemonType[] | undefined;
  return types?.some(type => immuneTypes.includes(type)) ?? false;
}
