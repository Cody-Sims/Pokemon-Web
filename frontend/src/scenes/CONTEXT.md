# Scenes

Phaser Scenes organized by gameplay domain. One scene per file. Scenes communicate
via `EventManager`, never through direct references.

## Domain Folders

| Folder | Scenes | Purpose |
|---|---|---|
| `boot/` | `BootScene`, `PreloadScene` | Asset loading pipeline with progress bar |
| `title/` | `TitleScene`, `IntroScene` | Main menu, new game setup, professor intro |
| `overworld/` | `OverworldScene` + 8 helpers | Top-down exploration: movement, NPCs, dialogue, fishing, field abilities, footsteps, transitions |
| `battle/` | `BattleScene`, `BattleUIScene` + 7 helpers | Turn-based combat: sprites, UI overlay, turn pipeline, catch sequence, victory handling |
| `menu/` | 13 scenes | Pause menu, inventory, party, summary, pokédex, settings, quests, trainer card, achievements, fly map, statistics, hall of fame |
| `pokemon/` | `StarterSelectScene`, `NicknameScene`, `MoveTutorScene`, `PCScene` | Pokémon management outside of battle |
| `minigame/` | `ShopScene`, `VoltorbFlipScene` | Shop and mini-game UIs |

## Scene Lifecycle

1. Scene created → `create()` builds game objects
2. Scene update loop → `update(time, delta)` runs every frame
3. Scene transitions → `TransitionManager` handles fade/wipe between scenes
4. Scene shutdown → `shutdown()` cleans up event listeners

## Conventions

- Register new scenes in `config/game-config.ts`
- Use `EventManager` for cross-scene communication
- Delegate heavy logic to `battle/`, `systems/`, or `managers/`
- Overworld helpers are extracted classes that `OverworldScene` composes
- Battle helpers are extracted classes that `BattleScene`/`BattleUIScene` compose
