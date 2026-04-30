# Pokemon Web — Bugs Found by Playthrough Audit

> Generated: 2026-04-29
> Method: static code review of the full `frontend/src/` tree, mentally walking
> the player from boot → title → intro → starter → first battles → menus →
> dungeons → switching/catching, plus map data integrity. Severity reflects
> visible player impact.

Legend: 🟥 Critical · 🟧 High · 🟨 Medium · 🟩 Low / Polish · 🎨 Pure visual

> **Status update — 2026-04-29:** A first-pass remediation sweep landed in
> the same day. IDs marked **✅ Fixed** below have been resolved; see the
> 2026-04-29 Changelog entry "Playthrough bug audit pass" for the full list
> of file references.

---

## 🟥 Critical — Game-breaking visual / state bugs

### BUG-001 🟥 Switched-in Pokémon is invisible after a faint  — ✅ Fixed
- **Where:** [BattleSwitchHandler.handleFaintedSwitch](frontend/src/scenes/battle/BattleSwitchHandler.ts#L107-L155),
  [BattleSwitchHandler.promptPartySwitch](frontend/src/scenes/battle/BattleSwitchHandler.ts#L67-L101),
  [BattleScene.faintSprite](frontend/src/scenes/battle/BattleScene.ts#L497-L508).
- **What happens:** `faintSprite()` tweens the player back-sprite to
  `{ scaleY: 0, alpha: 0, y: y + 50 }`. After the player picks the next
  Pokémon, the switch handler only calls `b.playerSprite.setTexture(...)` and
  `updateHpBars()`. It never resets `scaleY`, `alpha`, or `y`, so the
  replacement Pokémon is rendered at scale 0 / alpha 0 — effectively
  invisible — on the spot the previous Pokémon collapsed to. The HP bar and
  name update correctly which makes this even more confusing for the player.
- **Fix:** After `setTexture`, restore the original transform:
  `playerSprite.setScale(originalScaleX, originalScaleY).setAlpha(1).setY(originalY)`,
  ideally via `b.emergeFromBall(b.playerSprite)` which already exists for
  exactly this purpose but is not called from the switch handler.

### BUG-002 🟥 Forced switch ignores the player's choice  — ✅ Fixed
- **Where:** [BattleSwitchHandler.handleFaintedSwitch](frontend/src/scenes/battle/BattleSwitchHandler.ts#L121-L154).
- **What happens:** PartyScene is launched with `{ forcedSwitch: true }` but
  [PartyScene.init](frontend/src/scenes/menu/PartyScene.ts#L24-L26) only reads
  `selectMode`. The unknown flag is silently dropped, so:
  1. The party menu opens in **browse mode**, not select mode — pressing ESC
     dismisses it without picking, even after a black-out scenario.
  2. The handler listens for `'shutdown'` but **never** for
     `'pokemon-selected'`, then computes the new active as
     `gm.getParty().find(p => p.currentHp > 0)` — i.e., the *first* alive
     Pokémon in slot order, regardless of what the player tapped.
- **Fix:** Pass `{ selectMode: true, forcedSwitch: true }`, listen for
  `pokemon-selected`, swap that index to slot 0, and gate the shutdown so the
  scene cannot close without a selection while alive Pokémon remain.

### BUG-003 🟥 Move menu sits underneath the mobile touch controls  — ✅ Fixed
- **Where:** [BattleMoveMenu.openMoveMenu](frontend/src/scenes/battle/BattleMoveMenu.ts#L37-L75).
- **What happens:** The action menu (`BattleUIScene.create`) reserves
  `bottomReserve = 100` for mobile portrait so it clears the joystick + A/B
  DOM overlay. The move menu uses `mh - moveMenuH / 2 - 10` (only 10 px
  reserved). Result: when the player presses FIGHT in mobile portrait, the
  whole 2×2 move grid renders behind the joystick / A-button overlay and
  cannot be tapped without first moving the joystick out of the way. Move
  buttons row 1 are typically completely hidden.
- **Fix:** Mirror the action-menu logic — recompute
  `bottomReserve = isMobile() && isPortrait ? 100 : 10` and place
  `moveMenuY = mh - moveMenuH / 2 - bottomReserve`. The same correction is
  needed for the per-row offset (`mh - 85 + row * moveRowH`) so both rows
  shift together.

### BUG-004 🟥 Double-battle sprites & HP boxes use absolute pixel coords  — ✅ Fixed
- **Where:** [BattleScene.setupDoubleBattle](frontend/src/scenes/battle/BattleScene.ts#L572-L700).
- **What happens:** Player slot 0 is hard-pinned to `(200, 350)`, slot 1 to
  `(350, 370)`, enemy slot 0 to `(500, 140)`, slot 1 to `(650, 120)`. None of
  these scale with the canvas. On any mobile portrait viewport (≈400×800)
  the second enemy at x=650 is **off-screen**, and the second player Pokémon
  at x=350 sits half-out of frame on a 320-px-wide canvas.
- **Fix:** Compute slot positions from `ui(this)` — e.g.,
  `enemy0 = (w*0.55, h*0.25)`, `enemy1 = (w*0.78, h*0.22)`,
  `player0 = (w*0.22, h*0.62)`, `player1 = (w*0.42, h*0.66)`.

---

## 🟧 High — Visible during normal play on common viewports

### BUG-010 🟧 Forced second enemy HP text never populates in double battles  — ✅ Fixed
- **Where:** [BattleScene.setupDoubleBattle](frontend/src/scenes/battle/BattleScene.ts#L676-L686),
  [BattleScene.updateHpBars](frontend/src/scenes/battle/BattleScene.ts#L420-L443).
- **What happens:** Slot-1 enemy HP text is created with `''` ("empty") and
  pushed to `enemyHpTexts`, but `updateHpBars()` only updates
  `playerHpTexts[0]` for the partner — there is no `enemyHpTexts[0].setText(...)`
  branch. The HP text stays blank for the entire battle even as the bar
  visibly drains.

### BUG-011 🟧 Partner / second-enemy HP bars are never resized to match the panel  — ✅ Fixed
- **Where:** [BattleScene.updateHpBars](frontend/src/scenes/battle/BattleScene.ts#L431-L443).
- **What happens:** The partner bar is always animated to `displayWidth: 150 * pPct`
  and the second-enemy bar to `displayWidth: 180 * ePct`, both hard-coded —
  identical to the original full-width bars. If the layout is ever updated
  to scale these bars (already needed for portrait), the fill will overflow
  or under-fill the bg track.

### BUG-012 🟧 EXP bar animates to a 180-px width that doesn't match the panel in portrait  — ✅ Fixed
- **Where:** [BattleScene.animateExpBar](frontend/src/scenes/battle/BattleScene.ts#L519-L525).
- **What happens:** The EXP fill is created at `playerHpBarW` (160 in portrait,
  180 in landscape), but `animateExpBar()` tweens to `displayWidth: 180 * pct`.
  In portrait the EXP fill jumps **20 px wider than its background track** as
  soon as the first hit lands — visible as a fill spilling past the right
  edge of the bar frame.
- **Fix:** Use `this.expBarBg.width * pct` like `updateHpBars()` already does.

### BUG-013 🟧 Enemy trainer slides in to a hard-coded x=`w*0.78` regardless of layout  — ✅ Fixed
- **Where:** [BattleScene.create](frontend/src/scenes/battle/BattleScene.ts#L196-L201).
- **What happens:** Trainer is added at `(w + 100, enemyY - 30)` and tweened
  to `trainerX = round(w*0.78)` with `setScale(8)`. At 8× the trainer sprite
  is enormous (≈256 px wide for a 32 px source). On a 400-px portrait viewport
  with `enemyY = h*0.22 ≈ 176`, the scaled trainer overlaps the enemy info
  box (`enemyInfoY ≈ 0.09*h`) and the enemy Pokémon sprite simultaneously.
  Visually the trainer's arms cover most of the upper third.
- **Fix:** Pick `setScale` based on viewport; cap at ~4× on portrait and pin
  `trainerX` further left/up so the silhouette doesn't crash into the HUD.

### BUG-014 🟧 Pallet Town shows the wrong location name in the HUD  — ✅ Fixed
- **Where:** [pallet-town.ts](frontend/src/data/maps/cities/pallet-town.ts#L33-L37).
- **What happens:** No `displayName` is set, so the HUD falls back to
  `"Pallet Town"`. Yet every in-world reference says **"Littoral Town"**:
  the welcome NPC at [pallet-town.ts#L54](frontend/src/data/maps/cities/pallet-town.ts#L54),
  the pier sign at [pallet-town.ts#L176](frontend/src/data/maps/cities/pallet-town.ts#L176),
  the route sign at [route-1.ts#L137](frontend/src/data/maps/routes/route-1.ts#L137),
  and the home dialogue at [generic-house.ts#L112](frontend/src/data/maps/interiors/generic-house.ts#L112).
  Players see "Pallet Town" in the slide-in banner / HUD strip but every
  conversation calls it Littoral Town.
- **Fix:** Add `displayName: 'Littoral Town'` to the map definition.

### BUG-015 🟧 Tabs & stats columns clip off-canvas in SummaryScene on portrait  — ✅ Fixed
- **Where:** [SummaryScene.create](frontend/src/scenes/menu/SummaryScene.ts#L52-L60),
  [SummaryScene.drawStatsTab](frontend/src/scenes/menu/SummaryScene.ts#L260-L302),
  [SummaryScene.drawInfoTab](frontend/src/scenes/menu/SummaryScene.ts#L138-L170).
- **What happens:** All three issues are pure visual on phones:
  1. Tabs are placed at `120 + i * 240`. On a 400-px portrait canvas the
     **MOVES tab is at x=600** — 200 px past the right edge, completely
     invisible. INFO and STATS partly overlap.
  2. The STATS tab right-most column (`Bar`) starts at `x + 320 = 370` and
     extends another 200 px → ends at 570, way off-screen.
  3. The INFO tab sprite box is centered at `layout.w - 110` (=290) with
     width 120 → spans 230–350; the info-row values render at `x + 180 = 230`
     directly behind the sprite box.
- **Fix:** Add a portrait branch — either single-column layout, dropdown tab
  bar, or distribute tabs evenly using `tabPad + slotW * (i + 0.5)` like
  InventoryScene already does.

### BUG-016 🟧 PokedexScene plays a Pokémon cry every time the cursor moves  — ✅ Fixed
- **Where:** [PokedexScene.showDetail](frontend/src/scenes/menu/PokedexScene.ts#L240).
- **What happens:** `MenuController.onMove → highlightItem → renderList()` and
  `showDetail(idx)` is called on every navigation step. `showDetail` calls
  `AudioManager.getInstance().playCry(id)` unconditionally, so holding ↓ to
  scroll the dex spams cries on top of each other. Annoying audio bug, also
  hammers the procedural cry generator.
- **Fix:** Only play the cry when the user "lands" on a species (e.g., debounce
  by 150 ms, or only fire when `idx` changes after a brief idle).

### BUG-017 🟧 PokedexScene list and detail panel overlap on portrait  — ✅ Fixed
- **Where:** [PokedexScene.create](frontend/src/scenes/menu/PokedexScene.ts#L60),
  [PokedexScene.renderList](frontend/src/scenes/menu/PokedexScene.ts#L140-L165).
- **What happens:** Detail panel is anchored at `layout.w - 155` with width
  270 — spans `(w - 290) → (w - 20)`. List items render at x=18/34/85. On a
  400-px portrait viewport, the panel spans 110–380; a 10-character species
  name at x=85 ends near 175, overlapping the panel's left edge. There is no
  portrait branch in this scene at all.

### BUG-018 🟧 PartyScene HP text overlaps the HP bar in portrait  — ✅ Already addressed (current code uses proportional layout)
- **Where:** [PartyScene.create](frontend/src/scenes/menu/PartyScene.ts#L70-L100).
- **What happens:** HP bar is drawn at `layout.w * 0.33` with width 170,
  ending at `0.33*w + 170`. The HP text renders at `0.56*w`. On a 400-wide
  portrait viewport: bar 132 → 302, text at 224 — directly inside the bar's
  fill region. Type badges at `0.33*w + ti*72` (132 / 204) overlap both the
  HP bar and the text.

### BUG-019 🟧 Lighting RT resize listener leaks every time darkness is enabled  — ✅ Fixed
- **Where:** [LightingSystem.enableDarkness](frontend/src/systems/rendering/LightingSystem.ts#L60-L73).
- **What happens:** Every call to `enableDarkness()` registers a fresh
  `this.scene.scale.on('resize', ...)` callback that destroys + recreates the
  RT. The previous listener is never removed. Re-entering a dark map a few
  times accumulates N copies; on a single resize event each copy fires,
  destroying-and-recreating the RT N times. After the first iteration the
  remaining listeners reference a stale/destroyed RT and trigger
  `cannot read properties of null (destroy)` warnings, sometimes leaving a
  permanently black screen until the scene restarts.
- **Fix:** Register the resize handler once in the constructor, or store the
  listener reference and `scene.scale.off('resize', stored)` before adding
  another.

### BUG-020 🟧 Stale catch-ball "highlight" graphic stays on screen forever  — ✅ Fixed
- **Where:** [BattleCatchHandler.handlePokeBallUse](frontend/src/scenes/battle/BattleCatchHandler.ts#L60).
- **What happens:** `ctx.scene.add.circle(200, 400, 4, 0xffffff).setDepth(101)`
  creates a small white "highlight" companion to the throwable ball (`ballGfx`),
  but it is never assigned to a variable, never tweened, and never destroyed.
  After the catch sequence completes the bright pixel sticks at the
  hard-coded canvas coordinate (200, 400) for the rest of the battle, and
  every subsequent ball throw piles another orphaned dot on top.
- **Fix:** Capture the highlight, parent it to the tween, and `.destroy()`
  in the same `onComplete` that destroys `ballGfx`.

### BUG-021 🟧 Catch ball spawns at hard-coded (200, 400) instead of player sprite  — ✅ Fixed
- **Where:** Same line as BUG-020 plus the surrounding `ballGfx` initial
  position. On portrait mobile the player sprite is at roughly
  `(w*0.25, h*0.5) ≈ (100, 400)`, on landscape ≈ `(200, 460)`. The throw
  visibly originates **above** the actual player Pokémon, breaking the
  illusion that the player threw the ball.
- **Fix:** Use `b.playerSprite.x, b.playerSprite.y` as the start coords.

---

## 🟨 Medium — Player will notice on careful play / certain devices

### BUG-030 🟨 Pokémon Center HUD names are generic in two cities  — ✅ Fixed
- **Where:** [viridian-pokecenter.ts#L22](frontend/src/data/maps/interiors/viridian-pokecenter.ts#L22),
  [pewter-pokecenter.ts#L22](frontend/src/data/maps/interiors/pewter-pokecenter.ts#L22).
- **What happens:** `displayName: 'Pokémon Center'` (no city prefix) in both,
  so the HUD strip and slide-in banner cannot distinguish the two when
  warping. Every other city's Pokémon Center / Mart correctly prefixes the
  city name.
- **Fix:** `displayName: 'Viridian City Pokémon Center'` and
  `'Pewter City Pokémon Center'`.

### BUG-031 🟨 Floating-point depths sort player above NPCs at the same Y  — ✅ Fixed
- **Where:** [OverworldScene.update](frontend/src/scenes/overworld/OverworldScene.ts#L1006-L1019).
- **What happens:** Depths are computed as `1 + (y / mapPixelH) * 0.9`, then
  the same loop runs for player → npcs → trainers → mapObjects. When player
  and an NPC share a Y row, both get identical depths but the NPCs are
  added later, so the NPC always renders **on top of the player**. This is
  visible whenever the player walks behind an NPC counter or stands on the
  same row as a Trainer.
- **Fix:** Add a tiny per-class delta (e.g., player +0.001) or sort by
  `y * 1000 + entityType` once per frame.

### BUG-032 🟨 Follower Pokémon never gets a depth update from the y-sort loop  — ✅ Fixed
- **Where:** Same `update()` block — player/npcs/trainers/objects iterate, the
  follower (`this.follower`) is **omitted** entirely.
  [FollowerPokemon](frontend/src/entities/FollowerPokemon.ts) sets `setDepth(this.y)`
  inside its tween, but only while moving. Standing still it keeps its last
  in-tween depth which can be many tiles stale.
- **Effect:** Follower renders in front of trees / ledges / NPCs that should
  occlude it, especially after the player stops on a row above the follower.

### BUG-033 🟨 Follower icon scaled to ~2× tile size, semi-transparent forever  — ✅ Fixed
- **Where:** [FollowerPokemon.constructor](frontend/src/entities/FollowerPokemon.ts#L20-L24).
- **What happens:** `(TILE_SIZE / 56) * 1.6` → ~0.46 scale on a 68×56 icon =
  ~31×26 px rendered, **double** the 16-px tile grid. `setAlpha(0.92)` is
  also permanent, so the follower looks ghostly/hovering and visibly larger
  than the player sprite (which is 16×16 at 2× = 32 px). Combined with the
  Pokémon icon being a static front-facing image, the trailing follower
  looks like a translucent decal sliding behind the player.

### BUG-034 🟨 Long stat dump won't fit in the level-up message bar  — ✅ Fixed
- **Where:** [BattleVictorySequence.runLevelUpSequence](frontend/src/scenes/battle/BattleVictorySequence.ts#L82-L84).
- **What happens:** `HP: 100 | ATK: 95 | DEF: 90 | SpA: 100 | SpD: 95 | SPD: 90`
  is concatenated into a single 60–80 char message and pushed into
  `messageText` which has no `wordWrap`. On portrait viewports the right
  half of the line gets clipped against the right edge of the message box.
- **Fix:** Show two lines (`HP/ATK/DEF` then `SpA/SpD/SPD`) or use a small
  table widget like SummaryScene STATS does.

### BUG-035 🟨 Synthesis aura is created on the **already-tweened** sprite y
- **Where:** [BattleScene.showSynthesisAura](frontend/src/scenes/battle/BattleScene.ts#L530-L540).
- **What happens:** The aura captures `playerSprite.y` once at creation. The
  player sprite is in slide-in tween at this point during boss intro
  (synthesis can fire on turn 1). The aura locks to whatever Y the sprite
  has at the moment of activation, but the sprite continues to bob/animate
  during damage flashes (BattleScene `flashSprite` doesn't move y, but
  faintSprite, switch-in tweens do). After a switch the aura is left behind
  hovering over the previous slot.
- **Fix:** Parent the aura to the sprite (e.g., update its position each
  frame in `update()`), or destroy and re-create on switch.

### BUG-036 🟨 Pokédex shows "Caught" for the species but no caught-form sprite  — ✅ Fixed (request-id guard)
- **Where:** [PokedexScene.showDetail](frontend/src/scenes/menu/PokedexScene.ts#L222-L240).
- **What happens:** When a sprite isn't preloaded, the scene starts a runtime
  `this.load.image(...)` and adds the sprite on `complete`. But it does not
  guard against the user navigating away before the load resolves: the
  callback adds an image to `this.detailGroup` without checking whether
  `this.detailGroup` was already cleared for a later species. Result: a
  "ghost" sprite from a previously hovered species pops in over the current
  detail panel.
- **Fix:** Capture the cursor index at issue time and only add if it still
  matches.

### BUG-037 🟨 Inventory empty-list message hardcoded at x=200 (off-center on portrait)  — ✅ Fixed
- **Where:** [InventoryScene.refreshItemList](frontend/src/scenes/menu/InventoryScene.ts#L211-L216).
- **What happens:** `this.add.text(200, layout.cy, 'No items', ...)` ignores
  `layout.cx`. On any portrait viewport where `cx ≈ 200` it happens to look
  centered; on landscape (`cx ≈ 400+`) it sits noticeably left of center,
  inconsistent with every other "empty" state in the project.

### BUG-038 🟨 Inventory action panel hardcoded at x=200  — ✅ Fixed
- **Where:** [InventoryScene.openActionMenu](frontend/src/scenes/menu/InventoryScene.ts#L355-L362).
- **What happens:** `this.actionPanel = new NinePatchPanel(this, 200, layout.cy, 140, ...)`
  — same hard-coded 200 px x. On wide landscape canvases the popup floats in
  the left third of the screen while the focused item is on the right. The
  same hardcoded x is used for the action labels.

### BUG-039 🟨 Speaker name panel can extend off-canvas with long names  — ✅ Fixed
- **Where:** [DialogueScene.create](frontend/src/scenes/overworld/DialogueScene.ts#L141-L145).
- **What happens:** `speakerW = max(100, speaker.length * 10 + 24)` and the
  panel is anchored at `speakerX = 20 + speakerW / 2`, growing rightward.
  Names like `Tower Tycoon Maestro` (20 chars → 224 px) push the panel
  past 244 px, into or past the dialogue text on a 400-px portrait viewport
  and overlap the portrait sprite when both are present.
- **Fix:** Clamp `speakerW = min(speakerW, layout.w * 0.6)` and use
  `wordWrap` on the speaker text.

### BUG-040 🟨 Dialogue portrait stretched square via `setDisplaySize(48, 48)`  — ✅ Fixed
- **Where:** [DialogueScene.create](frontend/src/scenes/overworld/DialogueScene.ts#L132-L135).
- **What happens:** Most NPC walking spritesheets are 16×16 or non-square
  characters; `setDisplaySize(48, 48)` ignores aspect ratio and squashes
  them. Trainers with taller artwork look squished, professors look stretched.

### BUG-041 🟨 Dialogue portrait fixed to `'walk-down-0'` frame  — ✅ Fixed
- **Where:** Same line as BUG-040.
- **What happens:** `this.add.sprite(pX, pY, this.portraitKey, 'walk-down-0')`
  hard-codes the down-walk frame. Atlases that don't have that exact frame
  name (e.g., gym leader full-body portraits, trainer-card sprites) render
  blank or default to frame 0 — usually the wrong pose.

### BUG-042 🟨 IntroScene appearance options collide on narrow portrait
- **Where:** [IntroScene.buildAppearanceUI](frontend/src/scenes/title/IntroScene.ts#L425-L450).
- **What happens:** Boy preview at `width*0.3`, girl at `width*0.7`, each is
  an 80×80 box. On a 320-px portrait viewport the centers are at 96 / 224 —
  the 80-wide boxes (centered at those points) almost touch (right edge of
  boy at 136, left edge of girl at 184). The `'Boy'` / `'Girl'` labels at
  `optionY + 60` then sit above the DONE button at `height * 0.78`; on a
  short portrait viewport (height ~600) `optionY = height*0.42 ≈ 252`, so
  labels at y=312 vs DONE at y=468 — fine vertically, but selection arrows
  and stroke styles overlap horizontally.
- **Fix:** Center-stack the two options in portrait (one above the other).

### BUG-043 🟨 IntroScene leaks the hidden DOM input on scene restart  — ✅ Fixed
- **Where:** [IntroScene.buildNamingUI](frontend/src/scenes/title/IntroScene.ts#L300-L337).
- **What happens:** `document.body.appendChild(this.hiddenInput)` is removed
  in `confirmName()` but **not** in `shutdown()` or any other phase. If the
  user backs out (Esc → restart) or the scene restarts due to resize, the
  input element stays in the DOM with `position: fixed`. After several
  restarts the body has multiple invisible inputs.
- **Fix:** Register a `shutdown()` that removes the element if still attached.

### BUG-044 🟨 IntroScene hint text "Tap a preset, then tap DONE" but DONE is at h*0.82  — ✅ Fixed
- **Where:** [IntroScene.buildNamingUI](frontend/src/scenes/title/IntroScene.ts#L283-L298).
- **What happens:** DONE button at `h * 0.82` and SKIP at `h * 0.92`. On
  portrait phones with iOS DOM controls (~140 px) and safe-area insets,
  both buttons sit underneath the touch-control overlay. The user sees
  "tap DONE" but cannot reach DONE without rotating the device.
- **Fix:** Reserve the same ~150 px bottom-pad SettingsScene already uses.

### BUG-045 🟨 Catch handler uses `b.enemySprite.x, y` after enemy emerges from ball
- **Where:** [BattleCatchHandler.handlePokeBallUse](frontend/src/scenes/battle/BattleCatchHandler.ts#L66-L74).
- **What happens:** The throw tween targets the *current* enemy sprite x/y,
  but the enemy is mid-bob from `flashSprite` and from the slide-in tween.
  If the player throws a ball while the enemy is still sliding into place
  (the BAG screen can open as soon as the action menu shows, before the
  intro animations finish), the ball flies to wherever the enemy *was*, then
  the enemy fades out somewhere else.

### BUG-046 🟨 `OverworldScene.update()` rebuilds the NPC tile lookup every frame
- **Where:** [OverworldScene.update](frontend/src/scenes/overworld/OverworldScene.ts#L1023-L1028)
  → [rebuildNpcOccupiedTiles](frontend/src/scenes/overworld/OverworldScene.ts#L1216-L1228).
- **What happens:** Even when no NPC moved, this clears + rebuilds the set
  every frame. With 10–15 NPCs on a busy map, that's 10–15 string
  concatenations + Set ops × 60 fps. Functionally correct but a measurable
  GC churn that contributes to the 30-fps mobile target perf pressure
  flagged in IMPROVEMENT_PLAN.md.

### BUG-047 🟨 SummaryScene MOVES tab card text overflows on portrait
- **Where:** [SummaryScene.drawMovesTab](frontend/src/scenes/menu/SummaryScene.ts#L335-L380).
- **What happens:** The move name renders at `x + 170` (=220) with no
  word-wrap, while the PP text is right-anchored at `layout.w - 100`. On a
  portrait canvas the right edge is `layout.w - 100 ≈ 300`, leaving only
  80 px for the move name. A move like "Hyperspace Hole" (15 chars) at
  16-px font ≈ 130 px, overflowing into the PP column.

---

## 🟩 Polish / Visual

### BUG-060 🟩 Two redundant menu items "QUIT" and "EXIT" sit adjacent
- **Where:** [MenuScene.create](frontend/src/scenes/menu/MenuScene.ts#L29-L34).
- **What happens:** QUIT goes back to the title screen (loses unsaved
  progress); EXIT just closes the pause menu and resumes the overworld.
  Both verbs mean the same thing to most players. Putting them adjacent in
  the same list invites mis-taps that cost progress.
- **Fix:** Rename QUIT → `RETURN TO TITLE` (or place it behind a confirm
  modal — the code already has `ConfirmBox`) and label EXIT → `RESUME`.

### BUG-061 🟩 Title screen "floating silhouettes" use mojibake characters
- **Where:** [TitleScene.create](frontend/src/scenes/title/TitleScene.ts#L33-L51).
- **What happens:** The decorative characters `'◆', '●', '▲'` are rendered
  with the system font at 20–40 px and varying alpha. On Windows builds
  without the matching glyphs in the default font stack, these fall back to
  tofu boxes (`□`).
- **Fix:** Use a guaranteed shape (rectangles via `add.graphics()`) or load a
  known-good fallback font.

### BUG-062 🟩 Cycling has no visible sprite swap (already in IMPROVEMENT_PLAN 4.4)
- **Where:** [OverworldScene.update](frontend/src/scenes/overworld/OverworldScene.ts#L1136-L1148).
- **What happens:** Toggling the bicycle changes movement speed and the
  internal animation key (`cycle-*`) but no cycling spritesheet is loaded
  for the player, so the rendered animation just falls back to the walk
  cycle at higher speed. Reported in IMPROVEMENT_PLAN.md, included here so
  a player playing today sees no feedback.

### BUG-063 🟩 `pickup` of a faint friendship message uses the wrong name
- **Where:** [BattleUIScene.applyMoveResult](frontend/src/scenes/battle/BattleUIScene.ts#L536-L546)
  — "held on so you wouldn't feel sad!" branch.
- **What happens:** The message uses `defender.nickname ?? pokemonData[defender.dataId]?.name`,
  which is correct in single battles, but **never updates** if the player
  has nicknamed the partner Pokémon mid-battle (e.g., post-catch). Cosmetic
  drift only.

### BUG-064 🟩 Damage popup color for "no effect" (immune) is dark gray on dark bg
- **Where:** [BattleDamageNumbers.showDamagePopup](frontend/src/scenes/battle/BattleDamageNumbers.ts#L11-L15).
- **What happens:** `effectiveness === 0 → color = '#666666'` against a
  message panel of `#0a0a18` and a battle bg often dark — barely visible.
  Stroke is `#000000` which doesn't help contrast.
- **Fix:** Use `#cccccc` or skip the damage popup when damage is 0 (the
  "No effect!" message in the bar already conveys it).

### BUG-065 🟩 EmoteBubble depth tied to NPC depth via constant offset, can sit behind world tiles
- **Where:** Implied by `EmoteBubble.show` callsites in OverworldScene; the
  bubble depth is derived from NPC depth which is `1 + y/mapH * 0.9`, so it
  caps at 1.9, while LightingSystem darkness sits at depth 85 — emote
  bubbles in a dark cave will be **dimmed by the darkness overlay** because
  they render below it.

### BUG-066 🟩 Banner slide-in displays even if `displayName` is missing
- **Where:** [OverworldScene.create](frontend/src/scenes/overworld/OverworldScene.ts#L508-L545).
- **What happens:** Guarded by `if (this.mapDef.displayName)`. Pallet Town
  (BUG-014) has no displayName → no banner ever fires there. Combined with
  BUG-014 the player has no visual confirmation of the area name on the
  game's first map.

### BUG-067 🟩 NPC-occupied tile set treats blocking and walkable objects identically
- **Where:** [OverworldScene.rebuildNpcOccupiedTiles](frontend/src/scenes/overworld/OverworldScene.ts#L1218-L1228).
- **What happens:** All `mapObjects` (signs, item-balls, PCs, doors) are
  added to `npcOccupiedTiles`, so the player cannot walk *onto* an item-ball
  to pick it up — only adjacent + interact. That makes the existing
  "stand on a warp tile to teleport" behavior (PCs use door-style warps)
  inconsistent with item collection. (Possibly intentional; flagged here in
  case the design is "step on item-ball to collect" elsewhere.)

### BUG-068 🟩 Title decorative gradient "lines" loop is i<5 with offset 4 — mostly invisible
- **Where:** [TitleScene.create](frontend/src/scenes/title/TitleScene.ts#L54-L56).
- **What happens:** Five 2-px-tall rectangles stacked 4 px apart with alpha
  0.3 → a 10-px-tall fuzzy band. Clearly intended to be a decorative ribbon
  but reads as a smudge. Cosmetic only.

### BUG-069 🟩 Catch sequence ball "shake" highlight position offset assumes ball at (ballX, ballY+20)
- **Where:** [BattleCatchHandler.runShakeSequence](frontend/src/scenes/battle/BattleCatchHandler.ts#L82-L100).
- **What happens:** Each shake creates a *new* graphic at
  `(enemySprite.x, enemySprite.y + 20)`. If the enemy sprite is mid-fade
  (`setAlpha(0)` was just called) the ball icon is positioned correctly,
  but if the sprite has been moved by previous tweens (mid-faint, mid-emerge)
  the ball jumps between shakes.

---

## 🎨 Pure visual nitpicks

### NIT-001 🎨 BattleScene comments still reference legacy hard-coded coords
- **Where:** [BattleScene.setupDoubleBattle](frontend/src/scenes/battle/BattleScene.ts#L575-L577).
  Comment says `// Player slot 0: x=200, y=350`. The whole block (BUG-004)
  is the actual issue, but the stale comment hints at how the magic numbers
  arrived.

### NIT-002 🎨 Battle action menu uses a *Rectangle* and a *NinePatchPanel* on the same coords
- **Where:** [BattleUIScene.create](frontend/src/scenes/battle/BattleUIScene.ts#L116-L121).
- **What:** `this.actionMenu.actionMenuBg = this.add.rectangle(...)` is added,
  then immediately a `NinePatchPanel` is drawn on top of the same rect with
  the same dimensions and alpha 0.95. The rectangle is invisible but
  occupies a draw call and lives the entire scene — likely a leftover from
  a refactor.

### NIT-003 🎨 `mobileFontSize(...)` returns `"NNpx"` strings but `add.bitmapText` wants a number
- **Where:** [OverworldScene.create](frontend/src/scenes/overworld/OverworldScene.ts#L426-L432).
- **What:** The fix `parseInt(mobileFontSize(14), 10) || 14` works but
  signals a typing inconsistency — a single helper that returns a `number`
  for bitmap and a `string` for plain `add.text` would prevent future
  mistakes (and the `|| 14` fallback hides any future regex change).

### NIT-004 🎨 SummaryScene "Bar" header column literally says "Bar"  — ✅ Removed (compact STATS layout drops the header)
- **Where:** [SummaryScene.drawStatsTab](frontend/src/scenes/menu/SummaryScene.ts#L274).
- **What:** Header "Bar" is functional placeholder copy; usually that
  column is unlabeled or labeled "Power". Cosmetic.

### NIT-005 🎨 Pewter Mart `displayName: 'PokéMart'` (no city prefix)  — ✅ Fixed
- **Where:** [pewter-pokemart.ts#L22](frontend/src/data/maps/interiors/pewter-pokemart.ts#L22).
- **What:** Same class of issue as BUG-030 but for the mart. Other marts
  prefix the city name; this one doesn't.

---

## Suggested priority for fixes

1. BUG-001 (invisible Pokémon after switch) — highest gameplay impact.
2. BUG-002 (forced switch ignores choice) — softlock-adjacent.
3. BUG-003 (mobile move menu under controls) — blocks battles on phones.
4. BUG-014 (Pallet/Littoral Town name) — single-line fix, first thing players see.
5. BUG-015, BUG-017, BUG-018 (portrait clipping in Summary/Pokedex/Party) —
   the menus that are opened most often.
6. BUG-019 (lighting RT leak) — accumulates the longer the player plays.
7. BUG-020/BUG-021 (catch sequence orphan + wrong origin) — visible every time
   the player throws a ball.
8. Remaining mediums + polish.

---

*Audit performed by static-reading every scene under `frontend/src/scenes/`,
`frontend/src/entities/`, `frontend/src/systems/rendering/`, and the maps
under `frontend/src/data/maps/`. Each bug above includes the file/line
reference where the broken behavior originates so a fix PR can be scoped
narrowly.*
