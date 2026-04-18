# Mobile Improvements Plan

**Date**: 2026-04-16
**Scope**: Full mobile UX audit and improvement roadmap for Pokemon Web
**Target devices**: iOS Safari (iPhone 12+), Android Chrome (Galaxy S21+), tablets (iPad, Galaxy Tab)

---

## Executive Summary

The game already has solid mobile foundations: dual-mode touch controls (virtual joystick + DOM overlay), PWA support, orientation prompts, haptic feedback, and scaled fonts. However, a deeper audit through the lens of mobile UX best practices reveals **7 high-impact improvement areas** that would elevate the experience from "playable on mobile" to "designed for mobile." The gaps center on inconsistent scene adaptations, missing gesture support, no scene re-layout on resize, limited offline readiness, and underused performance tiering.

---

## Table of Contents

- [Current State Assessment](#current-state-assessment)
- [Phase 1: Scene Consistency and Touch Target Compliance](#phase-1-scene-consistency-and-touch-target-compliance)
- [Phase 2: Dynamic Resize and Orientation Handling](#phase-2-dynamic-resize-and-orientation-handling)
- [Phase 3: Gesture and Interaction Polish](#phase-3-gesture-and-interaction-polish)
- [Phase 4: Performance Tiering and Adaptive Quality](#phase-4-performance-tiering-and-adaptive-quality)
- [Phase 5: PWA and Offline Experience](#phase-5-pwa-and-offline-experience)
- [Phase 6: Mobile-First UX Refinements](#phase-6-mobile-first-ux-refinements)
- [Phase 7: Accessibility and Inclusive Mobile Design](#phase-7-accessibility-and-inclusive-mobile-design)
- [Appendix: File Inventory](#appendix-file-inventory)

---

## Current State Assessment

### What Works Well

| Area | Implementation | Files |
|------|---------------|-------|
| Virtual joystick | Floating joystick appears at touch point in left 60% of screen; DOM overlay auto-switches in landscape | `frontend/src/ui/controls/TouchControls.ts`, `frontend/index.html` |
| A/B action buttons | 72px touch targets, visual press feedback, haptic vibration | `frontend/index.html` (#btn-a, #btn-b) |
| Input unification | `InputManager.getState()` merges keyboard + touch into single polling interface | `frontend/src/systems/engine/InputManager.ts` |
| Mobile font scaling | `mobileFontSize()` and `MOBILE_SCALE=1.35x` used across 8+ scenes | `frontend/src/ui/theme.ts` |
| Orientation prompt | Portrait detection with rotate-to-landscape overlay and "Continue Anyway" option | `frontend/index.html` (#rotate-prompt) |
| PWA manifest | Fullscreen display, landscape orientation, maskable icons | `frontend/public/manifest.json` |
| iOS install prompt | Custom "Add to Home Screen" banner for iOS Safari | `frontend/index.html` (#ios-install-prompt) |
| Zoom prevention | Double-tap, gesture, and context menu blocked | `frontend/index.html` (script block) |
| Safe area insets | `env(safe-area-inset-*)` used for notch/Dynamic Island padding | `frontend/index.html` (body CSS) |
| Quality settings | 3-tier render quality (high/medium/low); mobile defaults to medium | `frontend/src/utils/perf-profile.ts` |
| Haptics setting | Configurable vibration feedback toggle in Settings | `frontend/src/scenes/menu/SettingsScene.ts` |
| Joystick size setting | Small/medium/large joystick size option | `frontend/src/scenes/menu/SettingsScene.ts` |

### What Needs Improvement

| Gap | Impact | Severity |
|-----|--------|----------|
| 5+ heavily used scenes have zero mobile adaptations | Tiny text, unreachable buttons on phone screens | **High** |
| No scene re-layout on resize/orientation change | UI elements mispositioned after rotating device mid-scene | **High** |
| Dialogue choice selection is keyboard-only | Cannot select dialogue options by tapping them | **High** |
| No swipe/scroll gestures for lists | Party, inventory, Pokédex, and move lists require joystick-only scrolling | **Medium** |
| Quality tiers only affect particle counts | No texture quality, shadow, or animation frame rate reduction on low-end devices | **Medium** |
| Service worker precaches only `index.html` | First offline load fails for all assets; no asset precaching strategy | **Medium** |
| Mobile detection uses `maxTouchPoints > 0` only | Laptops with touchscreens trigger mobile mode; no phone vs tablet distinction | **Medium** |
| Rotate prompt "Continue Anyway" does not persist | Reappears on every resize event | **Low** |
| No apple-touch-icon in HTML head | iOS home screen uses screenshot instead of icon | **Low** |
| No iOS splash screen images | White flash on app launch from home screen | **Low** |
| Settings localStorage key mismatch | `VirtualJoystick` reads `pokemon_settings` but `GameManager` saves to a different key | **Low** |

---

## Phase 1: Scene Consistency and Touch Target Compliance

**Goal**: Every scene is readable and tappable on a 375px-wide phone screen.
**Priority**: High
**Estimated scope**: 6 scene files

### Problem

These scenes do not use `mobileFontSize()`, `MOBILE_SCALE`, or `MIN_TOUCH_TARGET`:

| Scene | Issue |
|-------|-------|
| `PartyScene` | No mobile font scaling; slot heights hard-coded; no minimum touch targets |
| `SummaryScene` | Dense stat layout with small fixed fonts; tabs not touch-sized |
| `StarterSelectScene` | Selection grid not scaled for mobile; labels tiny on phones |
| `MoveTutorScene` | Move list items use fixed sizes below 48px touch threshold |
| `ShopScene` | Item rows too short for comfortable tapping |
| `PCScene` | Grid cells too small for fat-finger tapping on phones |

### Solution

1. Import `mobileFontSize`, `MOBILE_SCALE`, `MIN_TOUCH_TARGET`, and `isMobile` from `@ui/theme` in each scene.
2. Replace all hard-coded font size strings with `mobileFontSize(basePx)` calls.
3. Scale row heights, slot heights, and grid cell sizes by `MOBILE_SCALE`.
4. Ensure all interactive elements meet 48px minimum touch target on mobile using `MIN_TOUCH_TARGET`.
5. Add padding/spacing adjustments so layouts don't clip at 1.35x scale.

### Acceptance Criteria

- [ ] All 6 scenes import and use `mobileFontSize()` for every text element.
- [ ] Interactive elements measure ≥48px on a 375px viewport.
- [ ] No text clipping or overlap at `MOBILE_SCALE=1.35`.
- [ ] Manual test on iPhone SE (375x667) and iPhone 15 Pro (393x852) viewport sizes.

---

## Phase 2: Dynamic Resize and Orientation Handling

**Goal**: UI stays correct when the player rotates their device or the browser chrome appears/disappears.
**Priority**: High
**Estimated scope**: Core utility + all scene files that create positioned UI

### Problem

Scenes use `ui(scene)` for initial layout in `create()` but never re-run layout on resize. When a mobile user rotates their phone, pulls down the address bar, or resizes their browser:

- Chat bubbles, panels, and text stay at the old positions.
- Touch controls re-layout (good), but game UI does not.
- The darkness render texture (BUG-076) does not resize.

### Solution

#### 2a. Create a resize-safe layout system

Add a `layoutOn(scene, callback)` utility that:

1. Calls the callback immediately for initial layout.
2. Subscribes to `scene.scale.on('resize', callback)`.
3. Cleans up on `scene.events.on('shutdown')`.

```typescript
// frontend/src/utils/layout-on.ts
export function layoutOn(scene: Phaser.Scene, fn: () => void): void {
  fn(); // initial
  const handler = () => fn();
  scene.scale.on('resize', handler);
  scene.events.on('shutdown', () => scene.scale.off('resize', handler));
}
```

#### 2b. Migrate scenes incrementally

- Wrap existing `create()` UI code in `layoutOn()` blocks.
- Prioritize scenes that players spend the most time in: `OverworldScene`, `BattleUIScene`, `DialogueScene`, `MenuScene`.
- For scenes with animations or tween-dependent UI, track which elements are "layout-owned" vs "animation-owned" to avoid conflicts.

#### 2c. Fix BUG-076 — darkness render texture not resized

Hook the darkness RT refresh into the resize handler in `OverworldScene`.

### Acceptance Criteria

- [ ] `layoutOn()` utility exists and is documented.
- [ ] At minimum, `OverworldScene`, `BattleUIScene`, `DialogueScene`, and `MenuScene` use `layoutOn()`.
- [ ] Rotating from portrait → landscape → portrait mid-dialogue shows no mispositioned UI.
- [ ] Darkness RT resizes correctly on orientation change.

---

## Phase 3: Gesture and Interaction Polish

**Goal**: Touch interactions feel native-quality, not like a keyboard game with touch bolted on.
**Priority**: High
**Estimated scope**: Touch controls, dialogue scene, list-based scenes

### 3a. Tappable Dialogue Choices

**Problem**: When a dialogue presents 2+ choices (e.g., "Yes / No"), the player must use the virtual joystick to highlight and A-button to confirm. This is unintuitive when choices are visually displayed as a list.

**Solution**: Make each choice text a tap target. On `pointerdown`, highlight it; on `pointerup` (within bounds), select it. Keep joystick+A as an alternative.

### 3b. Swipe Scrolling for Lists

**Problem**: `PartyScene` (6 Pokémon), `InventoryScene` (potentially many items), `PokedexScene` (151+ entries), and `MoveTutorScene` (move list) all require the joystick to scroll. No momentum scrolling, no drag-to-scroll.

**Solution**: Create a `ScrollContainer` UI component:

- Tracks pointer down → move → up for drag distance.
- Applies momentum/inertia on release (exponential decay).
- Clamps to content bounds with overscroll rubber-band effect.
- Fires scroll events that scenes can listen to for updating visible items.
- Supports both vertical and horizontal scrolling.

Use `ScrollContainer` in `InventoryScene`, `PokedexScene`, `MoveTutorScene`, and `PCScene`.

### 3c. Swipe-to-Navigate Between Tabs/Pages

For scenes with tabs (`SummaryScene` stat pages, `PokedexScene` detail tabs), add horizontal swipe detection to move between pages. Threshold: 50px horizontal displacement with <30px vertical.

### 3d. Long-Press Context Actions

For `PartyScene`, add long-press (500ms) on a Pokémon slot to open the context menu (Summary, Move, Item, etc.) instead of requiring the hamburger menu flow.

### Acceptance Criteria

- [ ] Dialogue choices respond to direct taps.
- [ ] `ScrollContainer` component works in at least `InventoryScene` and `PokedexScene`.
- [ ] Horizontal swipe navigates tabs in `SummaryScene`.
- [ ] Long-press opens context menu in `PartyScene`.
- [ ] All gesture interactions coexist with joystick+button controls (no regressions).

---

## Phase 4: Performance Tiering and Adaptive Quality

**Goal**: Smooth 60fps gameplay on mid-range phones (2022 era) and playable 30fps on low-end devices.
**Priority**: Medium
**Estimated scope**: `perf-profile.ts`, battle effects, overworld rendering

### Problem

The quality system (`perf-profile.ts`) only adjusts particle counts. The `medium` and `low` tiers should cascade through more rendering features:

| Feature | High | Medium | Low |
|---------|------|--------|-----|
| Particle count | 100% | 50% | 25% |
| Battle animation frames | All | Skip 1/3 | Skip 1/2 |
| Weather overlay | Full | Reduced | Off |
| Shadow rendering | Full | Simplified | Off |
| Text shimmer/glow effects | On | On | Off |
| Tile fade transitions | Cross-fade | Instant cut | Instant cut |
| Max active tweens | 20 | 12 | 6 |

### Solution

1. **Expand `perf-profile.ts`** with getters for each feature tier (e.g., `shouldShowWeather()`, `maxActiveTweens()`, `battleAnimFrameSkip()`).
2. **Add FPS monitoring**: Sample frame times over 2-second windows. If average drops below 24fps for 3 consecutive windows, auto-downgrade quality with a toast notification.
3. **Add GPU tier detection**: Use `navigator.gpu` (WebGPU) or WebGL renderer info to classify GPU capability. Default to `low` on devices with <2GB reported memory or Adreno 505-class GPUs.
4. **Texture quality**: For future optimization, prepare a mechanism to load half-resolution sprite sheets on `low` quality (requires asset pipeline change in `PreloadScene`).

### Acceptance Criteria

- [ ] `perf-profile.ts` exports at least 4 additional quality-gated feature flags beyond particles.
- [ ] FPS auto-downgrade triggers after sustained low frame rates.
- [ ] Settings UI reflects auto-downgraded quality level.
- [ ] No visual corruption when switching quality tiers mid-session.

---

## Phase 5: PWA and Offline Experience

**Goal**: The game loads fully from cache after first visit and handles offline transitions gracefully.
**Priority**: Medium
**Estimated scope**: `sw.js`, `index.html`, `PreloadScene`

### Problem

- Service worker only precaches `index.html`. All sprites, tilesets, maps, audio, and JS bundles require network on first load.
- No offline indicator in-game if network drops.
- No strategy for caching save data remotely (single-device saves only).

### Solution

#### 5a. Strategic Asset Precaching

Add critical assets to the precache list in `sw.js`:

```javascript
const PRECACHE_URLS = [
  '/Pokemon-Web/',
  '/Pokemon-Web/index.html',
  // JS bundles (add after build)
  '/Pokemon-Web/assets/sprites/player/player.json',
  '/Pokemon-Web/assets/sprites/player/player.png',
  '/Pokemon-Web/assets/tilesets/overworld-tileset.png',
  '/Pokemon-Web/assets/maps/pallet-town.json',
  '/Pokemon-Web/assets/ui/nine-patch.png',
  '/Pokemon-Web/assets/fonts/pokemon-font.png',
  // ... starter area critical assets
];
```

Alternatively, implement runtime precaching: after the game loads, use a `backgroundPrecache()` function to cache the next logical area's assets in idle time.

#### 5b. Apple Touch Icon and Splash Screens

Add to `index.html`:

```html
<link rel="apple-touch-icon" href="/Pokemon-Web/assets/ui/icon-192.png" />
```

Generate iOS splash screen images for common device sizes and add `<link rel="apple-touch-startup-image">` tags with media queries.

#### 5c. Offline State Indicator

When `navigator.onLine` transitions to `false`, show a subtle in-game toast: "Playing offline — progress saves locally." Reconnection triggers a "Back online" toast. This prevents user anxiety about lost saves.

#### 5d. Background Save Sync (Future)

Design an optional cloud save mechanism using a lightweight backend (IndexedDB → periodic sync to a remote endpoint). Mark this as future work, but structure `SaveManager` exports to support it.

### Acceptance Criteria

- [ ] Critical first-area assets are precached; game loads offline after one full visit.
- [ ] `apple-touch-icon` and at least one splash screen configured.
- [ ] Offline/online transition toasts appear in-game.
- [ ] Service worker versioning updated.

---

## Phase 6: Mobile-First UX Refinements

**Goal**: Small details that collectively elevate the feeling from "desktop game on a phone" to "native mobile game."
**Priority**: Medium
**Estimated scope**: Multiple small changes across UI and controls

### 6a. Improved Mobile Detection

**Problem**: `navigator.maxTouchPoints > 0` classifies touchscreen laptops as mobile. This triggers the virtual joystick and scaled fonts on devices that have keyboards.

**Solution**: Use a multi-signal heuristic:

```typescript
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const isSmallScreen = window.innerWidth <= 1024 && window.innerHeight <= 768;
  // Coarse pointer + small screen = phone/tablet; touch alone = maybe laptop
  return hasTouch && (hasCoarsePointer || isSmallScreen);
}
```

Add a `isTablet()` check using screen size thresholds (>768px shortest dimension) for tablet-specific layouts (e.g., larger UI but no virtual joystick because tablets can use Bluetooth keyboards).

### 6b. Persistent Orientation Preference

**Problem**: The "Continue Anyway" button on the portrait prompt dismisses it, but it reappears on every resize event.

**Solution**: Store the dismissal in `sessionStorage`. Check the flag before showing the prompt. Reset only on new sessions.

### 6c. Context-Sensitive Touch Hints

**Problem**: Some scenes show "Press Enter to continue" even on mobile.

**Solution**: Audit all hardcoded hint strings. Use a `hintText(action)` utility:

```typescript
export function hintText(action: 'confirm' | 'back' | 'menu'): string {
  if (isMobile()) {
    return { confirm: 'Tap A', back: 'Tap B', menu: 'Tap ☰' }[action];
  }
  return { confirm: 'Press Z', back: 'Press X', menu: 'Press Enter' }[action];
}
```

### 6d. Improved Mobile Menu Button

The hamburger button (`☰`) is 36x36px in landscape, which is below the 48px minimum. Increase to 48x48px and add a subtle background pulse animation when the player first enters the overworld to teach discoverability.

### 6e. Double-Tap to Run

In the overworld, add a double-tap-and-hold gesture on the joystick to toggle running (if running shoes are obtained). Currently only keyboard `Shift` toggles run. Provide a visual indicator (small shoe icon near the joystick).

### 6f. Quick-Save Floating Button

Add a small, semi-transparent save icon in the overworld (top-right corner, below the menu button) that triggers a quick save on tap. Mobile players cannot easily access the menu → save flow while in the middle of exploration.

### Acceptance Criteria

- [ ] Touchscreen laptops no longer trigger mobile mode.
- [ ] Orientation prompt dismissed state persists within a session.
- [ ] All hint text adapts to input mode.
- [ ] Menu button is ≥48px on all layouts.
- [ ] Double-tap run works in overworld with visual feedback.

---

## Phase 7: Accessibility and Inclusive Mobile Design

**Goal**: The mobile experience works for players with motor, visual, or situational impairments.
**Priority**: Medium
**Estimated scope**: Settings, UI components, touch controls

### 7a. One-Handed Mode

Add an option to move the A/B buttons to the left side (or make them draggable to a preferred position). Some players hold their phone with one hand and need both controls accessible on the same side.

### 7b. Button Remapping

Allow remapping of A/B buttons (e.g., swap confirm/cancel for players used to Japanese layout). Store in settings.

### 7c. Adjustable Dead Zone

The virtual joystick has a fixed dead zone. Add a dead zone sensitivity slider to settings for players with tremors or limited fine motor control.

### 7d. High Contrast Touch Controls

Add a "High Visibility Controls" toggle that makes the joystick and buttons fully opaque with thick outlines, for players using the game in bright sunlight or with low vision.

### 7e. Reduced Motion Cascade

The existing `reducedMotion` setting should cascade to:

- Screen transitions (instant cut instead of fade).
- Battle entry/exit animations.
- NPC exclamation marks.
- Weather particles.
- Joystick appearance animation.

### Acceptance Criteria

- [ ] One-handed mode option exists in Settings.
- [ ] A/B swap option exists in Settings.
- [ ] Dead zone slider exists in Settings.
- [ ] Reduced motion disables all non-essential animations.

---

## Appendix: File Inventory

### Files That Need Changes

| File | Phases |
|------|--------|
| `frontend/src/ui/theme.ts` | 1, 6a |
| `frontend/src/scenes/menu/PartyScene.ts` | 1, 3b, 3d |
| `frontend/src/scenes/menu/SummaryScene.ts` | 1, 3c |
| `frontend/src/scenes/pokemon/StarterSelectScene.ts` | 1 |
| `frontend/src/scenes/pokemon/MoveTutorScene.ts` | 1, 3b |
| `frontend/src/scenes/minigame/ShopScene.ts` | 1 |
| `frontend/src/scenes/pokemon/PCScene.ts` | 1, 3b |
| `frontend/src/scenes/overworld/OverworldScene.ts` | 2b, 2c, 6e, 6f |
| `frontend/src/scenes/battle/BattleUIScene.ts` | 2b |
| `frontend/src/scenes/overworld/DialogueScene.ts` | 2b, 3a |
| `frontend/src/scenes/menu/MenuScene.ts` | 2b |
| `frontend/src/scenes/menu/InventoryScene.ts` | 3b |
| `frontend/src/scenes/menu/PokedexScene.ts` | 3b, 3c |
| `frontend/src/utils/perf-profile.ts` | 4 |
| `frontend/public/sw.js` | 5a |
| `frontend/index.html` | 5b, 6b, 6d |
| `frontend/src/ui/controls/TouchControls.ts` | 6e, 7a, 7c, 7d |
| `frontend/src/scenes/menu/SettingsScene.ts` | 7a, 7b, 7c, 7d |

### New Files to Create

| File | Purpose | Phase |
|------|---------|-------|
| `frontend/src/utils/layout-on.ts` | Resize-safe layout utility | 2a |
| `frontend/src/ui/widgets/ScrollContainer.ts` | Momentum scroll container for lists | 3b |
| `frontend/src/utils/hint-text.ts` | Input-mode-aware hint strings | 6c |

### Priority Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 1: Scene consistency | Medium | High — fixes unreadable/untappable UI |
| 2 | Phase 3a: Tappable dialogue choices | Small | High — most common frustration |
| 3 | Phase 2: Dynamic resize | Large | High — fixes orientation-change breakage |
| 4 | Phase 6a: Mobile detection | Small | Medium — fixes false-positive mobile mode |
| 5 | Phase 3b-d: Gesture polish | Medium | Medium — native feel |
| 6 | Phase 5: PWA and offline | Medium | Medium — reliability |
| 7 | Phase 4: Performance tiering | Medium | Medium — smoothness on low-end |
| 8 | Phase 6b-f: UX refinements | Small each | Medium — cumulative polish |
| 9 | Phase 7: Accessibility | Medium | Medium — inclusive design |
