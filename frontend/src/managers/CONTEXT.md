# Managers

Singleton service classes that provide global game infrastructure. Access via static
methods or `getInstance()`.

## Files

| File | Singleton | Responsibility |
|---|---|---|
| `GameManager.ts` | `GameManager` | Central game state: party, bag, badges, money, flags, playtime, pokedex, game stats. The single source of truth for persistent state. |
| `SaveManager.ts` | `SaveManager` | Serializes `GameManager` state to `localStorage`. Handles save slots, auto-save, and data migration. |
| `EventManager.ts` | `EventManager` | Custom event bus for inter-scene communication. Scenes emit/listen here instead of referencing each other directly. |
| `AudioManager.ts` | `AudioManager` | BGM playback, SFX, volume control, crossfades. Wraps Phaser audio. |
| `DialogueManager.ts` | `DialogueManager` | Dialogue queue and typewriter text rendering for NPC conversations. |
| `QuestManager.ts` | `QuestManager` | Quest state tracking, objective progress, completion checks. |
| `AchievementManager.ts` | `AchievementManager` | Achievement unlock tracking and toast notifications. |
| `TransitionManager.ts` | `TransitionManager` | Scene transition animations (fade, wipe, etc.). |

## Conventions

- Managers are singletons — reset them in test `beforeEach` blocks.
- Scenes access managers via import, never by passing them as constructor args.
- All persistent game state changes go through `GameManager` — never store state
  directly on scenes or entities.
- `EventManager` is the only approved cross-scene communication channel.
