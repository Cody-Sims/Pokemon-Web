# Bug Report — Pokemon Web

> **Audit date:** 2026-04-16
> **Auditor:** Game Tester (automated code audit)
> **Scope:** Full codebase review of game flow, battle system, data integrity, managers, systems, scenes, and UI

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 9     |
| High     | 15    |
| Medium   | 24    |
| Low      | 10    |
| **Total**| **58**|

---

## Critical Bugs

### BUG-001: Player faint ends battle even with alive party members

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L640
- **Description:** When the player's active Pokemon faints, the game immediately triggers "You blacked out..." and ends the battle. The REPLACE state (party switch on faint) exists in the state machine but is never entered.
- **Expected:** If the player has other conscious Pokemon, prompt for a switch-in. Only black out when the entire party is fainted.
- **Impact:** Every battle where your lead faints is an automatic loss regardless of remaining party.

### BUG-002: PP not deducted on missed moves

- **File:** `frontend/src/battle/execution/MoveExecutor.ts` ~L148
- **Description:** The accuracy check happens before PP deduction. Moves that miss consume zero PP. OHKO moves like Fissure can be spammed indefinitely at no cost.
- **Expected:** PP should be deducted when a move is selected, before the accuracy check.

### BUG-003: BattleScene injects Lv.5 Bulbasaur when party is empty

- **File:** `frontend/src/scenes/battle/BattleScene.ts` L103-107
- **Description:** If a battle starts with an empty party, the scene silently creates a Lv.5 Bulbasaur and adds it to the party instead of blocking the battle. This masks the real bug (missing starter).
- **Expected:** Battle should not start if the player has no Pokemon. The game flow should enforce receiving a starter first.

### BUG-004: Rival lab battle can trigger before player receives starter

- **File:** `frontend/src/data/cutscene-data.ts` L149-163
- **Description:** The `rival-kael-lab` cutscene/NPC interaction has no `receivedStarter` prerequisite flag check. Combined with BUG-003, the player fights the rival with an injected Bulbasaur.
- **Expected:** The rival battle cutscene should require the `receivedStarter` flag before firing.

### BUG-005: SaveManager loses most game state on save/load

- **File:** `frontend/src/managers/SaveManager.ts` L22-48
- **Description:** `save()` omits `gameStats`, `hallOfFame`, `visitedMaps`, `boxNames`, `playerGender`, `stepCount`, and `settings`. Loading a save resets all of these to defaults. Fly destinations, Hall of Fame records, and play statistics are all lost.
- **Expected:** All GameManager state fields should be serialized and deserialized.

### BUG-006: CutsceneEngine.execSetFlag() doesn't emit 'flag-set' event

- **File:** `frontend/src/systems/engine/CutsceneEngine.ts` L233-235
- **Description:** When a cutscene sets a flag via `execSetFlag()`, it calls `GameManager.setFlag()` but never emits the `flag-set` event on EventManager. This means the QuestManager automation system (which listens for flag events) is completely blind to all cutscene-set flags — affecting 18+ flags across all cutscenes.
- **Expected:** `execSetFlag()` should emit `'flag-set'` via EventManager after setting the flag.

### BUG-007: QuestManager.initAutomation() stacks duplicate listeners

- **File:** `frontend/src/managers/QuestManager.ts` L106-120
- **Description:** `initAutomation()` is called on every `OverworldScene.create()` (every map transition). It registers new EventManager listeners each time without cleaning up old ones. After N map transitions, quest rewards pay out N times.
- **Expected:** Either guard against re-registration, or clean up old listeners before registering new ones.

### BUG-008: Tag battle uses wrong TransitionScene data keys

- **File:** `frontend/src/scenes/overworld/OverworldInteraction.ts` L225-236
- **Description:** Tag battle handler passes `{ target, data }` instead of `{ targetScene, targetData }` to TransitionScene, causing the transition to fail silently or crash with a black screen for all tag battles.
- **Expected:** Use the correct property names `targetScene` and `targetData`.

### BUG-009: 17+ moves referenced by TMs/learnsets don't exist in moveData

- **File:** `frontend/src/data/moves/` (missing steel.ts, gaps in dragon/fighting/normal/grass/fire/water/flying)
- **Description:** TM data and Pokemon learnsets reference moves that were never defined (e.g., iron-tail, steel-wing, dragon-claw, draco-meteor, brick-break, energy-ball, aerial-ace, facade, etc.). Using a TM or reaching a learn level for these moves will fail or crash.
- **Expected:** All referenced moves should exist in the move data files.

---

## High Bugs

### BUG-010: Run always succeeds — flee logic bypassed

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L210
- **Description:** The RUN action immediately ends the battle without calling `attemptFlee()`. There is no speed-based flee calculation and no enemy counter-attack on failed flee.
- **Expected:** Running should use the standard flee formula based on speed comparison, with a chance of failure.

### BUG-011: Speed Boost ability displays message but doesn't boost speed

- **File:** `frontend/src/battle/effects/AbilityHandler.ts` ~L141
- **Description:** Shows "Speed Boost raised its Speed!" but never modifies the speed stat stage. The ability is entirely cosmetic.
- **Expected:** Speed stat stage should increase by 1 each turn.

### BUG-012: Poison Heal takes poison damage then heals — net negative

- **Files:** `frontend/src/scenes/battle/BattleEndOfTurn.ts` ~L30, `frontend/src/battle/effects/AbilityHandler.ts` ~L146
- **Description:** End-of-turn poison damage is applied first, then Poison Heal restores HP. With Toxic's increasing damage, the pokemon takes net damage after turn 2.
- **Expected:** Poison Heal should prevent poison damage entirely and heal 1/8 HP instead.

### BUG-013: Focus Sash broken — HP check uses reconstructed value

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` ~L581
- **Description:** `hpBeforeHit` is reconstructed as `currentHp + damage`, but when HP was clamped to 0, this over-counts. The check `hpBeforeHit === stats.hp` then fails, and Focus Sash never activates.
- **Expected:** Store the defender's HP before damage is applied and pass it to the Focus Sash check.

### BUG-014: CHECK_FAINT searches party forward only — misses earlier slots

- **File:** `frontend/src/battle/core/BattleManager.ts` ~L72
- **Description:** `findIndex(i > currentIndex)` skips alive Pokemon at indices before the current one after a switch. This can cause wrongful "all fainted" when live Pokemon exist in earlier slots.
- **Expected:** Search the entire party for alive Pokemon, not just indices after the current one.

### BUG-015: Achievements never persisted — SaveManager doesn't call serialize/deserialize

- **File:** `frontend/src/managers/AchievementManager.ts` L52-57
- **Description:** AchievementManager has `serialize()` and `deserialize()` methods, but SaveManager never invokes them. All achievement progress is lost on page reload.
- **Expected:** SaveManager should include achievement data in the save/load cycle.

### BUG-016: No GameManager reset between New Game / Continue

- **File:** `frontend/src/managers/GameManager.ts`
- **Description:** The singleton has no `reset()` or `resetInstance()` method. Starting a New Game after Continue (or vice versa) contaminates state — previous party, flags, badges, and money persist.
- **Expected:** GameManager should have a reset method called when starting a new game.

### BUG-017: EventManager listeners never cleaned up across scenes

- **File:** `frontend/src/managers/EventManager.ts`
- **Description:** Global listeners accumulate across scene transitions. Listeners from destroyed scenes persist, causing memory leaks and potential stale-reference crashes when events fire on dead scene objects.
- **Expected:** EventManager should support scene-scoped listener cleanup, or scenes should unregister their listeners on shutdown.

### BUG-018: EventManager.emit() has no error isolation

- **File:** `frontend/src/managers/EventManager.ts` L24-29
- **Description:** If one listener throws an error, all subsequent listeners for that event are aborted. A single buggy handler can break the entire event pipeline.
- **Expected:** Wrap each listener callback in try/catch so one failure doesn't prevent others from executing.

### BUG-019: 'rival-intro' cutscene replays infinitely

- **File:** `frontend/src/data/cutscene-data.ts` L4-16
- **Description:** The rival-intro cutscene has no `setFlag` action. The replay guard checks `setFlagActions.length > 0 && ...` which evaluates to false, so the cutscene triggers on every NPC interaction.
- **Expected:** Add a `setFlag` action (e.g., `rival_intro_seen`) to mark the cutscene as completed.

### BUG-020: No save version migration — old saves silently corrupt

- **File:** `frontend/src/managers/SaveManager.ts` L50-57
- **Description:** `SAVE_VERSION` is stored in saves but never checked on load. When the save format changes, old saves load with missing/mismatched fields, causing silent data corruption or crashes.
- **Expected:** Check save version on load and run migration logic for older formats.

### BUG-021: Trainer defeated state may not persist

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts` L528-564
- **Description:** `triggerTrainerBattle` transitions to `BattleScene`, but there's no visible code path that calls `gm.defeatTrainer()` after winning. Trainers may re-trigger their battle on every step past them.
- **Expected:** Winning a trainer battle should set a defeated flag that prevents re-triggering.

### BUG-022: Smart AI logic is defined but never called

- **File:** `frontend/src/battle/core/AIController.ts`
- **Description:** `AIController` has sophisticated move selection logic, but the battle turn runner never calls it. All enemies (including gym leaders and Elite Four) select moves completely at random.
- **Expected:** Trainer battles should use the smart AI; only wild Pokemon should use random selection.

### BUG-023: Dragon moves file contains only dragon-rage

- **File:** `frontend/src/data/moves/dragon.ts`
- **Description:** Dragon-claw, draco-meteor, and outrage are referenced in learnsets and TMs but missing from the dragon moves data. Dragon-type Pokemon have almost no usable STAB moves.
- **Expected:** All referenced dragon moves should be defined.

### BUG-024: Continue loads save into stale GameManager

- **File:** `frontend/src/scenes/title/TitleScene.ts` L163-167
- **Description:** `loadFromSave()` doesn't reset all GameManager fields first. State from the current session (e.g., money earned, flags set, party changes) bleeds into the loaded game.
- **Expected:** Fully reset GameManager before applying loaded save data.

---

## Medium Bugs

### BUG-025: Struggle fallback uses 'tackle' instead of 'struggle'

- **Files:** 4 files across battle system
- **Description:** When a Pokemon runs out of PP on all moves, the fallback move used is `'tackle'` instead of `'struggle'`. This means no recoil damage and incorrect base power.
- **Expected:** Use the Struggle move with 1/4 max HP recoil.

### BUG-026: Speed tie always favors the player

- **File:** `frontend/src/scenes/battle/BattleTurnRunner.ts` ~L38
- **Description:** Speed comparison uses `>=` which always gives priority to the player on ties instead of a 50/50 coin flip.
- **Expected:** Speed ties should be broken randomly.

### BUG-027: Dream Eater works on awake targets

- **File:** `frontend/src/data/moves/psychic.ts` ~L6
- **Description:** Dream Eater has no sleep status check on the target. It deals damage and heals regardless of the target's status.
- **Expected:** Dream Eater should fail if the target is not asleep.

### BUG-028: 7 moves target the wrong stat

- **Files:** `frontend/src/data/moves/normal.ts`, `frontend/src/data/moves/ground.ts`
- **Description:**
  - Smokescreen and Sand Attack lower ATK instead of accuracy
  - Double Team and Minimize raise SPD instead of evasion
  - Focus Energy raises ATK instead of crit ratio
- **Expected:** Each move should modify its correct target stat.

### BUG-029: Hyper Beam has no recharge turn

- **File:** `frontend/src/data/moves/normal.ts` ~L41
- **Description:** Hyper Beam deals 150 base power damage every turn with no recharge penalty. It's strictly better than every other Normal move.
- **Expected:** User should be forced to skip the next turn after using Hyper Beam.

### BUG-030: Phantom Force missing two-turn implementation

- **File:** `frontend/src/data/moves/ghost.ts` ~L7
- **Description:** Phantom Force executes as a single-turn attack instead of the intended vanish-then-strike pattern.
- **Expected:** Turn 1: user vanishes (semi-invulnerable). Turn 2: strike and lift Protect.

### BUG-031: Thrash and Petal Dance have no multi-turn lock or confusion

- **Files:** `frontend/src/data/moves/normal.ts`, `frontend/src/data/moves/grass.ts`
- **Description:** These 120-power moves execute as normal single-turn attacks with no 2-3 turn lock and no confusion aftereffect.
- **Expected:** Lock user into the move for 2-3 turns, then confuse.

### BUG-032: Enemy switch-in skips ability triggers

- **File:** `frontend/src/battle/core/BattleManager.ts` ~L68
- **Description:** When the enemy sends in a new Pokemon, `initPokemon()` and `onSwitchIn()` are skipped. Abilities like Intimidate, Drizzle, and Sand Stream never activate on enemy switch-ins.
- **Expected:** Run full switch-in initialization including ability triggers.

### BUG-033: Stale flinch volatile persists between turns

- **File:** `frontend/src/battle/core/BattleManager.ts` ~L124
- **Description:** The flinch volatile from the previous turn is not cleared, so the first mover can be flinched by a move used last turn.
- **Expected:** Clear flinch volatiles at the start of each turn.

### BUG-034: Repel item has non-functional effect type

- **File:** `frontend/src/data/item-data.ts` ~L72
- **Description:** Repel has `effect: { type: 'key' }` instead of a repel-specific effect type. Using a Repel does nothing.
- **Expected:** Implement a `'repel'` effect type that suppresses wild encounters for N steps.

### BUG-035: Evolution stones categorized as key items with no evolution effect

- **File:** `frontend/src/data/item-data.ts` ~L148
- **Description:** Fire Stone, Water Stone, etc. are categorized as `'key'` items with no evolution-triggering effect type. Using them on a Pokemon does nothing.
- **Expected:** Evolution stones should have an effect type that triggers evolution when used on a compatible Pokemon.

### BUG-036: Rival starter hardcoded to Charmander

- **File:** `frontend/src/data/trainers/rival.ts` ~L6
- **Description:** Despite comments saying the rival adapts to the player's starter choice, the rival always uses Charmander regardless of which starter the player picked.
- **Expected:** Rival should use the starter with a type advantage over the player's choice.

### BUG-037: Only 2 of 10 city shops have inventories

- **File:** `frontend/src/data/shop-data.ts`
- **Description:** 8 Pokemarts across the game world have empty inventories. Visiting these shops shows nothing to buy.
- **Expected:** All shops should have level-appropriate inventories.

### BUG-038: Held items have no buy price and non-functional effects

- **File:** `frontend/src/data/item-data.ts` ~L81
- **Description:** Items like Choice Band, Leftovers, etc. have `effect: { type: 'key' }` and no `buyPrice`. They may be unobtainable and non-functional in battle.
- **Expected:** Held items should have proper battle effects and an acquisition path.

### BUG-039: Dual source of truth for evolution data

- **Files:** `frontend/src/data/evolution-data.ts`, `frontend/src/data/pokemon/*.ts`
- **Description:** Evolution chains are defined both in `evolutionData` and in each Pokemon's `evolutionChain` field, using different field names. These can easily get out of sync.
- **Expected:** Single source of truth for evolution data, or a validation check to ensure consistency.

### BUG-040: GridMovement updates tile position before tween completes

- **File:** `frontend/src/systems/overworld/GridMovement.ts` L80-82
- **Description:** The player's tile position is set to the destination immediately when movement starts, while the sprite is still animating. Other systems see the player at the destination tile while the sprite is mid-tween. This causes NPCs to walk into the departing tile, warps to trigger early, and encounters to fire prematurely.
- **Expected:** Update tile position when the movement tween completes, or track both current and target tiles.

### BUG-041: Duplicate low-HP warning systems that leak across scenes

- **Files:** `frontend/src/managers/AudioManager.ts` L262-278
- **Description:** Two independent low-HP beep systems exist: a `setInterval` oscillator and a Phaser timer. The `setInterval` one is not cleaned up on scene change and continues beeping in menus, battle transitions, etc.
- **Expected:** Use a single low-HP warning system with proper scene lifecycle cleanup.

### BUG-042: AudioManager setScene() doesn't clean up old scene tweens

- **File:** `frontend/src/managers/AudioManager.ts` L37-42
- **Description:** When `setScene()` is called, in-flight crossfade tweens still reference the old (destroyed) scene's tween manager, causing errors.
- **Expected:** Cancel active crossfade tweens before switching scenes.

### BUG-043: ESC key triggers both 'cancel' and 'menu' simultaneously

- **File:** `frontend/src/systems/engine/InputManager.ts` L66-69
- **Description:** Both `cancel` and `menu` input flags are set to `true` when ESC is pressed. Context-dependent scenes may handle both, leading to unexpected double-actions (e.g., closing a dialog and opening the menu at the same time).
- **Expected:** ESC should map to one action based on context, or scenes should consume inputs exclusively.

### BUG-044: Post-champion cutscene starts quest bypassing QuestManager

- **File:** `frontend/src/data/cutscene-data.ts` L134-146
- **Description:** Sets the `quest_fatherTrail_started` flag directly via `setFlag` without going through QuestManager's `startQuest()`. The quest appears in flags but QuestManager doesn't track it, so progress/completion logic breaks.
- **Expected:** Use QuestManager.startQuest() or emit proper quest events.

### BUG-045: completeQuest() awards rewards without checking quest is active

- **File:** `frontend/src/managers/QuestManager.ts` L72-86
- **Description:** `completeQuest()` can be called for a quest that isn't in the active state, awarding rewards for already-completed or never-started quests. Combined with BUG-007 (duplicate listeners), this allows multiple reward payouts.
- **Expected:** Only award rewards if the quest is currently in `active` state.

### BUG-046: Wild Pokemon always have 'hardy' nature

- **File:** `frontend/src/systems/overworld/EncounterSystem.ts` ~L80
- **Description:** Encountered wild Pokemon are always created with `nature: 'hardy'`. No random nature selection happens.
- **Expected:** Randomly select from all 25 natures.

### BUG-047: SettingsScene uses resume() but MenuScene used sleep()

- **File:** `frontend/src/scenes/menu/SettingsScene.ts` ~L226
- **Description:** MenuScene puts itself to `sleep()` before launching SettingsScene, but SettingsScene calls `resume()` on MenuScene when closing. `resume()` doesn't wake a sleeping scene — MenuScene stays permanently hidden.
- **Expected:** Use matching lifecycle methods (sleep/wake or pause/resume).

### BUG-048: Spread damage in doubles applies full then partially reverses

- **File:** `frontend/src/battle/core/DoubleBattleManager.ts` ~L225
- **Description:** Full damage is applied to each target, then partially healed back to simulate the 0.75x spread reduction. Pokemon can momentarily reach 0 HP, triggering faint effects before being "healed back."
- **Expected:** Calculate reduced damage first, then apply it once.

---

## Low Bugs

### BUG-049: Catch formula uses 3 shakes instead of 4

- **File:** Battle catch logic
- **Description:** The catch animation and calculation only checks 3 shakes. The games use 4 shake checks for catch confirmation.
- **Expected:** Use 4 shake checks per the standard formula.

### BUG-050: Foul Play doesn't use defender's attack stat

- **File:** Battle damage calculation
- **Description:** Foul Play uses the attacker's ATK stat instead of the defender's. The move loses its signature utility against physical attackers.
- **Expected:** Foul Play should substitute the defender's ATK into the damage formula.

### BUG-051: Jump Kick / High Jump Kick has no crash damage on miss

- **File:** Move effect data
- **Description:** Missing crash damage (50% max HP) when these moves miss. They're risk-free high-power moves.
- **Expected:** Apply crash damage to the user on miss.

### BUG-052: 15+ status moves have no effect implementation

- **File:** Various move data files
- **Description:** Moves like Protect, Toxic Spikes, Stealth Rock, Light Screen, Reflect, and others are defined with stats but have no effect callbacks. Using them wastes a turn with no result.
- **Expected:** Implement effects for all defined moves.

### BUG-053: stepCount not persisted

- **File:** `frontend/src/managers/GameManager.ts` ~L54
- **Description:** The step counter used for friendship/egg calculations is not included in save data. Friendship walking progress resets every load.
- **Expected:** Include `stepCount` in SaveManager serialization.

### BUG-054: Gym Leader Ferris typed as Steel but uses Rock/Ground/Electric team

- **File:** `frontend/src/data/trainers/gym-leaders.ts` ~L55
- **Description:** Ferris is labeled as a "Steel-type" gym leader but his team is Rock/Ground/Electric Pokemon with no Steel types.
- **Expected:** Either fix the team composition or the type label.

### BUG-055: Gym Leaders Morwen and Drake have only 3 Pokemon

- **File:** `frontend/src/data/trainers/gym-leaders.ts` ~L142
- **Description:** Late-game gym leaders (Gym 6 and 7) have only 3 Pokemon each, below the expected difficulty curve.
- **Expected:** Late-game gym leaders should have 4-5 Pokemon.

### BUG-056: Elite Four Nerida has 5 Pokemon instead of 6

- **File:** `frontend/src/data/trainers/elite-four.ts` ~L5
- **Description:** All other E4 members have 6 Pokemon, but Nerida only has 5.
- **Expected:** Add a 6th Pokemon to Nerida's party.

### BUG-057: TM29 and TM48 both teach brick-break

- **File:** `frontend/src/data/tm-data.ts` ~L66
- **Description:** Two different TM numbers are assigned to the same move (brick-break), which is also undefined in move data.
- **Expected:** Fix the duplicate — TM48 should teach a different move.

### BUG-058: GameClock time-of-day not persisted

- **File:** `frontend/src/systems/engine/GameClock.ts`
- **Description:** The in-game clock always starts at minute 0 on load. Time-of-day dependent encounters and events reset every session.
- **Expected:** Persist clock state in save data.

---

## Additional Notes

### Patterns of concern

1. **Scene lifecycle inconsistency:** The codebase mixes `sleep`/`wake`, `pause`/`resume`, and `stop`/`start` inconsistently across menu scenes. This creates multiple paths where scenes can get stuck in invisible or unresponsive states.

2. **Hard-coded OverworldScene references:** At least 3 locations (DialogueScene, CutsceneEngine, and other managers) hard-code `'OverworldScene'` as the resume target. If any of these systems are triggered from a non-overworld context, the calling scene stays paused/frozen.

3. **Missing input validation at system boundaries:** GameManager allows negative money, SaveManager trusts localStorage data without validation, and quest steps can be completed out of order.

4. **Singleton state leakage:** GameManager, QuestManager, and EventManager are singletons that never reset. New Game → Continue → New Game cycles accumulate stale state.

5. **Event system fragility:** EventManager has no error isolation, no scene-scoped cleanup, and CutsceneEngine flag-sets bypass the event pipeline entirely — breaking the quest automation system.
