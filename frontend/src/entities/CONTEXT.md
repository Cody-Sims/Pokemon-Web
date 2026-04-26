# Entities

Game object classes that represent on-screen interactive elements. Each entity is a
Phaser `Sprite` or `Container` with game-specific behavior.

## Files

| File | Class | Description |
|---|---|---|
| `Player.ts` | `Player` | Grid-locked player sprite. Uses `GridMovement` system for 16px-tile movement. Handles input delegation. |
| `NPC.ts` | `NPC` | Base NPC with dialogue, directional facing, and optional patrol routes. |
| `Trainer.ts` | `Trainer` | Extends `NPC`. Adds line-of-sight battle triggers and defeat tracking. |
| `FollowerPokemon.ts` | `FollowerPokemon` | Party lead Pokémon following the player on the overworld. |
| `WildEncounterZone.ts` | `WildEncounterZone` | Invisible zone that triggers random encounters when the player walks through. |
| `InteractableObject.ts` | `InteractableObject` | Signs, PCs, item balls, doors, and other interact-on-press objects. |

## Conventions

- Entities live on the overworld layer managed by `OverworldScene`.
- Sprite keys must match assets in `frontend/public/assets/sprites/`.
- NPC spawning is handled by `OverworldNPCSpawner` in `scenes/overworld/`.
- Entities never import from `scenes/` directly — they receive scene references via
  constructor injection.
