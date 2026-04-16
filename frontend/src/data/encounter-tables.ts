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
  'route-4': [
    { pokemonId: 27, levelRange: [15, 19], weight: 20 },  // Sandshrew
    { pokemonId: 74, levelRange: [15, 18], weight: 20 },  // Geodude
    { pokemonId: 66, levelRange: [16, 19], weight: 15 },  // Machop
    { pokemonId: 58, levelRange: [15, 18], weight: 15 },  // Growlithe
    { pokemonId: 21, levelRange: [15, 18], weight: 15 },  // Spearow
    { pokemonId: 95, levelRange: [17, 20], weight: 5 },   // Onix (rare)
    { pokemonId: 77, levelRange: [17, 20], weight: 10 },  // Ponyta
  ],
  'ember-mines': [
    { pokemonId: 41, levelRange: [18, 22], weight: 25 },  // Zubat
    { pokemonId: 74, levelRange: [18, 22], weight: 20 },  // Geodude
    { pokemonId: 75, levelRange: [20, 24], weight: 10 },  // Graveler
    { pokemonId: 109, levelRange: [18, 22], weight: 15 }, // Koffing
    { pokemonId: 88, levelRange: [18, 22], weight: 15 },  // Grimer
    { pokemonId: 95, levelRange: [20, 24], weight: 5 },   // Onix (rare)
    { pokemonId: 126, levelRange: [22, 25], weight: 5 },  // Magmar (rare)
    { pokemonId: 50, levelRange: [18, 22], weight: 5 },   // Diglett
  ],
  'route-5': [
    { pokemonId: 43, levelRange: [22, 26], weight: 20 },  // Oddish
    { pokemonId: 46, levelRange: [22, 26], weight: 15 },  // Paras
    { pokemonId: 48, levelRange: [22, 26], weight: 15 },  // Venonat
    { pokemonId: 69, levelRange: [22, 26], weight: 15 },  // Bellsprout
    { pokemonId: 102, levelRange: [24, 28], weight: 10 }, // Exeggcute
    { pokemonId: 114, levelRange: [24, 28], weight: 10 }, // Tangela
    { pokemonId: 123, levelRange: [25, 28], weight: 5 },  // Scyther (rare)
    { pokemonId: 17, levelRange: [22, 26], weight: 10 },  // Pidgeotto
  ],
  'route-6': [
    { pokemonId: 92, levelRange: [28, 33], weight: 20 },  // Gastly
    { pokemonId: 93, levelRange: [30, 35], weight: 10 },  // Haunter
    { pokemonId: 96, levelRange: [28, 33], weight: 20 },  // Drowzee
    { pokemonId: 97, levelRange: [32, 36], weight: 10 },  // Hypno
    { pokemonId: 49, levelRange: [28, 33], weight: 15 },  // Venomoth
    { pokemonId: 17, levelRange: [28, 33], weight: 15 },  // Pidgeotto
    { pokemonId: 64, levelRange: [30, 35], weight: 10 },  // Kadabra (rare)
  ],
  'route-7': [
    { pokemonId: 92, levelRange: [32, 37], weight: 15 },  // Gastly
    { pokemonId: 93, levelRange: [34, 38], weight: 15 },  // Haunter
    { pokemonId: 109, levelRange: [32, 37], weight: 15 }, // Koffing
    { pokemonId: 110, levelRange: [35, 39], weight: 10 }, // Weezing
    { pokemonId: 88, levelRange: [32, 37], weight: 15 },  // Grimer
    { pokemonId: 24, levelRange: [32, 37], weight: 15 },  // Arbok
    { pokemonId: 42, levelRange: [34, 38], weight: 15 },  // Golbat
  ],
  'victory-road': [
    { pokemonId: 66, levelRange: [40, 45], weight: 15 },  // Machop
    { pokemonId: 67, levelRange: [42, 47], weight: 10 },  // Machoke
    { pokemonId: 74, levelRange: [40, 45], weight: 15 },  // Geodude
    { pokemonId: 75, levelRange: [42, 47], weight: 10 },  // Graveler
    { pokemonId: 95, levelRange: [42, 47], weight: 10 },  // Onix
    { pokemonId: 42, levelRange: [40, 45], weight: 15 },  // Golbat
    { pokemonId: 105, levelRange: [42, 47], weight: 10 }, // Marowak
    { pokemonId: 112, levelRange: [44, 48], weight: 5 },  // Rhydon (rare)
    { pokemonId: 126, levelRange: [44, 48], weight: 5 },  // Magmar (rare)
    { pokemonId: 125, levelRange: [44, 48], weight: 5 },  // Electabuzz (rare)
  ],
  'route-8': [
    { pokemonId: 75, levelRange: [36, 41], weight: 15 },  // Graveler
    { pokemonId: 105, levelRange: [36, 41], weight: 15 }, // Marowak
    { pokemonId: 42, levelRange: [36, 41], weight: 15 },  // Golbat
    { pokemonId: 24, levelRange: [36, 41], weight: 10 },  // Arbok
    { pokemonId: 112, levelRange: [38, 43], weight: 10 }, // Rhydon
    { pokemonId: 110, levelRange: [36, 41], weight: 10 }, // Weezing
    { pokemonId: 34, levelRange: [38, 43], weight: 10 },  // Nidoking
    { pokemonId: 31, levelRange: [38, 43], weight: 10 },  // Nidoqueen
    { pokemonId: 125, levelRange: [40, 44], weight: 5 },  // Electabuzz (rare)
  ],
  'aether-sanctum': [
    { pokemonId: 93, levelRange: [55, 60], weight: 15 },  // Haunter
    { pokemonId: 110, levelRange: [55, 60], weight: 15 }, // Weezing
    { pokemonId: 89, levelRange: [55, 60], weight: 15 },  // Muk
    { pokemonId: 64, levelRange: [55, 60], weight: 10 },  // Kadabra
    { pokemonId: 82, levelRange: [55, 60], weight: 10 },  // Magneton
    { pokemonId: 101, levelRange: [55, 60], weight: 10 }, // Electrode
    { pokemonId: 132, levelRange: [55, 60], weight: 10 }, // Ditto
    { pokemonId: 137, levelRange: [58, 63], weight: 5 },  // Porygon (rare)
    { pokemonId: 143, levelRange: [60, 65], weight: 5 },  // Snorlax (very rare)
    { pokemonId: 149, levelRange: [60, 65], weight: 5 },  // Dragonite (very rare)
  ],
  'crystal-cavern-depths': [
    { pokemonId: 42, levelRange: [50, 55], weight: 15 },  // Golbat
    { pokemonId: 75, levelRange: [50, 55], weight: 15 },  // Graveler
    { pokemonId: 105, levelRange: [50, 55], weight: 10 }, // Marowak
    { pokemonId: 95, levelRange: [52, 57], weight: 10 },  // Onix
    { pokemonId: 36, levelRange: [50, 55], weight: 10 },  // Clefable
    { pokemonId: 112, levelRange: [52, 57], weight: 10 }, // Rhydon
    { pokemonId: 47, levelRange: [50, 55], weight: 10 },  // Parasect
    { pokemonId: 142, levelRange: [55, 60], weight: 5 },  // Aerodactyl (rare)
    { pokemonId: 131, levelRange: [55, 60], weight: 5 },  // Lapras (rare)
    { pokemonId: 148, levelRange: [55, 60], weight: 5 },  // Dragonair (rare)
    { pokemonId: 104, levelRange: [50, 55], weight: 5 },  // Cubone
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
