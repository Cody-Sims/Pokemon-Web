---
description: Project-wide coding guidelines for the Pokemon Web game
applyTo: '**'
---

# Pokemon Web — Project Instructions

## Work in Parallel to the best of your ability

## Project Overview
A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The entire game runs client-side as a static web app. See [docs/plan.md](../../docs/plan.md) for the development plan and [docs/architecture.md](../../docs/architecture.md) for the full architecture.

## Tech Stack
- **TypeScript 5.x** with strict mode
- **Phaser 3.90+** for 2D rendering, physics, input, audio, scene management
- **Vite 6.x** for dev server and builds
- **Tiled** (external) for tilemap creation (exported as JSON)

## Documentation Requirements

### Changelog (MANDATORY)
After completing any task that modifies code or assets, **update [docs/CHANGELOG.md]** with a summary of what changed. Use the following format:

```markdown
## [YYYY-MM-DD]
### Added / Changed / Fixed / Removed
- Brief description of the change
```

Group entries by date (newest first). Use [Keep a Changelog](https://keepachangelog.com/) conventions: Added, Changed, Deprecated, Removed, Fixed, Security.

### Architecture (MANDATORY when applicable)
If a task introduces new scenes, managers, systems, entities, data files, or changes the folder structure or high-level data flow, **update `docs/architecture.md`** to reflect the changes. Keep the folder-structure tree, architecture diagram, and section descriptions in sync with the actual codebase.

## Code Conventions
- One Phaser Scene per file in `frontend/src/scenes/`.
- Entity classes go in `frontend/src/entities/`.
- Pure data (no game logic) goes in `frontend/src/data/`.
- Singleton service classes go in `frontend/src/managers/`.
- Reusable gameplay systems go in `frontend/src/systems/`.
- Reusable UI components go in `frontend/src/ui/`.
- Utility functions go in `frontend/src/utils/`.
- Battle subsystem logic (isolated from scenes) goes in `frontend/src/battle/`.
- Static assets live under `frontend/public/assets/` and are organized by type (sprites, tilesets, maps, audio, ui, fonts).
- Documentation and design notes go in `docs/`.
- Temporary files (downloaded data, one-off test scripts, scratch work) go in `temp/`. Do not commit `temp/` contents unless explicitly requested.
- Use path aliases when configured (`@scenes/*`, `@entities/*`, `@data/*`, etc.).
- Prefer `const` over `let`; avoid `var`.
- Use TypeScript interfaces/types for all game data structures (see `frontend/src/data/interfaces.ts`).

## Build & Dev Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check then build for production
- `npm run preview` — Preview production build locally

## Git Workflow (MANDATORY)
After completing a task, **stage and commit all changed files** with a short but detailed commit message describing what was done. Use imperative mood (e.g., "Add fire-type moves and update type chart"). If a task spans multiple logical changes, use separate commits for each. Do not amend or force-push without explicit approval.

## Key Patterns
- Scenes communicate via `EventManager` (custom event bus), not direct references.
- Game state lives in `GameManager` (party, badges, playtime, flags).
- Save/load uses `SaveManager` serializing to localStorage.
- Grid-locked movement via `GridMovement` system.
- Battle flow is managed by `BattleStateMachine` (FSM pattern).