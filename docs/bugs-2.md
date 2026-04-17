# Bug Report 2 — Pokemon Web (UI, Storyline, and Logic Audit)

> **Audit date:** 2026-04-16
> **Auditor:** QA Tester (deep UI, storyline continuity, and logic audit)
> **Scope:** UI widgets, scene lifecycle, storyline consistency, battle UI edge cases, data integrity, mobile accessibility
> **Predecessor:** [docs/bugs.md](bugs.md) (BUG-001 through BUG-058)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 5     |
| High     | 8     |
| Medium   | 16    |
| Low      | 11    |
| **Total**| **40**|

---

## Critical Bugs

### BUG-059: Two professors — Oak vs. Willow identity crisis across the entire game

- **Files:** 20+ files across the codebase
- **Description:** The game has a massive identity conflict for its professor character. The storyline bible, IntroScene, cutscenes, and late-game events all reference **Professor Willow** (Aurum Region original character). However, the actual lab map (`pallet-oak-lab.ts`) uses sprite key `npc-oak`, dialog prefix `"Prof. Oak:"`, the lab is named `"Oak's Laboratory"`, and the Oak parcel quest references `"Prof. Oak"`. Specific conflicts:
  - IntroScene slide 2: *"My name is WILLOW"* — but shows `npc-professor` sprite (a generic NPC, not even Oak or Willow)
  - `pallet-oak-lab.ts`: NPC id `lab-oak`, texture `npc-oak`, all dialogue says `"Prof. Oak:"`
  - `cutscene-data.ts`: `willow-lab-intro` cutscene says `"Prof. Willow"`, directly contradicting the lab NPCs
  - `rival-kael-lab` cutscene: Kael says `"the one Gramps chose?"` — implying Prof. Oak is his grandfather (an element from Kanto, not the Aurum storyline where Kael is unrelated to Willow)
  - `OverworldScene.ts` L469: `"You should go see Prof. Oak first!"`
  - `item-data.ts` L115: Parcel description references `"Prof. Oak"`
  - `tm-data.ts` L34: TM21 location says `"Pallet Town (Prof. Oak)"`
  - Late-game cutscenes (`willow-kidnapping`, `willow-rescue`, `abyssal-spire-f4`) correctly use `"Professor Willow"`
- **Expected:** A single consistent professor identity. Either rename all Oak references to Willow (matching the Aurum storyline), or make them separate characters with clear roles. The IntroScene must show a dedicated professor sprite, not a generic NPC.
- **Impact:** The game's central mentor figure has a split personality. Players meet "Willow" in the intro, then "Oak" in the lab, then "Willow" again in cutscenes. This breaks narrative immersion entirely.

### BUG-060: Pallet Town vs. Littoral Town — town naming inconsistency

- **Files:** `pallet-town.ts`, `pallet-oak-lab.ts`, `pallet-player-house.ts`, `route-1.ts`, `FlyMapScene.ts`, `quest-data.ts`, `cutscene-data.ts`
- **Description:** The storyline describes the starting town as **Littoral Town** in the Aurum Region. The FlyMapScene correctly maps `pallet-town` → `"Littoral Town"`. However, the actual map data and NPC dialogue still say "Pallet Town":
  - `pallet-town.ts` L53: `"Welcome to Pallet Town!"`
  - `pallet-town.ts` L145: `"PALLET TOWN PIER"`
  - `route-1.ts` L65: Sign reads `"PALLET TOWN ↓"`
  - `cutscene-data.ts` L149: Comment says `"entering Pallet Town"`
  - `pallet-player-house.ts` L72: Comment says `"→ Pallet Town"`
  - `generic-house.ts` L50: `"This is our home in Pallet Town."`
  - Quest data correctly uses `"Littoral Town"` in step descriptions
- **Expected:** All in-game text should say "Littoral Town" to match the Aurum Region setting. Map keys can remain `pallet-town` internally, but player-facing strings must be consistent.
- **Impact:** The starting town has two names. Players see "Littoral Town" in quests and the fly map but "Pallet Town" on signs and in NPC dialogue.

### BUG-061: 8+ quest reward items don't exist in item-data.ts

- **Files:** `frontend/src/data/quest-data.ts`, `frontend/src/data/item-data.ts`
- **Description:** Multiple quests reference reward items that have no definition in `item-data.ts`:
  - `rare-candy` — rewards for `lost-delivery` and `chef-special`
  - `master-ball` — reward for `father-trail`
  - `mystic-water` — reward for `stern-engine`
  - `spell-tag` — reward for `restless-spirit`
  - `dragon-scale` — reward for `dragon-lament`
  - `charcoal` — reward for `volcanic-survey`
  - `leftovers` — reward for `collectors-challenge` (exists in item-data but as a held item with `effect: { type: 'key' }`, meaning it has no functional effect)
- **Expected:** All quest reward items should be defined in `item-data.ts` with proper effects.
- **Impact:** Completing quests either crashes (accessing undefined item data) or silently fails to grant rewards, making 7 of 12 quests unrewarding.

### BUG-062: End-of-turn faint (poison/burn/weather) skips party check — immediate blackout

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L837
- **Description:** When the player's Pokemon faints from end-of-turn damage (poison, burn, sandstorm, hail), the code jumps directly to the "blacked out" sequence without checking for alive party members. This is the same class of bug as BUG-001 but through 3 additional code paths:
  1. End-of-turn status damage (poison/burn)
  2. Recoil damage (Brave Bird, Double-Edge, etc.) ~L762
  3. Confusion self-hit ~L541
- **Expected:** All faint paths should check for alive party members before triggering blackout.
- **Impact:** Any non-direct-attack faint auto-loses the battle regardless of party state.

### BUG-063: Voluntary Pokemon switch in battle does nothing

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L223
- **Description:** Selecting POKEMON from the battle menu opens the party screen, but when the player selects a Pokemon to switch to, no switch action is queued and no turn is consumed. The menu simply closes and returns to the action selection.
- **Expected:** Selecting a Pokemon should queue a switch action, consume the player's turn, and trigger the enemy's attack.
- **Impact:** Players cannot strategically switch Pokemon during battle. The only way to switch is when the active Pokemon faints.

---

## High Bugs

### BUG-064: Battle BAG — non-Pokeball items don't consume a turn

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L210
- **Description:** Using a Potion, status heal, or stat boost from the bag during battle applies the effect but doesn't consume the player's turn. The player gets a free heal and still acts.
- **Expected:** Using any item in battle should consume the player's turn. The enemy should get to attack.

### BUG-065: Failed flee allows player to act again — enemy gets no free attack

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L248
- **Description:** When running fails, the message displays but then returns to the action menu. The enemy doesn't get a free attack on a failed flee attempt.
- **Expected:** A failed flee should consume the player's turn and let the enemy attack.

### BUG-066: AchievementScene and TrainerCardScene not registered in game config

- **File:** `frontend/src/config/game-config.ts` L29-74
- **Description:** Both `AchievementScene` and `TrainerCardScene` exist as implemented scene classes but are not included in the Phaser game configuration's scene list. Attempting to start either scene causes a silent failure or crash.
- **Expected:** Add both scenes to the game config scene array.

### BUG-067: ConfirmBox widget has zero touch/pointer support

- **File:** `frontend/src/ui/widgets/ConfirmBox.ts` ~L36
- **Description:** The confirmation dialog (used for save overwrite, quit confirm, etc.) only accepts keyboard input (`ENTER`/`ESC`). On mobile devices, there is no way to confirm or cancel — the dialog is a permanent softlock.
- **Expected:** Add pointer/touch handlers for Yes/No buttons.

### BUG-068: MenuList widget has no touch support

- **File:** `frontend/src/ui/widgets/MenuList.ts`
- **Description:** The `MenuList` widget (used across MenuScene, SettingsScene, InventoryScene, and others) renders menu items but has no pointer/touch interaction. All menu items respond only to keyboard UP/DOWN/ENTER. On touch devices, menus are completely non-functional.
- **Expected:** Add touch-to-select on each menu item.

### BUG-069: `willow-lab-intro` cutscene replays infinitely

- **File:** `frontend/src/data/cutscene-data.ts` L16-25
- **Description:** The `willow-lab-intro` cutscene has no `setFlag` action. Like BUG-019 (rival-intro, which was fixed), this cutscene triggers every time the player interacts with the lab NPC.
- **Expected:** Add a `setFlag` action (e.g., `willow_lab_intro_seen`) and check it before triggering.

### BUG-070: Kael says "Gramps" — implies family relation that doesn't exist in the storyline

- **File:** `frontend/src/data/cutscene-data.ts` L180
- **Description:** In the `rival-kael-lab` cutscene, Kael says `"Well, well! So YOU're the one Gramps chose?"`. In the Pokemon Red/Blue canon, "Gramps" refers to Professor Oak (Blue's grandfather). But in the Aurum Region, Kael Ashford is **not** related to Professor Willow. This dialogue was copied from the Kanto storyline and never adapted.
- **Expected:** Change to `"the Professor"` or `"Prof. Willow"` to match the Aurum storyline where Kael is an unrelated childhood friend.

### BUG-071: IntroScene girlPreviewBg has duplicate conflicting click handlers

- **File:** `frontend/src/scenes/IntroScene.ts` L398-401
- **Description:** The girl character preview background (`girlPreviewBg`) has two conflicting `pointerdown` handlers registered:
  - L398: `girlPreviewBg.on('pointerdown', () => { this.selectedAppearance = 0; ... })` — sets to **BOY**
  - L401: `girlPreviewBg.on('pointerdown', () => { this.selectedAppearance = 1; ... })` — sets to **GIRL**
  Both fire on click. The second handler wins (sets to girl), but the first handler also fires, plays the cursor sound twice, and may cause a visual flicker as the selection switches from boy to girl in the same frame.
- **Expected:** Remove the first duplicate handler on L398. Only `girlPreviewBg → 1 (girl)` and `boyPreviewBg → 0 (boy)`.

---

## Medium Bugs

### BUG-072: IntroScene professor sprite is a generic NPC — not a recognizable professor character

- **File:** `frontend/src/scenes/IntroScene.ts` L86
- **Description:** The intro scene uses `'npc-professor'` as the professor sprite. This is a generic white-coat NPC sprite, not a unique or recognizable professor character. The iconic Pokemon intro scene is the player's first impression of the game. Using a generic sprite undermines the character's importance and doesn't match the detailed Professor Willow character in the storyline.
- **Expected:** Use a dedicated, visually distinct professor sprite for the intro sequence, or at minimum use the `npc-oak` sprite that exists (if the character is unified as Willow, the sprite should be renamed and potentially redesigned).

### BUG-073: FLY menu creates broken scene lifecycle — MenuScene stopped, OverworldScene double-paused

- **File:** `frontend/src/scenes/menu/MenuScene.ts` ~L138
- **Description:** When using FLY from the menu: MenuScene calls `this.scene.stop()` on itself, then starts `FlyMapScene`. But the OverworldScene is already paused (from opening the menu). If the player cancels FLY, the return path tries to resume OverworldScene through MenuScene, which is now stopped. This leaves the player on a black screen.
- **Expected:** FLY should launch over the current scene stack without stopping MenuScene, or the cancel handler should properly restart the menu chain.

### BUG-074: FLY cancel bypasses menu entirely — drops to overworld

- **File:** `frontend/src/scenes/menu/MenuScene.ts` ~L138
- **Description:** When canceling out of FlyMapScene, the scene resumes OverworldScene directly instead of returning to MenuScene. The player's menu interaction is interrupted.
- **Expected:** Canceling FLY should return to the menu, not the overworld.

### BUG-075: DialogueScene hard-codes resume target as 'OverworldScene'

- **File:** `frontend/src/scenes/overworld/DialogueScene.ts` ~L268
- **Description:** When dialogue finishes, it always calls `this.scene.resume('OverworldScene')`. If dialogue is triggered from any non-overworld context (battle, menu, cutscene), the calling scene stays paused permanently while OverworldScene resumes incorrectly.
- **Expected:** DialogueScene should track and resume whatever scene launched it, or accept the calling scene key as a parameter.

### BUG-076: Pokedex hardcoded to 151 species — doesn't match Aurum Region

- **File:** `frontend/src/scenes/menu/PokedexScene.ts` ~L41
- **Description:** The Pokedex displays 151 entries (Gen 1 Kanto Pokedex). The Aurum Region storyline implies a regional dex with unique Pokemon, but the data uses only original 151 IDs. This is inconsistent with the custom region setting.
- **Expected:** At minimum, update the Pokedex header or frame to reference the Aurum Region. If custom Pokemon are planned, the count should be configurable.

### BUG-077: Dragon Dance only raises ATK — missing Speed boost

- **File:** `frontend/src/data/moves/dragon.ts` ~L6
- **Description:** Dragon Dance's stat modification only raises the Attack stat by 1 stage. The signature move should raise both ATK and SPD by 1 stage each.
- **Expected:** Add speed stage +1 to Dragon Dance's effect.

### BUG-078: Close Combat only lowers DEF — missing Sp.Def drop

- **File:** `frontend/src/data/moves/fighting.ts` ~L13
- **Description:** Close Combat's self-debuff only lowers Defense by 1 stage. It should lower both Defense and Special Defense by 1 stage each.
- **Expected:** Add sp.def stage -1 to Close Combat's self-debuff effect.

### BUG-079: StarterSelectScene has no cancel/back handler — player can get trapped

- **File:** `frontend/src/scenes/pokemon/StarterSelectScene.ts`
- **Description:** The starter selection screen has no ESC/back button handler. If the player enters the scene accidentally or wants to re-read the lab dialogue first, they cannot leave without selecting a starter.
- **Expected:** Add a cancel/back option that returns to the lab scene, or confirm the selection before committing.

### BUG-080: StarterSelectScene cards overflow on narrow mobile screens

- **File:** `frontend/src/scenes/pokemon/StarterSelectScene.ts` ~L66
- **Description:** The three starter Pokemon cards are laid out with fixed pixel spacing that doesn't account for narrow viewports. On phones in portrait mode, the rightmost card is cut off or overlaps the screen edge.
- **Expected:** Use relative positioning based on camera width, or scale cards to fit.

### BUG-081: TextBox typewriter effect has no touch-to-skip

- **File:** `frontend/src/ui/widgets/TextBox.ts`
- **Description:** The typewriter text animation in dialogue boxes can only be skipped/fast-forwarded via keyboard. On mobile, players must wait for the full animation to complete before being able to advance.
- **Expected:** Tapping the text box should complete the typewriter animation instantly.

### BUG-082: ConfirmBox prompt text not destroyed on cleanup

- **File:** `frontend/src/ui/widgets/ConfirmBox.ts` ~L28
- **Description:** When `ConfirmBox.destroy()` is called, the background and option texts are removed, but the prompt text object remains in the scene as an orphaned visual element.
- **Expected:** Destroy all child objects including the prompt text.

### BUG-083: ConfirmBox keyboard listeners conflict with parent scene

- **File:** `frontend/src/ui/widgets/ConfirmBox.ts` L36
- **Description:** ConfirmBox registers keyboard listeners directly on the scene input without scoping them. Parent scene keyboard handlers for `ENTER` and `ESC` also fire, potentially causing double-actions (e.g., confirming save AND advancing dialogue).
- **Expected:** ConfirmBox should exclusively consume keyboard events while active, preventing pass-through to the parent scene.

### BUG-084: TrainerCard trainer ID stored via private property hack — lost on reload

- **File:** `frontend/src/scenes/menu/TrainerCardScene.ts` ~L56
- **Description:** The trainer ID number is read as `(gm as any)._trainerId`, accessing a private or non-existent property via type assertion bypass. This value is never properly initialized or saved, so the trainer card always shows `undefined` or `0`.
- **Expected:** Add `trainerId` as a proper GameManager field that is generated on new game and persisted in saves.

### BUG-085: StatisticsScene and HallOfFameScene close on any pointer click anywhere

- **File:** `frontend/src/scenes/menu/StatisticsScene.ts` ~L92, `HallOfFameScene.ts`
- **Description:** Both scenes register a global `pointerdown` handler to close the scene. Any tap or click anywhere — including accidental touches, or scrolling through content — immediately closes the scene.
- **Expected:** Use a dedicated "Close" or "Back" button, or require the click to be outside the content area.

### BUG-086: HallOfFameScene destroys children during iteration

- **File:** `frontend/src/scenes/menu/HallOfFameScene.ts` ~L89
- **Description:** The cleanup routine iterates over `this.children.list` while calling `destroy()` on each child. Destroying elements mutates the array during iteration, causing elements to be skipped and leaked.
- **Expected:** Copy the children array before iterating, or use `this.children.removeAll(true)`.

---

## Low Bugs

### BUG-087: `fatherTrail_active` flag set in cutscene but never read anywhere

- **File:** `frontend/src/data/cutscene-data.ts` L145
- **Description:** The `post-champion-victory` cutscene sets both `quest_fatherTrail_started` and `fatherTrail_active`. The latter flag is never checked by any NPC, map, quest step, or game logic. It's dead code.
- **Expected:** Either use the flag to gate content (e.g., new NPC dialogue mentioning the father) or remove it.

### BUG-088: HealthBar division-by-zero when maxValue is 0

- **File:** `frontend/src/ui/widgets/HealthBar.ts` ~L30
- **Description:** `setValue(current, max)` computes `current / max` for the bar fill percentage. If `max` is 0 (possible for a bugged Pokemon with 0 HP stat), this produces `NaN`, which causes the health bar to render as invisible or full-width.
- **Expected:** Guard against `max <= 0`.

### BUG-089: IntroScene finishIntro doesn't clean up tweens or listeners

- **File:** `frontend/src/scenes/IntroScene.ts` ~L498
- **Description:** When the intro ends, `finishIntro()` starts a camera flash and fade, then transitions to OverworldScene. Any in-flight tweens (cursor blink, text fade) and registered keyboard listeners from the naming/appearance phases continue running against destroyed objects.
- **Expected:** Call `this.tweens.killAll()` and remove input listeners before transitioning.

### BUG-090: MenuScene keyboard listeners not cleaned up on scene stop

- **File:** `frontend/src/scenes/menu/MenuScene.ts` ~L67
- **Description:** MenuScene registers keyboard listeners in `create()` but doesn't remove them when the scene is stopped or put to sleep. If the scene is re-created, duplicate listeners stack up.
- **Expected:** Clean up keyboard listeners in a `shutdown` or `sleep` handler.

### BUG-091: Gym Leader Drake labeled as Dragon-type but has a non-Dragon team

- **File:** `frontend/src/data/trainers/gym-leaders.ts`
- **Description:** Drake is presented as a Dragon-type specialist gym leader. However, his actual team may contain non-Dragon Pokemon that don't fit the specialist theme. Combined with BUG-055 (only 3 Pokemon), Drake is both under-staffed and off-theme.
- **Expected:** Drake's team should primarily consist of Dragon-type Pokemon.

### BUG-092: Tri Attack only inflicts paralysis — should randomly pick burn/freeze/paralysis

- **File:** `frontend/src/data/moves/normal.ts`
- **Description:** Tri Attack's secondary effect always applies paralysis. The move should have a 20% chance of one of three statuses: burn, freeze, or paralysis (6.67% each).
- **Expected:** Randomly select between burn, freeze, and paralysis for the secondary effect.

### BUG-093: Encounter fallback creates Lv.3 Pidgey when table lookup fails

- **File:** `frontend/src/systems/overworld/EncounterSystem.ts`
- **Description:** When an encounter table is missing or empty for a map, the system silently creates a Lv.3 Pidgey instead of logging a warning or skipping the encounter. This masks missing encounter data for new maps.
- **Expected:** Log a warning in development and skip the encounter rather than spawning a fallback.

### BUG-094: NPC uses stale collision reference after map transition

- **File:** `frontend/src/entities/NPC.ts`
- **Description:** NPC physics bodies retain collision references from the previous map. On map transition, NPCs from the old map may have stale collision callbacks that fire against new-map objects.
- **Expected:** Clear NPC collision state on map transition cleanup.

### BUG-095: PCScene box highlight state persists incorrectly across visits

- **File:** `frontend/src/scenes/pokemon/PCScene.ts` ~L195
- **Description:** The PC storage scene uses a highlight index to track the selected slot. This index is stored as a scene property that isn't reset between visits. If the player had slot 15 selected, closes the PC, then reopens it with fewer Pokemon in the box, the highlight is on an empty/invalid slot.
- **Expected:** Reset highlight index to 0 on scene creation.

### BUG-096: 151 Pokedex number in lab dialogue contradicts Aurum Region lore

- **File:** `frontend/src/data/maps/interiors/pallet-oak-lab.ts` L57
- **Description:** Prof. Oak says `"There are 151 Pokémon to discover!"` This is the Kanto Pokedex count. The Aurum Region should either have its own regional dex number, or this line should be written to not specify a number.
- **Expected:** Remove the specific count or update to match the Aurum regional dex size.

### BUG-097: "Oak's parcel" item description references Viridian City delivery to Prof. Oak

- **File:** `frontend/src/data/item-data.ts` L115
- **Description:** The parcel item description says `"A parcel to be delivered to Prof. Oak from Viridian City."` This should reference Prof. Willow, and "from Viridian City" is the Kanto version. The Aurum Region adaptation of this quest should reference the correct professor and source location.
- **Expected:** Update to `"A parcel to be delivered to Prof. Willow"` with the correct Aurum location.

---

## Patterns of Concern

### 1. Kanto/Aurum identity crisis

The codebase was clearly adapted from a Kanto-based game into the custom Aurum Region storyline. The adaptation is incomplete:

- **Professor:** Oak in map data and NPC dialogue, Willow in cutscenes and late-game events
- **Town names:** Internal keys use Kanto names (`pallet-town`, `viridian-city`, `pewter-city`), display names are partially converted
- **Pokedex:** Hardcoded to 151 (Kanto), not a custom regional dex
- **Dialogue patterns:** "Gramps" (Kanto rival-professor relationship), parcel quests, and 151 references are all vestiges of the original Kanto plot

**Recommendation:** Do a systematic search-and-replace pass to unify all player-facing text under the Aurum Region identity.

### 2. Mobile accessibility is critically broken

Three fundamental UI widgets (`ConfirmBox`, `MenuList`, `TextBox`) have zero touch support. This means:

- Save/quit confirmation dialogs softlock on mobile
- All menu screens (inventory, party, settings, pokedex) are non-functional on mobile
- Dialogue text can't be fast-forwarded on mobile

This contradicts the PWA/mobile improvements already in the codebase and makes the game effectively unplayable on touch devices for anything beyond walking and battle FIGHT commands.

### 3. Battle non-FIGHT actions are all broken

The battle system's FIGHT action works, but all three alternatives fail:

- **BAG:** Items apply but don't consume a turn (free heals)
- **POKEMON:** Switch selection has no effect
- **RUN:** Failed flee doesn't give enemy a turn

This means battles are FIGHT-only, removing all strategic depth around item use, switching, and flee mechanics.

### 4. Quest reward pipeline is broken

7 of 12 quests reference reward items that don't exist in `item-data.ts`. Combined with BUG-045 (rewards awarded for non-active quests) and BUG-007 (duplicate reward payouts from listener stacking), the quest reward system needs a comprehensive overhaul.

### 5. IntroScene appearance selection has a duplicate handler bug

The code at lines 398-401 registers `girlPreviewBg.on('pointerdown', ...)` twice — once setting `selectedAppearance = 0` (wrong) and once setting `selectedAppearance = 1` (correct). The `boyPreviewBg` only fires once (correctly as 0). This means clicking the girl preview fires two handlers with conflicting values.
