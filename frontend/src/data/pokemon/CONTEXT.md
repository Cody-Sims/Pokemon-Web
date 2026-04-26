# Pokémon

Per-type species data files. Each file exports an array of `PokemonData` objects
for Pokémon whose primary type matches the filename.

## Files (16 type files + barrel)

| File | Type | Species Count |
|---|---|---|
| `normal.ts` | Normal | 22 species |
| `fire.ts` | Fire | 12 species |
| `water.ts` | Water | 28 species |
| `electric.ts` | Electric | 9 species |
| `grass.ts` | Grass | 12 species |
| `ice.ts` | Ice | 2 species |
| `fighting.ts` | Fighting | 7 species |
| `poison.ts` | Poison | 14 species |
| `ground.ts` | Ground | 8 species |
| `psychic.ts` | Psychic | 8 species |
| `bug.ts` | Bug | 12 species |
| `rock.ts` | Rock | 9 species |
| `ghost.ts` | Ghost | — |
| `dragon.ts` | Dragon | — |
| `fairy.ts` | Fairy | — |
| `index.ts` | — | Barrel: combines all into `pokemonData` record (153 total) |

## Conventions

- Follow the `PokemonData` interface from `data/interfaces.ts`
- Import via barrel: `import { pokemonData } from '@data/pokemon'`
- Each species needs `id`, `name`, `types`, `baseStats`, `abilities`, `learnset`,
  `catchRate`, `expYield`, `spriteKeys`
- Add sprites to `frontend/public/assets/sprites/pokemon/` when adding species
