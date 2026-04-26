# Pokemon Web

> A browser-based Pokémon-style RPG built with Phaser 3 + TypeScript + Vite. Fully client-side static web app with 153 Pokémon, 66 maps, turn-based battles, and a complete storyline. No backend.

## Quick Reference

| Aspect          | Value                                                |
|-----------------|------------------------------------------------------|
| Language        | TypeScript 6.x (strict mode)                         |
| Framework       | Phaser 3.90+                                         |
| Bundler         | Vite 8.x                                             |
| Test Runner     | Vitest 4.x + Playwright                              |
| Node Version    | 22+                                                  |
| Package Manager | npm                                                  |
| Entry Point     | `frontend/src/main.ts`                               |
| Game Config     | `frontend/src/config/game-config.ts`                 |
| Build Output    | `dist/`                                              |

## Dev Environment

- Run `npm install` before any other command.
- Run `npm run dev` to start the Vite dev server with HMR.
- Run `npm run build` to type-check (`tsc --noEmit`) then build for production. **Always run before committing.**
- Run `npm run preview` to preview the production build locally.
- Path aliases are configured in `frontend/tsconfig.json` and `frontend/vite.config.ts`: `@scenes/*`, `@entities/*`, `@data/*`, `@managers/*`, `@systems/*`, `@ui/*`, `@utils/*`, `@config/*`, `@battle/*`.

## Testing

- `npm run test` — All unit + integration tests (< 2s)
- `npm run test:unit` — Unit tests only
- `npm run test:integration` — Integration tests only
- `npm run test:e2e` — Playwright E2E tests (needs dev server running)
- `npm run test:coverage` — Tests with V8 coverage report
- Tests live in `tests/unit/`, `tests/integration/`, `tests/e2e/`.
- Seed `Math.random` in `beforeEach` for determinism. Reset singletons between tests.

## Project Layout

```
frontend/src/
├── main.ts                 # Creates Phaser.Game, syncs accessibility settings
├── config/game-config.ts   # Phaser GameConfig object
├── scenes/                 # One Phaser Scene per file, organized by domain
│   ├── boot/               # BootScene, PreloadScene (asset loading)
│   ├── title/              # TitleScene, IntroScene (menus, new game)
│   ├── overworld/          # OverworldScene + helpers (NPCs, dialogue, fishing, etc.)
│   ├── battle/             # BattleScene, BattleUIScene, turn pipeline
│   ├── menu/               # Pause menu, inventory, party, pokédex, settings
│   ├── pokemon/            # Starter select, nickname, move tutor, PC
│   └── minigame/           # ShopScene, VoltorbFlipScene
├── entities/               # Player, NPC, Trainer, InteractableObject, etc.
├── battle/                 # Battle subsystem (isolated from scenes)
│   ├── core/               # BattleManager, DoubleBattleManager, StateMachine, AI
│   ├── calculation/        # Damage, experience, catch rate formulas
│   ├── effects/            # Status effects, abilities, held items, weather
│   └── execution/          # Move executor, animation player
├── data/                   # Pure data files (no game logic)
│   ├── interfaces.ts       # All TypeScript interfaces
│   ├── maps/               # 66 map definitions in cities/, routes/, interiors/, dungeons/
│   ├── moves/              # Per-type move data files (16 types)
│   ├── pokemon/            # Per-type Pokémon data files (153 species)
│   ├── trainers/           # Trainer data by category (rival, gym, elite four, etc.)
│   ├── type-chart.ts       # 18×18 type effectiveness matrix
│   ├── item-data.ts        # Items (potions, balls, key items)
│   ├── encounter-tables.ts # Per-route wild Pokémon + level ranges
│   ├── evolution-data.ts   # Evolution conditions
│   ├── quest-data.ts       # Side quest definitions
│   ├── cutscene-data.ts    # Scripted story sequences
│   └── achievement-data.ts # 50 achievements across 5 categories
├── managers/               # Singleton services (GameManager, AudioManager, SaveManager, etc.)
├── systems/                # Reusable gameplay systems
│   ├── audio/              # Procedural audio, Pokémon cries, ambient SFX
│   ├── overworld/          # GridMovement, NPCBehavior, encounters, field abilities
│   ├── rendering/          # Weather, lighting, animations, emote bubbles
│   └── engine/             # InputManager, GameClock, MapPreloader, CutsceneEngine
├── ui/                     # Reusable UI components
│   ├── controls/           # TouchControls, VirtualJoystick, MenuController
│   └── widgets/            # NinePatchPanel, HealthBar, TextBox, etc.
└── utils/                  # Pure helpers (constants, math, type-helpers, audio-keys)
```

### Other Key Paths

| Path | Purpose |
|------|---------|
| `frontend/public/assets/` | Static assets: sprites, tilesets, maps, audio, UI, fonts |
| `docs/` | Design docs, architecture, changelog, storyline, plans |
| `tests/` | Vitest + Playwright tests |
| `temp/` | Scratch work, one-off scripts, map generators (not committed) |
| `.github/instructions/` | Copilot custom instructions (path-specific) |
| `.github/workflows/` | CI/CD (ci.yml, deploy.yml) |

## Architecture Patterns

- **Scene communication**: Via `EventManager` (custom event bus), never direct references.
- **Game state**: `GameManager` singleton holds the party, badges, bag, flags, playtime.
- **Persistence**: `SaveManager` serializes to `localStorage`.
- **Movement**: Grid-locked 16px tiles via `GridMovement` system.
- **Battle flow**: `BattleStateMachine` FSM → INTRO → PLAYER_TURN → EXECUTE_TURN → …
- **Data-driven**: Maps use character-grid strings parsed at runtime. Moves, Pokémon, trainers are plain TypeScript objects with barrel re-exports.
- **Barrel exports**: Most directories have `index.ts` files that re-export all members.

## Map System

Maps are defined as TypeScript files in `frontend/src/data/maps/`. Each map has:
- A character grid (string[] where each char maps to a tile type via `CHAR_TO_TILE`)
- NPC spawns, trainer spawns, warp definitions, wild encounter zones
- Map metadata (name, dimensions, BGM key, lighting, weather)

Use the map toolchain for generation:
```bash
npm run map:validate                    # Validate all maps
npm run map:validate -- --map route-1   # Validate one map
npm run map:preview -- --map route-1    # Render PPM preview
npm run map:gen dungeon -- --width 31 --height 25 --seed 42 --biome cave
npm run map:region                      # Render the Aurum Region overview to temp/region-map.ppm
```

## Dependency Graph

```
main.ts → config/game-config.ts → scenes/*
scenes/* → managers/* (GameManager, AudioManager, SaveManager, EventManager)
scenes/* → entities/* (Player, NPC, Trainer)
scenes/battle/* → battle/* (BattleManager, BattleStateMachine, DamageCalculator)
battle/* → data/interfaces.ts, data/moves/*, data/type-chart.ts
systems/overworld/* → entities/Player, managers/GameManager, data/maps/*
systems/rendering/* → managers/GameManager (weather/lighting state)
systems/engine/* → managers/* (InputManager wraps Phaser input)
ui/* → managers/GameManager (theme, accessibility)
data/maps/* → data/maps/tiles.ts, data/maps/map-parser.ts, data/maps/map-interfaces.ts
data/moves/index.ts → data/moves/<type>.ts (barrel re-export)
data/pokemon/index.ts → data/pokemon/<type>.ts (barrel re-export)
data/trainers/index.ts → data/trainers/<category>.ts (barrel re-export)
```

## Key Interfaces (from `data/interfaces.ts`)

| Interface | Used For | Key Fields |
|---|---|---|
| `PokemonData` | Species definitions | `id`, `name`, `types`, `baseStats`, `learnset`, `catchRate` |
| `MoveData` | Move definitions | `id`, `name`, `type`, `category`, `power`, `accuracy`, `pp`, `effect` |
| `ItemData` | Item definitions | `id`, `name`, `category`, `buyPrice`, `effect` |
| `TrainerData` | Trainer definitions | `id`, `name`, `party[]`, `dialogue`, `rewardMoney` |
| `PokemonInstance` | Runtime Pokémon state | `dataId`, `level`, `currentHp`, `stats`, `moves`, `nature`, `ivs` |
| `MapDefinition` | Map structure | `key`, `name`, `width`, `height`, `grid`, `npcs`, `objects`, `warps`, `encounters` |
| `ObjectSpawn` | Object placement | `id`, `tileX`, `tileY`, `textureKey`, `objectType`, `dialogue` |
| `SaveData` | Serialized game state | `player`, `flags`, `trainersDefeated`, `boxes` |

## File-Finding Shortcuts

| Looking for... | Go to |
|---|---|
| Type effectiveness | `frontend/src/data/type-chart.ts` |
| All interfaces/types | `frontend/src/data/interfaces.ts` |
| Type helper enums (`PokemonType`, `Stats`) | `frontend/src/utils/type-helpers.ts` |
| Damage formula | `frontend/src/battle/calculation/DamageCalculator.ts` |
| EXP/level-up formula | `frontend/src/battle/calculation/ExperienceCalculator.ts` |
| Catch rate formula | `frontend/src/battle/calculation/CatchCalculator.ts` |
| Wild encounter rates | `frontend/src/data/encounter-tables.ts` |
| Evolution conditions | `frontend/src/data/evolution-data.ts` |
| Items and shop data | `frontend/src/data/item-data.ts`, `frontend/src/data/shop-data.ts` |
| Quest definitions | `frontend/src/data/quest-data.ts` |
| Achievement definitions | `frontend/src/data/achievement-data.ts` |
| Tile types and map chars | `frontend/src/data/maps/tiles.ts`, `frontend/src/data/maps/map-parser.ts` |
| Map warp/NPC interfaces | `frontend/src/data/maps/map-interfaces.ts` |
| Game constants (tile size, etc.) | `frontend/src/utils/constants.ts` |
| Audio key registry | `frontend/src/utils/audio-keys.ts` |
| Game config (resolution, physics) | `frontend/src/config/game-config.ts` |
| Vite path aliases | `frontend/vite.config.ts` and `frontend/tsconfig.json` |

## Common Tasks

### Adding a New Pokémon Move
1. Edit the appropriate type file in `frontend/src/data/moves/<type>.ts`
2. Follow the `MoveData` interface from `frontend/src/data/interfaces.ts`
3. The barrel `frontend/src/data/moves/index.ts` auto-exports

### Adding a New Pokémon Species
1. Edit the appropriate type file in `frontend/src/data/pokemon/<primary-type>.ts`
2. Follow the `PokemonData` interface — include `baseStats`, `learnset`, `spriteKeys`
3. Add sprites to `frontend/public/assets/sprites/pokemon/`
4. Add encounter entries in `frontend/src/data/encounter-tables.ts` if wild
5. Add evolution data in `frontend/src/data/evolution-data.ts` if it evolves

### Adding a New NPC to a Map
1. Edit the map file in `frontend/src/data/maps/<category>/<map>.ts`
2. Add to the `npcs` array following `NpcSpawn` interface
3. Assign a sprite key from `frontend/public/assets/sprites/npcs/`
4. Signs, item balls, PCs, and doors go in the `objects` array — not `npcs` (see below)

### Adding a Map Object (Sign, Item Ball, PC, Door)
1. Edit the map file in `frontend/src/data/maps/<category>/<map>.ts`
2. Add to the `objects` array following the `ObjectSpawn` interface
3. Set `objectType` to `'sign'`, `'item-ball'`, `'pc'`, or `'door'`
4. Objects do NOT have `facing` or `behavior` — they are static sprites

### Adding a New Trainer
1. Add trainer data in `frontend/src/data/trainers/<category>.ts`
2. Follow the `TrainerData` interface — include `party`, `dialogue`, `rewardMoney`
3. Place the trainer in a map file via the `trainers` array (uses `TrainerSpawn`)
4. Set `victoryFlag` for story progression; `badgeReward` for gym leaders

### Adding a New Item
1. Add to `frontend/src/data/item-data.ts` following the `ItemData` interface
2. If sold in shops, add to `frontend/src/data/shop-data.ts`
3. If it is a TM, also add to `frontend/src/data/tm-data.ts`

### Adding a New Map
1. Use the map toolchain: `npm run map:gen <type>` or `npm run map:compose`
2. Place the file in `frontend/src/data/maps/<category>/`
3. Register in `frontend/src/data/maps/index.ts` and add warps/NPCs
4. Validate with `npm run map:validate` and preview with `npm run map:preview`
5. See `.github/instructions/map-generation.instructions.md` for full rules

### Adding a New Scene
1. Create the scene file in the appropriate `frontend/src/scenes/<domain>/` folder
2. Register it in `frontend/src/config/game-config.ts`
3. Use `EventManager` for cross-scene communication — never direct scene references
4. Update `docs/architecture.md` with the new scene

### Modifying Battle Logic
1. Battle subsystem is in `frontend/src/battle/` (isolated from scenes)
2. Scene-level battle code is in `frontend/src/scenes/battle/`
3. The FSM in `BattleStateMachine.ts` drives all state transitions
4. Run `npm run test` after changes — battle logic has thorough test coverage

## Anti-Patterns (Common AI Mistakes)

| Mistake | Why it's wrong | Do this instead |
|---|---|---|
| Importing from a file instead of the barrel `index.ts` | Breaks consistent import style | Import from the directory barrel: `from '@battle'` not `from '@battle/core/BattleManager'` |
| Using direct scene references for communication | Creates tight coupling | Use `EventManager.emit()` / `EventManager.on()` |
| Putting game logic in data files | Data files must be pure data | Put logic in `battle/`, `systems/`, or `managers/` |
| Using `let` when `const` works | Project convention is `const`-first | Use `const` unless reassignment is truly needed |
| Rewriting entire map grids from scratch | Character grids are error-prone | Make targeted edits; use the map toolchain |
| Skipping `npm run build` before committing | TypeScript errors slip through | Always run `npm run build` — it does full type-check |
| Using `git add -A` or `git add .` | Picks up temp files, unrelated changes | Stage only changed files: `git add <file1> <file2>` |
| Adding game state to Scene classes | State should be centralized | Use `GameManager` for all persistent game state |
| Hardcoding tile characters without checking `tiles.ts` | Wrong char = broken map | Look up the character in `CHAR_TO_TILE` from `map-parser.ts` |

## Keeping Context Fresh

This project uses `CONTEXT.md` files, `AGENTS.md`, and path-specific `.instructions.md`
files to help AI agents navigate efficiently. **These must be kept in sync with the codebase.**

| Trigger | Update |
|---|---|
| Add/remove/rename a file in `frontend/src/` | Update that directory's `CONTEXT.md` |
| Add a new subdirectory | Add a row to the parent `CONTEXT.md` |
| Change a module's responsibility | Update its `CONTEXT.md` description |
| Add a new major module or directory | Update `AGENTS.md` Project Layout tree |
| Add a new interface to `interfaces.ts` | Update `AGENTS.md` Key Interfaces table |
| Change the dependency graph | Update `AGENTS.md` Dependency Graph |
| Discover a new anti-pattern | Add to `AGENTS.md` Anti-Patterns table |
| Add domain-specific rules | Update the matching `.instructions.md` |

## Git Workflow

- Stage only changed files: `git add <file1> <file2>` — never `git add -A` or `git add .`
- Commit with imperative mood: "Add fire-type moves and update type chart"
- Update `docs/CHANGELOG.md` after every code change
- Run `npm run build` and `npm run test` before committing
