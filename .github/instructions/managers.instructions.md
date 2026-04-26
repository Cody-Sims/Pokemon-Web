---
description: Rules for creating and editing singleton manager services
applyTo: 'frontend/src/managers/**'
---

# Manager Instructions

## Singleton Services

| Manager | Responsibility |
|---|---|
| `GameManager` | Central game state: party, bag, badges, money, flags, playtime, pokédex, game stats |
| `SaveManager` | Serializes GameManager state to `localStorage`. Save slots, auto-save, data migration. |
| `EventManager` | Custom event bus for inter-scene communication. The only approved cross-scene channel. |
| `AudioManager` | BGM playback, SFX, volume control, crossfades. Wraps Phaser audio. |
| `DialogueManager` | Dialogue queue and typewriter text rendering for NPC conversations. |
| `QuestManager` | Quest state tracking, objective progress, completion checks. |
| `AchievementManager` | Achievement unlock tracking and toast notifications. |
| `TransitionManager` | Scene transition animations (fade, wipe, etc.). |

## Rules

1. **Singleton pattern**: Each manager is a singleton accessed via static methods or
   `getInstance()`. Never instantiate managers directly from scenes.
2. **State centralization**: All persistent game state belongs in `GameManager`. Scenes
   and entities must not hold their own persistent state.
3. **EventManager only**: Cross-scene communication goes through `EventManager.emit()` /
   `EventManager.on()`. Never pass scene references between managers.
4. **Reset in tests**: Reset all singletons in `beforeEach` blocks. Managers carry state
   between tests if not reset.
5. **No circular imports**: Managers may import from `data/` and `utils/` but must not
   import from `scenes/`, `entities/`, or `battle/`.
6. **Barrel import**: Import managers via `import { GameManager } from '@managers'`.
