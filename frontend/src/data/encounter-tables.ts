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
