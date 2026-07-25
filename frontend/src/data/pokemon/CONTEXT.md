# Pokémon

Per-type species data files. Each file exports `PokemonData` records for Pokémon
whose primary type matches the filename.

## Files

`index.ts` combines the per-type files into the `pokemonData` registry, which
currently contains 155 species. The nearest source of truth for the exact registry
is `frontend/src/data/pokemon/index.ts`; avoid duplicating per-file species counts
here because content files change during data restructuring.

## Conventions

- Follow the `PokemonData` interface from `data/interfaces.ts`
- Import via barrel: `import { pokemonData } from '@data/pokemon'`
- Each species needs `id`, `name`, `types`, `baseStats`, `abilities`, `learnset`,
  `catchRate`, `expYield`, `spriteKeys`
- Add sprites to `frontend/public/assets/sprites/pokemon/` when adding species
