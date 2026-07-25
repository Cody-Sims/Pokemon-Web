# UI Controls

Scene-agnostic input and selection helpers for menus, touch controls, and mobile interactions.

## Files

| File | Purpose |
|---|---|
| `SelectableController.ts` | Canonical list/grid selection state machine: cursor movement, wrapping, disabled entries, confirm/cancel hooks, pointer binding, keyboard binding, and scroll-window ranges. |
| `MenuController.ts` | Backward-compatible menu input controller used by existing scene menus. |
| `MobileTapMenu.ts` | Touch-friendly radial/menu tap affordances for mobile play. |
| `TouchControls.ts` | On-screen movement/action controls for touch devices. |
| `VirtualJoystick.ts` | Virtual joystick implementation for directional movement. |
| `touch-geometry.ts` | Pure touch-control math for joystick vectors, dead-zone direction resolution, and safe-area-aware layout. |

## Conventions

- Keep control state reusable and scene-agnostic; scenes render the current state and supply callbacks.
- Bind Phaser keyboard/pointer handlers through control APIs and call `destroy()`/cleanup on scene shutdown.
- Use `SelectableController` for new list or grid menus instead of bespoke cursor logic.
- Preserve keyboard, gamepad, mouse, and touch parity for interactive controls.
