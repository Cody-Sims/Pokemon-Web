import type { PokemonType, Stats } from '@utils/type-helpers';

export interface PokemonInstance {
  dataId: number;
  nickname?: string;
  level: number;
  currentHp: number;
  stats: Stats;
  ivs: Stats;
  evs: Stats;
  nature: string;
  moves: MoveInstance[];
  status: string | null;
  statusTurns?: number;
  exp: number;
  friendship: number;
  ability?: string;
  heldItem?: string | null;
  isShiny?: boolean;
  /** Synthesis-mode type override; when set, replaces species types for STAB/effectiveness. */
  typeOverride?: [PokemonType] | [PokemonType, PokemonType];
}

export interface MoveInstance {
  moveId: string;
  currentPp: number;
}
