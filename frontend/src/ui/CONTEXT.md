# UI Components

Reusable UI widgets and input controls shared across scenes. Themed via `theme.ts`.

## Structure

| Path | Purpose |
|---|---|
| `controls/` | Input handling: `TouchControls.ts`, `VirtualJoystick.ts`, `MenuController.ts` |
| `widgets/` | Display components: `NinePatchPanel.ts`, `HealthBar.ts`, `TextBox.ts`, `MenuList.ts`, `ConfirmBox.ts`, `ScrollContainer.ts`, `BattleHUD.ts`, `AchievementToast.ts` |
| `theme.ts` | Shared color palette, font sizes, spacing constants |
| `index.ts` | Barrel re-exports for all UI components |

## Key Widgets

| Widget | Used By | Purpose |
|---|---|---|
| `NinePatchPanel` | Dialogue, menus, HUD | 9-slice scalable panel background |
| `HealthBar` | Battle, party screen | Animated HP bar with color transitions |
| `TextBox` | Dialogue, battle messages | Typewriter text with auto-advance |
| `MenuList` | All menu scenes | Selectable item list with cursor |
| `BattleHUD` | Battle scene | HP/EXP bars, status icons, Pokémon info |

## Conventions

- UI components receive scene references via constructor — they don't import scenes.
- Use `theme.ts` constants for colors and spacing — don't hardcode values.
- Mobile support: `TouchControls` and `VirtualJoystick` handle touch input alongside
  keyboard/gamepad via `InputManager`.
