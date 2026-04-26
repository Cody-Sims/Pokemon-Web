# Overworld Scenes

Top-down exploration: player movement, NPC interaction, dialogue, fishing,
field abilities, footsteps, and scene transitions.

## Files

| File | Class | Purpose |
|---|---|---|
| `OverworldScene.ts` | `OverworldScene` | Main exploration scene. Composes all helper classes below. Manages map rendering, player, camera. |
| `OverworldNPCSpawner.ts` | `OverworldNPCSpawner` | Spawns NPCs and trainers from map data. |
| `OverworldInteraction.ts` | `OverworldInteraction` | Dispatches NPC talk, sign read, item pickup, and tile interactions. |
| `OverworldFieldAbilities.ts` | `OverworldFieldAbilities` | Boulder push, tile redraw, and other field move effects. |
| `OverworldFishing.ts` | `OverworldFishing` | Fishing rod logic and encounter triggers. |
| `OverworldHealing.ts` | `OverworldHealing` | PokéCenter party heal helper. |
| `OverworldFootsteps.ts` | `OverworldFootsteps` | Footstep SFX by tile type (grass, sand, wood, etc.). |
| `DialogueScene.ts` | `DialogueScene` | Typewriter text overlay for NPC dialogue. Runs as a parallel scene. |
| `TransitionScene.ts` | `TransitionScene` | Fade/wipe transitions between scenes. |
| `index.ts` | — | Barrel re-exports. |

## Architecture

`OverworldScene` is the composition root. The `Overworld*` helper classes are
instantiated by `OverworldScene` and receive the scene reference. They handle
specific concerns without bloating the main scene file.
