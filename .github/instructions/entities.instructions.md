---
description: Rules for creating and editing entity classes (Player, NPC, Trainer, etc.)
applyTo: 'frontend/src/entities/**'
---

# Entity Instructions

## Entity Classes

| Class | File | Extends | Purpose |
|---|---|---|---|
| `Player` | `Player.ts` | Phaser.Sprite | Grid-locked player with `GridMovement`, input delegation |
| `NPC` | `NPC.ts` | Phaser.Sprite | Base NPC with dialogue, facing direction, optional patrol |
| `Trainer` | `Trainer.ts` | `NPC` | NPC subclass with line-of-sight battle triggers, defeat tracking |
| `FollowerPokemon` | `FollowerPokemon.ts` | Phaser.Sprite | Party lead following the player on the overworld |
| `WildEncounterZone` | `WildEncounterZone.ts` | Phaser.Zone | Invisible encounter trigger zone |
| `InteractableObject` | `InteractableObject.ts` | Phaser.Sprite | Signs, PCs, items, doors, interact-on-press objects |

## Rules

1. **No scene imports**: Entities receive scene references via constructor injection — never
   import scene classes directly.
2. **Sprite keys must match assets**: Sprite keys must correspond to files in
   `frontend/public/assets/sprites/`.
3. **Grid-locked**: All overworld entities snap to 16px grid tiles. Use `GridMovement` for
   movement, never raw pixel positioning.
4. **Spawning**: NPC/Trainer spawning is handled by `OverworldNPCSpawner` in
   `scenes/overworld/` — entities don't spawn themselves.
5. **Dialogue**: NPC dialogue is dispatched through `DialogueManager`, not handled inline.
6. **State**: Entities don't hold persistent game state. Defeat flags, quest progress, etc.
   go through `GameManager`.
