# Maps

66 map definitions organized by category. Maps use character grids parsed at runtime
by `CHAR_TO_TILE` from `map-parser.ts`.

## Infrastructure Files

| File | Purpose |
|---|---|
| `index.ts` | Barrel export: `mapRegistry` (all maps), shared types |
| `tiles.ts` | `Tile` enum with 115 tile types and `LEDGE_TILES` |
| `tile-metadata.ts` | `OVERLAY_BASE`, `FOREGROUND_TILES`, `TILE_COLORS`, `SOLID_TILES` |
| `map-interfaces.ts` | `MapDefinition`, `NpcSpawn`, `TrainerSpawn`, `ObjectSpawn`, `ObjectType`, `WarpDefinition`, `SpawnPoint` |
| `map-parser.ts` | `CHAR_TO_TILE` mapping and `parseMap()` function |
| `shared.ts` | Backwards-compatible re-exports from split modules |

## Map Categories

| Directory | Maps | Description |
|---|---|---|
| `cities/` | 10 | City/town overworld maps (Pallet Town through Scalecrest Citadel) |
| `routes/` | 8 | Route maps (Route 1–8) connecting cities |
| `interiors/` | 33 | Gyms, PokéCenters, PokéMarts, houses, labs, museum, Pokémon League |
| `dungeons/` | 15 | Viridian Forest, Crystal Cavern, Ember Mines, Victory Road, Abyssal Spire (5 floors), Shattered Isles (3 areas), etc. |

## Conventions

- Use the map toolchain for generation — see `.github/instructions/map-generation.instructions.md`
- Always validate with `npm run map:validate` after editing
- Never rewrite entire character grids from scratch — make targeted edits
- Look up tile characters in `CHAR_TO_TILE` from `map-parser.ts`
