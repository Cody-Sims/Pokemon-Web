# Pokémon Web repository instructions

Read `AGENTS.md` before changing code. It is the source of truth for architecture,
commands, file placement, maintenance triggers, and common mistakes. When working
inside a major `frontend/src/` directory, also read its nearest `CONTEXT.md`.
Path-specific rules in `.github/instructions/*.instructions.md` supplement this file.

## Repository boundaries

- This is currently a frontend-only static application. Do not invent a server,
  database, API, authentication layer, or secret unless the task explicitly adds a
  backend.
- Production code lives under `frontend/`; tests live under `tests/`; reusable build
  checks live under `scripts/`.
- Treat `frontend/public/assets/` as source assets. Build generators may rewrite
  tracked files, so review the diff and restore unrelated generated changes.
- Put temporary analysis and generated previews under `temp/`, which is ignored.

## Workflow

1. Inspect the relevant `CONTEXT.md`, path-scoped instructions, tests, and interfaces.
2. Run `npm install` before other npm commands in a fresh checkout.
3. Run the existing build and tests before editing to identify baseline failures.
4. Plan a minimal, complete change. Delegate independent research or validation in
   parallel, but never let multiple workers edit overlapping files.
5. Make focused edits and add or update tests for changed behavior.
6. Run the narrowest relevant checks, then `npm run test` and `npm run build`.
7. For scene or UI changes, also run the relevant Playwright command. For map
   changes, run `npm run map:validate`.
8. For agent or architecture-memory changes, run `npm run agent:validate`.
9. Update `docs/CHANGELOG.md` for code or workflow changes and maintain context files
   according to `AGENTS.md`.
10. Review `git diff` and stage only intended paths. Never use `git add .` or
   `git add -A`.

## Engineering rules

- Use TypeScript strict types, `const` by default, path aliases, and barrel exports.
- Keep data files declarative and side-effect free.
- Use `EventManager` for scene communication and `GameManager` for persistent state.
- Do not bypass existing managers, battle state transitions, map tooling, or test
  fixtures.
- Never commit credentials or log prompts, environment values, tool payloads, or
  other potentially sensitive agent-session data.

## Agent resources

- Skills in `.github/skills/` are AgentSkills-compatible. Load the matching
  `SKILL.md` before a frontend, backend, validation, tile/sprite, or shadow workflow.
- `.shadow/` contains the reviewed decision graph. Read its index for architectural
  changes, but recheck every record against current source and tests.
- `.github/global-agent-toolkit/` is versioned source for reusable user-level agents
  and skills. It must remain repository-agnostic and is installed with explicit npm
  commands, never from lifecycle hooks.
- Hooks in `.github/hooks/` provide fast session guidance and guard dangerous shell
  commands. Keep hooks deterministic, offline, non-interactive, and under five
  seconds.
- `llms.txt` is the compact discovery index; `AGENTS.md` is the detailed guide.
