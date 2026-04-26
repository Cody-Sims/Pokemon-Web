# Improvement Plan — Pokemon Web: Aurum Region

> **Non-Story Technical & Polish Roadmap** | April 2026
>
> Focuses on performance, stability, code quality, UX polish, mobile,
> accessibility, and gameplay feel. No new story content.

---

## Current State Summary

| Metric | Value |
|--------|-------|
| Build | Clean (zero TS errors) |
| Tests | 1,595 passing (43 files, < 3s) |
| Open bugs | 3 (2 medium, 1 low) |
| Bundle size | 1.92 MB total (battle chunk 1.37 MB dominates) |
| Pokémon | 153 species, 217 moves, 79 maps |
| Phases complete | 20 development phases shipped |

The game is functionally complete with deep mechanics. The main gaps are
**performance** (oversized battle chunk, no texture atlases, per-tile sprites
instead of tilemaps), **architecture debt** (GameManager god object, BattleUIScene
mega-file), **mobile UX gaps** (6 scenes lack mobile scaling, no gesture support),
and **gameplay feel** (hard-cut music, no overworld weather, missing Town Map,
double-battle UI gaps).

---

## Priority Tiers

| Tier | Theme | Goal |
|------|-------|------|
| 0 | **Stability & Bugs** | Zero open bugs, robust error recovery |
| 1 | **Performance** | Sub-1s load, 60 FPS on mid-range mobile |
| 2 | **Architecture** | Reduce coupling, improve maintainability |
| 3 | **Mobile & Accessibility** | First-class phone experience |
| 4 | **Gameplay Feel** | From functional to delightful |
| 5 | **Quality of Life** | Small features, big player satisfaction |
| 6 | **Testing & CI** | Confidence for fast iteration |

---

## Tier 0 — Stability & Bugs

*Fix the remaining open issues and harden error paths.*

### 0.1 Fix Surf State on Water Spawn (NEW-006)

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts`
- **Problem:** `init()` resets `surfing = false`. If the player warps onto a
  water tile, they get stuck.
- **Fix:** After setting spawn position, check whether the tile is water and
  auto-enable surf state.
- **Effort:** Small

### 0.2 Add CI Validation for Evolution Data Sync (BUG-039)

- **Files:** `frontend/src/data/evolution-data.ts`, `frontend/src/data/pokemon/*.ts`
- **Problem:** Dual source of truth for evolution chains can drift.
- **Fix:** Add an integration test that iterates all Pokémon with
  `evolutionChain` and asserts matching entries exist in `evolutionData`, and
  vice versa. Fail CI on mismatch.
- **Effort:** Small

### 0.3 Remaining `shutdown()` Coverage

- **Problem:** Only 5 of 30+ scenes have `shutdown()` lifecycle methods.
  Keyboard listeners, EventManager subscriptions, and timers leak on scene
  restarts.
- **Fix:** Add `shutdown()` to every scene that registers listeners. Priority
  order: BattleScene, BattleUIScene, PartyScene, InventoryScene, PokedexScene,
  ShopScene, PCScene, SummaryScene.
- **Effort:** Medium

### 0.4 Async Error Boundaries

- **Problem:** Several async paths (cutscene playback, cry generation, scene
  transitions) have no error recovery. A failed cutscene freezes the game.
- **Fix:** Wrap async scene transitions and cutscene execution in try/catch
  with fallback behavior (skip cutscene, resume overworld, log warning).
- **Effort:** Medium

---

## Tier 1 — Performance

*Reduce load time and maintain 60 FPS on mobile.*

### 1.1 Break Up the Battle Chunk (1.37 MB)

- **Problem:** The `battle` code-split chunk is 1.37 MB — nearly all Phaser
  framework code lands here. The `index` chunk (390 KB) is reasonable, but the
  battle chunk triggers the Vite size warning.
- **Fix:** Separate the Phaser vendor chunk from game code using
  `rolldownOptions.output.manualChunks`. Target: vendor (Phaser) < 1 MB,
  battle logic < 400 KB.
- **Effort:** Medium

### 1.2 Texture Atlas Generation

- **Problem:** 521 individual PNG sprites loaded as separate textures. No GPU
  draw-call batching. HTTP overhead even with HTTP/2.
- **Fix:** Generate texture atlases grouped by category (Pokémon front/back,
  NPC overworld, UI icons, items). Use `free-tex-packer-core` or a build-time
  script. Update `PreloadScene` to load atlases instead of individual PNGs.
- **Effort:** Large
- **Impact:** Major draw-call reduction, faster load, lower memory

### 1.3 Migrate Map Rendering to Phaser Tilemaps

- **Problem:** `drawMap()` creates an individual sprite per tile instead of
  using Phaser's `Tilemap`/`TilemapLayer` system. Hundreds of game objects per
  map where a single tilemap layer would suffice.
- **Fix:** Convert the character-grid parser to output `Phaser.Tilemaps.Tilemap`
  data. Use `createLayer()` for ground, collision, and overlay layers.
- **Effort:** Large
- **Impact:** Dramatic draw-call reduction, enables future map-editor tooling

### 1.4 Object Pooling for Battle Animations

- **Problem:** `MoveAnimationPlayer` still creates texture-based objects per
  animation (improved from raw Arcs, but still allocates/destroys per move).
- **Fix:** Implement a `GameObjectPool<Phaser.GameObjects.Image>` that
  pre-allocates a small pool. Animations request from pool, return on complete.
- **Effort:** Medium

### 1.5 Throttle Cosmetic Overworld Effects

- **Problem:** Grass alpha randomization and tile tint cycling run every frame
  in the `update()` loop. They are visual-only and can run less frequently.
- **Fix:** Throttle to every 4th frame using a frame counter, or convert to
  Phaser tweens with fixed durations.
- **Effort:** Small
- **Status:** Marked done in perf audit but worth verifying the implementation

---

## Tier 2 — Architecture

*Reduce complexity, improve developer velocity.*

### 2.1 Decompose GameManager

- **Problem:** 383 lines, 50+ methods. Manages party, bag, money, badges, flags,
  trainers defeated, pokédex, player info, playtime, position, PC boxes,
  difficulty, nuzlocke state, step count, game stats, hall of fame, visited maps,
  and settings. Everything depends on it.
- **Fix:** Extract focused sub-managers behind a thin facade:
  - `PartyManager` — party, PC boxes, pokédex
  - `ProgressManager` — badges, flags, trainers defeated, hall of fame
  - `InventoryManager` — bag, money
  - `SettingsManager` — settings, difficulty
  - `PlayerStateManager` — position, map, playtime, steps
- **Effort:** Large (touches many consumers)

### 2.2 Decompose BattleUIScene

- **Problem:** 1,013 lines handling battle UI layout, HP bars, move selection,
  item menus, Pokémon switching, catch animations, experience bars, level-up
  flow, and evolution prompts.
- **Fix:** Extract focused components:
  - `BattleMoveMenu` — move selection panel
  - `BattleItemMenu` — item usage UI
  - `BattleSwitchMenu` — Pokémon switching UI
  - `BattleHUD` — HP bars, status, names
  - Keep `BattleUIScene` as a thin coordinator
- **Effort:** Large

### 2.3 Remove Duplicated Catch Logic

- **Problem:** Poké Ball throw animation, shake sequence, and sparkle effect
  exist in both `BattleUIScene.ts` and `BattleCatchHandler.ts`.
- **Fix:** Delete the copy in `BattleUIScene`, delegate entirely to
  `BattleCatchHandler`.
- **Effort:** Small (marked "already delegated" in perf audit but code remains)

### 2.4 Typed EventManager

- **Problem:** Events use `string` keys and `unknown[]` payloads. No
  compile-time verification of event names or shapes.
- **Fix:** Define an `EventMap` interface mapping event names to their payload
  types. Update `EventManager.emit()` and `.on()` to use generics constrained by
  `EventMap`.
- **Status:** Marked done in perf audit — verify completeness
- **Effort:** Medium

---

## Tier 3 — Mobile & Accessibility

*Make every scene playable on a 375px phone screen.*

### 3.1 Mobile-Scale 6 Remaining Scenes

- **Problem:** `PartyScene`, `SummaryScene`, `StarterSelectScene`,
  `MoveTutorScene`, `ShopScene`, and `PCScene` use hard-coded font sizes and
  row heights with no mobile scaling.
- **Fix:** Import `mobileFontSize()`, `MOBILE_SCALE`, `MIN_TOUCH_TARGET` from
  `@ui/theme`. Replace hard-coded sizes. Ensure interactive elements meet 48px
  minimum touch targets.
- **Effort:** Medium (6 scenes, each ~30 min)

### 3.2 Dialogue Choice Touch Selection

- **Problem:** Dialogue choice branches are keyboard-only. Mobile players
  cannot tap to select a dialogue option.
- **Fix:** Make each choice option a tappable zone. On tap, highlight and
  confirm the choice.
- **Effort:** Small

### 3.3 Swipe/Scroll Gestures for Lists

- **Problem:** Party, inventory, Pokédex, and move lists require joystick-only
  scrolling on mobile. No native swipe gestures.
- **Fix:** Add vertical swipe detection to `TouchControls` and wire into list
  scenes for smooth scrolling.
- **Effort:** Medium

### 3.4 Dynamic Resize Handling

- **Problem:** No scene re-layout on resize or orientation change. UI elements
  become mispositioned if the player rotates their device mid-scene.
- **Fix:** Add a `resize` event listener in each scene that recalculates
  layout positions based on current viewport dimensions.
- **Effort:** Medium

### 3.5 Improved Mobile Detection

- **Problem:** Detection uses `maxTouchPoints > 0` only. Touchscreen laptops
  trigger mobile mode. No phone vs. tablet distinction.
- **Fix:** Combine `maxTouchPoints`, screen width, `navigator.userAgent`
  heuristics, and hover media query to classify device type more accurately.
- **Effort:** Small

### 3.6 Persist Orientation Prompt Dismissal

- **Problem:** The "Rotate to landscape" prompt reappears on every resize
  event after the player taps "Continue Anyway."
- **Fix:** Store dismissal in `sessionStorage`. Check before showing.
- **Effort:** Small

### 3.7 PWA Completeness

- **Problem:** Service worker precaches only a handful of URLs. First offline
  load fails for most assets. No iOS splash screens or apple-touch-icon.
- **Fix:**
  - Generate a build-time asset manifest and precache all critical assets
  - Add `<link rel="apple-touch-icon">` to `index.html`
  - Add iOS splash screen images
- **Effort:** Medium

---

## Tier 4 — Gameplay Feel

*Polish that transforms "functional" into "delightful."*

### 4.1 Town Map Scene

- **Problem:** No way to see where you are in the world. Players get lost.
  This is the single most impactful missing UX feature.
- **Fix:** Create a `TownMapScene` showing:
  - Stylized region map with all visited locations
  - Current position indicator
  - Active quest objective marker
  - Fly integration (select a city, confirm, fly)
- **Effort:** Large

### 4.2 Dynamic Music Transitions

- **Problem:** Music hard-cuts on map change with no crossfade.
- **Fix:**
  - 500ms crossfade between area themes
  - Battle intro stinger before battle BGM
  - Victory fanfare that crossfades back to the route theme
- **Effort:** Medium

### 4.3 Overworld Weather Per Route

- **Problem:** Weather only activates in battle. The overworld is always
  clear regardless of location.
- **Fix:** Add a `weather` field to `MapDefinition` and drive
  `WeatherRenderer` from map data:
  - Coral Harbor: rain
  - Cinderfall: ash particles
  - Wraithmoor: fog
  - Crystal Cavern: drip particles
- **Effort:** Medium

### 4.4 Cycling Sprite & Animation

- **Problem:** Bicycle mode has no visual feedback — the player sprite is
  unchanged at 3x speed.
- **Fix:** Create a cycling spritesheet (4 directions) and swap on bicycle
  toggle. Add dust particles behind the bike.
- **Effort:** Medium (requires sprite art)

### 4.5 Double Battle UI Polish

- **Problem:** Double battle UI lacks partner HP display, partner action
  indication, and has unclear messaging for spread moves.
- **Fix:** Add partner HP bar, turn-order indicator, and "hits both" / "hits
  one" labels for targeting.
- **Effort:** Medium

### 4.6 NPC Schedule System

- **Problem:** NPCs are static. The world feels the same at 2am as it does
  at 2pm despite having a day/night cycle.
- **Fix:** Add a `schedule` field to NPC data. NPCs move between positions
  based on `GameClock` time period. Day NPCs go indoors at night; ghost girl
  appears only at night in Wraithmoor.
- **Effort:** Medium

---

## Tier 5 — Quality of Life

*Small features that significantly improve the player experience.*

### 5.1 Type Icons as Sprites

- **Problem:** Types are shown as colored text labels in battle and summary.
  No sprite icons.
- **Fix:** Create an 18-icon type sprite sheet. Display in battle HUD, summary
  screen, move info, and Pokédex.
- **Effort:** Medium (requires sprite art + UI wiring)

### 5.2 Status Condition Icons

- **Problem:** Status conditions (burn, poison, paralysis, etc.) shown as
  text labels only.
- **Fix:** Create status icon sprites and display alongside Pokémon name in
  battle HUD and party screen.
- **Effort:** Small

### 5.3 Minimap HUD

- **Problem:** No spatial orientation on the overworld beyond map name.
- **Fix:** Small corner minimap showing nearby tiles with player dot and
  NPC markers. Toggle via Settings.
- **Effort:** Medium

### 5.4 Party Quick-View in Overworld

- **Problem:** Must enter the full menu to check party status.
- **Fix:** Display 6 Poké Ball icons across the top of the screen, colored
  by HP status (green/yellow/red/gray for fainted). Tap to open full party.
- **Effort:** Small

### 5.5 Wire Remaining Achievement Triggers

- **Problem:** Achievement system exists (50 achievements, 5 categories) but
  several triggers are not wired: specific gym badge combos, sweep-trainer
  (6-0 victory), underdog-win (lower-level team), type-specialist achievements.
- **Fix:** Add event listeners in `AchievementManager` for the unwired
  conditions. Emit appropriate events from battle and overworld systems.
- **Effort:** Medium

### 5.6 Settings localStorage Key Alignment

- **Problem:** `VirtualJoystick` reads from `pokemon_settings` but
  `GameManager` saves to a different key.
- **Fix:** Align both to the same storage key.
- **Effort:** Small

---

## Tier 6 — Testing & CI

*Confidence for fast iteration.*

### 6.1 E2E Test Coverage for Core Flows

- **Problem:** E2E tests exist but coverage is unclear for critical flows.
- **Fix:** Add or verify E2E coverage for:
  - New game → starter selection → first battle → save
  - Load game → walk → enter building → warp back
  - Battle → catch Pokémon → nickname → party full → PC deposit
  - Shop → buy → sell → insufficient funds
- **Effort:** Medium

### 6.2 Visual Regression Tests

- **Problem:** UI changes can silently break layouts (especially mobile).
- **Fix:** Add Playwright screenshot comparison tests for key screens:
  Battle HUD, party screen, inventory, Pokédex, title screen.
- **Effort:** Medium

### 6.3 Bundle Size CI Guard

- **Problem:** No automated check prevents bundle size regressions.
- **Fix:** Add a CI step that fails if any chunk exceeds a threshold (e.g.,
  vendor < 1 MB, battle < 500 KB, core < 400 KB, maps < 200 KB).
- **Effort:** Small

### 6.4 Performance Benchmark Tests

- **Problem:** No automated detection of performance regressions (frame
  time, load time).
- **Fix:** Add a Playwright test that measures time-to-interactive and
  average frame time during a scripted walk sequence. Fail if thresholds are
  exceeded.
- **Effort:** Medium

---

## Implementation Order

Recommended execution sequence based on impact, risk, and dependency chains.

### Sprint 1 — Stability & Quick Wins

| Item | Tier | Effort |
|------|------|--------|
| 0.1 Fix surf state on water spawn | 0 | Small |
| 0.2 Evolution data sync test | 0 | Small |
| 3.5 Improved mobile detection | 3 | Small |
| 3.6 Persist orientation dismissal | 3 | Small |
| 5.6 Settings key alignment | 5 | Small |
| 6.3 Bundle size CI guard | 6 | Small |

### Sprint 2 — Performance Foundations

| Item | Tier | Effort |
|------|------|--------|
| 1.1 Break up battle chunk | 1 | Medium |
| 0.3 Remaining shutdown() coverage | 0 | Medium |
| 1.5 Verify cosmetic throttling | 1 | Small |
| 1.4 Object pooling for animations | 1 | Medium |

### Sprint 3 — Mobile & Touch

| Item | Tier | Effort |
|------|------|--------|
| 3.1 Mobile-scale 6 scenes | 3 | Medium |
| 3.2 Dialogue choice touch selection | 3 | Small |
| 3.3 Swipe gestures for lists | 3 | Medium |
| 3.4 Dynamic resize handling | 3 | Medium |

### Sprint 4 — Architecture Refactoring

| Item | Tier | Effort |
|------|------|--------|
| 2.1 Decompose GameManager | 2 | Large |
| 2.2 Decompose BattleUIScene | 2 | Large |
| 2.3 Remove duplicated catch logic | 2 | Small |

### Sprint 5 — Gameplay Feel

| Item | Tier | Effort |
|------|------|--------|
| 4.1 Town Map scene | 4 | Large |
| 4.2 Dynamic music transitions | 4 | Medium |
| 4.3 Overworld weather per route | 4 | Medium |
| 4.5 Double battle UI polish | 4 | Medium |

### Sprint 6 — Visual & QoL

| Item | Tier | Effort |
|------|------|--------|
| 5.1 Type icons | 5 | Medium |
| 5.2 Status condition icons | 5 | Small |
| 5.4 Party quick-view HUD | 5 | Small |
| 5.5 Wire achievement triggers | 5 | Medium |
| 4.4 Cycling sprite | 4 | Medium |

### Sprint 7 — Large Infrastructure

| Item | Tier | Effort |
|------|------|--------|
| 1.2 Texture atlas generation | 1 | Large |
| 1.3 Migrate to Phaser tilemaps | 1 | Large |
| 3.7 PWA completeness | 3 | Medium |

### Sprint 8 — Testing & Polish

| Item | Tier | Effort |
|------|------|--------|
| 6.1 E2E test coverage | 6 | Medium |
| 6.2 Visual regression tests | 6 | Medium |
| 6.4 Performance benchmarks | 6 | Medium |
| 4.6 NPC schedule system | 4 | Medium |
| 5.3 Minimap HUD | 5 | Medium |
| 0.4 Async error boundaries | 0 | Medium |

---

## Items Explicitly Excluded

These are deferred from this plan per the constraint of no story content:

| Item | Reason |
|------|--------|
| New cutscenes or dialogue | Story content |
| New quests or quest steps | Story content |
| New trainer battles for story progression | Story content |
| New maps tied to story acts | Story content |
| Battle Tower / Frontier | Content expansion (Tier 2 in Level Up Plan) |
| Multiplayer / WebRTC | Stretch goal (Tier 4 in Level Up Plan) |
| Breeding / Safari Zone | Content expansion (Tier 4 in Level Up Plan) |
| Randomizer mode | Content expansion (Tier 3 in Level Up Plan) |
| Localization / i18n | Infrastructure (lower priority) |
| Mod support | Infrastructure (lower priority) |

---

## Cross-References

| Document | Overlap |
|----------|---------|
| [performance-improvements.md](performance-improvements.md) | Tier 1 items sourced from the perf audit; status tracked there |
| [mobile-improvements-plan.md](mobile-improvements-plan.md) | Tier 3 items sourced from mobile audit |
| [UI_IMPROVEMENT_PLAN.md](UI_IMPROVEMENT_PLAN.md) | Visual pipeline for tiles/maps; Sprint 6 is UI-focused |
| [LEVEL_UP_PLAN.md](LEVEL_UP_PLAN.md) | Tiers 2-4 gameplay features deferred from this plan |
| [bugs.md](bugs.md) | Tier 0 items 0.1 and 0.2 tracked there |
