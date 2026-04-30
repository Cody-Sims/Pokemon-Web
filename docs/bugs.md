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

## 2026-04-29 audit cycle — round 5 (deep logic)

Fresh top-to-bottom code review of the battle scene layer, battle
subsystem (calculators, effects, executor), overworld, and inventory.
Most bugs from this cycle were fixed in the 2026-04-30 changelog entry
"Bug audit pass, round 5". Remaining open items:

### Contact abilities trigger on all physical moves

- **Files:** [frontend/src/battle/effects/AbilityHandler.ts](frontend/src/battle/effects/AbilityHandler.ts#L79-L80).
- **Symptom:** Static, Flame Body, Poison Point, Rough Skin, and Iron
  Barbs activate on any `move.category === 'physical'`. Non-contact
  physical moves like Earthquake and Rock Slide incorrectly trigger.
  In the games, only moves that make contact trigger these abilities.
- **Status:** Open — add a `contact` flag to `MoveData`; check
  `move.contact === true` instead of `move.category === 'physical'`.

### Repel steps discarded on map transition and battle return

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L237), [frontend/src/systems/overworld/EncounterSystem.ts](frontend/src/systems/overworld/EncounterSystem.ts#L13).
- **Symptom:** `create()` constructs a new `EncounterSystem()` every
  time the scene starts (warps, battle returns, fly). The new instance
  has `repelSteps = 0`, discarding any remaining repel steps. A player
  who uses a Repel and enters a building or finishes a battle
  immediately loses the repel effect.
- **Status:** Open — persist `repelSteps` on `GameManager` and
  restore in `create()`.

### DoubleBattleManager: Protect persists across turns

- **Files:** [frontend/src/battle/core/DoubleBattleManager.ts](frontend/src/battle/core/DoubleBattleManager.ts#L280-L300).
- **Symptom:** `clearProtectAll()` is never called at the end of
  `executeTurn`. A Pokémon that uses Protect stays protected
  indefinitely — blocking attacks on all subsequent turns.
- **Status:** Open — add `this.statusHandler.clearProtectAll()` at
  the end of `executeTurn`.

### DoubleBattleManager: Switch-in abilities don't trigger

- **Files:** [frontend/src/battle/core/DoubleBattleManager.ts](frontend/src/battle/core/DoubleBattleManager.ts#L449-L465).
- **Symptom:** After `statusHandler.initPokemon(newPokemon)`,
  `AbilityHandler.onSwitchIn` is never called. Intimidate won't lower
  Attack, Drizzle/Drought won't set weather when switching in during
  doubles.
- **Status:** Open — call `AbilityHandler.onSwitchIn` after
  `initPokemon`.

### DoubleBattleManager: End-of-turn ability and item effects missing

- **Files:** [frontend/src/battle/core/DoubleBattleManager.ts](frontend/src/battle/core/DoubleBattleManager.ts#L285-L298).
- **Symptom:** The end-of-turn loop calls `statusHandler.applyEndOfTurn`
  and `weatherManager.applyEndOfTurn`, but never calls
  `AbilityHandler.onEndOfTurn` or `HeldItemHandler.onEndOfTurn`. Speed
  Boost never boosts speed, Leftovers never heals, Black Sludge never
  triggers in double battles.
- **Status:** Open — add `AbilityHandler.onEndOfTurn` and
  `HeldItemHandler.onEndOfTurn` calls in the loop.

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

## 2026-05-02 audit cycle — round 5 (save / load / battle state)

User-reported regressions plus the related code paths discovered while
auditing them. Save-state issues are listed first because they are
**blocking continued playtesting** — Continue from the title screen
crashes immediately on the live build (`battle-Q0rEFkIH.js` →
`loadFromSave`).

### TitleScene "Continue" crashes — `loadFromSave` expects a save shape that no longer exists 🚨

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L20-L36),
  [GameManager.ts](frontend/src/managers/GameManager.ts#L221-L296),
  [OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L115-L121),
  [TitleScene.ts](frontend/src/scenes/title/TitleScene.ts#L197-L201),
  [interfaces.ts](frontend/src/data/interfaces.ts#L96-L120).
- **Symptom:** `TypeError: undefined is not an object (evaluating
  'e.player.party')` thrown from `loadFromSave` whenever a player taps
  Continue on the title screen. Game is unrecoverable from save —
  every session starts from scratch.
- **Root Cause:** Two completely incompatible save formats coexist:
  - `SaveManager.save()` writes a **flat** object built from
    `gm.serialize()` (top-level `playerName`, `party`, `bag`, `money`,
    `flags`, `trainersDefeated`, …).
  - `GameManager.loadFromSave(save)` expects the **legacy nested**
    shape (`save.player.name`, `save.player.party`, `save.player.bag`,
    `save.player.position`, `save.player.badges`, `save.player.pokedex`,
    …) and immediately destructures `save.player.party` → crash.
  - `SaveManager.load()` lies about the type (`return parsed as
    SaveData`) so TypeScript happily passes the flat object as if it
    were nested.
  - `SaveData` (in `interfaces.ts`) still describes the nested shape,
    so every consumer that trusts the type signature is broken.
  - `loadAndApply()` (used by the import-JSON path) calls
    `gm.deserialize` instead and works correctly — masking the bug
    until someone actually pressed Continue.
- **Status:** Open — minimum fix is to replace the
  `gm.loadFromSave(data.saveData)` call in `OverworldScene.init` with
  `gm.deserialize(data.saveData as ReturnType<typeof gm.serialize>)`
  plus the achievements restore that `loadAndApply` does (or have
  TitleScene call `loadAndApply()` and pass nothing to
  `OverworldScene`). Longer-term, **delete `loadFromSave`** entirely
  along with the stale nested `SaveData` interface — they are pure
  technical debt and a footgun.

### `SaveManager.load()` returns the wrong type

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L38-L57).
- **Symptom:** `load()` declares `: SaveData | null` and casts the
  parsed JSON `as SaveData`, but the actual on-disk shape is the flat
  output of `gm.serialize()` (no `player` wrapper). Any caller that
  reads typed fields like `data.player.name` will hit `undefined`.
- **Status:** Open — change the signature to
  `ReturnType<GameManager['serialize']> & { version: number;
  timestamp: number; achievements?: string[] } | null` (or introduce a
  `SerializedSave` type) and fix the now-stale `SaveData` interface.

### `SaveData` interface is the legacy nested shape

- **Files:** [interfaces.ts](frontend/src/data/interfaces.ts#L96-L120).
- **Symptom:** Documentation drift — the canonical "save format"
  declared in `interfaces.ts` describes a structure that has not been
  written to disk since the v1→v2 migration. New contributors will
  read this and write more `data.player.party`-style code that
  silently breaks at runtime.
- **Status:** Open — replace with `type SaveData =
  ReturnType<GameManager['serialize']> & { version: number; timestamp:
  number; achievements?: string[] }` so the type tracks reality.

### `OverworldScene.init` skips achievement restore

- **Files:** [OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L115-L125),
  [SaveManager.ts](frontend/src/managers/SaveManager.ts#L60-L72).
- **Symptom:** Even when the save-load path is fixed, the title-screen
  Continue branch calls `gm.loadFromSave(data.saveData)` directly and
  never restores `AchievementManager`. `loadAndApply()` does (`if
  (data.achievements …) AchievementManager.getInstance().deserialize`),
  so achievements silently roll back to whatever was unlocked in the
  current process.
- **Status:** Open — route Continue through `loadAndApply()` instead of
  passing `saveData` into the scene, or replicate the achievement
  restore step in `OverworldScene.init`.

### `SaveManager.save()` swallows `JSON.stringify` errors silently (still open from round 3, escalated)

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L20-L36).
- **Symptom:** `try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }`
  catches *only* DOMException quota errors but `JSON.stringify` itself
  can throw on circular references — the round-5 audit found that
  `PlayerStateManager.berryPlots` accepts arbitrary `unknown[]` values
  that could contain Phaser game objects with cyclic parent refs.
  Result: silent save loss with a single `console.error`.
- **Status:** Open — add a structural pre-check (e.g. `JSON.stringify`
  in a separate try and surface a user-facing toast on failure), or
  prune Phaser objects from save payloads at the manager layer.

### `loadAndApply()` casts away type errors

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L60-L72).
- **Symptom:** `gm.deserialize(data as unknown as ReturnType<typeof
  gm.serialize>)` bypasses TypeScript entirely. Any future field that
  `serialize()` adds but old saves lack will silently `undefined` its
  way through `deserialize` (most managers guard with `if (data.x)`,
  so the field is just dropped). No telemetry, no warning, no
  migration step.
- **Status:** Open — add a `migrate(parsed)` step in `load()` that
  back-fills new fields with defaults and bumps `version`, and remove
  the `as unknown as` cast.

### Battle HP bar shows 100% on entry even when active Pokémon is wounded 🚨

- **Files:** [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L268-L275),
  [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L406-L420).
- **Symptom:** User-reported: *"I joined the battle with 2/20 HP and
  yet my health bar was full."* The numeric `playerHpText` is correct
  (e.g. `2/20`) but the green bar visually fills the entire frame
  until the player's first action is taken. Triggers every encounter
  whose lead Pokémon is below max HP (post-poison overworld walk,
  resumed save, etc.).
- **Root Cause:** [BattleScene.ts#L271](frontend/src/scenes/battle/BattleScene.ts#L271)
  creates `playerHpBar` (and `enemyHpBar`) at full width:
  `add.rectangle(x, y, playerHpBarW, 10, 0x4caf50)`. `updateHpBars()`
  is *never* called inside `BattleScene.create()` — the first call
  happens after a turn is taken (move animation, end-of-turn ticks,
  or a faint check). Until then, the bar is a literal full-width
  rectangle.
- **Status:** Open — call `this.updateHpBars()` once after the
  slide-in tween chain (or set the initial `displayWidth =
  playerHpBarW * (currentHp / stats.hp)` and pick the colour at
  creation time). Same fix needed for `enemyHpBar` for wounded boss
  rematches and double-battle partner bars
  ([BattleScene.ts#L426-L444](frontend/src/scenes/battle/BattleScene.ts#L426-L444)).

### `BattleScene.create` selects an alive lead but does not refresh status icon either

- **Files:** [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L137-L138),
  [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L274-L275).
- **Symptom:** Sister bug to the HP-bar issue — `playerStatusImg` is
  added with `setVisible(false)` and is only refreshed by
  `updateStatusIndicators()` (called from `updateHpBars()`). A
  Pokémon entering battle already poisoned/burned therefore shows no
  status icon during the entire intro sequence and through the first
  turn.
- **Status:** Open — same fix (initial `updateHpBars()` call) covers
  this since `updateHpBars` ends with `this.updateStatusIndicators()`.

### EXP bar is also created at full width before the level percentage is applied — wait, it isn't

- **Files:** [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L277-L281).
- **Symptom:** Audited as part of the HP-bar fix to confirm scope;
  the EXP bar is created with `playerHpBarW * expPct` width, so it is
  correct from frame 0. Documenting the negative result so future
  audits do not chase it.
- **Status:** Not a bug — listed for traceability.

### `handleFaintedSwitch` "shutdown" fallback can wedge the battle if PartyScene races

- **Files:** [BattleSwitchHandler.ts](frontend/src/scenes/battle/BattleSwitchHandler.ts#L139-L177).
- **Symptom:** User-reported: *"I have fainted but yet the battle
  hasn't ended."* When the active Pokémon faints with no other alive
  party members, `handleFaintedSwitch` correctly schedules
  `endBattle()` after 2 s. But when an alive party member exists and
  PartyScene closes via `shutdown` *before* the `pokemon-selected`
  event fires (race observed on slow mobile devices, or when the user
  taps the close-zone overlay), `chosenIndex` stays at `-1`, the code
  falls back to `party.find(p => p.currentHp > 0)` — and if the user
  rapidly used a Revive that finished after the check, `newActive` is
  `undefined` because the new alive member's `currentHp` was set in
  another tick. The handler then `return`s without re-enabling input.
  The scene stays in `state = 'message'`, no actions are shown, and
  the battle is permanently frozen.
- **Status:** Open — at minimum, when `newActive` is undefined the
  handler must call `this.scene.endBattle()` (the player has no
  Pokémon left and the whole-party guard above missed a transition),
  and `PartyScene` should always emit `pokemon-selected` before
  `shutdown` in `forcedSwitch` mode.

### `BattleSwitchHandler.openPartyMenu` (voluntary switch) still skips `initPokemon` order vs. round 3 — but worse with HP bar bug

- **Files:** [BattleSwitchHandler.ts](frontend/src/scenes/battle/BattleSwitchHandler.ts#L19-L70).
- **Symptom:** Round 3 noted that the voluntary path skips
  `AbilityHandler.onSwitchIn` setup ordering. Re-reading the code now,
  this *is* fired (line 56), but `b.updateHpBars()` is called
  **before** `clearPokemon`/`initPokemon` change the active reference.
  Combined with the round-5 HP-bar bug above, switching into a
  damaged party member during a voluntary switch shows a full bar
  that snaps to the correct value only after the next damage tick.
- **Status:** Open — move `b.updateHpBars()` to *after* the
  `initPokemon` calls and the ability hooks fire, so the bar reflects
  the post-switch state (and fix the missing initial call from the
  HP-bar bug above).

### `BattleScene` resume-from-save path does not exist

- **Files:** [BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts#L120-L160),
  [SaveManager.ts](frontend/src/managers/SaveManager.ts#L20-L36).
- **Symptom:** Stack trace from the user shows
  `loadFromSave (battle-Q0rEFkIH.js:1:93605) → init
  (index-DtueDsYM.js:1:220437) → bootScene` — `loadFromSave` is
  bundled into the **battle** chunk because `OverworldScene` (which
  imports `BattleScene`) re-exports a transitive dependency, not
  because the battle scene itself resumes from save. The save format
  has **no field** for "battle in progress" — if the user hard-quits
  mid-battle, the next session resumes them on the overworld at the
  saved position with the post-encounter party state. Document or
  guard accordingly.
- **Status:** Open (design / docs) — either persist a battle resume
  payload or display a "Battle was interrupted" toast and roll back
  to last overworld save on detection.

### `gm.reset()` in `loadAndApply` does not reset `AchievementManager`

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L60-L72).
- **Symptom:** `loadAndApply` calls `gm.reset()` to clear stale state,
  then conditionally restores achievements only when
  `data.achievements` is an array. If a v1 save is loaded that has no
  `achievements` field, the **previous session's** unlocked
  achievements survive into the new run.
- **Status:** Open — add `AchievementManager.getInstance().reset()`
  before the conditional `deserialize`, and add a `reset()` method to
  `AchievementManager` if it does not already exist.

### `SaveManager.importJson` minimum-shape check uses the broken nested key list — wait, it doesn't

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L100-L132).
- **Symptom:** Audit of `importJson` confirms the required-field list
  is `['playerName', 'party', 'badges', 'flags']` — the **flat**
  shape. Imports therefore validate against the real on-disk format.
  Documenting the negative result so future contributors do not "fix"
  this back to `'player.name'`.
- **Status:** Not a bug — listed for traceability.

### Save round-trip drops `boxNames`, `gameClockMinutes`, `currentMap` for legacy v1 imports

- **Files:** [SaveManager.ts](frontend/src/managers/SaveManager.ts#L38-L57),
  [PartyManager](frontend/src/managers/PartyManager.ts).
- **Symptom:** v1 → v2 migration in `load()` sets
  `parsed.boxNames = undefined` instead of providing default labels;
  `PartyManager.deserialize` then leaves `boxNames` empty and the PC
  shows "Box 1"…"Box 8" placeholders forever.
- **Status:** Open — supply default box names in the migration.

### `currentMap` is not validated on load

- **Files:** [PlayerStateManager.ts](frontend/src/managers/PlayerStateManager.ts#L296-L303),
  [OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L115-L125).
- **Symptom:** A save written on a map that has since been removed
  (e.g. a beta-only test map) loads fine but `OverworldScene.init`
  asks for `gm.getCurrentMap()` and the tilemap loader hits an
  unhandled `undefined` map descriptor a few frames later.
- **Status:** Open — validate `currentMap` against the registered map
  list in `loadAndApply` and fall back to a known-safe spawn (Pallet
  Town / starting map) with a one-line player-visible toast.

### `PokemonInstance` array references after load do not survive structural change

- **Files:** [interfaces.ts](frontend/src/data/interfaces.ts#L60-L95),
  [PartyManager.ts](frontend/src/managers/PartyManager.ts).
- **Symptom:** `PartyManager.deserialize` assigns `this.party =
  data.party` directly — the runtime party is the JSON-parsed object
  graph, and any instance method or `Map`/`Set` field will not be
  reconstructed. Currently the data classes are plain interfaces so
  this works, but the audit logged this as a future-risk item before
  someone adds class-based state to `PokemonInstance`.
- **Status:** Open (preventative) — wrap deserialized instances in
  `Object.assign(new PokemonInstance(), data)` or equivalent factory.

### `gameStats` typed as `Record<string, number>` but cast through `as GameStats`

- **Files:** [GameManager.ts](frontend/src/managers/GameManager.ts#L296-L298),
  [StatsManager.ts](frontend/src/managers/StatsManager.ts).
- **Symptom:** `loadFromSave` (and by association any future caller
  that uses the legacy method) does
  `this._stats.deserialize({ gameStats: save.gameStats as GameStats |
  undefined })`. Because `Record<string, number>` is structurally
  compatible with most fields of `GameStats`, missing keys silently
  default to `undefined` and any later `incrementStat('stepCount', 1)`
  evaluates to `NaN`.
- **Status:** Open — `StatsManager.deserialize` should clone the
  default `GameStats` and merge known keys instead of accepting the
  raw record.

### Battle "joined with 2/20 HP" might be the result of recoil/poison faint going undetected

- **Files:** [BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L600-L660),
  [HeldItemHandler.ts](frontend/src/battle/effects/HeldItemHandler.ts#L48-L53).
- **Symptom:** The `runEndOfTurnStep` loop calls
  `b.updateHpBars()` only when `allMessages.length > 0`. If a status
  effect *changes HP* (Black Sludge healing a Poison-type, Heal Bell,
  Hex damage rolled to 0 due to Magic Bounce) but produces an empty
  message array, the bar drifts out of sync with `currentHp`.
  Combined with the missing initial `updateHpBars()` call this can
  cascade across multiple turns.
- **Status:** Open — call `b.updateHpBars()` unconditionally after
  `collectEndOfTurnEffects` runs, regardless of message count.

### `runEndOfTurnStep` `idx` recursion can stack-overflow on long status chains

- **Files:** [BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L600-L630).
- **Symptom:** When several Pokémon have empty-message status ticks
  (no HP change, no flavour text), the function recurses synchronously
  via `this.runEndOfTurnStep(pokemonToCheck, idx + 1)` without going
  through `time.delayedCall`. With 4 Pokémon in a double battle and
  multiple silent ticks per turn, the call stack grows linearly per
  turn. Real games never reach the limit but contributor tests with
  scripted long chains will.
- **Status:** Open (preventative) — wrap the no-message branch in
  `this.time.delayedCall(0, …)` to break the synchronous recursion.

### `applyMoveResult` faint sequence does not clear `state` before `endBattle`

- **Files:** [BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L515-L575).
- **Symptom:** When the defender faints from a recoil-only attack,
  the handler chains `faintSprite → msg → handleFaintedSwitch` but
  leaves `this.state = 'animating'`. If the user taps the action
  buttons during the 1500 ms delay, `BattleActionMenu` rejects the
  input because state is wrong; if they tap *after*
  `handleFaintedSwitch` opens PartyScene, the click hits the now-
  invisible action menu underneath because `hideActions()` was never
  called.
- **Status:** Open — set `this.state = 'message'` and call
  `this.hideActions()` inside the faint branch before the
  `delayedCall`.

---

## Resolved

The following audit passes are fully documented in
[docs/CHANGELOG.md](docs/CHANGELOG.md). Open the changelog for per-bug
file/line references:

| Audit      | CHANGELOG entry                                         | Scope                                                                                                                                                                                                                                                                            |
|------------|---------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2026-04-30 | "Bug audit pass, round 5"                               | Round-5: enemy AI never invoked, flee formula wrap, type-immune 1 dmg, secondary effects on immune, Struggle auto-use, Full Restore revive, two-turn PP double-deduct, multi-hit weather+hooks, bad-poison catch rate, catch failure status bypass, Trace overwrite, Guts burn, weather refresh |
| 2026-04-29 | "Bug audit pass, round 3"                               | Round-3: duplicate ability/item hooks, voluntary switch-in abilities, Rare Candy stats, Max Revive heal, potions reviving fainted, PC deposit message, Poison Heal undo + toxic counter, ability immunity messages, wild encounter stats, AI null-accuracy, trainer LoS NPCs, dead BattleManager.selectMove |
| 2026-04-29 | "Playthrough bug audit pass, round 2 (medium / polish)" | Round-2 polish: synthesis aura tracking, Intro portrait stack, catch slot anchor, NPC tile dirty flag, QUIT/EXIT rename, title decorations, immune popup contrast, EmoteBubble depth, banner fallback, NIT-001/002/003 |
| 2026-04-29 | "Playthrough bug audit pass (BUG-001 through BUG-044)" | Round-1: switched-in invisibility, forced-switch softlock, mobile move menu, double-battle proportional layout, Pallet → Littoral Town displayName, Summary/Pokedex portrait clipping, Lighting RT leak, catch-ball origin + highlight, follower depth/scale, level-up message split, dialogue speaker clamp, Intro safe-area + DOM-input cleanup |
| 2026-04-29 | "Mobile UI bug sweep (B1–B7)" | Mobile triage: Challenge Modes BEGIN clip, ConfirmBox depth, HUD-on-title leak, interior warp blocker, NPC face-on-interact, Party slot collision, Party screen mobile exit |

Earlier audit cycles also reused `BUG-NNN` numbering for unrelated issues
(e.g., the `BUG-001 … BUG-097` set documented under entries dated before
2026-04-29). Those numbers do **not** correspond to the IDs above —
treat each audit cycle's IDs as scoped to that cycle's CHANGELOG entry.

---

## 2026-04-30 audit cycle — full-codebase deep review

Full-codebase bug audit across 52 shards (battle, overworld, managers,
UI, cross-cutting sweeps, edge-case matrix). Baseline: commit
f7378c705518, build PASS, 2148 tests PASS. Findings below are **new**
(not already tracked above). 96 unique findings total; 5 critical,
22 high, 50 medium, 19 low.

### CRIT-1: Pokéballs can be thrown at fainted Pokémon

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts#L33-L94).
- **Symptom:** `handlePokeBallUse()` checks for trainer battles and
  challenge mode but never validates `enemyPokemon.currentHp > 0`.
  A ball can be thrown at a 0-HP target and the catch sequence runs.
- **Status:** Fixed — add `if (enemy.currentHp <= 0)` guard returning
  "It won't have any effect!" before shake logic.

### CRIT-2: Save during scene transition not blocked

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts),
  [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts).
- **Symptom:** No guard prevents save while `transitioning === true`.
  Player can open menu during fade-transition and save, capturing
  mid-warp state that may not restore cleanly.
- **Status:** Fixed — SaveManager.save() should check a global
  transitioning flag or OverworldScene should block menu during warp.

### CRIT-3: Bad-poison (Toxic) damage has no cap

- **Files:** [frontend/src/battle/effects/StatusEffectHandler.ts](frontend/src/battle/effects/StatusEffectHandler.ts#L517-L525).
- **Symptom:** Toxic counter increments unbounded:
  `damage = (hp * counter) / 16`. After 16 turns the damage exceeds
  max HP per tick. Should cap counter at 15.
- **Status:** Fixed — add `Math.min(counter, 15)` in applyEndOfTurn.

### CRIT-4: Status effects bypass Substitute

- **Files:** [frontend/src/battle/effects/StatusEffectHandler.ts](frontend/src/battle/effects/StatusEffectHandler.ts#L307-L331).
- **Symptom:** `applyMoveEffect()` applies status directly to the
  target without checking `volatileStatuses.has('substitute')`.
  Status moves like Thunder Wave hit through Substitute.
- **Status:** Fixed — add substitute guard before status application.

### CRIT-5: Battle FSM accepts transitions to unregistered states

- **Files:** [frontend/src/battle/core/BattleStateMachine.ts](frontend/src/battle/core/BattleStateMachine.ts#L22-L29).
- **Symptom:** `transition()` doesn't validate that the target state
  is registered. FSM enters a dead state; `update()` silently does
  nothing. Can softlock the battle.
- **Status:** Fixed — validate state exists, throw or log on unknown.

### HIGH-1: Bad-poison counter not reset on switch

- **Files:** [frontend/src/battle/effects/StatusEffectHandler.ts](frontend/src/battle/effects/StatusEffectHandler.ts#L518-L525).
- **Symptom:** When a badly-poisoned Pokémon switches out and back in,
  `statusTurns` persists from its old value. Damage resumes at the
  accumulated counter instead of resetting to 1.
- **Status:** Fixed.

### HIGH-2: Trace ability not restored on re-switch-in

- **Files:** [frontend/src/battle/effects/AbilityHandler.ts](frontend/src/battle/effects/AbilityHandler.ts#L56-L70).
- **Symptom:** `onSwitchIn()` stores `originalAbility` in volatile
  state, but `clearPokemon()` deletes the state without restoring
  `pokemon.ability`. On re-entry the traced ability persists.
- **Status:** Fixed.

### HIGH-3: Intimidate / onSwitchIn can trigger twice

- **Files:** [frontend/src/battle/effects/AbilityHandler.ts](frontend/src/battle/effects/AbilityHandler.ts#L18-L74).
- **Symptom:** No idempotent guard on `onSwitchIn()`. If the caller
  invokes it twice per switch, Intimidate cuts Attack twice.
- **Status:** Fixed.

### HIGH-4: Choice item move lock not enforced

- **Files:** [frontend/src/battle/effects/HeldItemHandler.ts](frontend/src/battle/effects/HeldItemHandler.ts#L289-L316).
- **Symptom:** Choice Band/Specs/Scarf apply damage multipliers but
  don't track or enforce the one-move lock.
- **Status:** Fixed.

### HIGH-5: Two-turn move PP double-deduction risk

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L56-L88).
- **Symptom:** If `statusHandler` is null on the attack turn of a
  two-turn move, `skipPPDeduction` stays false and PP is deducted
  twice (once on charge, once on attack).
- **Status:** Fixed.

### HIGH-6: Struggle execution bypassed

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L167-L175).
- **Symptom:** Struggle is not in the movepool. `moveInstance` is
  undefined, and the check at L171 returns miss() — Struggle
  never executes.
- **Status:** Fixed.

### HIGH-7: Drain HP not applied after multi-hit moves

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L314-L332).
- **Symptom:** For multi-hit moves the drain effect path is never
  called. Drain Punch as a multi-hit move would deal damage but
  not heal.
- **Status:** Fixed.

### HIGH-8: HP threshold items checked before recoil applied

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L349-L351).
- **Symptom:** `checkHPThreshold()` (Sitrus Berry etc.) fires before
  the caller applies recoil. Berry could trigger too early.
- **Status:** Fixed.

### HIGH-9: PartnerAI targets dead enemy slot

- **Files:** [frontend/src/battle/core/PartnerAI.ts](frontend/src/battle/core/PartnerAI.ts#L31-L33).
- **Symptom:** When both enemies fainted, `bestTarget` defaults to
  slot 2 and the AI returns a move targeting a dead slot.
- **Status:** Fixed.

### HIGH-10: Rapid double-input during battle animations

- **Files:** [frontend/src/scenes/battle/BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L161-L167).
- **Symptom:** Two rapid A presses before state changes to
  'animating' can queue and the second fires after state returns
  to 'actions'.
- **Status:** Fixed.

### HIGH-11: Battle input listeners active when scene paused

- **Files:** [frontend/src/scenes/battle/BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L161-L167).
- **Symptom:** Keyboard listeners registered in `create()` persist
  when the scene is paused (e.g., PartyScene overlay). Keys fire
  into both scenes.
- **Status:** Fixed.

### HIGH-12: Re-enter PLAYER_TURN after failed run

- **Files:** [frontend/src/scenes/battle/BattleActionMenu.ts](frontend/src/scenes/battle/BattleActionMenu.ts#L73-L90).
- **Symptom:** After a failed run attempt, the state returns to
  'actions' and the player can immediately select RUN again before
  the enemy-only turn completes.
- **Status:** Fixed.

### HIGH-13: Grid-snap drift after tween cancel

- **Files:** [frontend/src/systems/overworld/GridMovement.ts](frontend/src/systems/overworld/GridMovement.ts#L89-L143).
- **Symptom:** If a movement tween is cancelled externally,
  `onComplete` never fires, leaving `tileX/tileY` stale while the
  sprite is mid-tile.
- **Status:** Fixed.

### HIGH-14: CutsceneEngine doesn't block player input

- **Files:** [frontend/src/systems/engine/CutsceneEngine.ts](frontend/src/systems/engine/CutsceneEngine.ts#L67-L85).
- **Symptom:** `play()` runs cutscene actions but never disables
  overworld input. Player can walk or interact during cutscenes.
- **Status:** Fixed.

### HIGH-15: WeatherRenderer texture memory leak on resize

- **Files:** [frontend/src/systems/rendering/WeatherRenderer.ts](frontend/src/systems/rendering/WeatherRenderer.ts#L40-L51).
- **Symptom:** Rapid resize events create textures faster than they
  are destroyed. `textureKeys` array not cleared before recreating.
- **Status:** Fixed.

### HIGH-16: LightingSystem resize handler never unregistered

- **Files:** [frontend/src/systems/rendering/LightingSystem.ts](frontend/src/systems/rendering/LightingSystem.ts#L56-L88).
- **Symptom:** Resize handler outlives the scene. On scene re-entry,
  old handler runs alongside new one.
- **Status:** Fixed.

### HIGH-17: GlowEmitterSystem not cleaned on scene shutdown

- **Files:** [frontend/src/systems/rendering/GlowEmitterSystem.ts](frontend/src/systems/rendering/GlowEmitterSystem.ts#L45-L186).
- **Symptom:** `destroy()` not called automatically on scene shutdown.
  Re-entering scene creates duplicate emitters.
- **Status:** Fixed.

### HIGH-18: All Math.random calls unseeded (14 gameplay sites)

- **Files:** AIController, DamageCalculator, CatchCalculator,
  BattleManager, EncounterSystem, BattleTurnRunner, math-helpers.
- **Symptom:** Every gameplay-affecting RNG call uses raw
  `Math.random()`. Tests seed it via `beforeEach` but the production
  code is non-deterministic for replays.
- **Status:** Fixed — wrap all calls through a seeded RNG utility.

### HIGH-19: Warp into NPC-occupied tile

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L243-L269).
- **Symptom:** NPC spawn happens after player is placed. If an NPC
  spawns at the player's warp destination, they overlap.
- **Status:** Fixed.

### HIGH-20: No visibility change handling — battle advances while tab hidden

- **Files:** [frontend/src/scenes/battle/BattleScene.ts](frontend/src/scenes/battle/BattleScene.ts).
- **Symptom:** No `visibilitychange` listener. Phaser continues
  updating when tab is hidden; battle FSM can advance turns.
- **Status:** Fixed.

### HIGH-21: Mute state not persisted / restored on reload

- **Files:** [frontend/src/managers/AudioManager.ts](frontend/src/managers/AudioManager.ts#L436-L444).
- **Symptom:** `muted` flag initializes as `false`. Volume slider
  and mute toggle desync after page reload.
- **Status:** Fixed.

### HIGH-22: No inventory capacity limits

- **Files:** [frontend/src/managers/PlayerStateManager.ts](frontend/src/managers/PlayerStateManager.ts#L114-L118).
- **Symptom:** `addItem()` always succeeds. Items accumulate
  without limit; item-ball pickups never fail.
- **Status:** Fixed.

### MED-1: Sleep counter not reset on switch

- **Files:** [frontend/src/battle/effects/StatusEffectHandler.ts](frontend/src/battle/effects/StatusEffectHandler.ts#L147-L159).
- **Symptom:** Sleep counter decrements each turn via `pokemon.statusTurns--`,
  but `clearPokemon()` deletes the volatile state without resetting
  `statusTurns`. On switch-in `initPokemon()` never re-initializes it.
- **Status:** Fixed.

### MED-2: Weather duration bonus not applied from abilities

- **Files:** [frontend/src/battle/effects/AbilityHandler.ts](frontend/src/battle/effects/AbilityHandler.ts#L40-L55),
  [frontend/src/battle/effects/HeldItemHandler.ts](frontend/src/battle/effects/HeldItemHandler.ts#L274-L287),
  [frontend/src/battle/effects/WeatherManager.ts](frontend/src/battle/effects/WeatherManager.ts).
- **Symptom:** When an ability like Drizzle triggers weather on switch-in,
  `onSwitchIn()` returns the weather type but not the duration. The caller
  must separately fetch held-item bonuses (Heat Rock, Damp Rock, etc.)
  and pass `5 + bonus` as duration. The interface doesn't enforce this,
  so weather always lasts exactly 5 turns regardless of held item.
- **Status:** Fixed.

### MED-3: Protect rate reset before move validation

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L106-L109).
- **Symptom:** `statusHandler.resetProtectRate(attacker)` is called for all
  non-protect moves before the accuracy check. If the move misses, the
  protect rate is still reset, breaking the consecutive-protect penalty.
- **Status:** Fixed.

### MED-4: Life Orb recoil triggers on Substitute (0 damage)

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L337-L386).
- **Symptom:** Life Orb recoil triggers on `damage.damage > 0`. If the
  defender has a Substitute and the move hits the Substitute for 0 actual
  HP damage but `damage.damage > 0`, Life Orb recoil still applies.
- **Status:** Fixed.

### MED-5: Drain healing applied to fainted attacker

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L337-L386).
- **Symptom:** If the attacker faints from contact-ability recoil during
  move execution, drain healing is still applied because there is no
  `attacker.currentHp > 0` check before the drain logic.
- **Status:** Fixed.

### MED-6: NaN score propagation in AI scoring

- **Files:** [frontend/src/battle/core/AIController.ts](frontend/src/battle/core/AIController.ts#L53).
- **Symptom:** If `getCombinedEffectiveness()` returns `undefined` or `NaN`,
  the score calculation produces `NaN`. `NaN > bestScore` is always false,
  so the AI silently falls back to the first available move instead of
  making a meaningful choice.
- **Status:** Fixed.

### MED-7: Faint mid-execute when both faint same hit (double battle)

- **Files:** [frontend/src/battle/core/DoubleBattleManager.ts](frontend/src/battle/core/DoubleBattleManager.ts#L225-L227).
- **Symptom:** In the move execution loop, if Pokémon A faints Pokémon B
  and A also faints from recoil on the same hit, the faint detection
  during move execution (not before turn order) can lead to incorrect
  turn-order violations.
- **Status:** Fixed.

### MED-8: Listener leak in BattleCatchHandler nickname prompt

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts#L306-L333).
- **Symptom:** If the scene shuts down while NicknameScene is open, the
  `shutdown` event fires and calls `cleanup()`, but the NicknameScene's
  events are still bound. When NicknameScene later completes, its
  `onComplete()` callback fires against the destroyed parent scene.
- **Status:** Fixed.

### MED-9: Encounter check after warp without return guard

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L745).
- **Symptom:** After `doWarp()` is called, execution may continue past the
  warp check to the encounter check code. A `return` statement at L746
  exists but the pattern is fragile — wild encounters could fire on a warp
  tile in the old scene before restart.
- **Status:** Fixed.

### MED-10: Multiple fishing DialogueScene launches without guard

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts#L956-L969).
- **Symptom:** `tryFishing()` launches a DialogueScene without checking if
  one is already active. Rapid confirm presses can queue multiple
  DialogueScene launches.
- **Status:** Fixed.

### MED-11: indicatorTween leak in DialogueScene choices

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L191-L198).
- **Symptom:** `indicatorTween` is created with infinite repeat but is never
  stopped when choices are shown. `cleanupChoices()` doesn't stop the tween,
  causing a resource leak.
- **Status:** Fixed.

### MED-12: mobileTapMenu listeners not cleaned on external shutdown

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L412-L417).
- **Symptom:** `mobileTapMenu` is only cleaned up in `cleanupChoices()`. If the
  scene shuts down externally, `shutdown()` doesn't call `cleanupChoices()`,
  leaving the MobileTapMenu and its event listeners dangling.
- **Status:** Fixed.

### MED-13: layoutOn callback not cleaned in DialogueScene

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L224-L267).
- **Symptom:** `layoutOn(this, ...)` registers a window resize listener that is
  never explicitly removed when the scene shuts down. If the scene is paused
  and resumed, the callback can fire multiple times.
- **Status:** Fixed.

### MED-14: Trainer walks through NPCs during approach

- **Files:** [frontend/src/entities/Trainer.ts](frontend/src/entities/Trainer.ts#L80-L133).
- **Symptom:** `walkToward()` tweens the trainer in a straight line toward the
  player without per-step collision checks. If another NPC blocks the path,
  the trainer sprite visually overlaps it.
- **Status:** Fixed.

### MED-15: Trainer LoS through transparent tiles

- **Files:** [frontend/src/entities/Trainer.ts](frontend/src/entities/Trainer.ts#L36-L77).
- **Symptom:** `isInLineOfSight()` checks only `SOLID_TILES` along the line.
  Tall grass, dark grass, and non-solid objects do not block LoS.
  May be intentional (matches some mainline Pokémon games).
- **Status:** Fixed — design decision needed.

### MED-16: Boulder redraw skipped on tween cancel

- **Files:** [frontend/src/scenes/overworld/OverworldFieldAbilities.ts](frontend/src/scenes/overworld/OverworldFieldAbilities.ts#L108-L128).
- **Symptom:** `pushBoulder()` updates map data immediately but redraws tiles
  in the tween's `onComplete`. If the scene is destroyed or the tween is
  cancelled, tile sprites show the old state while map data reflects the
  new state.
- **Status:** Fixed.

### MED-17: ParseMap Unicode chars may misalign grid

- **Files:** [frontend/src/data/maps/map-parser.ts](frontend/src/data/maps/map-parser.ts#L122-L124).
- **Symptom:** `parseMap()` uses `[...row].map()` to spread string into
  characters. Multi-byte Unicode tile characters (e.g., `Ø`, `µ`, `Þ`)
  should be handled correctly by the spread operator, but edge cases with
  combining marks or surrogate pairs could cause misalignment.
- **Status:** Fixed.

### MED-18: GridMovement mapWidth defaults to Infinity

- **Files:** [frontend/src/systems/overworld/GridMovement.ts](frontend/src/systems/overworld/GridMovement.ts#L79-L82).
- **Symptom:** `mapWidth` defaults to `Infinity`. If `setMapBounds()` is not
  called, the boundary check is always false and the player can walk off
  the edge of the map into undefined territory.
- **Status:** Fixed.

### MED-19: CutsceneEngine save not blocked

- **Files:** [frontend/src/systems/engine/CutsceneEngine.ts](frontend/src/systems/engine/CutsceneEngine.ts#L67-L85).
- **Symptom:** No mechanism prevents save/load during cutscene playback.
  Player can save mid-dialogue or mid-fade, creating save states with
  partial cutscene progress.
- **Status:** Fixed.

### MED-20: FollowerPokemon tween on destroyed scene

- **Files:** [frontend/src/entities/FollowerPokemon.ts](frontend/src/entities/FollowerPokemon.ts#L34-L59).
- **Symptom:** `moveTo()` calls `this.scene.tweens.add()` but `this.scene`
  could be destroyed between the method call and the tween callback. If
  the scene destroys mid-tween, the callback accesses a destroyed context.
- **Status:** Fixed.

### MED-21: Save during battle has no runtime guard

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts).
- **Symptom:** BattleScene doesn't expose a menu, so the player can't
  normally open save during battle. However, `SaveManager.save()` has no
  check for battle-active state — if the menu were ever accessible, save
  would capture mid-battle state.
- **Status:** Fixed.

### MED-22: Save during cutscene not blocked

- **Files:** [frontend/src/scenes/menu/MenuScene.ts](frontend/src/scenes/menu/MenuScene.ts),
  [frontend/src/systems/engine/CutsceneEngine.ts](frontend/src/systems/engine/CutsceneEngine.ts).
- **Symptom:** OverworldScene blocks most input during cutscenes, but
  does not prevent the menu from being opened. MenuScene has no check for
  `CutsceneEngine.isRunning()`.
- **Status:** Fixed.

### MED-23: AudioManager BGM duplicated on fade-out + playBGM

- **Files:** [frontend/src/managers/AudioManager.ts](frontend/src/managers/AudioManager.ts).
- **Symptom:** If `playBGM()` is called while a previous BGM is fading out,
  a new BGM instance starts overlapping the old one.
- **Status:** Fixed.

### MED-24: Mute state not persisted / restored on reload

- **Files:** [frontend/src/managers/AudioManager.ts](frontend/src/managers/AudioManager.ts#L436-L444).
- **Symptom:** `muted` flag initializes as `false` unconditionally. Volume
  slider and mute toggle desync after page reload.
- **Status:** Fixed.

### MED-25: Save quota error silent to user

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts#L31-L35).
- **Symptom:** `localStorage.setItem` is wrapped in try/catch, but the catch
  only calls `console.error()`. Player sees no UI feedback and may think
  save succeeded.
- **Status:** Fixed.

### MED-26: InventoryScene keyboard handler leaks on reopen

- **Files:** [frontend/src/scenes/menu/InventoryScene.ts](frontend/src/scenes/menu/InventoryScene.ts#L509-L522).
- **Symptom:** `openTargetPicker` registers keyboard handlers scoped to the
  function. If the player closes the picker and re-opens it, new handlers
  are created but old ones are never removed.
- **Status:** Fixed.

### MED-27: TouchControls resize listener not removed on destroy

- **Files:** [frontend/src/ui/controls/TouchControls.ts](frontend/src/ui/controls/TouchControls.ts#L730-L741).
- **Symptom:** `destroy()` removes canvas event listeners but never removes
  the `resize` event listener registered earlier. This listener persists
  and references the destroyed scene.
- **Status:** Fixed.

### MED-28: VirtualJoystick duplicate event listeners

- **Files:** [frontend/src/ui/controls/VirtualJoystick.ts](frontend/src/ui/controls/VirtualJoystick.ts#L225-L242).
- **Symptom:** Event listeners are added directly to the canvas, then the
  same handlers are stored in `boundHandlers`. If VirtualJoystick is created
  multiple times without proper cleanup, handlers accumulate.
- **Status:** Fixed.

### MED-29: MenuController keyboard handlers leak on scene restart

- **Files:** [frontend/src/ui/controls/MenuController.ts](frontend/src/ui/controls/MenuController.ts#L180-L194).
- **Symptom:** `destroy()` removes keyboard listeners, but if a scene
  restarts before `destroy()` is called, both old and new handler sets
  remain attached.
- **Status:** Fixed.

### MED-30: ScrollContainer decay timer leak on scene shutdown

- **Files:** [frontend/src/ui/widgets/ScrollContainer.ts](frontend/src/ui/widgets/ScrollContainer.ts#L126-L129).
- **Symptom:** `destroy()` calls `this.decayTimer?.destroy()`, but if the
  scene is stopped before `destroy()` is called, the timer continues and
  references the destroyed zone.
- **Status:** Fixed.

### MED-31: PokedexScene cry timer leak

- **Files:** [frontend/src/scenes/menu/PokedexScene.ts](frontend/src/scenes/menu/PokedexScene.ts#L268-L275).
- **Symptom:** In `showDetail()`, a `cryTimer` is created but if the player
  navigates away before it fires, or if the scene is stopped, the timer
  is not cleaned up in a shutdown handler.
- **Status:** Fixed.

### MED-32: TouchControls updateDOMLayout re-entrancy

- **Files:** [frontend/src/ui/controls/TouchControls.ts](frontend/src/ui/controls/TouchControls.ts#L323-L360).
- **Symptom:** `updateDOMLayout()` sets `updatingLayout = true` and returns
  early on re-entry. If a resize event fires during layout (e.g., during
  tweens), the blocked call leaves the UI in an inconsistent state.
- **Status:** Fixed.

### MED-33: Save schema boxNames mismatch

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts#L51).
- **Symptom:** `PartyManager.serialize()` writes `boxNames` to the save
  payload, but `boxNames` is not defined in the `SaveData` interface.
  The field is written but has no type-safe read path.
- **Status:** Fixed.

### MED-34: PreloadScene non-null assertions on optional fields

- **Files:** [frontend/src/scenes/boot/PreloadScene.ts](frontend/src/scenes/boot/PreloadScene.ts#L106-L118).
- **Symptom:** Non-null assertions (`!`) on optional `asset.path`,
  `asset.texture`, `asset.atlas`, `asset.frameWidth`, `asset.frameHeight`.
  If any are undefined at runtime, calls crash.
- **Status:** Fixed.

### MED-35: TilemapBuilder layer creation assertions

- **Files:** [frontend/src/systems/rendering/TilemapBuilder.ts](frontend/src/systems/rendering/TilemapBuilder.ts#L79-L90).
- **Symptom:** Non-null assertions on `addTilesetImage()` and three
  `createBlankLayer()` calls. If layer creation fails, code crashes
  instead of handling gracefully.
- **Status:** Fixed.

### MED-36: TransitionManager double-transition race

- **Files:** [frontend/src/managers/TransitionManager.ts](frontend/src/managers/TransitionManager.ts).
- **Symptom:** Rapid scene changes can trigger two overlapping fade
  transitions. No guard prevents a second `fadeTransition()` call while
  one is in progress.
- **Status:** Fixed.

### MED-37: EventManager listeners not auto-cleared between sessions

- **Files:** [frontend/src/managers/EventManager.ts](frontend/src/managers/EventManager.ts#L18-L19).
- **Symptom:** `listeners` and `taggedListeners` Maps carry state across
  sessions. `clear()` exists but must be called manually; it's not invoked
  automatically during `GameManager.reset()`.
- **Status:** Fixed.

### MED-38: Spread move damage reduction applied after faint check (double battle)

- **Files:** [frontend/src/battle/core/DoubleBattleManager.ts](frontend/src/battle/core/DoubleBattleManager.ts#L268-L276).
- **Symptom:** Spread-move 75% damage reduction is applied AFTER the move
  executes and damage is dealt. If the defender fainted from the full damage
  before reduction, the logic momentarily creates an incorrect state.
- **Status:** Fixed.

### MED-39: Haze stat reset scope incorrect

- **Files:** [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts#L360-L363).
- **Symptom:** `statusHandler.resetAllStages()` is called unconditionally
  on Haze, potentially resetting stats for all Pokémon rather than
  correctly scoping to the appropriate sides.
- **Status:** Fixed.

### MED-40: GameManager.addItem allows negative quantities

- **Files:** [frontend/src/managers/GameManager.ts](frontend/src/managers/GameManager.ts).
- **Symptom:** `addItem()` does not validate that the quantity is positive.
  Passing a negative value decrements the item count directly.
- **Status:** Fixed.

### MED-41: GameManager.party returned by reference

- **Files:** [frontend/src/managers/GameManager.ts](frontend/src/managers/GameManager.ts).
- **Symptom:** `getParty()` returns the internal party array by reference.
  External code can mutate the array (push, splice, reorder) without going
  through the manager's API.
- **Status:** Fixed.

### MED-42: SaveManager import overwrites without validation

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts).
- **Symptom:** `importSave()` writes imported data to localStorage without
  validating the schema against `SaveData`. Corrupt or malicious imports
  can break the save slot.
- **Status:** Fixed.

### MED-43: SaveManager migration drops unknown fields

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts).
- **Symptom:** Version migration silently drops fields not recognized by the
  current schema. Downgrading or forward-compatible saves lose data.
- **Status:** Fixed.

### MED-44: PartyManager swapPartyMembers no bounds check

- **Files:** [frontend/src/managers/PartyManager.ts](frontend/src/managers/PartyManager.ts).
- **Symptom:** `swapPartyMembers()` does not validate that both indices are
  within `[0, party.length)`. Out-of-bounds indices cause undefined writes.
- **Status:** Fixed.

### MED-45: QuestManager flag set order dependent

- **Files:** [frontend/src/managers/QuestManager.ts](frontend/src/managers/QuestManager.ts).
- **Symptom:** Quest completion checks depend on flag-set order. If two
  flags are set in the wrong order within the same frame, completion
  detection can be missed.
- **Status:** Fixed.

### MED-46: AchievementManager toast fires even if already unlocked

- **Files:** [frontend/src/managers/AchievementManager.ts](frontend/src/managers/AchievementManager.ts).
- **Symptom:** `unlock()` returns `false` for already-unlocked achievements,
  but callers may still trigger the toast notification without checking the
  return value.
- **Status:** Fixed.

### MED-47: AudioManager BGM duplicated if playBGM during fade-out

- **Files:** [frontend/src/managers/AudioManager.ts](frontend/src/managers/AudioManager.ts).
- **Symptom:** Calling `playBGM()` while a previous track is mid-fade creates
  overlapping audio. The old track continues fading while the new one starts.
- **Status:** Fixed.

### MED-48: Achievements type mismatch in save (unknown vs string[])

- **Files:** [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts#L29),
  [frontend/src/data/interfaces.ts](frontend/src/data/interfaces.ts).
- **Symptom:** `SaveData.achievements` is typed as `unknown`, but
  `SaveManager.load()` casts it as `string[]` without validation.
- **Status:** Fixed.

### MED-49: ProgressManager / AchievementManager Set serialization relies on explicit conversion

- **Files:** [frontend/src/managers/ProgressManager.ts](frontend/src/managers/ProgressManager.ts),
  [frontend/src/managers/AchievementManager.ts](frontend/src/managers/AchievementManager.ts).
- **Symptom:** Pokedex `seen`/`caught` and `unlocked` use `Set` objects.
  These are properly converted in `serialize()` but would fail if any
  code path passes them directly to `JSON.stringify`.
- **Status:** Fixed.

### MED-50: Floating-point comparisons in encounter/catch/damage (5 sites)

- **Files:** EncounterSystem, CatchCalculator, DamageCalculator, BattleTurnRunner.
- **Symptom:** Direct `Math.random()` comparisons with float thresholds
  (encounter rate, fishing rate, shake probability, accuracy, speed tie).
  Subject to floating-point precision edge cases.
- **Status:** Fixed.

### LOW-1: Recoil KO announcement order reversed

- **Files:** [frontend/src/scenes/battle/BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L532-L580).
- **Symptom:** When both Pokémon faint on the same hit (recoil KO),
  the defender's faint message appears before the attacker's.
  Functionally correct but cosmetically reversed.
- **Status:** Fixed.

### LOW-2: Outrage not implemented as multi-turn move

- **Files:** [frontend/src/data/moves/dragon.ts](frontend/src/data/moves/dragon.ts).
- **Symptom:** Outrage is defined as a simple 120-power attack with no
  multi-turn locking effect. The edge case of interruption by faint
  cannot manifest. Missing feature, not a bug in existing code.
- **Status:** Fixed — implement multi-turn lock if desired.

### LOW-3: Freeze thaw probability + fire-move thaw ordering

- **Files:** [frontend/src/battle/effects/StatusEffectHandler.ts](frontend/src/battle/effects/StatusEffectHandler.ts#L228-L235).
- **Symptom:** `checkThaw()` (fire-move 100% thaw) and `checkTurnStart()`
  (20% random thaw) are called separately. If called out of order, a fire
  move could lose its guaranteed thaw to the RNG check firing first.
  Ordering depends on caller.
- **Status:** Fixed.

### LOW-4: Ability / item suppress not distinguished

- **Files:** [frontend/src/battle/effects/AbilityHandler.ts](frontend/src/battle/effects/AbilityHandler.ts#L12-L16),
  [frontend/src/battle/effects/HeldItemHandler.ts](frontend/src/battle/effects/HeldItemHandler.ts#L12-L15).
- **Symptom:** No concept of "suppressed" abilities or items (e.g.,
  Neutralizing Gas, Gastro Acid). Missing feature.
- **Status:** Fixed — implement if suppress mechanics are added.

### LOW-5: Graphics destroy leak in ball throw animation

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts#L78-L92).
- **Symptom:** `ballGfx` and `ballHighlight` are created but only destroyed
  in the tween's `onComplete`. If the scene shuts down mid-tween, the
  graphics objects leak.
- **Status:** Fixed.

### LOW-6: Faint animation not awaited before next turn

- **Files:** [frontend/src/scenes/battle/BattleUIScene.ts](frontend/src/scenes/battle/BattleUIScene.ts#L546-L559).
- **Symptom:** `faintSprite()` triggers an 800ms tween that is not awaited.
  The faint animation and the next-turn message may overlap.
- **Status:** Fixed.

### LOW-7: BAG throw timing vs intro tween visual mismatch

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts#L62-L69).
- **Symptom:** If the player opens BAG and throws a ball before the
  enemy's intro slide-in tween completes, `killTweensOf` stops the
  sprite mid-animation. The throw target uses the interrupted position.
- **Status:** Fixed.

### LOW-8: BattleBagHandler ballUsed flag race condition

- **Files:** [frontend/src/scenes/battle/BattleBagHandler.ts](frontend/src/scenes/battle/BattleBagHandler.ts#L25-L43).
- **Symptom:** `ballUsed` flag set in a listener could race with the
  shutdown listener if both fire in the same frame.
- **Status:** Fixed.

### LOW-9: Page advance during typewriter text reveal

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L357-L373).
- **Symptom:** Pressing advance while characters are being revealed can
  make text appear to skip or stutter — the advance indicator appears
  before the previous page's typewriter completes.
- **Status:** Fixed.

### LOW-10: DialogueScene shutdown binding in create()

- **Files:** [frontend/src/scenes/overworld/DialogueScene.ts](frontend/src/scenes/overworld/DialogueScene.ts#L269-L271).
- **Symptom:** Shutdown handler registered with `events.once('shutdown', ...)`
  in `create()`. If `create()` runs multiple times without shutdown between,
  duplicate bindings accumulate.
- **Status:** Fixed.

### LOW-11: Trainer mapGround null-check race condition

- **Files:** [frontend/src/entities/Trainer.ts](frontend/src/entities/Trainer.ts#L60-L74).
- **Symptom:** LoS check uses OR logic: if `mapGround` is null and
  `npcOccupiedTiles` is null, collision validation is skipped entirely.
  Unlikely in normal flow (mapGround is assigned immediately after spawn).
- **Status:** Fixed.

### LOW-12: ParseMap defaults unknown chars to GRASS silently

- **Files:** [frontend/src/data/maps/map-parser.ts](frontend/src/data/maps/map-parser.ts#L122-L124).
- **Symptom:** `CHAR_TO_TILE[ch] ?? Tile.GRASS` defaults to GRASS for
  unknown characters. Typos in map grids silently create walkable passages
  through intended walls.
- **Status:** Fixed.

### LOW-13: TilemapBuilder no bounds validation

- **Files:** [frontend/src/systems/rendering/TilemapBuilder.ts](frontend/src/systems/rendering/TilemapBuilder.ts#L103-L159).
- **Symptom:** `buildTilemap()` never validates that `ground.length === mapH`
  or `ground[y].length === mapW`. Truncated map data creates sparse layers.
- **Status:** Fixed.

### LOW-14: CutsceneEngine parallel actions party mutation race

- **Files:** [frontend/src/systems/engine/CutsceneEngine.ts](frontend/src/systems/engine/CutsceneEngine.ts#L255-L257).
- **Symptom:** `execParallel()` awaits `Promise.all()`. If one action sets
  a flag that triggers a battle while other parallel actions are running,
  party state becomes inconsistent.
- **Status:** Fixed.

### LOW-15: FollowerPokemon tween leak

- **Files:** [frontend/src/entities/FollowerPokemon.ts](frontend/src/entities/FollowerPokemon.ts#L34-L59).
- **Symptom:** `moveTo()` creates tweens without storing references. If
  `hideFollower()` is called mid-tween, the tween continues running
  on a hidden sprite.
- **Status:** Fixed.

### LOW-16: EmoteBubble target destroyed mid-tween

- **Files:** [frontend/src/systems/rendering/EmoteBubble.ts](frontend/src/systems/rendering/EmoteBubble.ts#L24-L76).
- **Symptom:** Emote text is positioned at `target.x/y` but no check
  validates that the target sprite still exists. If destroyed between
  `show()` and tween completion, the text orphans.
- **Status:** Fixed.

### LOW-17: LightingSystem renderTexture race on resize

- **Files:** [frontend/src/systems/rendering/LightingSystem.ts](frontend/src/systems/rendering/LightingSystem.ts#L71-L83).
- **Symptom:** Resize handler destroys and recreates `this.rt`. If other
  code accesses `this.rt` during the frame between destroy and reassignment,
  it crashes.
- **Status:** Fixed.

### LOW-18: NPC walk anim facing race

- **Files:** [frontend/src/entities/NPC.ts](frontend/src/entities/NPC.ts#L50-L77).
- **Symptom:** `playWalkAnim()` captures `this.facing` in a closure. If
  `faceDirection()` is called mid-animation, frames are stamped from
  the new direction but the index continues from the old sequence.
- **Status:** Fixed.

### LOW-19: ConfirmBox active flag race condition

- **Files:** [frontend/src/ui/widgets/ConfirmBox.ts](frontend/src/ui/widgets/ConfirmBox.ts#L56-L86).
- **Symptom:** The `active` flag is set to `false` before calling
  `onResult()`. If `onResult()` synchronously interacts with ConfirmBox,
  the flag blocks it.
- **Status:** Fixed.

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
