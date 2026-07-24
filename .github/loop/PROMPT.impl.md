# Implementation iteration

Read `AGENTS.md` and the nearest `CONTEXT.md` before editing.

Pick the single highest-priority `todo` item from `.github/loop/backlog.md`. Work
on that item only.

Your shell already starts in the repository root. Run commands bare, for example
`npm run test`, not `cd <path> && npm run test`.

Rules:

- Change files under `frontend/src/` only, plus `docs/CHANGELOG.md`.
- Never edit `tests/`, `.github/`, `scripts/`, `.shadow/`, any config file, or
  anything under `frontend/public/assets/` or `frontend/src/data/maps/`.
- Never add `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `as any`, or a
  skipped test. If a check fails, fix the cause.
- Run `npm run test` and `npm run build`. Show the real output.
- Add a `docs/CHANGELOG.md` entry.
- Make exactly one commit, staging explicit paths, and begin the commit subject
  with the backlog item ID, for example `L-001: remove the unused helper`. Never
  use `git add -A` or `git add .`, and never push.
- Do not edit `.github/loop/backlog.md`. The loop records progress for you.

If you cannot make both commands pass, revert every change with
`git checkout -- <path>` for each file you touched, and stop without committing.
Never weaken a check to make it pass.
