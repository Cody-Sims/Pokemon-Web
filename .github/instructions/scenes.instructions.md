---
description: Rules for creating and editing Phaser scenes
applyTo: 'frontend/src/scenes/**'
---

# Scene Instructions

## Organization

Scenes are organized by gameplay domain in subdirectories:

| Folder | Domain | Scene Count |
|---|---|---|
| `boot/` | Asset loading | 2 (BootScene, PreloadScene) |
| `title/` | Main menu, new game | 2 (TitleScene, IntroScene) |
| `overworld/` | Exploration | 1 scene + 8 helpers |
| `battle/` | Turn-based combat | 2 scenes + 7 helpers |
| `menu/` | Pause menu system | 13 scenes |
| `pokemon/` | Pokémon management | 4 scenes |
| `minigame/` | Shops and mini-games | 2 scenes |

## Rules

1. **One scene per file**: Each Phaser Scene class gets its own `.ts` file.
2. **Register in game config**: Add new scenes to `config/game-config.ts`.
3. **EventManager for communication**: Never reference other scenes directly.
   Use `EventManager.emit()` and `EventManager.on()`.
4. **No persistent state on scenes**: All game state goes through `GameManager`.
   Scene-local state (UI positions, animation timers) is fine.
5. **Use TransitionManager**: For scene transitions (fade, wipe). Never call
   `this.scene.start()` directly for gameplay transitions.
6. **Helper extraction**: Complex scenes use helper classes (e.g.,
   `BattleTurnRunner`, `OverworldNPCSpawner`). Extract when a scene file
   exceeds ~300 lines.
7. **Barrel exports**: Each domain folder should have an `index.ts` re-exporting
   its public scene classes.

## Scene Lifecycle Hooks

```typescript
class MyScene extends Phaser.Scene {
  create(): void { /* Build game objects, register event listeners */ }
  update(time: number, delta: number): void { /* Per-frame logic */ }
  shutdown(): void { /* Clean up event listeners, timers */ }
}
```

## Common Patterns

- **Overworld helpers** are composed by `OverworldScene` — they receive the scene
  reference and operate on it (spawning NPCs, handling fishing, etc.)
- **Battle helpers** are composed by `BattleScene`/`BattleUIScene` — they manage
  turn execution, damage display, catch sequences, etc.
- **Menu scenes** are self-contained — each manages its own UI lifecycle.
