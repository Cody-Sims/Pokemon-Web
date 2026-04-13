# Changelog

All notable changes to the Pokemon Web project.

---

## [2026-04-12]
### Fixed
- Professor Oak no longer repeats starter selection dialogue after player already received a Pokémon — `starter-select` interaction now checks `receivedStarter` flag; NPCs are respawned after starter selection so the flag-gated `pallet-oak-after` NPC replaces `pallet-oak`
- DialogueScene can now be closed with ESC key at any point; regular dialogue now properly resumes OverworldScene on close
- Rewrote `player-walk.json` atlas — sprite sheet is column-based (col0=down, col1=right, col2=up, col3=left) with 3 frames per direction, not row-based with 4 frames. Updated AnimationHelper to register all 4 directions (removed flipX hack for right) with correct frame range (0–2). Player now faces the correct direction when walking.
- Player walk animation no longer spins/restarts every frame — restored `repeat: -1` for continuous walk cycle during movement, removed per-frame `lastAnimKey` reset that was causing the animation to restart from frame 0 each tick

### Added
- **UI Testing — Scene State Machine & Regression Tests**
  - `overworld-animation.test.ts`: Validates animation key stability to prevent player rotation bugs — idle/walk animation resolution, facing→key mapping, rapid direction change handling
  - `battle-ui-state-machine.test.ts`: Exhaustive state×input matrix for BattleUIScene — documents ESC-exits-battle bug, tests input blocking during animation, action/move menu transitions
  - `scene-lifecycle.test.ts`: Input gating across scene overlays (menu, dialogue, battle), pause/resume correctness, transition guards, battle→overworld return sequence
  - `grid-movement.test.ts`: Pure-logic movement — collision blocking, movement locking during tweens, NPC collision, trainer line-of-sight for all 4 directions
  - `input-manager.test.ts`: Direction priority, WASD alternatives, JustDown vs isDown, shared ESC key documentation
  - `ui-regression.spec.ts` (Playwright): Idle rotation, ESC-in-battle, rapid ESC/direction stress, menu open/close/resume, save option
  - Test suite now at 1172 tests across 38 files

### Fixed
- Player walk animation no longer loops infinitely; plays once per tile move using `repeat: 0` and `duration` matching `WALK_DURATION`

### Added
- CI workflow (`.github/workflows/ci.yml`) runs tests and type-check on PRs and pushes to main
- Test step added to deploy workflow so failing tests block deployment
- **Expanded Testing Suite — 1089 tests across 33 files**
  - 15 new test files covering previously untested modules and deep scenarios
  - Extended unit tests: DamageCalculator (burn/stat stage/formula verification), StatusEffectHandler (all 11 stat stages, escalating toxic, confusion self-hit, trap timing, effect chance gating, single-status rule), AIController (power×effectiveness scoring, PP avoidance), type-chart (exhaustive 324 matchups + 48 SE + 8 immunities), data integrity (learnset sorting/dedup, starter balance, move effect validation, evolution acyclicity, route progression)
  - New unit tests: seeded-random (determinism, distribution, edge seeds), map-data (tile constants, solid tiles, colors), audio-keys (BGM/SFX keys, MAP_BGM validation), constants (all game constants)
  - Extended integration tests: full multi-turn battles, multi-pokemon party battles, trainer multi-enemy parties, priority move turn order, status accumulation over turns, every move in moveData crash-tested, every registered species createWildPokemon tested, all level-based evolutions tested, save/load field preservation (nickname, status, EVs, friendship), multi-cycle save/load
  - New integration tests: DialogueManager, full-battle-scenarios
  - Created `docs/TestingArchitecture.md` documenting all 5 test layers, test structure, coverage goals, and agent workflow
  - Updated `copilot-instructions.md` with testing section referencing TestingArchitecture.md

- **Phase 11: Deployment — GitHub Pages — COMPLETE**
  - Set Vite `base: '/Pokemon-Web/'` for correct asset paths on GitHub Pages
  - Created `.github/workflows/deploy.yml` — GitHub Actions CI/CD: checkout → Node 20 → npm ci → build → upload artifact → deploy to Pages
  - Added `npm run deploy` script (manual deploy via gh-pages package)
  - Production build verified with correct base path in output HTML

- **Phase 10: Polish & Quality of Life — COMPLETE**
  - Battle intro slide-in animation: sprites enter from offscreen (enemy from right, player from left), info boxes slide in from top/bottom with Back.easeOut easing
  - EXP bar in battle HUD: blue progress bar below player HP, animates on EXP gain with SFX
  - Battle transition screen-wipe: 3 styles (stripes, circles, fade) — battles use alternating stripe wipe effect
  - Evolution animation system: detects level-based evolution after level-up in battle, plays rapid flash sequence → white flash → sprite swap → stat recalculation, updates Pokédex
  - Configurable text speed: DialogueScene reads text speed preference (slow/medium/fast/instant), defaults to medium
  - Save game from menu: MenuScene SAVE option writes to localStorage via SaveManager, shows "Game Saved!" confirmation with fade-out
  - Continue from save: TitleScene→OverworldScene properly loads save data via GameManager.loadFromSave(), restores map position, party, flags

### Changed
  - TransitionScene rewritten with 3 transition styles and clean scene handoff
  - BattleScene sprites and info boxes now use intro animation instead of static placement
  - BattleUIScene victory sequence now checks for evolution before ending battle

- **Phase 9: Game Content — World Building — COMPLETE**
  - 4 new maps: Viridian City (30×30), Route 2 (20×30), Viridian Forest (25×40), Pewter City (30×30)
  - 10 new tile types: PokéCenter (wall/roof/door), PokéMart (wall/roof/door), Gym (wall/roof/door), Dense Tree
  - New trainers: Youngster Ben (Route 2), 3 Bug Catchers placed in Viridian Forest, Gym Leader Brock in Pewter City Gym
  - `StarterSelectScene`: overlay UI for choosing Bulbasaur/Charmander/Squirtle with card layout, sprite preview, keyboard+mouse navigation
  - Flag-gated NPC system: `NpcSpawn.requireFlag`, `flagDialogue` (alternative dialogue per flag), `setsFlag`, `interactionType`
  - Story flag flow: Oak gives starter (→ `receivedStarter`), Mart clerk gives parcel (→ `hasParcel`), Oak accepts parcel (→ `deliveredParcel`, `receivedPokedex`), Brock defeated (→ `defeatedBrock`)
  - Pokémon Center healing: fully restores HP, PP, and status for all party members
  - Trainer defeat rewards: money awarded, trainer marked defeated, Boulder Badge granted for Brock
  - Post-battle trainer messages: defeat announcement, money reward, badge, after-dialogue
  - Block warps when player has no Pokémon (directs to Oak)
  - Map transitions: Route 1 north → Viridian City, Viridian City north → Route 2, Route 2 north → Viridian Forest, Forest north → Pewter City

### Changed
  - Mom NPC dialogue is flag-gated (pre/post starter)
  - OverworldScene NPC spawning respects `requireFlag` conditions
  - BattleScene stores `isTrainerBattle` and `trainerId` from transition data
  - BattleUIScene victory sequence handles trainer rewards, money, badges, and after-dialogue
  - ExperienceCalculator now receives proper isTrainer flag for trainer battles

- **Comprehensive Testing System (All 5 Phases)**
  - **Phase 1 — Unit Tests (Vitest):** DamageCalculator, CatchCalculator, ExperienceCalculator, type-chart, BattleStateMachine, StatusEffectHandler, AIController, math-helpers, and full data integrity tests
  - **Phase 2 — Integration Tests:** GameManager (party, bag, money, badges, serialize/deserialize), SaveManager round-trip, BattleManager full battle flow, MoveExecutor (all move types), EncounterSystem, EventManager, evolution, inventory
  - **Phase 3 — E2E Tests (Playwright):** Boot-to-title smoke test, console error check, new game flow, menu navigation
  - **Phase 4 — Deterministic Replay System:** Seeded PRNG (mulberry32), replay runner, replay types/format, starter battle replay JSON
  - **Phase 5 — Fuzz/Monkey Testing:** Seeded random input generator, 2000-input crash test with periodic screenshots
  - Vitest config with path aliases matching the project's Vite config
  - Phaser mock and localStorage mock utilities for Node-based testing
  - 255 tests across 18 test files, all passing
  - `npm run test`, `test:unit`, `test:integration`, `test:watch`, `test:e2e`, `test:fuzz`, `test:coverage`, `test:all` scripts
  - `frontend/src/utils/seeded-random.ts` — mulberry32 PRNG for deterministic replay

- **Status Effect System — Full Wiring**
  - Type-based status immunities: Fire immune to burn, Electric to paralysis, Poison/Steel to poison, Ice to freeze, Grass to Leech Seed
  - Fire-type move thawing: fire moves now thaw frozen targets before dealing damage
  - Leech Seed effect: drains 1/8 max HP per turn and heals the opponent, with Grass-type immunity
  - Trapping move effects for Wrap, Bind, Fire Spin, and Clamp: deal 1/8 HP per turn for 4–5 turns
  - Status condition indicators (BRN, PAR, PSN, SLP, FRZ) displayed on battle HUD with color coding
  - `StatusEffectHandler` integrated into `BattleManager` as single source of truth
  - `BattleManager.selectMove()` now uses StatusEffectHandler for stat stages, priority, status turn-start checks, flinch, and end-of-turn effects
  - `BattleManager.switchPokemon()` now clears volatile statuses on switch-out and initializes new active
  - `BattleManager.cleanup()` method for proper teardown
  - `BattleManager.getStatusHandler()` exposes the handler for UI integration
  - `MoveExecutor` now passes thaw messages through all return paths (OHKO, fixed-damage, level-damage, multi-hit, standard)

### Changed
  - `BattleUIScene` now uses `BattleManager.getStatusHandler()` instead of creating its own StatusEffectHandler
  - `StatusEffectHandler.applyEndOfTurn()` accepts optional opponent parameter for Leech Seed healing
  - `VolatileStatus` type expanded with `'leech-seed' | 'trapped'`
  - `MoveEffect.type` union expanded with `'leech-seed' | 'trap'`
  - `BattlePokemonState` tracks `trapTurns` for trapping move duration
  - Updated end-of-turn flow in `BattleUIScene` to pass opponent reference for Leech Seed

- **Phase 7: Audio System — COMPLETE**
  - Enhanced `AudioManager` singleton with browser autoplay policy handling (queues BGM until user interaction unlocks audio), safe playback (missing audio keys don't crash), current BGM tracking (avoids replaying same track), fade-out method, mute toggle, volume clamping
  - Created `utils/audio-keys.ts` with typed BGM/SFX key constants and map→BGM mapping table
  - Generated 8 placeholder BGM WAV files (title, pallet-town, route, battle-wild, battle-trainer, battle-gym, victory, pokemon-center) using synthesized square-wave melodies
  - Generated 16 placeholder SFX WAV files (cursor, confirm, cancel, error, hit-normal, hit-super, hit-weak, hit-crit, faint, ball-throw, ball-shake, catch-success, exp-fill, level-up, door-open, ledge-jump, bump, encounter)
  - Audio preloading in `PreloadScene` for all BGM and SFX keys
  - BGM wired into `TitleScene` (title theme), `OverworldScene` (per-map BGM with crossfade on map transition), `BattleScene` (wild/trainer battle themes)
  - Victory BGM plays on battle win in `BattleUIScene`
  - SFX wired into `TitleScene` (cursor/confirm), `MenuScene` (cursor/confirm/cancel), `BattleUIScene` (cursor/confirm/cancel, hit variants based on type effectiveness and crits, faint, level-up), `OverworldScene` (encounter sting)

### Fixed
- Battle→Overworld return flow now properly passes `returnScene`/`returnData` through `BattleScene` so the player returns to the correct map and position after battle (previously defaulted to GameManager state which worked by coincidence)

## [Unreleased]

### Phase 1: Environment & Tooling Setup — COMPLETE
- Initialized project with Vite 8 + TypeScript 6 + Phaser 3
- Moved all frontend code into `frontend/` directory for future backend support
- Configured `tsconfig.json` with strict mode and path aliases (`@scenes/*`, `@data/*`, etc.)
- Configured `vite.config.ts` with matching path aliases and `frontend/` as root
- Created full folder structure per architecture.md
- Created `index.html`, `.gitignore`, `package.json` with dev/build/preview scripts
- Dev server running at `localhost:8080` with HMR

### Phase 2: Core Scenes Skeleton — COMPLETE
- Created 12 scene classes: Boot, Preload, Title, Overworld, Battle, BattleUI, Dialogue, Menu, Inventory, Party, Summary, Transition
- Scene flow: Boot → Preload (progress bar) → Title (New Game / Continue) → Overworld → Battle
- TitleScene: keyboard + mouse menu navigation, cursor indicator
- OverworldScene: placeholder grid, player movement (arrow keys + WASD), camera follow
- BattleScene + BattleUIScene: stubs with placeholder sprites, action menu
- TransitionScene: fade-to-black transitions between scenes
- MenuScene: pause overlay with Pokemon/Bag/Save/Options/Exit
- DialogueScene: typewriter text effect with advance-on-input

### Phase 3: Data Layer — COMPLETE
- Defined TypeScript interfaces: PokemonData, MoveData, ItemData, TrainerData, PokemonInstance, SaveData, etc.
- Populated ~30 Pokémon (3 starter lines, route Pokémon, gym Pokémon)
- Populated ~50 moves across all 18 types + status moves
- Populated ~15 items (Potions, Poké Balls, status heals, key items)
- Populated 7 trainers (Rival, Bug Catchers, Youngster, Lass, Gym Leader Brock)
- Populated 3 encounter tables (Route 1, Route 2, Viridian Forest)
- Built 18×18 type effectiveness chart with lookup functions
- Built evolution data for all Pokémon with level/item conditions

### Phase 4: Overworld Systems — PARTIAL
- Grid-based player movement with tween animation (WASD + Arrow keys)
- GridMovement system: collision checking, tile snapping, direction facing
- Player entity class wrapping GridMovement
- NPC entity class with dialogue and direction facing
- Trainer entity class with line-of-sight detection
- InteractableObject entity for signs/doors/items
- WildEncounterZone entity for grass areas
- EncounterSystem: step counter, weighted random Pokémon selection, wild instance creation
- InputManager: unified keyboard input polling
- AnimationHelper: player walk-cycle animation registration
- Player walk-cycle spritesheet loaded and animated (4-direction)
- Overworld tileset loaded as background
- **Not yet done:** Tiled maps, map transitions/warps, NPC spawning from Tiled objects

### Phase 5: Battle System — COMPLETE
- BattleStateMachine FSM with all states (INTRO, PLAYER_TURN, EXECUTE, CHECK_FAINT, VICTORY, DEFEAT, FLEE, CAPTURE)
- BattleManager: orchestrates turns, speed-based turn order, party management
- DamageCalculator: full Pokémon damage formula (level, power, attack/defense, STAB, type effectiveness, critical hits, random factor)
- MoveExecutor: applies damage, deducts PP, status effect handling
- StatusEffectHandler: burn, paralysis, poison, bad poison, sleep, freeze logic with damage/skip/thaw
- AIController: trainer AI prefers super-effective moves, wild Pokémon random selection
- ExperienceCalculator: EXP yield formula, level-up with stat recalculation, nature modifiers (+10%/-10%), new move learning
- CatchCalculator: catch rate formula with HP ratio, ball multiplier, status bonus, shake checks
- Nature system: 25 natures with proper stat modifiers, `getNatureMultiplier()` and `getNatureDescription()` exports
- Real battle flow: player party persists via GameManager, actual Pokémon instances with moves/stats/PP
- Turn execution: speed determines order, both sides attack, damage messages, effectiveness text, crits
- HP bars animate via tweens, change color (green → yellow → red)
- Sprite flash on hit, drop+fade on faint
- EXP bar in player info box, animates on gain
- Level-up sequence: flash effect, stat display, new move prompt (auto-learn if <4, replace choice if 4)
- Victory returns to overworld, defeat shows "blacked out" message

### Phase 6: UI & Menus — COMPLETE
- **Shared theme system** (`ui/theme.ts`): centralized COLORS, FONTS, SPACING, TYPE_COLORS, CATEGORY_COLORS, STATUS_COLORS + helper functions (drawPanel, drawTypeBadge, drawHpBar, drawButton, hpColor)
- **TitleScene**: dark themed background, split title with gold accent, cursor arrow, monospace fonts
- **MenuScene**: auto-sized panel, cursor arrow, themed borders, keyboard + mouse
- **PartyScene**: pulls real party from GameManager, card-style slots with HP bars, type badges, status badges, gold highlight on selection, opens SummaryScene on select
- **SummaryScene** (3-tab detail view):
  - INFO tab: species, dex #, nature (+/-), status, friendship, HP bar, total EXP, EXP to next level with progress bar, actual Pokémon front sprite
  - STATS tab: all 6 stats with value/base/IV/EV columns, visual bars, nature color coding (red=boosted, blue=lowered), stat totals
  - MOVES tab: move cards with type + category badges, power, accuracy, PP, priority, effect descriptions
- **BattleUIScene**: 2×2 action grid (FIGHT/BAG/POKEMON/RUN), move selection from real Pokémon moves, message bar, keyboard + mouse navigation
- **InventoryScene**: tabbed categories stub (Medicine, Poké Balls, Key Items, TMs)
- All menus navigable with arrow keys + Enter/Space/Escape AND mouse hover + click
- Reusable UI components: HealthBar, TextBox, MenuList, ConfirmBox, BattleHUD

### Phase 8: Save / Load System — COMPLETE
- SaveManager singleton: save/load/hasSave/deleteSave via localStorage
- SaveData interface: version, timestamp, player state, party, bag, money, badges, pokedex, flags, trainers defeated
- GameManager: full serialize/deserialize methods
- TitleScene: "Continue" option appears when save exists

### Assets
- Downloaded all 151 Pokémon front/back/icon sprites from PokéAPI
- Player walk-cycle spritesheet (4-direction, 4-frame) from community resources
- NPC spritesheets for overworld characters
- Overworld tileset for map backgrounds
- PreloadScene dynamically loads all Pokémon sprites from pokemon-data registry
- Asset download script (`download-assets.cjs`) for batch sprite fetching

### Infrastructure
- TypeScript compiles cleanly with `tsc --noEmit` (zero errors)
- Vite dev server with HMR on port 8080
- Git repository initialized with proper `.gitignore`
- GitHub Copilot instructions file for project conventions

---

## Not Yet Started
- Phase 7: Audio (BGM crossfade, SFX)
- Phase 9: World Content (Tiled maps, story beats, NPC dialogue wiring, map transitions)
- Phase 10: Polish (battle transitions, move animations, evolution animations)
- Phase 11: Deployment (production build, GitHub Pages)
