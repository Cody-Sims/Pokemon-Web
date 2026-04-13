import { EncounterEntry } from './interfaces';

/** Per-route encounter tables. */
export const encounterTables: Record<string, EncounterEntry[]> = {
  'route-1': [
    { pokemonId: 16, levelRange: [2, 5], weight: 40 },  // Pidgey
    { pokemonId: 19, levelRange: [2, 4], weight: 40 },  // Rattata
    { pokemonId: 25, levelRange: [3, 5], weight: 20 },  // Pikachu (rare)
  ],
  'route-2': [
    { pokemonId: 16, levelRange: [3, 6], weight: 30 },  // Pidgey
    { pokemonId: 19, levelRange: [3, 6], weight: 30 },  // Rattata
    { pokemonId: 10, levelRange: [3, 5], weight: 20 },  // Caterpie
    { pokemonId: 13, levelRange: [3, 5], weight: 20 },  // Weedle
  ],
  'viridian-forest': [
    { pokemonId: 10, levelRange: [3, 6], weight: 30 },  // Caterpie
    { pokemonId: 11, levelRange: [4, 6], weight: 10 },  // Metapod
    { pokemonId: 13, levelRange: [3, 6], weight: 30 },  // Weedle
    { pokemonId: 14, levelRange: [4, 6], weight: 10 },  // Kakuna
    { pokemonId: 25, levelRange: [3, 5], weight: 5 },   // Pikachu (rare)
    { pokemonId: 16, levelRange: [4, 6], weight: 15 },  // Pidgey
  ],
};

/** Fishing encounter tables: per-route + per-rod tier. */
export type RodTier = 'old' | 'good' | 'super';

export const fishingTables: Record<string, Partial<Record<RodTier, EncounterEntry[]>>> = {
  'route-1': {
    old:   [{ pokemonId: 129, levelRange: [5, 10], weight: 100 }],  // Magikarp
    good:  [
      { pokemonId: 129, levelRange: [10, 15], weight: 60 },  // Magikarp
      { pokemonId: 118, levelRange: [10, 15], weight: 40 },  // Goldeen
    ],
    super: [
      { pokemonId: 118, levelRange: [15, 25], weight: 40 },  // Goldeen
      { pokemonId: 119, levelRange: [20, 30], weight: 20 },  // Seaking
      { pokemonId: 130, levelRange: [20, 30], weight: 10 },  // Gyarados (rare)
      { pokemonId: 60,  levelRange: [15, 25], weight: 30 },  // Poliwag
    ],
  },
  'viridian-city': {
    old:   [{ pokemonId: 129, levelRange: [5, 10], weight: 100 }],
    good:  [
      { pokemonId: 129, levelRange: [10, 15], weight: 50 },
      { pokemonId: 60,  levelRange: [10, 15], weight: 50 },  // Poliwag
    ],
    super: [
      { pokemonId: 60,  levelRange: [15, 25], weight: 40 },
      { pokemonId: 61,  levelRange: [20, 30], weight: 20 },  // Poliwhirl
      { pokemonId: 54,  levelRange: [15, 25], weight: 40 },  // Psyduck
    ],
  },
  'pewter-city': {
    old:   [{ pokemonId: 129, levelRange: [5, 10], weight: 100 }],
    good:  [
      { pokemonId: 129, levelRange: [10, 15], weight: 70 },
      { pokemonId: 118, levelRange: [10, 15], weight: 30 },
    ],
  },
};
