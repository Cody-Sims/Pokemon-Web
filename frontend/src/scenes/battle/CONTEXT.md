# Battle Scenes

Turn-based combat UI and orchestration. Delegates core battle logic to
`frontend/src/battle/` (the isolated battle subsystem).

## Files

| File | Class | Purpose |
|---|---|---|
| `BattleScene.ts` | `BattleScene` | Main battle scene: Pokémon sprites, HP/EXP bars, backgrounds. |
| `BattleUIScene.ts` | `BattleUIScene` | Overlay scene: action menu, move menu, message log. Runs parallel to BattleScene. |
| `BattleTurnRunner.ts` | `BattleTurnRunner` | Turn execution pipeline: priority, speed, move resolution. |
| `BattleMessageQueue.ts` | `BattleMessageQueue` | Queues and displays battle messages sequentially. |
| `BattleDamageNumbers.ts` | `BattleDamageNumbers` | Floating damage number animations. |
| `BattleEndOfTurn.ts` | `BattleEndOfTurn` | Collects end-of-turn effects (weather, status, held items). |
| `BattleCatchHandler.ts` | `BattleCatchHandler` | Catch sequence: ball throw, shakes, success/fail, nickname prompt. |
| `BattleRewardHandler.ts` | `BattleRewardHandler` | Post-battle rewards: money, items from trainers. |
| `BattleVictorySequence.ts` | `BattleVictorySequence` | Victory flow: EXP gain, level-up, evolution check, trainer rewards. |
| `index.ts` | — | Barrel re-exports. |

## Architecture

`BattleScene` and `BattleUIScene` run as parallel scenes. The `Battle*` helper
classes are composed by these scenes. Core battle logic (damage, AI, FSM) lives
in `frontend/src/battle/` — scene code handles only presentation and UI.
