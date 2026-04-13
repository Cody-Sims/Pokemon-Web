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
  'crystal-cavern': [
    { pokemonId: 41, levelRange: [8, 12], weight: 30 },  // Zubat
    { pokemonId: 74, levelRange: [8, 12], weight: 25 },  // Geodude
    { pokemonId: 46, levelRange: [8, 11], weight: 15 },  // Paras
    { pokemonId: 35, levelRange: [9, 12], weight: 10 },  // Clefairy (uncommon)
    { pokemonId: 95, levelRange: [10, 13], weight: 5 },  // Onix (rare)
    { pokemonId: 50, levelRange: [9, 12], weight: 10 },  // Diglett
    { pokemonId: 104, levelRange: [9, 11], weight: 5 },  // Cubone (rare)
  ],
  'route-3': [
    { pokemonId: 21, levelRange: [10, 14], weight: 25 },  // Spearow
    { pokemonId: 23, levelRange: [10, 13], weight: 20 },  // Ekans
    { pokemonId: 27, levelRange: [10, 14], weight: 20 },  // Sandshrew
    { pokemonId: 56, levelRange: [11, 14], weight: 15 },  // Mankey
    { pokemonId: 16, levelRange: [10, 13], weight: 15 },  // Pidgey
    { pokemonId: 63, levelRange: [12, 14], weight: 5 },   // Abra (rare)
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
  'route-3': {
    old:   [{ pokemonId: 129, levelRange: [5, 10], weight: 100 }],
    good:  [
      { pokemonId: 129, levelRange: [10, 15], weight: 40 },
      { pokemonId: 120, levelRange: [10, 15], weight: 30 },  // Staryu
      { pokemonId: 116, levelRange: [10, 15], weight: 30 },  // Horsea
    ],
    super: [
      { pokemonId: 120, levelRange: [15, 25], weight: 30 },  // Staryu
      { pokemonId: 116, levelRange: [15, 25], weight: 25 },  // Horsea
      { pokemonId: 98,  levelRange: [20, 28], weight: 15 },  // Krabby
      { pokemonId: 90,  levelRange: [20, 28], weight: 15 },  // Shellder
      { pokemonId: 130, levelRange: [20, 30], weight: 5 },   // Gyarados (rare)
      { pokemonId: 131, levelRange: [25, 30], weight: 10 },  // Lapras (rare)
    ],
  },
  'coral-harbor': {
    old:   [{ pokemonId: 129, levelRange: [5, 10], weight: 100 }],
    good:  [
      { pokemonId: 129, levelRange: [10, 15], weight: 30 },
      { pokemonId: 72,  levelRange: [12, 18], weight: 40 },  // Tentacool
      { pokemonId: 120, levelRange: [12, 18], weight: 30 },  // Staryu
    ],
    super: [
      { pokemonId: 73,  levelRange: [20, 30], weight: 20 },  // Tentacruel
      { pokemonId: 121, levelRange: [20, 30], weight: 20 },  // Starmie
      { pokemonId: 116, levelRange: [15, 25], weight: 30 },  // Horsea
      { pokemonId: 117, levelRange: [25, 35], weight: 10 },  // Seadra (rare)
      { pokemonId: 130, levelRange: [20, 30], weight: 10 },  // Gyarados
      { pokemonId: 131, levelRange: [25, 30], weight: 10 },  // Lapras (rare)
    ],
  },
};
