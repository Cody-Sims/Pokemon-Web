# Overworld Systems

Core overworld mechanics used by `OverworldScene` and its helpers.

## Files

| File | Class | Purpose |
|---|---|---|
| `GridMovement.ts` | `GridMovement` | 16px tile-locked player movement. The only system that directly controls `Player` position. |
| `NPCBehavior.ts` | `NPCBehavior` | NPC patrol routes, idle behavior, and facing direction AI |
| `EncounterSystem.ts` | `EncounterSystem` | Random wild encounter triggering. Reads from `data/encounter-tables.ts`. |
| `OverworldAbilities.ts` | `OverworldAbilities` | Field move effects (Cut, Surf, Strength, Flash, etc.) |
| `HiddenItems.ts` | `HiddenItems` | Hidden item pickup detection and collection |
| `BerryGarden.ts` | `BerryGarden` | Berry planting, growth timer, and harvest logic |
