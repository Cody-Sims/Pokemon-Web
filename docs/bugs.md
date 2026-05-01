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
- **Status:** Partially fixed (2026-04-30 audit) — per-step collision
  check infrastructure was added to `walkToward()` via a `collisionCheck`
  callback, but the callback is not yet wired up by `OverworldScene`.
  Remaining: assign collision callback when spawning trainers.

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
- **Status:** Fixed (2026-04-30 audit) — added `isActive('DialogueScene')`
  guard in `tryFishing()`.

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
- **Status:** Partially fixed (2026-04-30 audit) — `VirtualJoystick`
  now guards against duplicate listeners via `handlersAttached` flag;
  `TouchControls` has layout re-entrancy queue. Remaining: wire
  `InputManager.destroy()` to scene shutdown to prevent per-boot leak.

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
- **Status:** Fixed (2026-04-30 audit) — `SaveManager.save()` now returns
  `boolean`; `MenuScene.saveGame()` checks the return value and shows
  a red "Can't save right now!" banner on failure.

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
| 2026-04-30 | "Fixed — Full-codebase bug audit: all 96 findings"      | Full-codebase deep review (52 shards): 5 critical, 22 high, 50 medium, 19 low across battle, overworld, managers, UI, entities, systems. Seeded PRNG, save blocking, substitute guard, FSM validation, input debounce, visibility-change pause, resource leak cleanup. |
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
