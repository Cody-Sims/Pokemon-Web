---
description: Rules for maintaining AI instructions, skills, hooks, and discovery documents
applyTo: 'AGENTS.md,llms.txt,.github/copilot-instructions.md,.github/instructions/**,.github/skills/**,.github/hooks/**,scripts/copilot-hooks.mjs'
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
- When adding or changing a workflow resource, update `llms.txt` and the Agent
  Workflows section of `AGENTS.md`.
