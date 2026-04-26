# Systems

Reusable gameplay systems organized by domain. Each system is a self-contained module
that scenes and entities can invoke without tight coupling.

## Subdirectories

| Directory | Purpose | Key Files |
|---|---|---|
| `overworld/` | Overworld mechanics | `GridMovement.ts` (tile-locked movement), `NPCBehavior.ts` (patrol/idle AI), `EncounterSystem.ts` (random encounters), `OverworldAbilities.ts` (field moves), `HiddenItems.ts` (hidden pickup), `BerryGarden.ts` |
| `rendering/` | Visual effects | `WeatherRenderer.ts` (rain/snow/sandstorm), `LightingSystem.ts` (day/night, caves), `AnimationHelper.ts` (sprite animations), `EmoteBubble.ts` (NPC emotion indicators) |
| `engine/` | Core engine services | `InputManager.ts` (keyboard/touch/gamepad), `GameClock.ts` (day/night cycle), `MapPreloader.ts` (adjacent map warm-up), `CutsceneEngine.ts` (scripted sequences) |
| `audio/` | Sound generation | `ProceduralAudio.ts` (synthesized music), `CryGenerator.ts` (Pokémon cry synthesis), `AmbientSFX.ts` (environment sounds) |

## Conventions

- Systems are stateless or lightly stateful — heavy state belongs in `managers/`.
- `GridMovement` is the only system that directly controls `Player` position.
- `EncounterSystem` reads from `data/encounter-tables.ts` — encounter logic is here,
  encounter data is in `data/`.
- Barrel export: `index.ts` re-exports all systems.
