---
title: Global Agent Toolkit
description: Reusable Copilot agent installed across repositories
---

## Ownership

This directory is the versioned source for repository-agnostic Copilot
customizations. It now ships only the `workspace-researcher` agent. The installer
copies only resources declared in `manifest.json` to the user-level
`~/.copilot/agents` directory.

Pokemon-specific instructions, hooks, and skills remain under the normal
`.github/` customization directories and are not installed globally.

## Skills moved to a dedicated repository

The three reusable skills that used to live here — `external-skill-review`,
`repository-agent-bootstrap`, and `shadow-architecture` — have moved to their own
dedicated repository, `Cody-Sims/agent-skills` (MIT). That catalog owns and
improves them alongside a larger set of skills and installs them to
`~/.copilot/skills` (as well as `~/.agents/skills` and `~/.claude/skills`), so this
toolkit no longer manages `~/.copilot/skills`.

To get the skills, install the dedicated catalog:

```bash
git clone https://github.com/Cody-Sims/agent-skills
cd agent-skills
npm run install:agents
```

Or install an individual skill with the skill CLI:

```bash
gh skill install Cody-Sims/agent-skills <skill-name>
```

## Commands

```bash
npm run agent:global:install
npm run agent:global:check
npm run agent:global:uninstall
```

Installation is idempotent. A receipt records content hashes, and updates or
uninstall refuse to overwrite or remove a managed file changed outside the
toolkit. Review the source diff before reinstalling an updated toolkit.

## Distribution

The bundle currently lives here so its source, tests, and installation can be
reviewed with the repository changes that maintain it. It can later move to a
dedicated repository without changing the installed layout.

When extracting it, preserve `agents/` and `manifest.json`; move the manager and
tests with the bundle; publish immutable releases; and keep installed files as
generated copies rather than canonical source. Third-party additions must pass the
`external-skill-review` workflow (now maintained in `Cody-Sims/agent-skills`)
before entering a manifest.