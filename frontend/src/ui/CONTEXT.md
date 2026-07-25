# UI Components

Reusable UI widgets and input controls shared across scenes. Themed via `theme.ts`.

## Structure

| Path | Purpose |
|---|---|
| `controls/` | Input and selection handling: `SelectableController.ts`, `MenuController.ts`, `MobileTapMenu.ts`, `TouchControls.ts`, `VirtualJoystick.ts`. |
| `widgets/` | Display components: `NinePatchPanel.ts`, `BarFrame.ts`, `BattlePlatform.ts`, `PixelText.ts`, `HealthBar.ts`, `ProgressBar.ts`, `TextBox.ts`, `MenuList.ts`, `ConfirmBox.ts`, `ScrollContainer.ts`, `BattleHUD.ts`, `AchievementToast.ts`. |
| `theme.ts` | Shared color palette, font sizes, spacing, radii, strokes, type/category colors, panel presets, progress-bar presets, and mobile sizing helpers. |
| `index.ts` | Barrel re-exports for UI controls, widgets, and theme tokens. |

## Key Widgets and Controls

| Component | Used For | Purpose |
|---|---|---|
| `SelectableController` | Menus and list/grid selection | Scene-agnostic cursor state, disabled entries, pointer activation, sounds, and scroll-window tracking. |
| `NinePatchPanel` | Dialogue, menus, HUD | 9-slice scalable panel background. |
| `BarFrame` | Battle HP/EXP bars | Thin bordered rail + drop shadow + optional accent stripe around any bar. |
| `BattlePlatform` | Battle scene | Layered ringed pixel-art platform under battle Pokémon. |
| `PixelText` | Overworld HUD (POC) | Wrapper around `Phaser.GameObjects.BitmapText` for the `aurum-pixel` BMFont. |
| `ProgressBar` | HP, EXP, timers, generic progress | Reusable themed rectangular progress bar with optional animation. |
| `HealthBar` | Battle, party screen | Animated HP bar with color transitions. |
| `TextBox` | Dialogue, battle messages | Canonical typewriter text with battle queues, speaker/portrait dialogue, pagination, and advance input. |
| `MenuList` | Menu scenes | Selectable item list with cursor. |
| `BattleHUD` | Battle scene | HP/EXP bars, status icons, Pokémon info. |

## Conventions

- UI components receive scene references via constructor — they do not import scene classes.
- Use `theme.ts` constants and presets for colors, spacing, font sizes, panels, and bars.
- UI components render caller-provided data and should not read from `GameManager` directly.
- Mobile support: `TouchControls` and `VirtualJoystick` handle touch input alongside keyboard/gamepad via `InputManager`.
- Import through the barrel when possible: `import { TextBox, SelectableController } from '@ui'`.
