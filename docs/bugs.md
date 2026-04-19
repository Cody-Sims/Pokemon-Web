# Bug Report — Pokemon Web (Consolidated)

> **Last updated:** 2026-04-18
> **Status:** Full codebase audit. 108 of 110 historical bugs resolved. 55 new bugs identified, 30 fixed.

---

## Summary

| Severity | Open Count | Fixed |
|----------|------------|-------|
| Critical | 0          | 5     |
| High     | 3          | 11    |
| Medium   | 14         | 12    |
| Low      | 10         | 2     |
| **Total**| **27**     | **30**|

*Includes 2 previously known open bugs (BUG-039, NEW-006).*

---

## Previously Known Bugs (Still Open)

### BUG-039: Dual source of truth for evolution data

- **Files:** `frontend/src/data/evolution-data.ts`, `frontend/src/data/pokemon/*.ts`
- **Description:** Evolution chains are defined both in `evolutionData` and in each Pokemon's `evolutionChain` field. These can get out of sync.
- **Severity:** Medium
- **Status:** Accepted risk. Both sources are validated by existing integration tests.

### NEW-006: Surf state not reset if spawn point is on water after warp

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts`
- **Description:** `init()` resets `surfing = false`. If the player is placed on a water tile by a spawn point after a warp, they are stuck.
- **Severity:** Medium
- **Status:** Open.

---

## Critical Bugs (All Fixed)

### ~~AUDIT-001: Save/Load schema mismatch crashes Continue~~ FIXED

### ~~AUDIT-002: Division by zero in DamageCalculator~~ FIXED

### ~~AUDIT-003: Division by zero in CatchCalculator~~ FIXED

### ~~AUDIT-004: Duplicate OverworldScene files~~ FIXED

### ~~AUDIT-005: Duplicate TitleScene files~~ FIXED

---

## High Bugs

### ~~AUDIT-006: Enemy replacement sends out fainted Pokemon~~ FIXED

### ~~AUDIT-007: Weather never ticks or deals damage (single battles)~~ FIXED

### AUDIT-008: Weather never ticks or deals damage (double battles)

- **File:** `frontend/src/battle/core/DoubleBattleManager.ts`
- **Description:** Same as AUDIT-007 but for double battles.

### AUDIT-009: Spread move damage can revive fainted Pokemon

- **File:** `frontend/src/battle/core/DoubleBattleManager.ts` (line ~258)
- **Description:** Spread move damage reduction retroactively adds HP back after full damage was dealt. If the target fainted from the full hit, the HP addition can bring them above 0, reviving them.
- **Fix:** Apply the spread reduction multiplier before dealing damage, not after.

### AUDIT-010: Rain/Sun weather type multipliers never apply

- **File:** `frontend/src/battle/execution/MoveExecutor.ts` (line ~250)
- **Description:** `weatherManager` is never passed to `DamageCalculator.calculate()`, so rain boosting Water and sun boosting Fire never take effect.
- **Fix:** Pass `this.weatherManager` through to the damage calculator.

### AUDIT-011: Post-damage ability/item hooks never fire

- **File:** `frontend/src/battle/execution/MoveExecutor.ts`
- **Description:** `AbilityHandler.onAfterDamage()`, `HeldItemHandler.onAfterDamage()`, `onAttackLanded()`, and `checkHPThreshold()` are never called. This means Static, Flame Body, Focus Sash, Life Orb recoil, and Sitrus Berry are all nonfunctional.
- **Fix:** Wire these hooks into the damage resolution pipeline in `MoveExecutor.execute()`.

### ~~AUDIT-012: Rare Candy does nothing~~ FIXED

### ~~AUDIT-013: Full Restore doesn't cure status~~ FIXED

### ~~AUDIT-014: Softlock — warp-blocked dialogue never resumes scene~~ FIXED

### ~~AUDIT-015: Softlock — no-starter dialogue never resumes scene~~ FIXED

### ~~AUDIT-016: Surf never activates~~ FIXED

### ~~AUDIT-017: Poison Heal applies on top of poison damage~~ FIXED

### ~~AUDIT-018: localStorage save crash on quota exceeded~~ FIXED

### ~~AUDIT-019: QuestManager automation dies after EventManager clear~~ FIXED

---

## Medium Bugs

### ~~AUDIT-020: Smokescreen reduces spAttack instead of accuracy~~ FIXED

### ~~AUDIT-021: Double Team raises spDefense instead of evasion~~ FIXED

### ~~AUDIT-022: Minimize raises spDefense instead of evasion~~ FIXED

### ~~AUDIT-023: Focus Energy raises spAttack instead of crit rate~~ FIXED

### ~~AUDIT-024: Flash reduces attack instead of accuracy~~ FIXED

### ~~AUDIT-025: Kinesis reduces attack instead of accuracy~~ FIXED

### AUDIT-026: No accuracy/evasion stat in the system (root cause of AUDIT-020 through AUDIT-025)

- **Files:** `frontend/src/data/interfaces.ts`, `frontend/src/battle/effects/StatusEffectHandler.ts`
- **Description:** The stat-change system only supports attack, defense, spAttack, spDefense, speed. There is no accuracy or evasion stat. Six moves are assigned wrong stats as a workaround.
- **Fix:** Add `accuracy` and `evasion` to the stat stage system or add a separate effect type for accuracy/evasion changes.

### ~~AUDIT-027: Always-hit moves can miss (accuracy 0/null)~~ FIXED

### ~~AUDIT-028: Partner AI uses Tackle as fallback instead of Struggle~~ FIXED

### AUDIT-029: Protect only blocks one attack per turn in doubles

- **File:** `frontend/src/battle/effects/StatusEffectHandler.ts` (line ~464)
- **Description:** Protect flag is consumed after the first hit check. In doubles, the second attacker's move hits through Protect.

### ~~AUDIT-030: Sleep with 1 turn wakes and acts immediately~~ FIXED

### ~~AUDIT-031: OHKO moves ignore type immunity~~ FIXED

### ~~AUDIT-032: Moves with 0 PP still execute~~ FIXED

### AUDIT-033: End-of-turn abilities never trigger (Speed Boost, Poison Heal in ability system)

- **File:** `frontend/src/battle/core/BattleManager.ts`
- **Description:** `AbilityHandler.onEndOfTurn()` is never called, so abilities like Speed Boost never activate through the ability system.

### AUDIT-034: Struggle may silently fail

- **File:** `frontend/src/battle/core/AIController.ts` (line ~12)
- **Description:** `'struggle'` may not exist in `moveData`. If it doesn't, the AI picks a null move causing a silent no-op with no recoil.

### AUDIT-035: Keyboard listeners accumulate in BattleUIScene

- **File:** `frontend/src/scenes/battle/BattleUIScene.ts` (line ~165)
- **Description:** `create()` adds keyboard listeners without cleanup. `waitForConfirmThen` adds manual listeners that leak if the battle ends before confirm fires.

### ~~AUDIT-036: fleeAttempts not reset between battles~~ FIXED

### AUDIT-037: Keyboard listeners leak in move replace menu

- **File:** `frontend/src/scenes/battle/BattleVictorySequence.ts` (line ~140)
- **Description:** Move replacement keyboard listeners are added but not tied to scene lifecycle and not cleaned up on scene shutdown.

### AUDIT-038: AudioManager.setScene kills non-audio tweens

- **File:** `frontend/src/managers/AudioManager.ts` (line ~38)
- **Description:** `setScene()` calls `tweens.killAll()` on the old scene, which kills all tweens — not just audio-related ones.

### AUDIT-039: Low-HP timer fires on stale scene reference

- **File:** `frontend/src/managers/AudioManager.ts` (line ~312)
- **Description:** Low-HP warning timer is created on the old scene's clock. After `setScene()`, the timer fires with a stale reference causing potential errors.

### ~~AUDIT-040: EventManager.clear() leaks tagged listeners~~ FIXED

### ~~AUDIT-041: GameManager.reset() doesn't reset berryPlots or gameClockMinutes~~ FIXED

### ~~AUDIT-042: stepCount lost on save/load~~ FIXED

### AUDIT-043: EncounterSystem uses Math.random not seeded PRNG

- **File:** `frontend/src/systems/overworld/EncounterSystem.ts`
- **Description:** Uses `Math.random()` instead of the seeded PRNG. This breaks replay determinism.

### ~~AUDIT-044: Encounters only check tall grass, not dark grass or water~~ FIXED

### ~~AUDIT-045: Badge achievement names don't match actual badges~~ FIXED

---

## Low Bugs

### AUDIT-046: Confusion self-damage uses flat 10% instead of proper formula

- **File:** `frontend/src/battle/effects/StatusEffectHandler.ts`
- **Description:** Confusion self-hit uses 10% of raw attack as damage. The games use a proper damage formula with level and stats.

### AUDIT-047: Level-up doesn't increase currentHp

- **File:** `frontend/src/battle/execution/MoveExecutor.ts`
- **Description:** When a Pokemon levels up mid-battle (from EXP), `currentHp` is not increased by the HP stat gain. The Pokemon appears to lose HP on level-up.

### AUDIT-048: AchievementManager.reset() doesn't clear onUnlockCallback

- **File:** `frontend/src/managers/AchievementManager.ts` (line ~73)
- **Description:** `reset()` doesn't clear `onUnlockCallback`. The callback may reference a destroyed scene's UI, causing errors on the next unlock.

### AUDIT-049: AudioManager has no reset() method

- **File:** `frontend/src/managers/AudioManager.ts`
- **Description:** `pendingBGM`, `lowHpActive`, `bgmPaused` state bleeds between game sessions since there's no reset.

### AUDIT-050: Pointer listeners leak in MenuController

- **File:** `frontend/src/ui/controls/MenuController.ts`
- **Description:** `bindInteractive()` pointer listeners are not cleaned up in `destroy()`.

### AUDIT-051: Cancel and Menu inputs return identical value

- **File:** `frontend/src/systems/engine/InputManager.ts`
- **Description:** Both `cancel` and `menu` map to the same key/value. Pressing ESC triggers both cancel and menu actions simultaneously.

### AUDIT-052: GridMovement has no map boundary validation

- **File:** `frontend/src/systems/overworld/GridMovement.ts`
- **Description:** No bounds check prevents walking off the map edge if the collision callback doesn't happen to block it.

### AUDIT-053: WeatherRenderer has no resize handler

- **File:** `frontend/src/systems/rendering/WeatherRenderer.ts`
- **Description:** Weather overlay doesn't cover the full viewport after a browser resize.

### AUDIT-054: CryGenerator capped at dex 151

- **File:** `frontend/src/systems/audio/CryGenerator.ts`
- **Description:** Dex number is clamped to 151. Any Pokemon beyond Gen I will produce a wrong or identical cry.

### AUDIT-055: Stat revert can push stats below 0

- **File:** `frontend/src/battle/effects/SynthesisHandler.ts` (line ~86)
- **Description:** If stats changed between activate and revert (e.g. a stat boost wore off or was cleared), the revert subtraction can push stats negative.

### AUDIT-056: Nickname prompt keyboard listeners not tied to scene lifecycle

- **File:** `frontend/src/scenes/battle/BattleCatchHandler.ts` (line ~150)
- **Description:** Keyboard listeners added during pokemon nickname prompt are not cleaned up if the scene shuts down mid-prompt.

### AUDIT-057: BattleScene missing shutdown cleanup

- **File:** `frontend/src/scenes/battle/BattleScene.ts`
- **Description:** No explicit `shutdown()` method. Tweens, timers, and event listeners created during battle are not cleaned up when the scene ends.

---

## Fixed Bug Reference

All historical bugs have been resolved. See [CHANGELOG.md](CHANGELOG.md) for details.

- Original bugs: BUG-001 through BUG-097 (95 of 97 fixed)
- Research audit bugs: NEW-001 through NEW-013 (12 of 13 fixed)
