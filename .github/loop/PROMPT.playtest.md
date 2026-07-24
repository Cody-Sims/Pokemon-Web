# Playtest repair iteration

Read `AGENTS.md`, the `playtest-discovery` skill, and the nearest `CONTEXT.md`
before editing.

The appended playtest finding is the only task for this iteration.

Rules:

- Change files under `frontend/src/` only, plus `docs/CHANGELOG.md`.
- Never edit `tests/`, `.github/`, `scripts/`, `.shadow/`, any config file, or
  anything under `node_modules/`, `frontend/public/assets/`, or
  `frontend/src/data/maps/`.
- Reproduce the finding with its exact command before editing.
- Fix the root cause without suppressions, broad catches, or silent fallbacks.
- Run the exact reproduction, `npm run test`, and `npm run build`.
- Add a `docs/CHANGELOG.md` entry.
- Make exactly one commit with explicit paths and the finding ID at the start of
  the subject. Never push.

If the finding cannot be reproduced or fixed safely, revert every changed path
and stop without committing.
