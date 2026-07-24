import type { PokemonType, MoveEffect } from '@utils/type-helpers';

export interface MoveData {
  id: string;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number;
  pp: number;
  effect?: MoveEffect;
  priority?: number;
  /** Whether this move makes physical contact. Defaults to true for physical moves, false otherwise. */
  contact?: boolean;
}
