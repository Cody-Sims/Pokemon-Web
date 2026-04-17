# Bug Report — Pokemon Web (Consolidated)

> **Last updated:** 2026-04-16
> **Scope:** All remaining unfixed bugs from original audits (BUG-001 through BUG-097) plus additional findings from deep QA research audits
> **Fixed bugs removed:** 83 of 97 original bugs have been resolved and are documented in [CHANGELOG.md](CHANGELOG.md)

---

## Summary

| Severity | Count |
|----------|-------|
| High     | 3     |
| Medium   | 18    |
| Low      | 7     |
| **Total**| **28**|

---

## High Bugs

### BUG-017: EventManager listeners never cleaned up across scenes

- **File:** `frontend/src/managers/EventManager.ts`
- **Description:** Global listeners accumulate across scene transitions. Listeners from destroyed scenes persist, causing memory leaks and potential stale-reference crashes when events fire on dead scene objects.
- **Expected:** EventManager should support scene-scoped listener cleanup, or scenes should unregister their listeners on shutdown.

### BUG-036: Rival starter hardcoded to Charmander

- **File:** `frontend/src/data/trainers/rival.ts` ~L6
- **Description:** Despite comments saying the rival adapts to the player's starter choice, the rival always uses Charmander regardless of which starter the player picked.
- **Expected:** Rival should use the starter with a type advantage over the player's choice.

### BUG-052: 15+ status moves have no effect implementation

- **File:** Various move data files
- **Description:** Moves like Toxic Spikes, Stealth Rock, Light Screen, Reflect, Disable, Roar, Whirlwind, Substitute, Counter, Hex, Destiny Bond, Bide, and others are defined with stats but have no effect callbacks. Using them wastes a turn with no result.
- **Expected:** Implement effects for all defined moves, or display "But nothing happened!" for genuinely unimplemented ones.

---

## Medium Bugs

### BUG-027: Dream Eater works on awake targets

- **File:** `frontend/src/data/moves/psychic.ts` ~L6
- **Description:** Dream Eater has no sleep status check on the target. It deals damage and heals regardless of the target's status.
- **Expected:** Dream Eater should fail if the target is not asleep.

### BUG-031: Thrash and Petal Dance have no multi-turn lock or confusion

- **Files:** `frontend/src/data/moves/normal.ts`, `frontend/src/data/moves/grass.ts`
- **Description:** These 120-power moves execute as normal single-turn attacks with no 2-3 turn lock and no confusion aftereffect.
- **Expected:** Lock user into the move for 2-3 turns, then confuse.

### BUG-033: Stale flinch volatile persists between turns

- **File:** `frontend/src/battle/core/BattleManager.ts` ~L124
- **Description:** The flinch volatile from the previous turn is not cleared, so the first mover can be flinched by a move used last turn.
- **Expected:** Clear flinch volatiles at the start of each turn.

### BUG-039: Dual source of truth for evolution data

- **Files:** `frontend/src/data/evolution-data.ts`, `frontend/src/data/pokemon/*.ts`
- **Description:** Evolution chains are defined both in `evolutionData` and in each Pokemon's `evolutionChain` field, using different field names. These can easily get out of sync.
- **Expected:** Single source of truth for evolution data, or a validation check to ensure consistency.

### BUG-048: Spread damage in doubles applies full then partially reverses

- **File:** `frontend/src/battle/core/DoubleBattleManager.ts` ~L225
- **Description:** Full damage is applied to each target, then partially healed back to simulate the 0.75x spread reduction. Pokemon can momentarily reach 0 HP, triggering faint effects before being "healed back."
- **Expected:** Calculate reduced damage first, then apply it once.

### BUG-050: Foul Play doesn't use defender's attack stat

- **File:** Battle damage calculation
- **Description:** Foul Play uses the attacker's ATK stat instead of the defender's. The move loses its signature utility against physical attackers.
- **Expected:** Foul Play should substitute the defender's ATK into the damage formula.

### BUG-051: Jump Kick / High Jump Kick has no crash damage on miss

- **File:** Move effect data
- **Description:** Missing crash damage (50% max HP) when these moves miss. They're risk-free high-power moves.
- **Expected:** Apply crash damage to the user on miss.

### BUG-090: MenuScene keyboard listeners not cleaned up on scene stop

- **File:** `frontend/src/scenes/menu/MenuScene.ts` ~L67
- **Description:** MenuScene registers keyboard listeners in `create()` but doesn't remove them when the scene is stopped or put to sleep. If the scene is re-created, duplicate listeners stack up.
- **Expected:** Clean up keyboard listeners in a `shutdown` or `sleep` handler.

### NEW-001: TransitionManager fadeTransition callback runs on destroyed scene

- **File:** `frontend/src/managers/TransitionManager.ts` ~L18
- **Description:** `fadeTransition` attaches a `camerafadeoutcomplete` listener with a callback that calls `scene.cameras.main.fadeIn()`. If the callback triggers `scene.restart()`, the fade-in references the dead camera. The new scene instance does not get the fade-in.
- **Expected:** The fade-in should happen on the new scene, not the old one being restarted.

### NEW-002: CutsceneEngine dialog resumes OverworldScene by hardcoded name

- **File:** `frontend/src/systems/engine/CutsceneEngine.ts` ~L126
- **Description:** `execDialogue` calls `this.scene.scene.resume('OverworldScene')` after DialogueScene shuts down. If the cutscene engine is used from a non-OverworldScene context, the calling scene stays paused.
- **Expected:** Resume the scene that launched the cutscene, not a hardcoded name.

### NEW-003: BerryGarden persistence is broken

- **File:** `frontend/src/systems/overworld/BerryGarden.ts` ~L31
- **Description:** `BerryGarden.getPlots()` calls `gm.getFlag('berryPlots')` which returns a boolean, then falls back to `(gm as any)._berryPlots` which is a nonexistent private field. Berry garden state can never load or persist.
- **Expected:** Store berry data in a dedicated GameManager field with proper serialization.

### NEW-004: GridMovement hop animation y-coordinate conflicts with tween

- **File:** `frontend/src/systems/overworld/GridMovement.ts` ~L97
- **Description:** The ledge hop animation's `onUpdate` manually sets `this.sprite.y` for the parabolic arc, but the tween also targets `y: targetPxY`. The tween's linear y-interpolation and the manual override fight each other each frame.
- **Expected:** Only tween `x` and handle `y` entirely in `onUpdate`. Remove `y` from tween targets.

### NEW-005: OverworldScene isCycling not reset on scene init

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` ~L93
- **Description:** `init()` resets many state variables but not `isCycling`. After a scene restart (entering/exiting a building), the player could remain in cycling mode inside an interior.
- **Expected:** Reset `isCycling` in `init()`.

### NEW-006: Surf state not reset if spawn point is on water after warp

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` ~L93
- **Description:** `init()` resets `surfing = false`. If the player is placed on a water tile by a spawn point after a warp, they are stuck because `surfing` is false and the collision check blocks water tiles when not surfing.
- **Expected:** Auto-enable surfing if the spawn point is on a water tile.

### NEW-007: LightingSystem RenderTexture not resized on window resize

- **File:** `frontend/src/systems/rendering/LightingSystem.ts` ~L65
- **Description:** The darkness RenderTexture is created with initial camera dimensions. If the browser window is resized (the game uses responsive GAME_WIDTH), the RT remains the wrong size, leaving gaps in the darkness overlay.
- **Expected:** Listen for resize events and recreate the RenderTexture.

### NEW-008: Double fishing dialogue can resume OverworldScene twice

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` ~L624
- **Description:** `tryFishing()` launches DialogueScene which on shutdown launches another DialogueScene. The second dialogue's shutdown listener calls `resume()`, but DialogueScene's own `closeDialogue()` also calls `resume('OverworldScene')`. The overworld could be resumed twice.
- **Expected:** Ensure resume is called only once.

### NEW-009: Protect consecutive use rate resets on failure

- **File:** `frontend/src/battle/effects/StatusEffectHandler.ts` ~L305
- **Description:** When Protect fails, the success rate resets to 1.0 instead of continuing to halve. This allows Protect spam strategies where failing resets the odds to full.
- **Expected:** Keep halving the rate even on failure to prevent exploitation.

---

## Low Bugs

### BUG-049: Catch formula uses 3 shakes instead of 4

- **File:** Battle catch logic
- **Description:** The catch animation and calculation only checks 3 shakes. The games use 4 shake checks for catch confirmation.
- **Expected:** Use 4 shake checks per the standard formula.

### BUG-058: GameClock time-of-day not persisted

- **File:** `frontend/src/systems/engine/GameClock.ts`
- **Description:** The in-game clock always starts at minute 0 on load. Time-of-day dependent encounters and events reset every session.
- **Expected:** Persist clock state in save data.

### BUG-091: Gym Leader Drake labeled as Dragon-type but has a non-Dragon team

- **File:** `frontend/src/data/trainers/gym-leaders.ts`
- **Description:** Drake is presented as a Dragon-type specialist gym leader. However, his actual team contains Gyarados (Water/Flying) and Aerodactyl (Rock/Flying), neither of which are Dragon-type.
- **Expected:** Drake's team should primarily consist of Dragon-type Pokemon.

### NEW-010: TitleScene Hall of Fame checks stale GameManager data

- **File:** `frontend/src/scenes/title/TitleScene.ts` ~L72
- **Description:** The title screen checks `gm.getHallOfFame().length > 0` to show the Hall of Fame option. After quit-to-title, the GM retains in-memory state from the previous session. If the player deletes their save, the option still appears until page reload.
- **Expected:** Check from saved data or reset GameManager on quit-to-title.

### NEW-011: Quest tracker scene can be launched multiple times

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` ~L118
- **Description:** `create()` checks `!this.scene.isActive('QuestTrackerScene')` before launching but `isActive` may return false during map transitions even if the scene is sleeping. Rapid map transitions can launch duplicate instances.
- **Expected:** Also check `this.scene.isSleeping('QuestTrackerScene')`.

### NEW-012: Trainer walk-toward callback doesn't check for scene destruction

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` ~L540
- **Description:** `triggerTrainerBattle` has a 600ms delayed call before `trainer.walkToward()`. If the scene is destroyed during the delay (menu quit, etc.), the callback executes on destroyed objects.
- **Expected:** Check `this.scene.isActive()` or trainer's `active` state before acting.

### NEW-013: PCScene placement targeting uses stale highlight data property

- **File:** `frontend/src/scenes/pokemon/PCScene.ts` ~L195
- **Description:** `placePokemon()` determines the drop target by checking `getData('highlighted')` on slots, but in 'moving' mode, this flag may not update correctly when navigating between box and party. Pokemon can be placed in unintended locations.
- **Expected:** Determine drop target from cursor position and navigation mode, not a stored data property.

---

## Fixed Bug Reference

The following 83 bugs have been resolved. See [CHANGELOG.md](CHANGELOG.md) for fix details.

BUG-001, BUG-002, BUG-003, BUG-004, BUG-005, BUG-006, BUG-007, BUG-008, BUG-009, BUG-010,
BUG-011, BUG-012, BUG-013, BUG-014, BUG-015, BUG-016, BUG-018, BUG-019, BUG-020, BUG-021,
BUG-022, BUG-023, BUG-024, BUG-025, BUG-026, BUG-028, BUG-029, BUG-030, BUG-032, BUG-034,
BUG-035, BUG-037, BUG-038, BUG-040, BUG-041, BUG-042, BUG-043, BUG-044, BUG-045, BUG-046,
BUG-047, BUG-053, BUG-054, BUG-055, BUG-056, BUG-057, BUG-059, BUG-060, BUG-061, BUG-062,
BUG-063, BUG-064, BUG-065, BUG-066, BUG-067, BUG-068, BUG-069, BUG-070, BUG-071, BUG-072,
BUG-073, BUG-074, BUG-075, BUG-076, BUG-077, BUG-078, BUG-079, BUG-080, BUG-081, BUG-082,
BUG-083, BUG-084, BUG-085, BUG-086, BUG-087, BUG-088, BUG-089, BUG-092, BUG-093, BUG-094,
BUG-095, BUG-096, BUG-097
