# UI Widgets

Reusable display components for menus, dialogue, HUDs, progress, and battle presentation.

## Files

| File | Purpose |
|---|---|
| `NinePatchPanel.ts` | Scalable 9-slice panel background and panel options. |
| `BarFrame.ts` | Reusable bordered frame around bar-style widgets. |
| `BattlePlatform.ts` | Pixel-art battle platform renderer with biome palettes. |
| `PixelText.ts` | BMFont-backed text helper for the `aurum-pixel` font. |
| `HealthBar.ts` | Pokémon HP bar with thresholds and animation. |
| `ProgressBar.ts` | Generic themed progress bar for HP, EXP, timers, and other meters. |
| `TextBox.ts` | Canonical typewriter message/dialogue widget with queueing, speaker/portrait support, pagination, and advance input. |
| `MenuList.ts` | Menu item list widget with cursor rendering. |
| `ConfirmBox.ts` | Confirmation prompt widget. |
| `ScrollContainer.ts` | Scrollable display container. |
| `BattleHUD.ts` | Battle HUD widget for Pokémon info, HP/EXP, and statuses. |
| `AchievementToast.ts` | Achievement notification toast. |

## Conventions

- Use `NinePatchPanel`, `PANEL_PRESETS`, and `PROGRESS_BAR_PRESETS` instead of custom panel/bar drawing for new widgets.
- Widgets receive the Phaser scene by constructor injection and must clean up Phaser objects/timers/tweens they create.
- Widgets should render explicit inputs from scenes, not query persistent game state directly.
- Keep reusable widget exports available through `frontend/src/ui/index.ts`.
