# Battle Subsystem

Isolated battle logic with no scene dependencies. Scenes in `scenes/battle/` delegate
to these modules for all battle mechanics.

## Subdirectories

| Directory | Purpose | Key Files |
|---|---|---|
| `core/` | Turn orchestration and AI | `BattleManager.ts` (single), `DoubleBattleManager.ts` (2v2), `BattleStateMachine.ts` (FSM), `AIController.ts`, `PartnerAI.ts` |
| `calculation/` | Math formulas | `DamageCalculator.ts`, `ExperienceCalculator.ts`, `CatchCalculator.ts` |
| `effects/` | Status, abilities, items, weather | `StatusEffectHandler.ts`, `AbilityHandler.ts`, `HeldItemHandler.ts`, `WeatherManager.ts`, `SynthesisHandler.ts` |
| `execution/` | Move application, animation, and pooled game objects | `MoveExecutor.ts`, `MoveAnimationPlayer.ts`, `GameObjectPool.ts` |

## FSM States (BattleStateMachine)

`INTRO → PLAYER_TURN → ENEMY_TURN → EXECUTE_MOVES/EXECUTE_TURN → CHECK_FAINT → REPLACE/EXP_GAIN → (loop or VICTORY/DEFEAT/FLEE/CAPTURE)`

## Key Dependencies

- **Reads**: `data/interfaces.ts` (`PokemonInstance`, `MoveData`), `data/moves/*`, `data/type-chart.ts`
- **No imports from**: `scenes/`, `entities/`, `ui/` (battle logic is scene-independent)
- **Barrel export**: `index.ts` re-exports all public classes

## Conventions

- All damage/EXP formulas live in `calculation/` — never inline math in other files.
- Status effects use a handler pattern: each handler implements `onTurnStart`, `onTurnEnd`, `onApply`.
- AI difficulty is configurable via `AIController` heuristics.
