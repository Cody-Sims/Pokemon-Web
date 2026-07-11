---
description: Cross-cutting rules for all frontend source, configuration, scripts, and assets
applyTo: 'frontend/**'
---

# Frontend instructions

## Architecture

- The frontend is a Phaser 3 application built by Vite with strict TypeScript.
- Keep domain logic in `frontend/src/battle/`, `systems/`, or `managers/`; scenes
  coordinate behavior and UI components render it.
- Prefer the most specific instruction file for the area being changed. Rules for
  battle, data, entities, managers, maps, scenes, systems, and UI are in sibling
  `.instructions.md` files.
- Read the nearest `CONTEXT.md` before changing a module and update it when files are
  added, removed, renamed, or repurposed.

## Boundaries

- Use configured path aliases and public barrel exports instead of deep imports.
- Do not add Node-only APIs to browser code.
- Do not fetch game data at runtime when it is already bundled under `src/data/`.
- Preserve the 16px tile grid, Phaser lifecycle cleanup, and localStorage save
  compatibility.
- Treat generated icons, atlases, fonts, and manifests as reproducible output.
  Review generated diffs and retain only changes required by the task.

## Validation

- Logic or data: `npm run test` and `npm run build`.
- UI or scene behavior: add the relevant Playwright smoke, visual, or focused E2E
  check.
- Maps: `npm run map:validate` plus a targeted preview.
- Performance-sensitive changes: `bash scripts/check-bundle-size.sh` and
  `npm run test:perf`.
