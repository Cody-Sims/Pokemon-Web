# Mobile Improvements Plan

## Current State

The game has baseline mobile support:

- **PWA manifest** with `"orientation": "landscape"` and `"display": "standalone"`.
- **Viewport meta** disables user scaling and pinch-zoom.
- **Phaser scale mode** uses `Phaser.Scale.FIT` with `CENTER_HORIZONTALLY` on mobile and `CENTER_BOTH` on desktop.
- **Fixed game resolution** of 800 × 600 (`GAME_WIDTH` / `GAME_HEIGHT` in `constants.ts`), letter-boxed into the viewport.
- **Touch controls**: `VirtualJoystick` (left 60 % of screen) + canvas-overlay A/B buttons + menu button + tap-to-confirm.
- **DOM control bar** (`#mobile-controls`) appears below the canvas in portrait when >100 px of bottom space exists; hides in landscape.
- **`MOBILE_SCALE`** (1.35×) applied to some font sizes and hit targets via `theme.ts`.
- **Zoom/gesture prevention** (double-tap, pinch, context menu, gesture events).
- **Safe-area padding** on the DOM control bar bottom only.

### Key Gaps

| Area | Issue |
|---|---|
| Landscape on phone | Canvas fills width but the 4:3 aspect ratio wastes vertical space; large black bars top/bottom on 19.5:9 phones. Touch controls overlay the gameplay area, obscuring ~25 % of the visible field. |
| Orientation handling | No orientation lock API call; no prompt to rotate; no layout adaptation when the user rotates mid-game. |
| Safe-area insets | Only the DOM control bar uses `env(safe-area-inset-bottom)`. Canvas, in-canvas overlays, and notch cutouts are ignored. |
| Font / hit-target scaling | `MOBILE_SCALE` is applied inconsistently — some scenes use `mobileFontSize()`, others hard-code `'16px'`. Minimum touch target (`MIN_TOUCH_TARGET = 48`) is defined but not enforced on most interactive elements. |
| UI layout | Every scene positions elements with absolute pixel offsets relative to constant 800 × 600. No responsive reflow for different aspect ratios. |
| Battle UI in landscape | Action menu and move menu cover the bottom ~130 px of the 600 px canvas—over 20 % of the view—making it hard to see the battlefield on small screens. |
| Performance | No mobile-specific perf tuning (particle count, tween complexity, off-screen rendering). |
| PWA experience | No offline fallback page, no install prompt, no splash screen beyond default browser behavior. |

---

## Phase 1 — Landscape Experience Fix (Priority: High)

The most impactful change: make horizontal phone play comfortable.

### 1.1 Widescreen-Aware Game Resolution

Instead of a fixed 800 × 600 canvas letter-boxed onto a ~19.5:9 screen, detect the device aspect ratio at boot and set a wider logical resolution.

- Introduce `getGameDimensions()` in `constants.ts` that returns `{ width, height }` based on `window.innerWidth / window.innerHeight`, clamped between 4:3 and 21:9, always keeping height at 600.
  - 4:3 → 800 × 600 (desktop default, unchanged).
  - 16:9 → 1067 × 600.
  - 19.5:9 → 1300 × 600.
- Update `game-config.ts` to call `getGameDimensions()` instead of using constants.
- Replace all `GAME_WIDTH` / `GAME_HEIGHT` references in scene layouts with `this.cameras.main.width` / `this.cameras.main.height` (or a helper) so UI elements anchor to the actual viewport edges.
- Keep `Phaser.Scale.FIT` so the wider canvas still scales down to fill the screen without black bars.

> **Estimated scope**: ~30 files reference `GAME_WIDTH`/`GAME_HEIGHT` for layout. A find-and-replace pass plus a scene-by-scene QA pass is required.

### 1.2 Relocate Touch Controls Outside the Gameplay Viewport

In landscape on phone, the joystick and A/B buttons currently overlay the canvas. Move them:

- Use **CSS `safe-area-inset-left` / `safe-area-inset-right`** to position the DOM joystick zone and DOM button zone in the horizontal margins left by the notch/Dynamic Island.
- In `TouchControls.updateDOMLayout()`, detect landscape orientation and switch to a **side-panel layout**: joystick zone on the left margin, action buttons on the right margin, with the canvas centered between them.
- Fall back to the existing in-canvas overlay only when the margins are too small (tablets in landscape that fill the screen edge-to-edge).

### 1.3 Orientation Lock / Prompt

- Call `screen.orientation.lock('landscape')` in `main.ts` after game boot (wrapped in a try/catch — only works in fullscreen or installed PWA on most browsers).
- If lock fails and the device is in portrait, show a centered overlay: "Rotate your device for the best experience" with a rotation icon and a "Continue anyway" dismiss button.
- On `orientationchange` / `resize`, recalculate `updateDOMLayout()` (already partially done) and re-anchor all scene UIs.

### 1.4 Fullscreen on First Tap

- On the first user interaction (tap on title screen), call `document.documentElement.requestFullscreen()` (or Phaser's `this.scale.startFullscreen()`).
- Fullscreen hides the browser chrome, giving back ~60–80 px of vertical space on most phones and enabling `screen.orientation.lock()`.

---

## Phase 2 — Responsive UI Layout (Priority: High)

### 2.1 Replace Absolute Positioning with Anchor-Based Layout

Create a lightweight `UILayout` utility:

```ts
// utils/ui-layout.ts
export function ui(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  return {
    w: cam.width,
    h: cam.height,
    cx: cam.width / 2,
    cy: cam.height / 2,
    left: 0,
    right: cam.width,
    top: 0,
    bottom: cam.height,
    /** Proportional x position (0–1). */
    px: (pct: number) => cam.width * pct,
    /** Proportional y position (0–1). */
    py: (pct: number) => cam.height * pct,
  };
}
```

Migrate each scene to use `ui(this)` instead of `GAME_WIDTH` / `GAME_HEIGHT`:

| Scene | Current pattern | Target pattern |
|---|---|---|
| `BattleUIScene` | `GAME_WIDTH / 2, GAME_HEIGHT - 60` | `ui.cx, ui.bottom - 60` |
| `MenuScene` | `GAME_WIDTH - panelW / 2 - 20` | `ui.right - panelW / 2 - 20` |
| `DialogueScene` | `GAME_WIDTH - 20, GAME_HEIGHT - 60` | `ui.w - 20, ui.bottom - 60` |
| `SettingsScene` | `GAME_WIDTH / 2, 50` | `ui.cx, 50` |
| All full-screen overlays | `GAME_WIDTH, GAME_HEIGHT` rect | `ui.w, ui.h` rect |

### 2.2 Battle UI — Compact Mode for Small Screens

When `MOBILE_SCALE > 1` or screen height < 400 physical pixels:

- Collapse the action menu from a 2 × 2 grid (100 px tall) to a single scrollable row (50 px tall) pinned to the bottom.
- Show move details (type/power/PP) as an overlay tooltip on long-press rather than inline.
- Shift the enemy/player info boxes inward to avoid notch overlap.

### 2.3 Dialogue Box Sizing

- Scale dialogue box width to `ui.w - 20` (already done in most places) but also scale font size based on `ui.w` so text doesn't overflow on narrower screens or look tiny on wider ones.
- Ensure the advance indicator ("▼") and speaker panel respect the new width.

---

## Phase 3 — Touch & Input Polish (Priority: Medium)

### 3.1 Consistent Touch Targets

Audit every `setInteractive()` call:

- Enforce minimum 48 × 48 CSS-pixel hit area (already defined as `MIN_TOUCH_TARGET` but not enforced).
- Add `hitArea` padding to small text elements (settings arrows, close buttons, type badges).

### 3.2 Haptic Feedback

- Call `navigator.vibrate(10)` on A-button press, cursor move, and critical battle hits (where supported).
- Gate behind a "Haptics" toggle in `SettingsScene`.

### 3.3 Gesture Enhancements

- **Swipe-to-dismiss** menus (swipe right to close MenuScene, swipe down to close DialogueScene).
- **Two-finger vertical swipe** as scroll in Pokedex, Quest Journal, and Inventory lists.
- **Long-press on party Pokémon** opens the summary directly (instead of requiring menu → view).

### 3.4 Joystick Improvements

- Make joystick dead-zone and radius configurable in settings (small / medium / large).
- Add optional **8-way mode** for diagonal movement (future: if grid movement supports diagonals).
- Visual: add subtle directional arrow highlights on the joystick base to indicate active direction.

---

## Phase 4 — Safe Area & Notch Handling (Priority: Medium)

### 4.1 CSS Safe-Area Insets

Update `index.html` styles:

```css
body {
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 4.2 In-Canvas Safe Margins

- Read the CSS custom property values from JS and pass them to a `SafeArea` utility.
- All HUD elements (map label, menu button, weather text) offset by the safe-area insets so nothing renders behind the notch or Dynamic Island.

### 4.3 Landscape Notch Awareness

On phones with a notch/Dynamic Island (iPhone 14+, Pixel, etc.) in landscape:

- The notch is on the left **or** right edge depending on rotation.
- Ensure the joystick zone and action buttons respect `safe-area-inset-left` / `safe-area-inset-right` and do not spawn underneath the notch.

---

## Phase 5 — Performance & Battery (Priority: Medium)

### 5.1 Mobile Performance Profile

- Detect mobile via `isMobile()` and reduce:
  - Particle emission rates by 50 %.
  - Weather overlay particle counts.
  - Ambient animation frame rates (water sparkles, grass sway) from 60 fps to 30 fps.
- Implement a `renderQuality` setting: `high` (desktop default), `medium`, `low`.

### 5.2 Off-Screen Culling

- Ensure objects more than 1 tile outside the camera bounds are deactivated (`setActive(false)`, `setVisible(false)`).
- `OverworldScene` already sets camera bounds — add object-pool culling for NPCs, grass particles, and tile decorations.

### 5.3 Battery-Aware Throttling

- Use `navigator.getBattery()` (where available) to detect low battery and suggest reducing render quality.
- Pause non-essential animations when the tab goes to background (`visibilitychange` event — partially handled by Phaser, but verify audio and timers also pause).

---

## Phase 6 — PWA & Offline (Priority: Low)

### 6.1 Improved Service Worker

- Cache all game assets at install time (sprites, tilesets, maps, audio) for true offline play.
- Show a custom offline fallback page when the network is unavailable and the cache is empty.
- Add cache-versioning so updates invalidate stale assets.

### 6.2 Install Prompt

- Detect `beforeinstallprompt` event and show an in-game banner: "Add to Home Screen for the best experience" with a one-tap install button.
- Dismiss and don't show again after the user installs or declines.

### 6.3 Splash Screen & App Icons

- Generate proper splash screen images for iOS (`apple-touch-startup-image`) at all required resolutions.
- Ensure `manifest.json` icons cover 48, 72, 96, 144, 192, 512 px sizes.

---

## Phase 7 — Accessibility on Mobile (Priority: Low)

### 7.1 Text Scaling

- Respect the OS-level font-size preference (`prefers-reduced-motion`, `font-size` accessibility settings) by reading it at boot and scaling `MOBILE_SCALE` accordingly.
- Add a "UI Scale" slider in settings (0.8× – 1.5×) that multiplies font sizes and hit areas.

### 7.2 Reduced Motion

- Detect `prefers-reduced-motion: reduce` and disable screen-shake, flash effects, and tween-heavy transitions.
- Replace them with simple fade in/out.

### 7.3 Color Blind Modes

- Offer Deuteranopia, Protanopia, and Tritanopia color filters using a Phaser post-processing pipeline or CSS `filter`.
- Remap type-color indicators to include shape/pattern cues in addition to color.

---

## Implementation Order

| Order | Phase | Description | Effort |
|---|---|---|---|
| 1 | 1.1 | Widescreen-aware resolution | Large |
| 2 | 2.1 | Anchor-based UI layout migration | Large |
| 3 | 1.2 | Side-panel touch controls in landscape | Medium |
| 4 | 1.3 | Orientation lock / prompt | Small |
| 5 | 1.4 | Fullscreen on first tap | Small |
| 6 | 2.2 | Battle UI compact mode | Medium |
| 7 | 4.1–4.3 | Safe-area / notch handling | Medium |
| 8 | 3.1 | Touch target audit | Medium |
| 9 | 2.3 | Dialogue box responsive sizing | Small |
| 10 | 3.2–3.4 | Gesture enhancements, haptics, joystick options | Medium |
| 11 | 5.1–5.3 | Performance tuning | Medium |
| 12 | 6.1–6.3 | PWA improvements | Medium |
| 13 | 7.1–7.3 | Accessibility | Medium |

---

## Success Criteria

- On a 6.7″ phone (iPhone 15 Pro Max, Pixel 8 Pro) in landscape: the game fills the screen edge-to-edge with no black bars; touch controls don't obscure the gameplay area; all interactive elements are reachable with thumbs; no content renders behind the notch.
- On a 6.1″ phone in portrait: the game displays a "Rotate for best experience" prompt; if dismissed, the game is still playable with DOM controls below the canvas.
- Lighthouse PWA score ≥ 90.
- All existing unit and integration tests continue to pass.
- No regression on desktop (keyboard + mouse) — the 800 × 600 resolution remains the default when the aspect ratio is 4:3 or narrower.
