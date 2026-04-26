---
description: Rules for creating and editing reusable UI components
applyTo: 'frontend/src/ui/**'
---

# UI Instructions

## Structure

| Directory | Purpose | Key Files |
|---|---|---|
| `controls/` | Input handling | `TouchControls.ts`, `VirtualJoystick.ts`, `MenuController.ts` |
| `widgets/` | Display components | `NinePatchPanel.ts`, `HealthBar.ts`, `TextBox.ts`, `MenuList.ts`, `ConfirmBox.ts`, `ScrollContainer.ts`, `BattleHUD.ts`, `AchievementToast.ts` |
| `theme.ts` | Shared constants | Color palette, font sizes, spacing values |
| `index.ts` | Barrel export | Re-exports all UI components |

## Rules

1. **Use `theme.ts` constants**: Never hardcode colors, font sizes, or spacing.
   Import from `theme.ts` for visual consistency.
2. **Constructor injection**: UI components receive scene references via constructor.
   Never import scene classes directly.
3. **No game state access**: UI components render what they're given. They don't
   read from `GameManager` directly — the calling scene passes data in.
4. **Mobile support**: All interactive widgets must work with both pointer (mouse/touch)
   and keyboard/gamepad input via `InputManager`.
5. **Barrel export**: Import via `import { NinePatchPanel } from '@ui'`.
6. **Nine-patch for panels**: Use `NinePatchPanel` for all scalable panel backgrounds.
   Don't create custom panel rendering.
