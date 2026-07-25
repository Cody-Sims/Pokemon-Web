---
description: Rules for creating and editing singleton manager services
applyTo: 'frontend/src/managers/**'
---

# Manager Instructions

## Singleton Services

| Manager              | Responsibility                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- |
| `GameManager`        | Central game state: party, bag, badges, money, flags, playtime, pokédex, game stats    |
| `SaveManager`        | Serializes GameManager state to `localStorage`. Save slots, auto-save, data migration. |
| `EventManager`       | Custom event bus for inter-scene communication. The only approved cross-scene channel. |
| `AudioManager`       | BGM playback, SFX, volume control, crossfades. Wraps Phaser audio.                     |
| `DialogueManager`    | Dialogue queue and typewriter text rendering for NPC conversations.                    |
| `QuestManager`       | Quest state tracking, objective progress, completion checks.                           |
| `AchievementManager` | Achievement unlock tracking and toast notifications.                                   |
| `TransitionManager`  | Scene transition animations (fade, wipe, etc.).                                        |

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
6. **Imports**: Import public manager APIs from the `@managers` barrel. Use
   concrete files only for private implementation details.
7. **Typed events**: `EventManager` event names are closed to `keyof EventMap`.
   Extend `EventMap` for new events; do not emit ad-hoc strings.
8. **Test resets**: Use `resetManagerSingletons()` from `@managers` instead of
   private-field or module-cache resets.
9. **Scene callbacks**: Managers must not retain destroyed scenes. If a manager
   stores a callback supplied by a scene, expose and call an unsubscribe/clear
   path during scene shutdown.
