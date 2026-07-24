---
description: Rules for maintaining AI instructions, skills, hooks, and discovery documents
applyTo: 'AGENTS.md,llms.txt,package.json,.shadow/**,.github/{copilot-instructions.md,global-agent-toolkit/**,instructions/**,skills/**,hooks/**,loop/**},scripts/{copilot-hooks.mjs,manage-global-agent-toolkit.mjs,validate-agent-workflows.mjs,validate-shadow-architecture.mjs,loop/**},tests/unit/scripts/**'
---

# Agent workflow instructions

- Keep repository-wide guidance short and place domain rules in path-scoped
  instructions.
- Skills must follow the AgentSkills specification: a directory containing
  `SKILL.md` with `name` and `description`; the name must match the directory.
- Write skill descriptions around user intent and activation conditions. Keep
  detailed material in `references/` and load it only when needed.
- Do not duplicate architecture inventories across skills. Link to `AGENTS.md`,
  `CONTEXT.md`, and path-specific instructions as sources of truth.
- Hook scripts must parse stdin as untrusted JSON, avoid shell interpolation and
  network calls, emit exactly one JSON result, and fail safely.
- Keep hooks fast and deterministic. Heavy builds, full tests, installs, commits,
  and writes do not belong in lifecycle hooks.
- Keep reusable, repository-agnostic resources in `.github/global-agent-toolkit/`
  and project-specific resources in the normal `.github/` customization folders.
  Do not use the same skill name at both scopes.
- Treat the toolkit manifest as the installation allowlist. Global install and
  uninstall must preserve user-modified or unmanaged files.
- Treat `.shadow/decisions/` as reviewed architecture source. New desired decisions
  start as proposed, and accepted history is superseded rather than rewritten.
- Keep the improvement loop's gate strictly stronger than its prompt. Prompt text
  is advisory; only `scripts/loop/` decides whether an iteration passes.
- Add a loop backlog item only with a named acceptance signal that `npm run test`
  or `npm run build` can produce. Never queue work that needs `tests/` edits, map
  grid edits, asset regeneration, or design judgment.
- When adding or changing a workflow resource, update `llms.txt` and the Agent
  Workflows section of `AGENTS.md`, then run `npm run agent:validate`.
