# Menu Scenes

Pause menu system with 14 self-contained scenes. Accessed from the overworld
via the pause menu.

## Files

| File | Scene | Purpose |
|---|---|---|
| `MenuScene.ts` | `MenuScene` | Pause menu hub: Pokémon, Bag, Save, Pokédex, Trainer Card, Settings, Quit |
| `PartyScene.ts` | `PartyScene` | Party view: HP, types, status per slot. Reorder and select Pokémon. |
| `SummaryScene.ts` | `SummaryScene` | 3-tab Pokémon detail: INFO / STATS / MOVES |
| `InventoryScene.ts` | `InventoryScene` | Bag management: use, give, toss items by category |
| `PokedexScene.ts` | `PokedexScene` | Pokédex browser: seen/caught species with filtering |
| `SettingsScene.ts` | `SettingsScene` | Settings: text speed, volume, battle animations, controls |
| `QuestJournalScene.ts` | `QuestJournalScene` | Quest log: Active / Complete tabs |
| `QuestTrackerScene.ts` | `QuestTrackerScene` | HUD overlay: active quest step display |
| `PartyQuickViewScene.ts` | `PartyQuickViewScene` | HUD overlay: 6 Poke Ball icons coloured by HP status |
| `TrainerCardScene.ts` | `TrainerCardScene` | Trainer card: name, badges, playtime, stats |
| `AchievementScene.ts` | `AchievementScene` | Achievement gallery with 5 category tabs |
| `FlyMapScene.ts` | `FlyMapScene` | Fly fast-travel destination picker |
| `StatisticsScene.ts` | `StatisticsScene` | Game stats viewer: battles, catches, steps, etc. |
| `HallOfFameScene.ts` | `HallOfFameScene` | Hall of Fame champion records browser |

## Notes

- Each menu scene is self-contained and manages its own UI lifecycle.
- Menu scenes are launched from `MenuScene` and return to it on close.
- `QuestTrackerScene` is the exception — it runs as a persistent HUD overlay.
- `PartyQuickViewScene` also runs as a persistent HUD overlay alongside `QuestTrackerScene`.
