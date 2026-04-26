---
description: Project-wide coding guidelines for the Pokemon Web game
applyTo: '**'
---

# Pokemon Web — Copilot Instructions

> For project overview, layout, architecture, dependency graph, key interfaces,
> file-finding shortcuts, common task recipes, and anti-patterns, see the root
> `AGENTS.md`. This file contains Copilot-specific behavioral rules only.

## Work in Parallel to the best of your ability

## Mandatory Checks (Run Before Every Commit)

1. **Build**: `npm run build` — must complete with zero errors (runs `tsc --noEmit` + Vite build)
2. **Test**: `npm run test` — fast unit + integration tests (< 2s)
3. **E2E**: `npm run test:e2e` — if UI or scene changes were made
4. **Changelog**: Update `docs/CHANGELOG.md` with date-grouped entries (Added/Changed/Fixed/Removed)
5. **Architecture**: Update `docs/architecture.md` if new scenes, managers, systems, entities, or data files were added
6. **Context files**: Update affected `CONTEXT.md` files when adding, removing, or renaming files in a directory (see below)

## Keeping Context Fresh (MANDATORY)

This project uses `CONTEXT.md` files in each major `frontend/src/` directory and `AGENTS.md` at the root to help AI agents navigate the codebase. These files become stale if not maintained.

**When to update `CONTEXT.md`:**
- Adding a new file to a directory → add it to that directory's `CONTEXT.md`
- Removing or renaming a file → update the corresponding `CONTEXT.md` entry
- Changing a module's responsibility → update its description in `CONTEXT.md`
- Adding a new subdirectory → add a row to the parent's `CONTEXT.md` table

**When to update `AGENTS.md`:**
- Adding a new major module or directory → update Project Layout tree
- Adding a new command or script → update Dev Environment or Testing sections
- Adding a new interface to `interfaces.ts` → update Key Interfaces table
- Changes that affect the dependency graph → update Dependency Graph section
- New common task patterns emerge → add to Common Tasks recipes
- Discovering a new anti-pattern → add to Anti-Patterns table

**When to update path-specific `.instructions.md`:**
- Adding new conventions or rules for a domain (battle, data, scenes)
- Adding new files that change the module table in the instruction file

## Code Conventions

### Import Rules
- Use path aliases: `@scenes/*`, `@entities/*`, `@data/*`, `@managers/*`, `@systems/*`, `@ui/*`, `@utils/*`, `@config/*`, `@battle/*`
- Import from barrel `index.ts` files, not from individual module files
- Example: `import { BattleManager } from '@battle'` not `import { BattleManager } from '@battle/core/BattleManager'`

### Variable and Type Rules
- Prefer `const` over `let`; never use `var`
- Use TypeScript interfaces/types for all game data structures (see `frontend/src/data/interfaces.ts`)
- All data objects must conform to their interface — no ad-hoc shapes

### File Placement
- One Phaser Scene per file in `frontend/src/scenes/<domain>/`
- Entity classes → `frontend/src/entities/`
- Pure data (no logic) → `frontend/src/data/`
- Singleton services → `frontend/src/managers/`
- Reusable gameplay systems → `frontend/src/systems/`
- Reusable UI components → `frontend/src/ui/`
- Utility functions → `frontend/src/utils/`
- Battle subsystem logic → `frontend/src/battle/`
- Static assets → `frontend/public/assets/` organized by type
- Design docs → `docs/`
- Temp/scratch files → `temp/` (don't commit unless explicitly requested)

### Scene Patterns
- Scenes communicate via `EventManager` (custom event bus), never direct references
- Register new scenes in `frontend/src/config/game-config.ts`
- All persistent game state goes through `GameManager`, never stored on scenes
- Use `TransitionManager` for scene transitions

### Data File Patterns
- Data files export plain objects/arrays — no classes, no logic, no side effects
- Map files follow the character-grid format with `CHAR_TO_TILE` mapping
- For maps, use the toolchain (`npm run map:validate`, `npm run map:preview`) — see `.github/instructions/map-generation.instructions.md`

## Testing Conventions

- Unit tests → `tests/unit/<module>.test.ts`
- Integration tests → `tests/integration/<feature>.test.ts`
- E2E tests → `tests/e2e/<flow>.spec.ts`
- Seed `Math.random` in `beforeEach` for determinism
- Reset singleton managers between tests
- Use `it.each()` for data-driven exhaustive coverage

## Git Workflow

- Stage only changed files: `git add <file1> <file2>` — never `git add -A` or `git add .`
- Commit with imperative mood: "Add fire-type moves and update type chart"
- Separate commits for separate logical changes
- Never amend or force-push without explicit approval