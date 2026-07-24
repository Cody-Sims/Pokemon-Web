import type { PokemonInstance } from '../models/pokemon';
import type { MapKey } from '@data/maps';

export interface SaveData {
  version: number;
  timestamp: number;
  difficulty?: string;
  nuzlockeEncountered?: string[];
  player: {
    name: string;
    gender?: 'boy' | 'girl';
    position: { mapKey: MapKey; x: number; y: number; direction: string };
    party: PokemonInstance[];
    bag: { itemId: string; quantity: number }[];
    money: number;
    badges: string[];
    pokedex: { seen: number[]; caught: number[] };
    playtime: number;
  };
  flags: Record<string, boolean>;
  trainersDefeated: string[];
  boxes?: PokemonInstance[][];
  boxNames?: string[];
  gameStats?: Record<string, number>;
  hallOfFame?: unknown[];
  visitedMaps?: string[];
  achievements?: unknown;
  gameClockMinutes?: number;
}
