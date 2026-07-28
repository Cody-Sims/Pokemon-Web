# Improvement loop backlog

Queue for `npm run loop:run`. One item per iteration, top-down, first `todo`
wins. States: `todo`, `in-progress`, `done`, `blocked`.

Curated by hand on 2026-07-24 after auditing `docs/IMPROVEMENT_PLAN.md`, which is
stale: 31 of its 34 items already shipped. Do not re-derive this queue from that
document. Every item below is a verified residual gap.

Scope rule: the gate rejects any diff touching more than 12 files or 400
lines, so every item below is bounded to a named file list well under that cap.

Verification reality check: no Vitest test imports anything from
`frontend/src/scenes/`, so changes there are proven by `tsc` only. Items marked
`build-only` compile-check but carry no behavioral signal. Keep them rare.

| ID | State | Signal | Task |
|---|---|---|---|
| L-001 | done | tsc | Delete the unused deprecated `computeGameWidth()` from `frontend/src/utils/constants.ts`. It has zero call sites; `npm run build` must stay green. |
| L-002 | done | test | Add `'berry-harvested': [payload: { treeId: string; berryId: string }]` to the `EventMap` interface in `frontend/src/managers/EventManager.ts`, matching the existing emit in `frontend/src/scenes/overworld/OverworldInteraction.ts`. `tests/integration/managers/event-manager.test.ts` must pass unmodified. |
| L-003 | done | tsc, build-only | Replace every `MOBILE_SCALE` usage with a `mobileScale()` call in `BattleMoveMenu.ts`, `BattleTowerScene.ts`, `BattleUIScene.ts`, `BPShopScene.ts`, `TownMapScene.ts`, and `TitleScene.ts`, then delete `export const MOBILE_SCALE` from `frontend/src/ui/theme.ts`. The deprecated const freezes its value at module load and ignores rotation. |
| L-004 | done | tsc, build-only | Replace every `MIN_TOUCH_TARGET` usage with a `minTouchTarget()` call in `DialogueScene.ts` and `MoveTutorScene.ts`, drop the unused imports in `PCScene.ts` and `StarterSelectScene.ts`, then delete `export const MIN_TOUCH_TARGET` from `frontend/src/ui/theme.ts`. Run after L-003; both edit `theme.ts`. |
| L-005 | done | test | Tighten `EventName` in `frontend/src/managers/EventManager.ts` to `keyof EventMap`, then add each event name `tsc` reports as missing. If `tests/integration/managers/event-manager.test.ts` stops compiling because it emits ad-hoc strings, revert and mark this item `blocked`: widening the test is out of scope for an implementation iteration. |

| L-006 | done | tsc | Replace deep `@managers/<file>` imports with the `@managers` barrel in exactly these seven files: `frontend/src/scenes/menu/MenuScene.ts`, `PartyScene.ts`, `InventoryScene.ts`, `SettingsScene.ts`, `PokedexScene.ts`, `StatisticsScene.ts`, `TownMapScene.ts`. Do not touch any other file. `npm run build` must stay green and the import-cycle guard test must still report zero cycles. |
| L-006b | done | tsc | Same barrel migration as L-006 for the remaining eight menu files: `FlyMapScene.ts`, `QuestTrackerScene.ts`, `PartyQuickViewScene.ts`, `TrainerCardScene.ts`, `HallOfFameScene.ts`, `MinimapScene.ts`, `AchievementScene.ts`, `QuestJournalScene.ts`. Run only after L-006 is `done`. Do not touch any other file. |
| L-007 | todo | test | Guard `SaveManager.save()` against exceeding the storage budget *before* writing: measure the serialized payload and return the existing typed failure result when it is too large, instead of relying on the browser throwing. Existing save/`SaveCodec` tests must pass unmodified, and a legitimate save must still round-trip identically. |
| L-008 | todo | tsc | Replace hand-rolled tile/pixel arithmetic with the shared helpers in `frontend/src/utils/grid-math.ts` inside `frontend/src/systems/overworld/` only. Do not change any computed value; this is a call-site migration, so `npm run build` and the existing overworld/grid-movement tests must stay green. |
| L-009 | todo | tsc, build-only | Replace duplicated string formatting (manual capitalisation, `padStart` for numbers) with the shared helpers in `frontend/src/utils/format.ts` inside `frontend/src/scenes/menu/` only. Behaviour must be identical; scenes have no unit coverage, so keep the edit strictly mechanical. |
| L-010 | todo | tsc, build-only | Replace the hardcoded HP colour literals in `frontend/src/scenes/battle/BattleScene.ts` with the shared HP colour helper in `frontend/src/ui/theme.ts`. The theme already exposes semantic HP colours; the rendered colours must not change. |

<!-- ── Curated 2026-07-28: nine new items after L-010 ────────────────────────────────── -->
<!-- Evidence: grep audit of deep @managers/@battle imports and inline format helpers.   -->
<!-- All items are bounded to ≤10 named source files + docs/CHANGELOG.md (≤11 total).   -->
<!-- No item touches tests/, data/maps/, protected scripts/, or config files.           -->

| L-011 | todo | tsc, build-only | Replace deep `@managers/<file>` imports with the `@managers` barrel in exactly these six files: `frontend/src/scenes/battle/BPShopScene.ts`, `BattleActionMenu.ts`, `BattleBagHandler.ts`, `BattleCatchHandler.ts`, `BattleMessageHandler.ts`, `BattleMoveMenu.ts`. Do not touch any other file. `npm run build` must stay green and the import-cycle guard test must still report zero cycles. |
| L-012 | todo | tsc, build-only | Same `@managers` barrel migration as L-011 for the remaining six battle-scene files: `frontend/src/scenes/battle/BattleRewardHandler.ts`, `BattleScene.ts`, `BattleSwitchHandler.ts`, `BattleTowerScene.ts`, `BattleUIScene.ts`, `BattleVictorySequence.ts`. L-011 and L-012 touch disjoint file sets and may run in parallel. |
| L-013 | todo | tsc, build-only | Replace deep `@battle/<subdir>` imports with the `@battle` barrel in exactly these nine files in `frontend/src/scenes/battle/`: `BattleActionMenu.ts`, `BattleCatchHandler.ts`, `BattleEndOfTurn.ts`, `BattleMoveMenu.ts`, `BattleScene.ts`, `BattleSwitchHandler.ts`, `BattleTurnRunner.ts`, `BattleUIScene.ts`, `BattleVictorySequence.ts`. The `@battle` barrel already exports every symbol these files need. Run only after L-011 **and** L-012 are `done`; this item writes to files touched by both. |
| L-014 | todo | tsc, build-only | Replace deep `@battle/<subdir>` imports with the `@battle` barrel in these three files outside `scenes/battle/`: `frontend/src/scenes/menu/SummaryScene.ts` (`@battle/calculation/ExperienceCalculator`), `frontend/src/systems/inventory/ItemUseService.ts` (`@battle/calculation/ExperienceCalculator`), and `frontend/src/systems/overworld/EncounterSystem.ts` (`@battle/calculation/ExperienceCalculator`). All three symbols are exported by the barrel. Run only after L-009 is `done`; L-009 already modifies `SummaryScene.ts` for string-formatting cleanup. |
| L-015 | todo | tsc, build-only | Replace deep `@managers/<file>` imports with the `@managers` barrel in exactly these six overworld files: `frontend/src/scenes/overworld/DialogueScene.ts`, `OverworldFishing.ts`, `OverworldHealing.ts`, `OverworldInteraction.ts`, `OverworldNPCSpawner.ts`, `OverworldScene.ts`. Do not touch any other file. `npm run build` must stay green and the import-cycle guard test must still report zero cycles. |
| L-016 | todo | tsc, build-only | Replace deep `@managers/<file>` imports with the `@managers` barrel in exactly these six title and Pokémon-flow files: `frontend/src/scenes/title/IntroScene.ts`, `TitleScene.ts`, `frontend/src/scenes/pokemon/MoveTutorScene.ts`, `NicknameScene.ts`, `PCScene.ts`, `StarterSelectScene.ts`. L-015 and L-016 touch disjoint file sets and may run in parallel. |
| L-017 | todo | tsc, build-only | Replace deep `@managers/<file>` imports with the `@managers` barrel in the remaining nine files that still carry them: `frontend/src/main.ts`, `frontend/src/scenes/boot/PreloadScene.ts`, `frontend/src/scenes/minigame/ShopScene.ts`, `VoltorbFlipScene.ts`, `frontend/src/systems/engine/ChallengeRules.ts`, `CutsceneEngine.ts`, `MapPreloader.ts`, `TrainerResolver.ts`, `frontend/src/systems/overworld/OverworldAbilities.ts`. L-015, L-016, and L-017 touch disjoint file sets and may run in parallel. |
| L-018 | todo | tsc, build-only | Remove the private `formatPlaytime` method duplicated in `frontend/src/scenes/overworld/OverworldScene.ts` and replace its two call sites with `formatPlaytime()` from `@utils/format`; also replace the two inline `.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())` map-name patterns in the same file with `titleCase()`; and replace the manual `berryName` capitalisation in `frontend/src/scenes/overworld/OverworldInteraction.ts` (`split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')`) with `titleCase()`. Behaviour must be identical. Run only after L-015 is `done`; L-015 modifies both of these files. |
| L-019 | todo | tsc, build-only | Replace the inline `padStart(2, '0')` clock-format logic in `GameClock.getClockString()` (`frontend/src/systems/engine/GameClock.ts`) with a call to `formatClockTime(this.getGameMinutes())` from `@utils/format`. `formatClockTime` is already covered by `tests/unit/utils/format.test.ts`; the rendered `HH:MM` output must be identical. `npm run build` must stay green. |

## Held back deliberately

| Candidate | Why it is not queued |
|---|---|
| Battle Tower `levelCap` enforcement | Needs a new case in `tests/unit/battle/battle-tower.test.ts`, which an implementation iteration may not touch. Requeue as a `test` iteration paired with an implementation iteration. |
| `TouchControls.isMobile` alignment | Changes runtime behavior on tablets with zero test coverage. |
| `AbilityHandler` suppression TODO | Requires deciding Neutralizing Gas semantics. Design judgment, not mechanical work. |
| Battle Tower rental roster | Balance authoring. No test can distinguish a good roster from a bad one. |
| Berry rollout, remaining city maps | Map character grids. Only `npm run map:validate` checks them, and it is absent from both `test` and `build`. |
| `BattleRewardHandler.ts` `capitalize` cleanup | One-line change in one file; too small to stand alone. Fold into a future `scenes/battle/` format-helpers cleanup iteration after L-013 is `done`. |
| `@entities` barrel creation and migration | No `index.ts` exists for `@entities`; creating one is a new-file addition that requires migrating call sites across multiple subsystems. Not a bounded mechanical migration. |
