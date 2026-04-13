import { PokemonType, Stats, MoveEffect } from '@utils/type-helpers';

export interface PokemonData {
  id: number;
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Stats;
  abilities: string[];
  learnset: { level: number; moveId: string }[];
  evolutionChain: { pokemonId: number; condition: { type: 'level' | 'item' | 'trade'; level?: number; itemId?: string } }[];
  catchRate: number;
  expYield: number;
  spriteKeys: { front: string; back: string; icon: string };
}

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
}

export interface ItemData {
  id: string;
  name: string;
  category: 'pokeball' | 'medicine' | 'battle' | 'key' | 'tm';
  description: string;
  buyPrice?: number;
  effect: {
    type: 'heal-hp' | 'heal-status' | 'capture' | 'boost-stat' | 'key' | 'teach-move';
    amount?: number;
    status?: string;
    catchRateMultiplier?: number;
    moveId?: string;
  };
}

export interface TrainerData {
  id: string;
  name: string;
  spriteKey: string;
  party: { pokemonId: number; level: number; moves?: string[] }[];
  dialogue: { before: string[]; after: string[] };
  rewardMoney: number;
}

export interface EncounterEntry {
  pokemonId: number;
  levelRange: [number, number];
  weight: number;
}

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
  statusTurns?: number;  // Remaining turns for sleep; toxic counter for bad-poison
  exp: number;
  friendship: number;
  ability?: string;
  heldItem?: string | null;
  isShiny?: boolean;
}

export interface MoveInstance {
  moveId: string;
  currentPp: number;
}

export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    name: string;
    position: { mapKey: string; x: number; y: number; direction: string };
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
}
