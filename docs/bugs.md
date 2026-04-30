# Pokemon Web — Bug Tracker

> Centralized list of **open / deferred** issues. Every resolved issue is
> documented in [docs/CHANGELOG.md](docs/CHANGELOG.md) — search for the bug
> ID or the dated `### Fixed` entry.

---

## Open

### Cycling has no visible sprite swap

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts) (cycling toggle, animation key), [frontend/public/assets/sprites/player/](frontend/public/assets/sprites/player) (no `cycle-*` frames yet).
- **Symptom:** Toggling the bicycle changes movement speed and swaps the
  internal animation key to `cycle-*`, but no `cycle-*` spritesheet has been
  generated, so the rendered animation falls back to the walk cycle at 3×
  speed. The player gets no visual feedback that they're cycling.
- **Status:** Deferred — needs new sprite art. Tracked under
  [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) Tier 4.4.

### Item-balls / signs cannot be walked onto

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts) — `rebuildNpcOccupiedTiles()`.
- **Symptom:** All entries from `mapDef.objects` (signs, item-balls, PCs,
  doors) are added to `npcOccupiedTiles`, blocking the player from stepping
  onto an item-ball to collect it. Today the player must stand adjacent and
  press the interact key.
- **Status:** Open — design call. Adjacent-interact is consistent with
  signs / PCs / NPCs. Step-on collection would mirror the legacy Pokémon
  games' item-ball behavior. Implementation is small once the design is
  decided (split `objects` into blocking vs. walkable lists during
  spawn).

### Catch shake graphic drifts when enemy sprite is mid-tween

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts) — `runShakeSequence()`.
- **Symptom:** Each shake creates a new graphic at
  `(enemySprite.x, enemySprite.y + 20)`. If the enemy sprite is still
  mid-intro tween (rare, requires opening BAG and throwing a ball before
  the slide-in completes) the ball icon hops between shakes.
- **Status:** Open — cosmetic edge case. The throw-origin and orphan-
  highlight issues that made the drift obvious were resolved in the
  round 1 audit pass; this one only triggers if the player races the
  intro animation. Fix would capture the slot anchor once at throw time
  and reuse it for every shake.

---

## 2026-05-02 audit cycle — round 3

The following entries are the result of a fresh top-to-bottom code review
of the battle subsystem, overworld, scenes, managers, and inventory.
Most bugs from this cycle were fixed in the 2026-04-29 changelog entry
"Bug audit pass, round 3". Remaining open items:

### Synthesis type override is silently ignored

- **Files:** [frontend/src/battle/effects/SynthesisHandler.ts](frontend/src/battle/effects/SynthesisHandler.ts#L70-L74), [frontend/src/battle/calculation/DamageCalculator.ts](frontend/src/battle/calculation/DamageCalculator.ts).
- **Symptom:** When a synthesis form has `typeOverride`, the handler
  pushes a `"…'s type changed!"` message and assigns
  `state.originalTypes = undefined` — but never writes the new type
  anywhere. `DamageCalculator` reads `pokemonData[id].types` (the
  static base data), so the type swap has zero effect on STAB or type
  effectiveness. The "type changed!" line is a UX lie.
- **Status:** Open — needs an instance-level `typeOverride` field on
  `PokemonInstance` and a `getEffectiveTypes()` accessor that
  `DamageCalculator` consults.

### Foul Play uses defender stat stages unconditionally for stages

- **Files:** [frontend/src/battle/calculation/DamageCalculator.ts](frontend/src/battle/calculation/DamageCalculator.ts#L57-L70).
- **Symptom:** For Foul Play the calculator passes `defender` to
  `getEffectiveStat(...,'attack')`, which correctly applies the
  defender's Attack stage. Per cartridge behavior Foul Play should
  use the **defender's** Attack but **ignore** the defender's
  positive stat stages. Right now Foul Play *boosted* by the
  defender's Swords Dance hits as hard as a real Swords-Dance attack,
  trivializing the move's anti-set-up niche.
- **Status:** Open — when `isFoulPlay`, fetch base `defender.stats.attack`
  rather than the staged value (or pass an "ignore positive stages"
  flag to `getEffectiveStat`).

### `Trainer.walkToward` only walks along the facing axis

- **Files:** [frontend/src/entities/Trainer.ts](frontend/src/entities/Trainer.ts#L75-L130).
- **Symptom:** Trainer movement computes both `stepsX` and `stepsY`
  but the actual loop uses only one based on `this.facing`:
  `const steps = this.facing === 'left' || 'right' ? stepsX : stepsY`.
  If the player is offset on both axes (e.g. trainer faces down,
  player is two tiles down and one tile right), the trainer only
  closes the vertical gap, then begins dialogue from a diagonal —
  visually wrong and can leave the trainer not adjacent. Combined
  with the LoS-through-NPC bug above, the trainer can also try to
  walk through obstacles since no per-step collision check is
  performed.
- **Status:** Open — walk straight along the facing axis until
  adjacent (LoS guarantees a single-axis path), and add a per-step
  collision check.

### `tryFishing` chains DialogueScene launches across a stop

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts).
- **Symptom:** The fishing flow launches a DialogueScene to print
  "You cast the line…" and, in its `shutdown` callback, launches a
  second DialogueScene for the result ("…and it bites!" / "…nothing
  bit."). Because the second `scene.launch('DialogueScene')` runs
  during the first scene's shutdown, Phaser may be mid-stop and the
  second launch can race or visually flash. Symptom: occasional
  duplicate or skipped dialogue when the player spam-presses A while
  fishing.
- **Status:** Open — replace the two-scene chain with a single
  DialogueScene that pages through the messages.

---

## 2026-05-02 audit cycle — round 4 (UI / mobile)

This pass focuses on the UI layer and mobile-specific paths: touch
controls, soft-keyboard handling, scene-resume input draining, layout
helpers, and per-scene close affordances.

### `TouchControls` and `VirtualJoystick` leak across scene boots

- **Files:** [frontend/src/systems/engine/InputManager.ts](frontend/src/systems/engine/InputManager.ts#L40), [frontend/src/ui/controls/TouchControls.ts](frontend/src/ui/controls/TouchControls.ts#L86), [frontend/src/ui/controls/VirtualJoystick.ts](frontend/src/ui/controls/VirtualJoystick.ts#L226-L242).
- **Symptom:** `InputManager` is created per-scene in `OverworldScene.create`,
  and each `InputManager` constructs a new `TouchControls(scene)` (which in
  turn constructs a new `VirtualJoystick`). Both wire `addEventListener`
  callbacks to the canvas, `window`, and DOM elements like `#btn-a`,
  `#btn-b`, `#mobile-menu-btn`. Neither `InputManager` nor any scene
  shutdown calls `TouchControls.destroy()`, so the listeners persist for
  the lifetime of the page. Every restart (`scene.restart`,
  `OverworldScene` boot after returning from title, etc.) adds a new
  layer:
  - The DOM A button accumulates N `touchstart` listeners → a single tap
    fires `confirmPressed` and `hapticTap()` N times (N vibrations).
  - The canvas accumulates N `touchstart` / `touchend` listeners doing
    swipe detection → swipe events count N times in `consumeSwipe*` over
    time.
  - `TouchControls.activeInstance` only points at the latest, but the
    leaked instances still mutate their own `confirmPressed` /
    `cancelPressed` flags.
- **Status:** Open — give `InputManager` a `destroy()` and call
  `touchControls.destroy()` from each scene's `shutdown`, or move
  `TouchControls` to a singleton bound to `game.events.once('destroy')`.

### Cross-scene cancel/confirm leak when leaving the overworld pause menu

- **Files:** [frontend/src/scenes/menu/MenuScene.ts](frontend/src/scenes/menu/MenuScene.ts#L201-L207), [frontend/src/ui/controls/TouchControls.ts](frontend/src/ui/controls/TouchControls.ts#L271-L286).
- **Symptom:** Only `OverworldScene` calls `TouchControls.drain()` on
  resume; every other scene that polls `consumeCancel()` / `consumeConfirm()`
  (`MenuScene`, `BattleUIScene`, `TownMapScene`, `DialogueScene`) inherits
  whatever press flag the previous scene left behind. Reproducible bug:
  open `PartyScene` from the pause `MenuScene`, tap the hamburger button —
  `PartyScene` does not poll `consumeCancel()` so the flag stays set;
  `PartyScene` shuts down → `MenuScene` wakes → its first `update()` polls
  `consumeCancel()`, immediately fires `closeMenu()`, and the player drops
  back to the overworld with no input. Same effect when bouncing between
  battle and bag.
- **Status:** Open — drain on every `wake` or have `TouchControls` own
  the lifecycle of these flags via `events.on('wake', drain)` for any
  scene that registers an InputManager.

### Many menu scenes ignore the hamburger / B-button

- **Files:** [frontend/src/scenes/menu/InventoryScene.ts](frontend/src/scenes/menu/InventoryScene.ts), [frontend/src/scenes/menu/PartyScene.ts](frontend/src/scenes/menu/PartyScene.ts#L351-L360), [frontend/src/scenes/menu/SettingsScene.ts](frontend/src/scenes/menu/SettingsScene.ts), [frontend/src/scenes/menu/PokedexScene.ts](frontend/src/scenes/menu/PokedexScene.ts), [frontend/src/scenes/menu/FlyMapScene.ts](frontend/src/scenes/menu/FlyMapScene.ts), [frontend/src/scenes/menu/HallOfFameScene.ts](frontend/src/scenes/menu/HallOfFameScene.ts), [frontend/src/scenes/menu/AchievementScene.ts](frontend/src/scenes/menu/AchievementScene.ts), [frontend/src/scenes/menu/StatisticsScene.ts](frontend/src/scenes/menu/StatisticsScene.ts), [frontend/src/scenes/menu/QuestJournalScene.ts](frontend/src/scenes/menu/QuestJournalScene.ts), [frontend/src/scenes/menu/SummaryScene.ts](frontend/src/scenes/menu/SummaryScene.ts), [frontend/src/scenes/minigame/ShopScene.ts](frontend/src/scenes/minigame/ShopScene.ts), [frontend/src/scenes/pokemon/MoveTutorScene.ts](frontend/src/scenes/pokemon/MoveTutorScene.ts), [frontend/src/scenes/pokemon/StarterSelectScene.ts](frontend/src/scenes/pokemon/StarterSelectScene.ts), [frontend/src/scenes/pokemon/PCScene.ts](frontend/src/scenes/pokemon/PCScene.ts), [frontend/src/scenes/pokemon/NicknameScene.ts](frontend/src/scenes/pokemon/NicknameScene.ts), [frontend/src/scenes/minigame/VoltorbFlipScene.ts](frontend/src/scenes/minigame/VoltorbFlipScene.ts), [frontend/src/scenes/menu/TrainerCardScene.ts](frontend/src/scenes/menu/TrainerCardScene.ts).
- **Symptom:** Only `MenuScene`, `TownMapScene`, `BattleUIScene`, and
  `DialogueScene` poll `TouchControls.consumeCancel()` from `update()`.
  Every scene above relies exclusively on its keyboard `keydown-ESC`
  handler to close. On a phone, the floating hamburger button + the DOM
  `#mobile-menu-btn` set `cancelPressed = true` but no consumer fires —
  the only mobile exit is the per-scene `✕` button (where one exists)
  or the on-screen B button on scenes whose update loop polls. The leak
  bug above amplifies the impact since the flag survives until somebody
  consumes it.
- **Status:** Open — add a `consumeCancel()` poll (or reuse `MenuController`
  in every menu scene so cancel routing is centralized).

### `FlyMapScene` traps mobile users with no exit

- **Files:** [frontend/src/scenes/menu/FlyMapScene.ts](frontend/src/scenes/menu/FlyMapScene.ts#L1-L165).
- **Symptom:** Two distinct bugs:
  1. There is no on-screen close affordance and no `consumeCancel` poll.
     A mobile user with no physical keyboard can only escape by tapping
     a destination — there is no "back" button.
  2. `confirmFly` for the player's current map plays the cancel SFX and
     `return`s **without closing the scene**, leaving the player on the
     fly menu indefinitely. Worse: the destination text shows "◄"
     marking it as the current map, so it looks tappable and inviting.
- **Status:** Open — add a tappable back button + `consumeCancel` poll;
  either close the scene on "fly to current map" or grey out the entry.

### `MOBILE_SCALE`, `MIN_TOUCH_TARGET`, and `BALL_RADIUS` are frozen at module load

- **Files:** [frontend/src/ui/theme.ts](frontend/src/ui/theme.ts#L138-L161), [frontend/src/scenes/menu/PartyQuickViewScene.ts](frontend/src/scenes/menu/PartyQuickViewScene.ts#L8-L9).
- **Symptom:** These constants are evaluated once at import time:
  `export const MOBILE_SCALE = isMobile() ? 1.35 : 1.0;`. `isMobile()`
  reads `window.innerWidth/innerHeight`, so the value is determined by
  the device dimensions at the moment the module is first evaluated.
  Two failure modes:
  1. A desktop user resizing the browser to ≤1024×768 should switch into
     mobile mode (per the `isMobile` rule "coarse pointer + small screen
     OR touch alone"), but `MOBILE_SCALE` and `MIN_TOUCH_TARGET` keep
     their boot-time desktop values (1.0 / 0).
  2. A phone whose viewport changes between portrait and landscape during
     boot (iOS sometimes reports the pre-rotation dims for the first
     event) can lock into the wrong scale until reload.
- **Status:** Open — convert these to functions (`mobileScale()`,
  `minTouchTarget()`) so call sites read the live value, and have
  `mobileFontPx` already calls `getTextScale()` per call.

### `layoutOn` re-runs while scenes are sleeping

- **Files:** [frontend/src/utils/layout-on.ts](frontend/src/utils/layout-on.ts#L12-L19), [frontend/src/scenes/menu/SettingsScene.ts](frontend/src/scenes/menu/SettingsScene.ts#L94-L255), [frontend/src/scenes/menu/MenuScene.ts](frontend/src/scenes/menu/MenuScene.ts#L107-L132).
- **Symptom:** `layoutOn` registers `scene.scale.on('resize', handler)`
  with no `scene.isActive()` / `scene.isSleeping()` guard. When the user
  rotates the device while a child scene is open (e.g. `SettingsScene`
  on top of `MenuScene`), the sleeping `MenuScene`'s layout fires too,
  destroying and recreating its `NinePatchPanel`, money text, and menu
  items. With `SettingsScene.buildLayout` doing the same thing several
  times in a row (the resize burst is debounced to fire 5 times within
  1.5 s), each rotation creates dozens of orphaned `Graphics` objects
  before the user even sees the next frame.
- **Status:** Open — guard the handler with
  `if (!scene.scene.isActive() && !scene.scene.isSleeping()) return;`
  or only fire on `wake` for sleeping scenes.

### `scene.restart` on resize discards user state

- **Files:** [frontend/src/scenes/menu/InventoryScene.ts](frontend/src/scenes/menu/InventoryScene.ts#L165-L172), [frontend/src/scenes/minigame/ShopScene.ts](frontend/src/scenes/minigame/ShopScene.ts#L153-L161), [frontend/src/scenes/menu/SummaryScene.ts](frontend/src/scenes/menu/SummaryScene.ts#L113-L117).
- **Symptom:** Several menu scenes implement orientation-change handling
  by calling `this.scene.restart()`, which loses transient state:
  - `InventoryScene` resets the cursor position, scroll offset, current
    category tab, and partially-typed quantity.
  - `ShopScene` resets the buy/sell tab and any in-progress quantity
    selection (player loses the ✕5 they were about to buy).
  - `SummaryScene` resets the active tab (INFO/STATS/MOVES) — rotating
    while reading STATS jumps you back to INFO.
  Plus `restart` triggers another `layoutOn` resize burst, recursively
  rebuilding everything.
- **Status:** Open — preserve cursor/scroll/tab in instance fields and
  re-render in place instead of restarting the scene.

### `SaveManager.save` failures are invisible to the player

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts#L21-L34), [frontend/src/scenes/menu/MenuScene.ts](frontend/src/scenes/menu/MenuScene.ts#L305-L323).
- **Symptom:** `SaveManager.save()` is `void` and swallows
  `localStorage.setItem` errors with `console.error`. `MenuScene.saveGame`
  calls `sm.save()` and unconditionally flashes "Game Saved!". On Safari
  Private Browsing, in cookies-disabled contexts, or when the localStorage
  quota is exceeded (long playthrough with large boxes), the player sees
  a green confirmation while their progress was silently dropped.
- **Status:** Open — return `boolean` (or throw) and surface a "Save
  failed — storage may be full" red banner with the retry option.

### `PartyScene` long-press fights its own click

- **Files:** [frontend/src/scenes/menu/PartyScene.ts](frontend/src/scenes/menu/PartyScene.ts#L161-L174).
- **Symptom:** Each slot registers two `pointerdown` listeners: the
  controller's `clickIndex(i)` (which immediately calls `confirm` →
  `onSlotConfirm` → opens the action menu / handles selectMode), AND a
  500 ms long-press timer that opens the context menu. If the
  `onSlotConfirm` flow takes >500 ms (e.g. it briefly opens
  `SummaryScene` which sleeps `PartyScene`), the long-press timer fires
  while the scene is asleep, opening the context menu underneath the
  Summary scene. When Summary closes, the user is staring at a context
  menu they did not request.
- **Status:** Open — cancel the long-press timer in `onSlotConfirm` and
  on `pointerdown` for the same slot, and skip the click listener if
  the long-press fired.

### `SummaryScene` swipe handler races multi-touch

- **Files:** [frontend/src/scenes/menu/SummaryScene.ts](frontend/src/scenes/menu/SummaryScene.ts#L83-L106).
- **Symptom:** Swipe detection captures `swipeStartX` / `swipeStartY` in
  shared instance fields on `pointerdown`, then reads them on `pointerup`
  to compute `dx, dy`. With multi-touch (a second finger lands during
  a swipe), the second `pointerdown` overwrites the start coordinates,
  so the first finger's `pointerup` measures from the wrong origin and
  fires bogus tab swaps. Common when the user rests a thumb on the screen
  while swiping with their index finger.
- **Status:** Open — track per-pointer-id origins in a `Map`, like
  `TouchControls.bindTapDetection` does.

### `NicknameScene` hidden input strips characters the keyboard handler accepts

- **Files:** [frontend/src/scenes/pokemon/NicknameScene.ts](frontend/src/scenes/pokemon/NicknameScene.ts#L98-L128), [frontend/src/scenes/pokemon/NicknameScene.ts](frontend/src/scenes/pokemon/NicknameScene.ts#L131-L150).
- **Symptom:** Three issues in the nickname flow:
  1. The mobile hidden-input `input` listener strips with
     `/[^a-zA-Z0-9]/g` and caps at 10 chars; the desktop keyboard handler
     accepts `/^[a-zA-Z0-9 \-]$/` (allows space + hyphen) and caps at 12.
     A name typed on a Bluetooth keyboard ("Mr. Mime") becomes "MrMime"
     the moment the user touches the soft-keyboard input zone.
  2. Both handlers run when a Bluetooth keyboard is paired to a phone
     (the soft keyboard sends `input` events, the hardware keyboard
     fires `keydown`). Each key press lands twice in `nameInput`.
  3. The `[ SKIP ]` button calls `this.scene.stop()` with no SFX, while
     `[ DONE ]` plays `SFX.CONFIRM`. Inconsistent.
- **Status:** Open — share one regex + max-length constant; suppress the
  `keydown` handler when `document.activeElement === this.hiddenInput`;
  play `SFX.CANCEL` on skip.

### `IntroScene` has the same nickname inconsistencies plus DOM input lifecycle gaps

- **Files:** [frontend/src/scenes/title/IntroScene.ts](frontend/src/scenes/title/IntroScene.ts#L317-L368).
- **Symptom:** The intro naming step duplicates `NicknameScene`'s logic
  with the same dual-handler + regex-mismatch problems. Additionally,
  `confirmName` removes `this.hiddenInput` from the DOM, but if the user
  navigates back (`SKIP`) or the scene is shut down by an external
  trigger before `confirmName` runs (e.g. resize-induced restart), the
  hidden input element is left orphaned in the DOM with `position:fixed`
  and `z-index: 9999` — invisible (opacity 0) but still focusable, which
  can intercept tab-key navigation in subsequent scenes.
- **Status:** Open — wire DOM cleanup to `events.once('shutdown', ...)`
  the way `NicknameScene` does.

### `ConfirmBox` dim overlay does not actually swallow taps

- **Files:** [frontend/src/ui/widgets/ConfirmBox.ts](frontend/src/ui/widgets/ConfirmBox.ts#L33-L40).
- **Symptom:** The full-screen dim is `setInteractive()` with a
  `pointerdown` handler that calls `p.event.stopPropagation?.()`. That
  stops the *native DOM event* propagation, but Phaser dispatches its
  own pointer events through its input plugin **before** the native
  event is dispatched on parent DOM elements, so by the time
  `stopPropagation` runs, every Phaser game object that registered
  `pointerdown` has already received the event. A tap on the dim while
  a YES/NO confirm is open can still trigger a button on the underlying
  scene (e.g., the menu cursor under the prompt).
- **Status:** Open — Phaser's correct guard is to set the dim's
  `setInteractive({ useHandCursor: false })` and rely on input depth
  ordering, plus call `pointerEvent.stopPropagation()` on the Phaser
  pointer (not the native one) inside the handler.

### `ShopScene` quantity-adjust arrows have sub-touch-target hit areas

- **Files:** [frontend/src/scenes/minigame/ShopScene.ts](frontend/src/scenes/minigame/ShopScene.ts#L275-L289).
- **Symptom:** The `◀` / `▶` quantity arrows in the buy panel are
  created as `add.text(..., '◀', { ...FONTS.heading })` and only get
  `setOrigin(0.5).setInteractive({ useHandCursor: true })` — no
  `setPadding`. The hit rectangle is therefore the natural glyph size
  (~16×24 px), well below `MIN_TOUCH_TARGET = 48`. Mobile users mis-tap
  near the arrows constantly.
- **Status:** Open — add `setPadding(16, 12, 16, 12)` (the same pattern
  used by `InventoryScene`'s close button).

### Battle move buttons have no `MIN_TOUCH_TARGET` floor

- **Files:** [frontend/src/scenes/battle/BattleMoveMenu.ts](frontend/src/scenes/battle/BattleMoveMenu.ts#L74-L79), [frontend/src/scenes/battle/BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L120-L130).
- **Symptom:** In compact-mobile mode (small landscape phones,
  `window.innerHeight < 400`) the move button width is hard-coded at
  120 px and height 30 px. Combined with the four-across layout, the
  effective tap zone per move is ~25×30 px — well below the 48 px
  Apple HIG / Android Material recommendation. Same issue with the
  action menu's compact mode (`menuH = 50`, four actions horizontally
  spaced — each tap target is ~50×50, which is borderline).
- **Status:** Open — clamp button height with `Math.max(MIN_TOUCH_TARGET, …)`
  and let the menu grow vertically rather than horizontally squashing.

### `AchievementScene` BACK button is below the touch target

- **Files:** [frontend/src/scenes/menu/AchievementScene.ts](frontend/src/scenes/menu/AchievementScene.ts#L77-L82).
- **Symptom:** `← BACK` is a 14 px text with no `setPadding`, so the
  hit rect is roughly 50×16. Mobile users have to pixel-hunt to close
  the achievements view. Same issue exists in `StatisticsScene`,
  `QuestJournalScene`, and `TrainerCardScene` for their close hints.
- **Status:** Open — pad close affordances to `MIN_TOUCH_TARGET`, and
  prefer the top-right ✕ pattern used by `InventoryScene` /
  `PartyScene`.

### DialogueScene choice panel sits under landscape touch controls

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L383-L392).
- **Symptom:** Choice panels anchor at `choiceX = layout.w - 100`. On
  landscape mobile phones the right ~140 px is reserved for the DOM
  joystick / A-B side panels (per `MenuScene.computeRightInset`), so a
  180 px choice panel (mobile width) lands inside that band — its right
  half is hidden behind the touch controls. The user can still tap the
  visible part, but options whose label reaches the right edge are
  unreadable.
- **Status:** Open — apply the same right-inset rule as `MenuScene` to
  the choice panel anchor.

### `DialogueScene` global `pointerdown` fires alongside per-choice handlers

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L290-L295).
- **Symptom:** `create()` registers `this.input.on('pointerdown', () => { if (!this.inChoiceMode) this.handleInput(); })`
  and individual choice texts register their own `pointerdown` for
  selection. Phaser dispatches per-object listeners first; the choice
  handler calls `selectChoice` → `cleanupChoices` → `closeDialogue` → the
  scene shuts down. Since the global handler still fires (its `if`
  condition was true at registration time but becomes false during the
  same dispatch), the dialogue advances under the (already-closed)
  scene, which can be observed when the next dialogue line of a
  multi-page sequence opens with the first character already typed.
- **Status:** Open — gate the global `pointerdown` on a "tap was on a
  choice" flag set by the per-choice handlers.

### `TouchControls.swapAB` setting only applies on next scene boot

- **Files:** [frontend/src/ui/controls/TouchControls.ts](frontend/src/ui/controls/TouchControls.ts#L687-L723).
- **Symptom:** `setupDOMButtons` reads `swapAB` from settings *once* at
  TouchControls construction and binds the listeners to fixed
  `confirm` / `cancel` actions. Toggling the setting in `SettingsScene`
  takes effect only after the next scene boot (or page reload). Players
  who change the swap toggle have to leave settings and re-enter the
  overworld for the change to apply.
- **Status:** Open — re-read the setting in the listener body, or
  subscribe to a settings-changed event.

### `SettingsScene.adjustValue` cannot reliably toggle fullscreen

- **Files:** [frontend/src/scenes/menu/SettingsScene.ts](frontend/src/scenes/menu/SettingsScene.ts#L210-L260).
- **Symptom:** `this.scale.startFullscreen()` is called from
  `adjustValue`, which is invoked synchronously by either a Phaser
  pointerdown handler or a `MenuController` keyboard callback. The
  Fullscreen API requires the call to happen during a user-gesture
  task; for the keyboard path there is no gesture. On strict browsers
  (Safari, especially iOS) the request is rejected silently and the
  toggle text flips from "OFF" → "ON" while no fullscreen actually
  occurred — the displayed value desyncs from `this.scale.isFullscreen`.
- **Status:** Open — only allow toggling fullscreen from a direct
  pointer event (disable the keyboard path with a hint), and re-read
  `this.scale.isFullscreen` after the request resolves.

### `PartyQuickView` ball radius freezes at module-load orientation

- **Files:** [frontend/src/scenes/menu/PartyQuickViewScene.ts](frontend/src/scenes/menu/PartyQuickViewScene.ts#L7-L10).
- **Symptom:** `BALL_RADIUS = isMobile() ? 10 : 8;` and `BALL_SPACING = isMobile() ? 28 : 24;`
  are top-level consts evaluated at import. If the user installs the
  PWA on a tablet (mobile-detected at boot), then external-displays it
  to a 1080p monitor (still touch-capable but now plenty of room), the
  HUD never resizes back. Same root cause as `MOBILE_SCALE`.
- **Status:** Open — compute inside `create()` from `ui(this)` width.

### `IntroScene.showAppearanceScreen` wipes every keyboard listener

- **Files:** [frontend/src/scenes/title/IntroScene.ts](frontend/src/scenes/title/IntroScene.ts#L411-L417).
- **Symptom:** Transitioning from the name step to the appearance step
  calls `this.input.keyboard!.removeAllListeners()` and
  `this.input.removeAllListeners()`. Any other system that registers
  scene-level input listeners during the transition window (e.g. an
  achievement toast that wired `keydown-Z` to dismiss, the audio
  manager mute hotkey, or future debug overlays) is silently
  unhooked. Currently no production code relies on this, but the
  blast radius is much bigger than the intent ("clear the name-typing
  handlers I just set up").
- **Status:** Open — track the registered handlers and remove them
  individually, or scope listeners with a Phaser `events` subscriber.

### `MobileTapMenu` registered alongside per-choice `pointerdown` doubles activations

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L412-L417), [frontend/src/ui/controls/MobileTapMenu.ts](frontend/src/ui/controls/MobileTapMenu.ts).
- **Symptom:** When a dialogue choice list is shown on mobile, both
  the per-text `pointerdown → selectChoice` AND the `MobileTapMenu`
  wrapper run on the same tap. `MobileTapMenu` calls the same callback
  that `selectChoice` uses, but `cleanupChoices` only runs once because
  the second pass sees the panel already destroyed. The visible glitch:
  a click sound double-plays on every choice selection.
- **Status:** Open — choose one input mechanism per platform, not both.

### Save quota check happens after `JSON.stringify`

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts#L26-L34).
- **Symptom:** `JSON.stringify(data)` of a long playthrough (full PC,
  unlocked Pokédex, hundreds of flags, achievements list) can reach
  hundreds of KB. The string is allocated, then `setItem` throws
  `QuotaExceededError` if the browser's per-origin localStorage budget
  is exceeded. The thrown error is caught and logged but the player
  sees no UI signal, **and** the JSON is wasted memory the GC won't
  reclaim until the next major collection. Repeated save attempts (the
  player tapping SAVE again) repeat the allocation each time.
- **Status:** Open — pre-check `data.length` against a budget, or
  switch to IndexedDB (`SaveManager` is already wrapped behind a
  singleton, so the migration is local).

### Hidden DOM inputs stay registered with iOS Safari autofill

- **Files:** [frontend/src/scenes/title/IntroScene.ts](frontend/src/scenes/title/IntroScene.ts#L317-L344), [frontend/src/scenes/pokemon/NicknameScene.ts](frontend/src/scenes/pokemon/NicknameScene.ts#L98-L128).
- **Symptom:** The hidden `<input>` used to summon the iOS soft
  keyboard has `autocomplete="off"` but lacks `autocorrect="off"`,
  `spellcheck="false"`, and a `name` attribute. iOS Safari sometimes
  attempts to autofill the field with the user's name from Contacts
  (especially on `autocapitalize="words"` text inputs that look like
  name fields), which then silently appends to `nameInput` via the
  `input` event — without the user pressing any key. Players have
  reported "Pikachu" suddenly being named with their real first name.
- **Status:** Open — set `autocorrect="off"`, `spellcheck="false"`,
  `inputmode="text"`, and `name="nickname-disabled"` (any non-standard
  name disables autofill heuristics).

---

## Resolved

The following audit passes are fully documented in
[docs/CHANGELOG.md](docs/CHANGELOG.md). Open the changelog for per-bug
file/line references:

| Audit | CHANGELOG entry | Scope |
|-------|-----------------|-------|
| 2026-04-29 | "Bug audit pass, round 3" | Round-3: duplicate ability/item hooks, voluntary switch-in abilities, Rare Candy stats, Max Revive heal, potions reviving fainted, PC deposit message, Poison Heal undo + toxic counter, ability immunity messages, wild encounter stats, AI null-accuracy, trainer LoS NPCs, dead BattleManager.selectMove |
| 2026-04-29 | "Playthrough bug audit pass, round 2 (medium / polish)" | Round-2 polish: synthesis aura tracking, Intro portrait stack, catch slot anchor, NPC tile dirty flag, QUIT/EXIT rename, title decorations, immune popup contrast, EmoteBubble depth, banner fallback, NIT-001/002/003 |
| 2026-04-29 | "Playthrough bug audit pass (BUG-001 through BUG-044)" | Round-1: switched-in invisibility, forced-switch softlock, mobile move menu, double-battle proportional layout, Pallet → Littoral Town displayName, Summary/Pokedex portrait clipping, Lighting RT leak, catch-ball origin + highlight, follower depth/scale, level-up message split, dialogue speaker clamp, Intro safe-area + DOM-input cleanup |
| 2026-04-29 | "Mobile UI bug sweep (B1–B7)" | Mobile triage: Challenge Modes BEGIN clip, ConfirmBox depth, HUD-on-title leak, interior warp blocker, NPC face-on-interact, Party slot collision, Party screen mobile exit |

Earlier audit cycles also reused `BUG-NNN` numbering for unrelated issues
(e.g., the `BUG-001 … BUG-097` set documented under entries dated before
2026-04-29). Those numbers do **not** correspond to the IDs above —
treat each audit cycle's IDs as scoped to that cycle's CHANGELOG entry.

---

## How to use this file

- Add a new entry above the **Resolved** section when an issue is found
  during play-testing or code review. Use a descriptive heading rather
  than a numeric ID — they collide across audit cycles.
- When a fix lands, remove the entry from this file and add a dated
  `### Fixed — …` entry to [docs/CHANGELOG.md](docs/CHANGELOG.md). Keep
  this file lean; the changelog is the historical record.
- For sweep-style audits (multi-bug single sitting), it's fine to retain
  numeric IDs scoped to that sweep — just include the prefix
  (e.g., `2026-MM-DD-01`) so they don't collide with future cycles.
