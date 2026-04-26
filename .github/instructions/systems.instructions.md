---
description: Rules for creating and editing reusable gameplay systems
applyTo: 'frontend/src/systems/**'
---

# Systems Instructions

## Architecture

Systems are reusable gameplay modules organized by domain. Scenes and entities
invoke systems without tight coupling.

| Subdirectory | Domain | Key Classes |
|---|---|---|
| `overworld/` | Overworld mechanics | `GridMovement`, `NPCBehavior`, `EncounterSystem`, `OverworldAbilities`, `HiddenItems`, `BerryGarden` |
| `rendering/` | Visual effects | `WeatherRenderer`, `LightingSystem`, `AnimationHelper`, `EmoteBubble` |
| `engine/` | Core services | `InputManager`, `GameClock`, `MapPreloader`, `CutsceneEngine` |
| `audio/` | Sound generation | `ProceduralAudio`, `CryGenerator`, `AmbientSFX` |

## Rules

1. **Stateless or lightly stateful**: Heavy persistent state belongs in `managers/`.
   Systems may hold transient state (animation timers, current weather) but not
   game-progression state.
2. **GridMovement owns movement**: Only `GridMovement` directly controls `Player`
   position. Other systems request movement through it.
3. **Data in `data/`, logic here**: `EncounterSystem` reads encounter tables from
   `data/encounter-tables.ts` but the encounter *logic* (rate calculation, zone
   detection) lives in the system.
4. **No scene imports**: Systems receive scene references via constructor or method
   parameters — never import scene classes directly.
5. **Barrel export**: Import via `import { GridMovement } from '@systems'`.
