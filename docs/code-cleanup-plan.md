# Code Cleanup and Architecture Improvement Plan

## Overview

This plan addresses growing monolithic files, flat directory structures that hinder navigation, and organizational inconsistencies across the codebase. Changes are grouped into prioritized phases so each phase delivers independent value and can be merged safely.

---

## Current State Summary

### Monolithic Files (by line count)

| File | Lines | Issue |
|------|------:|-------|
| `data/trainer-data.ts` | 1505 | Single record with every trainer in the game |
| `scenes/BattleUIScene.ts` | 1433 | UI rendering, move execution, end-of-turn, evolution, rewards |
| `scenes/OverworldScene.ts` | 1257 | Map setup, NPC spawning, field abilities, fishing, interaction |
| `data/maps/shared.ts` | 623 | Tile constants, tile sets, interfaces, parse functions |
| `battle/StatusEffectHandler.ts` | 556 | Every status condition in one class |
| `ui/TouchControls.ts` | 519 | D-pad, buttons, layout, gesture handling |
| `scenes/InventoryScene.ts` | 510 | Bag UI, categories, use/toss/give logic |
| `scenes/MoveTutorScene.ts` | 503 | Move tutor UI and logic |
| `scenes/IntroScene.ts` | 502 | Professor intro, character creation, naming |
| `battle/DoubleBattleManager.ts` | 482 | 2v2 battle orchestration |
| `battle/MoveAnimationPlayer.ts` | 478 | All move animation data and playback |
| `scenes/BattleScene.ts` | 477 | Battle backdrop, sprites, base setup |
| `scenes/ShopScene.ts` | 451 | Shop UI and purchase logic |
| `scenes/PCScene.ts` | 450 | PC box UI and Pokémon management |

### Flat Directories Needing Subdirectories

| Directory | File Count | Issue |
|-----------|:----------:|-------|
| `scenes/` | 25 files | All scenes in one flat folder; no grouping by domain |
| `battle/` | 14 files | Handlers, calculators, managers, and animations mixed together |
| `ui/` | 11 files | Input controls, HUD widgets, and theming mixed together |
| `systems/` | 17 files | Audio, rendering, gameplay, and overworld mixed together |
| `tests/unit/` | 25 files | Flat list with no domain grouping |
| `tests/integration/` | 15 files | Flat list with no domain grouping |

---

## Phase 1: Split Monolithic Scene Files (High Impact)

**Goal:** Break the two largest scenes into a core scene class plus extracted helpers.

### 1a. Decompose `BattleUIScene.ts` (1433 lines)

Extract these concerns into focused modules under a new `scenes/battle/` subdirectory:

| New File | Responsibility | Approx Lines |
|----------|---------------|:------------:|
| `scenes/battle/BattleUIScene.ts` | Core scene lifecycle, create/update, menu state | ~300 |
| `scenes/battle/BattleTurnRunner.ts` | Move execution, apply results, PP deduction | ~200 |
| `scenes/battle/BattleEndOfTurn.ts` | Residual damage, weather ticks, faint checks | ~150 |
| `scenes/battle/BattleEvolutionHandler.ts` | Post-battle evolution check and animation | ~100 |
| `scenes/battle/BattleRewardHandler.ts` | Trainer rewards, money, badges, post-battle dialogue | ~80 |
| `scenes/battle/BattleMessageQueue.ts` | Sequential message display utility | ~60 |
| `scenes/battle/BattleDamageNumbers.ts` | Floating damage number rendering | ~50 |

### 1b. Decompose `OverworldScene.ts` (1257 lines)

Extract into focused modules under a new `scenes/overworld/` subdirectory:

| New File | Responsibility | Approx Lines |
|----------|---------------|:------------:|
| `scenes/overworld/OverworldScene.ts` | Core scene lifecycle, camera, tilemap setup | ~350 |
| `scenes/overworld/OverworldNPCSpawner.ts` | NPC/trainer creation and flag-gated refresh | ~200 |
| `scenes/overworld/OverworldInteraction.ts` | NPC dialogue, sign reading, item pickup, warp | ~200 |
| `scenes/overworld/OverworldFieldAbilities.ts` | Cut, Surf, Strength, Flash, Rock Smash, Fly | ~200 |
| `scenes/overworld/OverworldFishing.ts` | Fishing rod logic and encounter trigger | ~80 |
| `scenes/overworld/OverworldHealing.ts` | PokéCenter heal logic, starter selection | ~60 |

### Migration Strategy

1. Create the new subdirectory and helper files.
2. Move methods out of the scene class into standalone functions or small utility classes that receive the scene as a parameter.
3. Update barrel exports so external imports don't break.
4. Keep public API identical; the scene class delegates to the extracted modules.
5. Run full test suite after each extraction.

---

## Phase 2: Reorganize `scenes/` into Subdirectories (Medium Impact)

**Goal:** Group 25 scene files by domain so related scenes are colocated.

### Proposed Structure

```
scenes/
├── boot/
│   ├── BootScene.ts
│   └── PreloadScene.ts
├── title/
│   ├── TitleScene.ts
│   └── IntroScene.ts
├── overworld/
│   ├── OverworldScene.ts          (slimmed from Phase 1)
│   ├── OverworldNPCSpawner.ts
│   ├── OverworldInteraction.ts
│   ├── OverworldFieldAbilities.ts
│   ├── OverworldFishing.ts
│   ├── OverworldHealing.ts
│   ├── DialogueScene.ts
│   └── TransitionScene.ts
├── battle/
│   ├── BattleScene.ts
│   ├── BattleUIScene.ts           (slimmed from Phase 1)
│   ├── BattleTurnRunner.ts
│   ├── BattleEndOfTurn.ts
│   ├── BattleEvolutionHandler.ts
│   ├── BattleRewardHandler.ts
│   ├── BattleMessageQueue.ts
│   └── BattleDamageNumbers.ts
├── menu/
│   ├── MenuScene.ts
│   ├── InventoryScene.ts
│   ├── PartyScene.ts
│   ├── SummaryScene.ts
│   ├── PokedexScene.ts
│   ├── SettingsScene.ts
│   ├── TrainerCardScene.ts
│   ├── QuestJournalScene.ts
│   ├── QuestTrackerScene.ts
│   └── AchievementScene.ts
├── pokemon/
│   ├── StarterSelectScene.ts
│   ├── NicknameScene.ts
│   ├── MoveTutorScene.ts
│   └── PCScene.ts
└── minigame/
    ├── ShopScene.ts
    └── VoltorbFlipScene.ts
```

### Migration Strategy

1. Create subdirectories and move files.
2. Update all import paths (use a codemod or IDE refactor).
3. Update `tsconfig.json` path aliases if configured for `@scenes/*`.
4. Verify no circular dependencies with `madge` or similar.
5. Update `docs/architecture.md` folder tree.

---

## Phase 3: Split Monolithic Data Files (Medium Impact)

### 3a. Split `trainer-data.ts` (1505 lines)

Organize by trainer category under `data/trainers/`:

```
data/trainers/
├── index.ts              # Re-exports combined trainerData record
├── gym-leaders.ts        # All 8 gym leader rosters
├── elite-four.ts         # Elite Four + Champion
├── rival.ts              # Rival encounters by progression point
├── route-trainers.ts     # Generic route/cave trainers
└── team-grunts.ts        # Villain team grunts and admins
```

### 3b. Split `maps/shared.ts` (623 lines)

Break the catch-all shared file into focused modules:

```
data/maps/
├── tiles.ts              # Tile enum/constants (Tile object)
├── tile-metadata.ts      # LEDGE_TILES, OVERLAY_BASE, FOREGROUND_TILES, SOLID_TILES, TILE_COLORS
├── map-interfaces.ts     # NpcSpawn, TrainerSpawn, WarpDefinition, SpawnPoint, MapDefinition
├── map-parser.ts         # parseMap function and related utilities
└── index.ts              # Updated re-exports
```

### 3c. Split `encounter-tables.ts` (269 lines)

If the file continues to grow, split by region segment:

```
data/encounters/
├── index.ts
├── early-routes.ts       # Routes 1-3
├── mid-routes.ts         # Routes 4-6
├── late-routes.ts        # Routes 7-8
└── dungeons.ts           # Cave and dungeon encounters
```

---

## Phase 4: Organize `battle/` with Subdirectories (Medium Impact)

**Goal:** Group the 14 battle files by responsibility.

### Proposed Structure

```
battle/
├── core/
│   ├── BattleManager.ts
│   ├── DoubleBattleManager.ts
│   ├── BattleStateMachine.ts
│   └── AIController.ts
├── calculation/
│   ├── DamageCalculator.ts
│   ├── ExperienceCalculator.ts
│   └── CatchCalculator.ts
├── effects/
│   ├── StatusEffectHandler.ts
│   ├── AbilityHandler.ts
│   ├── HeldItemHandler.ts
│   ├── WeatherManager.ts
│   └── SynthesisHandler.ts
├── execution/
│   ├── MoveExecutor.ts
│   └── MoveAnimationPlayer.ts
└── index.ts               # Barrel re-exports
```

### Bonus: Split `StatusEffectHandler.ts` (556 lines)

If the file remains large after subdirectory moves, consider splitting by status category:

| New File | Contents |
|----------|----------|
| `effects/volatile-status.ts` | Confusion, flinch, infatuation, trapped |
| `effects/non-volatile-status.ts` | Burn, freeze, paralysis, poison, sleep |
| `effects/turn-effects.ts` | End-of-turn residual processing |

---

## Phase 5: Organize `systems/` and `ui/` (Lower Impact)

### 5a. Organize `systems/` (17 files)

```
systems/
├── audio/
│   ├── ProceduralAudio.ts
│   ├── CryGenerator.ts
│   └── AmbientSFX.ts
├── overworld/
│   ├── GridMovement.ts
│   ├── NPCBehavior.ts
│   ├── EncounterSystem.ts
│   ├── OverworldAbilities.ts
│   ├── BerryGarden.ts
│   └── HiddenItems.ts
├── rendering/
│   ├── WeatherRenderer.ts
│   ├── LightingSystem.ts
│   ├── AnimationHelper.ts
│   └── EmoteBubble.ts
├── engine/
│   ├── InputManager.ts
│   ├── GameClock.ts
│   ├── MapPreloader.ts
│   └── CutsceneEngine.ts
└── index.ts
```

### 5b. Organize `ui/` (11 files)

```
ui/
├── controls/
│   ├── TouchControls.ts
│   ├── VirtualJoystick.ts
│   └── MenuController.ts
├── widgets/
│   ├── HealthBar.ts
│   ├── BattleHUD.ts
│   ├── TextBox.ts
│   ├── MenuList.ts
│   ├── ConfirmBox.ts
│   ├── NinePatchPanel.ts
│   └── AchievementToast.ts
└── theme.ts
```

### 5c. Split `TouchControls.ts` (519 lines)

Extract into focused pieces:

| New File | Responsibility |
|----------|---------------|
| `controls/TouchDPad.ts` | Directional pad rendering and input |
| `controls/TouchButtons.ts` | A/B/Menu button rendering and input |
| `controls/TouchControls.ts` | Coordinator that assembles D-pad + buttons |

---

## Phase 6: Organize Test Directories (Lower Impact)

**Goal:** Mirror source structure in tests for easier navigation.

### Proposed Structure

```
tests/
├── unit/
│   ├── battle/
│   │   ├── ai-controller.test.ts
│   │   ├── ai-controller-extended.test.ts
│   │   ├── battle-state-machine.test.ts
│   │   ├── battle-ui-state-machine.test.ts
│   │   ├── catch-calculator.test.ts
│   │   ├── damage-calculator.test.ts
│   │   ├── damage-calculator-extended.test.ts
│   │   ├── experience-calculator.test.ts
│   │   ├── status-effects.test.ts
│   │   └── status-effects-extended.test.ts
│   ├── data/
│   │   ├── data-integrity.test.ts
│   │   ├── data-integrity-extended.test.ts
│   │   ├── type-chart.test.ts
│   │   ├── type-chart-exhaustive.test.ts
│   │   └── map-data.test.ts
│   ├── systems/
│   │   ├── grid-movement.test.ts
│   │   ├── input-manager.test.ts
│   │   └── overworld-animation.test.ts
│   ├── scenes/
│   │   ├── bag-keyboard-navigation.test.ts
│   │   └── scene-lifecycle.test.ts
│   ├── managers/
│   │   └── quest-manager.test.ts
│   └── utils/
│       ├── audio-keys.test.ts
│       ├── constants.test.ts
│       ├── math-helpers.test.ts
│       └── seeded-random.test.ts
├── integration/
│   ├── battle/
│   │   ├── battle-flow.test.ts
│   │   ├── full-battle-scenarios.test.ts
│   │   ├── move-executor.test.ts
│   │   ├── move-executor-extended.test.ts
│   │   └── encounter-system.test.ts
|   |   └── encounter-extended.test.ts
│   ├── managers/
│   │   ├── game-manager.test.ts
│   │   ├── event-manager.test.ts
│   │   ├── dialogue-manager.test.ts
│   │   └── save-load.test.ts
|   |   └── save-load-extended.test.ts
│   └── systems/
│       ├── evolution.test.ts
│       ├── evolution-extended.test.ts
│       ├── inventory.test.ts
│       └── pc-shop-economy.test.ts
└── ...existing e2e, fuzz, replay, mocks
```

---

## Phase 7: Miscellaneous Cleanup (Ongoing)

### 7a. Barrel Exports

Add or update `index.ts` barrel files in every new subdirectory to keep imports clean:

```typescript
// scenes/battle/index.ts
export { BattleUIScene } from './BattleUIScene';
export { BattleTurnRunner } from './BattleTurnRunner';
// ...
```

### 7b. Path Alias Updates

Update `tsconfig.json` and `vite.config.ts` aliases for any new subdirectory:

```json
{
  "paths": {
    "@scenes/*": ["src/scenes/*"],
    "@battle/*": ["src/battle/*"],
    "@data/*": ["src/data/*"]
  }
}
```

### 7c. Documentation Sync

After each phase:

- Update `docs/architecture.md` folder tree and section descriptions.
- Add CHANGELOG entry.

### 7d. Dead Code Audit

Run a dead-code analysis to identify:

- Unused exports across `data/`, `battle/`, `systems/`.
- Orphaned utility functions in `utils/`.
- Unreferenced map definitions or trainer entries.

---

## Execution Priority

| Priority | Phase | Effort | Value |
|:--------:|:-----:|:------:|:-----:|
| 1 | Phase 1 — Split monolithic scenes | High | High — removes the biggest pain points |
| 2 | Phase 3 — Split monolithic data files | Medium | High — trainer-data and shared.ts are hard to navigate |
| 3 | Phase 2 — Reorganize scenes/ | Medium | Medium — improves discoverability |
| 4 | Phase 4 — Organize battle/ | Low-Medium | Medium — cleaner domain separation |
| 5 | Phase 5 — Organize systems/ and ui/ | Low | Medium — consistency |
| 6 | Phase 6 — Organize tests/ | Low | Low-Medium — mirrors source structure |
| 7 | Phase 7 — Barrel exports, aliases, docs | Low | Low — polish |

---

## Principles

- **No behavior changes.** Every phase is a pure refactor; all tests must pass before and after.
- **One phase per PR.** Keep diffs reviewable and bisectable.
- **Update imports incrementally.** Use IDE refactoring or `sed`/codemod to update import paths.
- **Preserve git blame.** Use `git mv` when moving files so history follows.
- **Test after every move.** Run `npm test` after each file relocation.
