import type { PokemonType, Stats } from '@utils/type-helpers';
import type { MoveId } from '@data/moves';

export interface PokemonData {
  id: number;
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Stats;
  abilities: string[];
  learnset: { level: number; moveId: MoveId }[];
  evolutionChain: { pokemonId: number; condition: { type: 'level' | 'item' | 'trade'; level?: number; itemId?: string } }[];
  catchRate: number;
  expYield: number;
  spriteKeys: { front: string; back: string; icon: string };
}
