---
description: Rules for editing the battle subsystem (logic, formulas, FSM, effects)
applyTo: 'frontend/src/battle/**'
---

# Battle Subsystem Instructions

## Architecture

The battle subsystem is **isolated from scenes**. Scene-level battle code lives in
`frontend/src/scenes/battle/` and delegates to modules here.

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `core/BattleManager.ts` | Single-battle orchestration (turns, win/loss, party management) |
| `core/DoubleBattleManager.ts` | 2v2 battles with partner/opponent pairs |
| `core/BattleStateMachine.ts` | FSM driving battle state transitions |
| `core/AIController.ts` | Enemy move selection heuristics |
| `core/PartnerAI.ts` | NPC ally move selection in tag/double battles |
| `calculation/DamageCalculator.ts` | Damage formula (STAB, type effectiveness, crits, weather) |
| `calculation/ExperienceCalculator.ts` | EXP yield, level-up detection, stat recalculation |
| `calculation/CatchCalculator.ts` | Poké Ball catch rate formula |
| `effects/StatusEffectHandler.ts` | Burn, paralysis, poison, sleep, freeze effects |
| `effects/AbilityHandler.ts` | Ability hooks (switch-in, after-damage, end-of-turn) |
| `effects/HeldItemHandler.ts` | Held item hooks (end-of-turn, after-damage) |
| `effects/WeatherManager.ts` | Weather conditions and type damage modifiers |
| `effects/SynthesisHandler.ts` | Synthesis Mode activation and reversion |
| `execution/MoveExecutor.ts` | Move application (damage, status, PP deduction) |
| `execution/MoveAnimationPlayer.ts` | Data-driven move animation playback |

## Rules

1. **No scene imports**: Battle logic must never import from `scenes/`, `entities/`, or `ui/`.
2. **Formulas in `calculation/` only**: Never inline damage/EXP/catch math elsewhere.
3. **Use interfaces**: All Pokémon data must use `PokemonInstance` and `MoveData` from `@data`.
4. **Import from barrel**: `import { DamageCalculator } from '@battle'` — not from the direct file path.
5. **Test after changes**: Run `npm run test` — battle logic has thorough unit test coverage.
6. **FSM transitions**: State changes must go through `BattleStateMachine` — never set state directly.
7. **Type chart**: Use `data/type-chart.ts` for effectiveness — never hardcode type matchups.
