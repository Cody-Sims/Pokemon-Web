---
description: Rules for editing pure data files (Pokémon, moves, items, trainers, encounters)
applyTo: 'frontend/src/data/**'
---

# Data File Instructions

## Core Rule

Data files export **plain objects and arrays only** — no classes, no logic, no side
effects, no imports from game modules. Game logic belongs in `battle/`, `systems/`,
or `managers/`.

## Interface Conformance

Every data object must conform to its interface from `data/interfaces.ts`:

| Data Type | Interface | File Pattern |
|---|---|---|
| Pokémon species | `PokemonData` | `data/pokemon/<type>.ts` |
| Moves | `MoveData` | `data/moves/<type>.ts` |
| Items | `ItemData` | `data/item-data.ts` |
| Trainers | `TrainerData` | `data/trainers/<category>.ts` |
| Encounters | `EncounterEntry` | `data/encounter-tables.ts` |
| Evolutions | (see `evolution-data.ts`) | `data/evolution-data.ts` |
| Quests | (see `quest-data.ts`) | `data/quest-data.ts` |
| Maps | `MapDefinition` | `data/maps/<category>/<name>.ts` |

## Barrel Export Rules

- Each subdirectory (`moves/`, `pokemon/`, `trainers/`, `maps/`) has a barrel
  `index.ts` that re-exports all entries.
- After adding a new file, update the directory's `index.ts` to include it.
- Consumers import from the barrel: `import { moveData } from '@data/moves'`

## Map Files

Map files have special rules — see `.github/instructions/map-generation.instructions.md`.

Key points:
- Maps use character grids parsed by `CHAR_TO_TILE` from `data/maps/map-parser.ts`
- Always validate with `npm run map:validate` after editing
- Never rewrite entire map grids from scratch — make targeted edits
- Tile types are defined in `data/maps/tiles.ts` (115 tile types)

## Adding New Data

1. Follow the matching interface from `interfaces.ts` exactly
2. Add to the appropriate per-type or per-category file
3. Update the barrel `index.ts` if adding a new file
4. Run `npm run build` to type-check
5. Run `npm run test` to verify no regressions
