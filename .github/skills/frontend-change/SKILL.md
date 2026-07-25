---
name: frontend-change
description: Plan, implement, and validate changes to the Phaser, TypeScript, Vite, UI, game-data, asset, or browser behavior. Use for any task that modifies frontend/**.
license: ISC
compatibility: Requires Node.js 22+ and npm.
---

# Frontend change

## Start

1. Read `AGENTS.md`.
2. Read `.github/instructions/frontend.instructions.md`.
3. Read the nearest `CONTEXT.md` and the most specific path instruction for every
   area being changed.
4. Identify the existing tests, public barrel, interfaces, and lifecycle ownership.
5. Run the baseline build and relevant tests before editing.

## Plan

- Preserve the current architecture and choose the smallest complete set of files.
- Separate independent investigation and validation work so it can run in parallel.
- Include tests, changelog updates, and context maintenance in the plan.
- If a request implies a backend, activate `backend-change` instead of adding
  server behavior to browser code.

## Execute

- Keep scenes as coordinators, data as plain data, persistent state in managers,
  reusable behavior in systems, and battle logic outside scenes.
- Use path aliases and barrel exports.
- Reuse shared infrastructure before hand-rolling: `SceneKey`, `scene-data`,
  `SceneRouter`, `SceneInputRegistry`, `SelectableController`, `ProgressBar`,
  `TextBox`, theme presets, `grid-math`, `format`, `phaser-sequence`, and
  `@data/selectors`.
- Extend typed contracts instead of using ad-hoc strings: `EventMap`, scene data,
  map keys, and move IDs.
- Add battle behavior through effect registries and the FSM transition table;
  preserve injected `BattleRng` ordering.
- Preserve scene shutdown cleanup, singleton callback teardown, and serialized
  save compatibility.
- Add focused tests with deterministic randomness and reset manager singletons.

## Validate

Read [references/validation.md](references/validation.md), select checks based on the
changed paths, and iterate until they pass. Review the final diff for unrelated
generator output before staging explicit paths.
