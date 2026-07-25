import type { PokemonInstance } from '../models/pokemon';

export interface SaveData {
  version: number;
  timestamp: number;
  party: PokemonInstance[];
  boxes?: PokemonInstance[][];
  boxNames?: string[];
  badges: string[];
  flags: Record<string, boolean>;
  trainersDefeated: string[];
  pokedex: { seen: number[]; caught: number[] };
  nuzlockeEncountered?: string[];
  visitedMaps?: string[];
  hallOfFame?: unknown[];
  playerName: string;
  playerGender?: 'boy' | 'girl';
  currentMap: string;
  playerPosition: { x: number; y: number; direction: string };
  bag: { itemId: string; quantity: number }[];
  money: number;
  trainerId?: string;
  playtime: number;
  difficulty?: string;
  challengeModes?: string[];
  monotypeLock?: string | null;
  settings?: Record<string, string | number | boolean>;
  berryPlots?: Record<string, unknown[]>;
  berryHarvests?: Record<string, number>;
  repelSteps?: number;
  battlePoints?: number;
  towerBestStreak?: Record<string, number>;
  towerClears?: Record<string, number>;
  gameClockMinutes?: number;
  speedrunSplits?: unknown[];
  gameStats?: Record<string, number>;
  stepCount?: number;
  achievements?: unknown;
}
