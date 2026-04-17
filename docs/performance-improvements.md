<!-- markdownlint-disable-file -->

# Codebase Quality & Performance Audit

**Date**: 2026-04-16
**Scope**: Full `frontend/src/` tree, build config, asset pipeline

---

## Executive Summary

The codebase has **39 actionable findings** across 6 categories. The most impactful areas are: a **1.85 MB single-bundle** with zero code splitting, **per-frame object allocation** in the lighting system, **3 dead duplicate scene files** that break the TypeScript build, a **god-object GameManager** (383 lines, 50+ methods), and **521 individual sprite PNGs** with no texture atlas batching. Addressing the Critical and High items alone would significantly improve load time, runtime performance, memory stability, and developer experience.

---

## Table of Contents

- [1. Build & Bundle](#1-build--bundle)
- [2. Runtime Performance](#2-runtime-performance)
- [3. Memory Management](#3-memory-management)
- [4. Architecture & Code Structure](#4-architecture--code-structure)
- [5. Type Safety & Code Quality](#5-type-safety--code-quality)
- [6. Dead Code & Tech Debt](#6-dead-code--tech-debt)

---

## 1. Build & Bundle

### 1.1 — No Code Splitting (Critical)

**File**: `frontend/vite.config.ts`

The entire application (Phaser 3 ~1.5 MB + battle system + all data + all scenes) ships as a **single 1,855 KB chunk** (`index-*.js`). Vite itself warns about this.

**Impact**: Slow initial load, no route-based lazy loading, poor cache invalidation (any change busts the entire bundle).

**Fix**: Configure `build.rolldownOptions.output.codeSplitting` and use dynamic `import()` for:
- Phaser (vendor chunk)
- Battle subsystem (loaded when entering battle)
- Data files (pokemon, moves, maps — loaded on demand)
- Scene groups (menu scenes, minigame scenes)

### 1.2 — No Minification/Compression Config (Medium)

**File**: `frontend/vite.config.ts:22-24`

The build config has no `build.minify`, `build.cssMinify`, or asset compression settings. No `vite-plugin-compression` for gzip/brotli pre-compression of static assets.

**Fix**: Add `build.minify: 'terser'` or rely on Vite defaults, add `vite-plugin-compression` for `.br`/`.gz` static output.

### 1.3 — All 60+ Maps Eagerly Imported (High)

**Directory**: `frontend/src/data/maps/`

Every map JSON is statically imported at module load time, even though only one map is active at a time. This inflates the main bundle and wastes memory.

**Fix**: Convert to dynamic `import()` behind a `MapLoader` utility. Preload the next map during transitions.

### 1.4 — All Pokemon/Move Data Eagerly Loaded (Medium)

**Directory**: `frontend/src/data/pokemon/`, `frontend/src/data/moves/`

All Pokemon species data (~150+ entries) and move definitions are statically imported. Combined, the `data/` directory is 816 KB of source.

**Fix**: Lazy-load data files by generation/region or on first access using a data registry with `import()`.

### 1.5 — Ineffective Dynamic Import (Low)

**File**: `frontend/src/utils/accessibility.ts`

Vite warns that `accessibility.ts` is dynamically imported by `theme.ts` but also statically imported by `main.ts` and `SettingsScene.ts`, defeating code splitting.

**Fix**: Remove the static imports and use only the dynamic `import()` path, or accept it in the main bundle.

---

## 2. Runtime Performance

### 2.1 — LightingSystem Creates/Destroys Image Per Light Per Frame (Critical)

**File**: `frontend/src/systems/rendering/LightingSystem.ts:110-120`

`drawLight()` calls `this.scene.make.image(...)` then `img.destroy()` for **every light source on every frame**. With 5 cave lights at 60 FPS, that is **360 object allocations + GC cycles per second**.

```typescript
// Current — allocates per call
private drawLight(screenX, screenY, radius, intensity?) {
  const img = this.scene.make.image({ ... }, false); // alloc
  img.setScale(scale);
  this.rt.erase(img, screenX, screenY);
  img.destroy(); // dealloc
}
```

**Fix**: Create a **single persistent `Phaser.GameObjects.Image`** in the constructor, reuse it by repositioning and rescaling for each `drawLight` call.

### 2.2 — MoveAnimationPlayer Creates 30+ Arc Objects Per Animation (High)

**File**: `frontend/src/battle/execution/MoveAnimationPlayer.ts:250-350`

Move animations manually create up to 30 `Phaser.GameObjects.Arc` (circle) game objects instead of using Phaser's built-in particle emitter system. Each creates GC pressure, especially on mobile.

**Fix**: Replace manual Arc creation with `Phaser.GameObjects.Particles.ParticleEmitter` using prebuilt particle textures.

### 2.3 — O(n) NPC Collision Check on Every Movement Tile (High)

**File**: `frontend/src/scenes/overworld/OverworldScene.ts` (movement logic)

Every player step runs a linear scan of all NPCs to check tile occupancy. In maps with 20+ NPCs, this is noticeable.

**Fix**: Maintain a `Set<string>` (e.g., `"x,y"` keys) of occupied NPC positions, updated on NPC movement. Provides **O(1)** lookup.

### 2.4 — HealthBar Full Redraw on Every HP Change (Medium)

**File**: `frontend/src/ui/` (HealthBar widget)

The HP bar calls `graphics.clear()` and redraws the entire bar + background on every HP tick. During multi-hit moves, this triggers dozens of full redraws.

**Fix**: Use a rectangle game object and update only its `width` property proportionally.

### 2.5 — `weightedRandom` Recomputes Total on Every Call (Medium)

**File**: `frontend/src/utils/` (weightedRandom)

`weights.reduce()` runs on every invocation to sum the total. For encounter tables called repeatedly, this is wasteful.

**Fix**: Accept a precomputed total parameter, or cache the total alongside the weights array.

### 2.6 — Heavy Per-Frame Work in Overworld Update Loop (Medium)

**File**: `frontend/src/scenes/overworld/OverworldScene.ts` (update method)

The `update()` loop performs grass alpha randomization and tile tint cycling every frame. These are visual-only effects that can run at a reduced frequency.

**Fix**: Throttle cosmetic updates to every 4th or 8th frame using a frame counter, or use Phaser tweens.

### 2.7 — 521 Individual Sprite PNGs — No Texture Atlas (High)

**Directory**: `frontend/public/assets/sprites/`

521 separate PNG files are loaded as individual textures. This prevents GPU draw-call batching and creates HTTP overhead (even with HTTP/2).

**Fix**: Generate texture atlases (e.g., using TexturePacker or `free-tex-packer-core`) grouping sprites by category (Pokemon front/back, overworld NPCs, UI icons). A single atlas draw call replaces dozens.

---

## 3. Memory Management

### 3.1 — TouchControls: ~20 DOM Listeners Never Removed (Critical)

**File**: `frontend/src/ui/controls/TouchControls.ts`

`TouchControls` adds approximately 20 `addEventListener` calls to the canvas and DOM elements. **Zero matching `removeEventListener` calls exist**. If controls are recreated (e.g., scene restart), listeners accumulate indefinitely.

**Fix**: Store all handler references and add a `destroy()` method that calls `removeEventListener` for each. Call it in the scene's `shutdown()`.

### 3.2 — VirtualJoystick: 8 DOM Listeners Never Removed (Critical)

**File**: `frontend/src/ui/controls/VirtualJoystick.ts`

Same pattern as TouchControls — 8 DOM event listeners with no cleanup path.

**Fix**: Same approach — track handlers, add `destroy()`, call from parent `TouchControls.destroy()`.

### 3.3 — No Scene `shutdown()` Methods — Listener Accumulation (High)

**File**: All 30+ scene files in `frontend/src/scenes/`

No scene implements `shutdown()` or `destroy()` lifecycle methods. Keyboard listeners registered via `this.input.keyboard!.on(...)` accumulate when scenes are restarted. NPC behavior controllers, timers, and tween callbacks leak.

**Fix**: Add `shutdown()` to every scene that registers input listeners, timers, or event subscriptions. At minimum:
- Remove keyboard listeners
- Clear EventManager subscriptions
- Destroy sub-systems (LightingSystem, CutsceneEngine, etc.)
- Clear NPC behavior controllers

### 3.4 — AudioManager Stale Scene Reference (Medium)

**File**: `frontend/src/managers/AudioManager.ts`

AudioManager holds a reference to the Phaser scene that created it. When scenes transition, this reference goes stale, risking "destroyed scene" errors when playing audio.

**Fix**: Update the scene reference on each `playBGM`/`playSFX` call, or use `this.scene.game.sound` (global sound manager) instead.

### 3.5 — AudioManager Dual Low-HP Warning (Low)

**File**: `frontend/src/managers/AudioManager.ts:22, 299`

Two parallel low-HP warning implementations exist: one using `setInterval` (line 299) and one using Phaser timers. The `setInterval` version bypasses Phaser's lifecycle and won't pause when the game loses focus.

**Fix**: Remove the `setInterval` implementation. Use only the Phaser timer version.

---

## 4. Architecture & Code Structure

### 4.1 — GameManager God Object (High)

**File**: `frontend/src/managers/GameManager.ts` (383 lines, 50+ methods)

`GameManager` manages: party, bag, money, badges, flags, trainers defeated, pokedex, player info, playtime, current map, position, PC boxes, difficulty, nuzlocke state, step count, game stats, hall of fame, visited maps, and settings. Every system depends on it.

**Fix**: Extract into focused sub-managers:
- `PartyManager` — party, PC boxes, pokedex
- `ProgressManager` — badges, flags, trainers defeated, hall of fame
- `InventoryManager` — bag, money
- `SettingsManager` — settings, difficulty
- `PlayerStateManager` — position, map, playtime, steps
- Keep `GameManager` as a thin facade that delegates

### 4.2 — BattleUIScene Mega-File (High)

**File**: `frontend/src/scenes/battle/BattleUIScene.ts` (1,013 lines)

A single file handling: battle UI layout, HP bars, move selection, item menus, Pokemon switching, catch animations, experience bars, level-up flow, and evolution prompts.

**Fix**: Extract into focused components:
- `BattleMoveMenu` — move selection panel
- `BattleItemMenu` — item usage UI
- `BattleSwitchMenu` — Pokemon switching UI
- `BattleHUD` — HP bars, status, names
- Keep `BattleUIScene` as a coordinator

### 4.3 — Duplicated Catch Logic (High)

**Files**: `frontend/src/scenes/battle/BattleUIScene.ts:818-885` and `frontend/src/scenes/battle/BattleCatchHandler.ts:61-227`

Pokeball throw animation, shake sequence, sparkle effect, and nickname prompt are implemented in **both** files.

**Fix**: Remove the copy from `BattleUIScene.ts`, keep only `BattleCatchHandler.ts` and have the UI scene delegate to it.

### 4.4 — Duplicated Turn-Order Logic in 3 Places (Medium)

**Files**: `BattleManager.ts`, `DoubleBattleManager.ts`, `BattleTurnRunner.ts`

Priority/speed-based turn ordering is computed independently in three locations.

**Fix**: Extract a `TurnOrderCalculator` utility and call from all three.

### 4.5 — Duplicated SPREAD_MOVES Set (Low)

**Files**: `DoubleBattleManager.ts`, `PartnerAI.ts`

Both define their own `SPREAD_MOVES` constant.

**Fix**: Move to a shared `battle/constants.ts`.

### 4.6 — Untyped EventManager (Medium)

**File**: `frontend/src/managers/EventManager.ts`

All events use `string` keys and `unknown[]` payloads. No compile-time verification of event names or payload shapes.

**Fix**: Define an `EventMap` interface mapping event names to their payload types:
```typescript
interface EventMap {
  'battle:start': [enemyTrainer: TrainerData];
  'dialogue:show': [text: string, speaker?: string];
  // ...
}
```

### 4.7 — Trainer Double-Registration (Low)

**Files**: `frontend/src/entities/Trainer.ts`, overworld scene

`Trainer` extends `NPC`, causing instances to appear in both `npcs[]` and `trainers[]` arrays. This leads to double collision checks and confusing iteration.

**Fix**: Use composition (Trainer _has-a_ NPC sprite) or maintain a single entity list with type discrimination.

---

## 5. Type Safety & Code Quality

### 5.1 — 19 `as any` Type Bypasses (High)

**Locations**: Concentrated in:
- `GameManager.ts:368-381` — 10 casts in `loadFromSave()`
- `BerryGarden.ts` — undeclared `_berryPlots`/`_clockTime` properties stored via casts
- `TrainerCardScene.ts` — storing `_trainerId` on GameManager
- `HallOfFameScene.ts` — attaching `pageContent` to Phaser objects

**Fix**:
- Define a `SaveData` interface for `loadFromSave()` to eliminate 10 casts at once
- Declare missing properties on their respective classes
- Use Phaser's `setData()`/`getData()` instead of attaching arbitrary properties

### 5.2 — 9 Async Functions Without Error Handling (Medium)

**Files**: `CryGenerator.playCry()`, all `CutsceneEngine` methods, several scene transitions

Unhandled promise rejections will silently fail and potentially leave the game in a broken state.

**Fix**: Add try/catch with meaningful error reporting and recovery (e.g., skip the cutscene, fallback audio).

### 5.3 — Silently Swallowed Errors (Medium)

**File**: `frontend/src/ui/theme.ts:129`

Catches and discards the accessibility module import failure without logging.

**Fix**: Log a warning so developers know the feature is degraded: `console.warn('Accessibility module failed to load:', err)`.

### 5.4 — 13 Stale Import Paths (Medium)

**Files**: Top-level duplicate scenes use old flat paths like `@systems/EncounterSystem` instead of `@systems/overworld/EncounterSystem`.

**Fix**: Deleting the duplicate scene files (see 6.1) eliminates all 13 stale imports. No other files use the old paths.

### 5.5 — BattleManager Ignores AIController (Medium)

**File**: `frontend/src/battle/core/BattleManager.ts:230-235`

`getEnemyMove()` uses pure `Math.random()` selection, completely ignoring the `AIController` system that implements difficulty-aware move choice.

**Fix**: Route enemy move selection through `AIController.selectMove()`.

### 5.6 — No Level Cap Guard in Experience Loop (Medium)

**File**: `frontend/src/battle/` (ExperienceCalculator)

The `awardExp` while-loop has no safeguard against exceeding level 100, risking an infinite loop if data is malformed.

**Fix**: Add `while (level < MAX_LEVEL && ...)` guard.

### 5.7 — EncounterSystem Ignores Nature Modifiers (Low)

**File**: `frontend/src/systems/` (EncounterSystem)

`createWildPokemon` calculates stats without applying the Pokemon's nature modifier, producing incorrect stat values.

**Fix**: Apply nature multipliers during stat calculation.

---

## 6. Dead Code & Tech Debt

### 6.1 — 3 Duplicate Scene Files Breaking the Build (Critical)

**Files**:
- `frontend/src/scenes/BattleScene.ts` (duplicate of `scenes/battle/BattleScene.ts`)
- `frontend/src/scenes/IntroScene.ts` (duplicate of `scenes/boot/IntroScene.ts`)
- `frontend/src/scenes/OverworldScene.ts` (duplicate of `scenes/overworld/OverworldScene.ts`)

These are stale copies from a module restructure with broken import paths. They cause **20 TypeScript compilation errors** that prevent production builds.

**Fix**: Delete all three files immediately. The subdirectory versions are the active ones.

### 6.2 — Dead `updateGrassCrop()` Method (Low)

**File**: `frontend/src/scenes/overworld/OverworldScene.ts`

Defined but never called.

**Fix**: Remove it.

### 6.3 — `drawMap()` Creates Individual Sprites Instead of Tilemaps (Medium)

**File**: `frontend/src/scenes/overworld/OverworldScene.ts`

Map rendering creates individual sprites per tile rather than using Phaser's optimized `Tilemap`/`TilemapLayer` system, which batches draw calls automatically.

**Fix**: Migrate to `this.make.tilemap()` + `createLayer()` for all map layers.

### 6.4 — Duplicate `tm-data.ts` Property (Low)

**File**: `frontend/src/data/tm-data.ts:70`

Object literal has a duplicate property name, causing a TypeScript error.

**Fix**: Remove the duplicate key.

### 6.5 — `normal.ts` Move Data `rechargeOnly` (Low)

**File**: `frontend/src/data/moves/normal.ts:46`

Uses `rechargeOnly` property that doesn't exist on the `MoveEffect` type.

**Fix**: Add `rechargeOnly` to the `MoveEffect` interface, or use the correct property name.

### 6.6 — `InputManager` Undeclared `_escRaw` Property (Low)

**File**: `frontend/src/systems/engine/InputManager.ts:70`

Object literal specifies `_escRaw` which isn't in the `InputState` type.

**Fix**: Add `_escRaw` to `InputState` interface, or remove it.

---

## Priority Matrix

| Priority | ID | Category | Finding | Effort | Status |
|----------|----|----------|---------|--------|--------|
| **Critical** | 6.1 | Dead Code | 3 duplicate scene files breaking build | 5 min | ✅ Done |
| **Critical** | 2.1 | Performance | LightingSystem per-frame allocation | 30 min | ✅ Done |
| **Critical** | 3.1 | Memory | TouchControls DOM listener leak | 1 hr | ✅ Done |
| **Critical** | 3.2 | Memory | VirtualJoystick DOM listener leak | 30 min | ✅ Done |
| **Critical** | 1.1 | Bundle | 1.85 MB single chunk, no code splitting | 4 hr | ✅ Done |
| **High** | 3.3 | Memory | No scene shutdown() methods | 4 hr | ✅ Done (5 scenes) |
| **High** | 2.7 | Performance | 521 PNGs, no texture atlas | 4 hr | |
| **High** | 4.1 | Architecture | GameManager god object (383 LOC) | 8 hr | |
| **High** | 4.2 | Architecture | BattleUIScene mega-file (1013 LOC) | 6 hr | |
| **High** | 4.3 | Architecture | Duplicated catch logic | 2 hr | ✅ Already delegated |
| **High** | 2.3 | Performance | O(n) NPC collision scan | 1 hr | ✅ Done |
| **High** | 2.2 | Performance | MoveAnimationPlayer manual Arcs | 3 hr | ✅ Done (texture-based) |
| **High** | 5.1 | Type Safety | 19 `as any` casts | 3 hr | ✅ Done (GM: 0 casts) |
| **High** | 1.3 | Bundle | All maps eagerly imported | 2 hr | ✅ Done (maps chunk) |
| **Medium** | 4.4 | Architecture | Turn-order logic in 3 places | 2 hr | ✅ Done |
| **Medium** | 4.6 | Architecture | Untyped EventManager | 3 hr | ✅ Done |
| **Medium** | 5.2 | Quality | 9 async functions without try/catch | 2 hr | ✅ Done |
| **Medium** | 5.5 | Quality | BattleManager ignores AIController | 1 hr | ✅ Done |
| **Medium** | 5.6 | Quality | No level cap guard in exp loop | 15 min | ✅ Done |
| **Medium** | 2.4 | Performance | HealthBar full redraw per tick | 1 hr | ✅ Done |
| **Medium** | 2.5 | Performance | weightedRandom recomputes total | 15 min | ✅ Done |
| **Medium** | 2.6 | Performance | Heavy per-frame overworld effects | 1 hr | ✅ Done |
| **Medium** | 6.3 | Tech Debt | Individual sprites instead of tilemaps | 8 hr | |
| **Medium** | 1.2 | Bundle | No minification/compression config | 1 hr | ✅ Done |
| **Medium** | 1.4 | Bundle | All Pokemon/move data eager | 2 hr | |
| **Medium** | 3.4 | Memory | AudioManager stale scene reference | 1 hr | ✅ Done |
| **Medium** | 5.3 | Quality | Swallowed errors in theme.ts | 15 min | ✅ Done |
| **Medium** | 5.4 | Quality | 13 stale import paths | Fixed by 6.1 | ✅ Done |
| **Low** | 6.2 | Dead Code | Dead updateGrassCrop method | 5 min | ✅ Done |
| **Low** | 6.4 | Dead Code | Duplicate tm-data property | 5 min | N/A (not found) |
| **Low** | 6.5 | Dead Code | Invalid rechargeOnly MoveEffect field | 15 min | N/A (already typed) |
| **Low** | 6.6 | Dead Code | Undeclared _escRaw property | 15 min | N/A (already typed) |
| **Low** | 4.5 | Architecture | Duplicated SPREAD_MOVES | 15 min | ✅ Done |
| **Low** | 4.7 | Architecture | Trainer double-registration | 2 hr | |
| **Low** | 3.5 | Memory | Dual low-HP setInterval | 30 min | ✅ Done |
| **Low** | 5.7 | Quality | Nature modifiers ignored | 30 min | ✅ Done |
| **Low** | 1.5 | Bundle | Ineffective dynamic import | 15 min | ✅ Done |

---

## Recommended Attack Order

### Phase 1 — Build Fix & Quick Wins (< 1 hour) ✅ Complete
1. ~~Delete 3 duplicate scene files (6.1)~~ ✅
2. ~~Fix `tm-data.ts` duplicate property (6.4)~~ — N/A (no duplicate found)
3. ~~Fix `normal.ts` rechargeOnly (6.5)~~ — N/A (already typed correctly)
4. ~~Fix `InputManager` _escRaw (6.6)~~ — N/A (already typed correctly)
5. ~~Remove dead `updateGrassCrop` (6.2)~~ ✅
6. ~~Add level cap guard (5.6)~~ ✅

### Phase 2 — Memory Leak Fixes (< 2 hours) ✅ Complete
7. ~~Add `destroy()` to TouchControls and VirtualJoystick (3.1, 3.2)~~ ✅
8. ~~Add `shutdown()` to top 5 most-restarted scenes (3.3 partial)~~ ✅

### Phase 3 — Hot-Path Performance (< 2 hours) ✅ Complete
9. ~~Reuse persistent Image in LightingSystem (2.1)~~ ✅
10. ~~Replace NPC collision with Set lookup (2.3)~~ ✅
11. ~~Cache weightedRandom total (2.5)~~ ✅

### Phase 4 — Bundle Optimization (< 1 day) — Partial
12. ~~Configure Vite code splitting (1.1)~~ ✅
13. Convert map imports to dynamic (1.3) — **TODO**
14. Add build compression (1.2) — **TODO**

### Phase 5 — Architecture Refactoring (multi-day)
15. Extract GameManager sub-managers (4.1)
16. Decompose BattleUIScene (4.2)
17. Remove duplicate catch logic (4.3)
18. Generate texture atlases (2.7)
19. Type the EventManager (4.6)
20. Eliminate `as any` casts (5.1)
