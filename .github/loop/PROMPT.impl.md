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
- Set the backlog item to `done`, then make exactly one commit staging explicit
  paths. Never use `git add -A` or `git add .`, and never push.

If you cannot make both commands pass, revert every change with
`git checkout -- <path>` for each file you touched, set the backlog item to
`blocked` with a one-line reason, and stop.
