# Data Layer

Pure data files with no game logic. Every file exports plain TypeScript objects or
arrays conforming to interfaces defined in `interfaces.ts`.

## Key Files

| File | Content |
|---|---|
| `interfaces.ts` | All TypeScript interfaces (`PokemonData`, `MoveData`, `ItemData`, `TrainerData`, `PokemonInstance`, `SaveData`, etc.) |
| `type-chart.ts` | 18×18 type effectiveness matrix |
| `encounter-tables.ts` | Per-route wild Pokémon + level ranges |
| `evolution-data.ts` | Evolution conditions (level, item, trade) |
| `item-data.ts` | All items (potions, balls, key items, TMs) |
| `shop-data.ts` | Per-city shop inventories |
| `tm-data.ts` | TM move mappings |
| `quest-data.ts` | Side quest definitions |
| `cutscene-data.ts` | Scripted story sequences |
| `achievement-data.ts` | 50 achievements across 5 categories |
| `difficulty.ts` | Difficulty level definitions |
| `synthesis-data.ts` | Synthesis Mode configuration |
| `trainer-data.ts` | Legacy trainer data (see also `trainers/`) |
| `battle-tower-data.ts` | A.1 Battle Tower tier configs + trainer rosters (Normal / Super / Rental) |

## Subdirectories

| Directory | Content | Barrel Export |
|---|---|---|
| `maps/` | 66 map definitions organized by `cities/`, `routes/`, `interiors/`, `dungeons/` | `maps/index.ts` → `mapRegistry` |
| `moves/` | Per-type move data (16 type files) | `moves/index.ts` → `moveData` |
| `pokemon/` | Per-type species data (153 Pokémon) | `pokemon/index.ts` → `pokemonData` |
| `trainers/` | Trainer data by category (rival, gym, elite four, etc.) | `trainers/index.ts` |

## Conventions

- Import data via barrel exports: `import { moveData } from '@data/moves'`
- Never put game logic here — logic goes in `battle/`, `systems/`, or `managers/`
- All new data objects must conform to interfaces in `interfaces.ts`
- Maps have their own parser and tile system — see `maps/CONTEXT.md` or
  `.github/instructions/map-generation.instructions.md`
