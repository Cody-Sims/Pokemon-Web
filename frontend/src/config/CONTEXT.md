# Runtime Configuration

Phaser runtime configuration for the browser-only Vite application.

## Files

| File | Purpose |
|---|---|
| `game-config.ts` | Creates the `Phaser.Types.Core.GameConfig`: renderer, computed game width/height from `@utils/constants`, pixel-art scaling, arcade physics, multi-touch pointer support, and the registered scene list. |

## Conventions

- Register new scenes in `game-config.ts` after creating the scene file.
- Keep scene keys aligned with `frontend/src/scenes/scene-keys.ts` and typed init payloads in `frontend/src/scenes/scene-data.ts`.
- Keep configuration browser-safe; do not add Node-only APIs or backend assumptions.
- Keep path aliases aligned with `frontend/tsconfig.json` and `frontend/vite.config.ts`.
