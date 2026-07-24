# Data Layer

Declarative game content plus small, explicit data access helpers. Registry content
exports plain TypeScript objects or arrays conforming to domain interfaces.

## Key Files

| File | Content |
|---|---|
| `interfaces.ts` | Compatibility barrel for domain interfaces from `pokemon/types.ts`, `moves/types.ts`, `items/types.ts`, `trainers/types.ts`, `encounters/types.ts`, and runtime Pokémon models. |
| `selectors.ts` | Lookup/view helpers such as `getMoveData`, `getPokemonData`, `pokemonDisplayName`, and party slot derivation; throws `MissingDataError` for missing IDs. |
| `type-chart.ts` | 18×18 type effectiveness matrix. |
| `encounter-tables.ts` | Per-route wild Pokémon + fishing encounter tables. |
| `evolution-data.ts` | Evolution conditions (level, item, trade). |
| `item-data.ts` | All items (potions, balls, key items, TMs). |
| `shop-data.ts` | Per-map shop inventories keyed by the Poké Mart/interior map that hosts the shop interaction. |
| `tm-data.ts` | TM and move-tutor mappings. |
| `quest-data.ts` | Side quest definitions. |
| `cutscene-data.ts` | Scripted story sequences. |
| `achievement-data.ts` | 50 achievements across 5 categories. |
| `difficulty.ts` | Difficulty level definitions. |
| `synthesis-data.ts` | Synthesis Mode configuration. |
| `trainer-data.ts` | Legacy trainer-data barrel/compatibility exports; canonical categories live in `trainers/`. |
| `battle-tower-data.ts` | Battle Tower tier configs + trainer rosters. |
| `bp-shop-data.ts` | BP Shop catalog of BP-priced competitive items. |

## Subdirectories

| Directory | Content | Barrel Export |
|---|---|---|
| `maps/` | 66 map source files organized by `cities/` (10), `routes/` (8), `interiors/` (33), and `dungeons/` (15); `mapRegistry` exposes 82 map entries because some source modules export multiple maps | `maps/index.ts` → `mapRegistry`, `MapKey` |
| `moves/` | 18 per-type move data files plus shared move types; registry contains 244 moves | `moves/index.ts` → `moveData`, `MoveId` |
| `pokemon/` | 15 per-primary-type Pokémon data files plus shared species types; registry contains 155 Pokémon | `pokemon/index.ts` → `pokemonData` |
| `trainers/` | Trainer data by category (rival, gym, elite four, route, team grunts, rematches) plus shared trainer types | `trainers/index.ts` |
| `items/` | Shared item interfaces/types used by `item-data.ts` and shop/catalog data | N/A |
| `encounters/` | Shared encounter interfaces/types used by encounter tables | N/A |
| `cutscenes/` | Shared cutscene interfaces/types used by scripted story data | N/A |

## Conventions

- Import data via barrel exports: `import { moveData } from '@data/moves'`.
- Keep registry files declarative and side-effect free; data lookup logic belongs in `selectors.ts` or runtime modules.
- Prefer derived ID types (`MoveId`, `MapKey`) where they are available.
- All new data objects must conform to their domain interfaces.
- Maps have their own parser and tile system — see `maps/CONTEXT.md` or `.github/instructions/map-generation.instructions.md`.
- Data reference changes should keep `tests/unit/data/data-integrity.test.ts` passing.
