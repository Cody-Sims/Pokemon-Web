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
| L-006b | todo | tsc | Same barrel migration as L-006 for the remaining eight menu files: `FlyMapScene.ts`, `QuestTrackerScene.ts`, `PartyQuickViewScene.ts`, `TrainerCardScene.ts`, `HallOfFameScene.ts`, `MinimapScene.ts`, `AchievementScene.ts`, `QuestJournalScene.ts`. Run only after L-006 is `done`. Do not touch any other file. |
| L-007 | todo | test | Guard `SaveManager.save()` against exceeding the storage budget *before* writing: measure the serialized payload and return the existing typed failure result when it is too large, instead of relying on the browser throwing. Existing save/`SaveCodec` tests must pass unmodified, and a legitimate save must still round-trip identically. |
| L-008 | todo | tsc | Replace hand-rolled tile/pixel arithmetic with the shared helpers in `frontend/src/utils/grid-math.ts` inside `frontend/src/systems/overworld/` only. Do not change any computed value; this is a call-site migration, so `npm run build` and the existing overworld/grid-movement tests must stay green. |
| L-009 | todo | tsc, build-only | Replace duplicated string formatting (manual capitalisation, `padStart` for numbers) with the shared helpers in `frontend/src/utils/format.ts` inside `frontend/src/scenes/menu/` only. Behaviour must be identical; scenes have no unit coverage, so keep the edit strictly mechanical. |
| L-010 | todo | tsc, build-only | Replace the hardcoded HP colour literals in `frontend/src/scenes/battle/BattleScene.ts` with the shared HP colour helper in `frontend/src/ui/theme.ts`. The theme already exposes semantic HP colours; the rendered colours must not change. |

## Held back deliberately

| Candidate | Why it is not queued |
|---|---|
| Battle Tower `levelCap` enforcement | Needs a new case in `tests/unit/battle/battle-tower.test.ts`, which an implementation iteration may not touch. Requeue as a `test` iteration paired with an implementation iteration. |
| `TouchControls.isMobile` alignment | Changes runtime behavior on tablets with zero test coverage. |
| `AbilityHandler` suppression TODO | Requires deciding Neutralizing Gas semantics. Design judgment, not mechanical work. |
| Battle Tower rental roster | Balance authoring. No test can distinguish a good roster from a bad one. |
| Berry rollout, remaining city maps | Map character grids. Only `npm run map:validate` checks them, and it is absent from both `test` and `build`. |
