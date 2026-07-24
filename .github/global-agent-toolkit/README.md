---
title: Global Agent Toolkit
description: Reusable Copilot agents and skills installed across repositories
---

## Ownership

This directory is the versioned source for repository-agnostic Copilot
customizations. The installer copies only resources declared in `manifest.json`
to the user-level `~/.copilot/agents` and `~/.copilot/skills` directories.

Pokemon-specific instructions, hooks, and skills remain under the normal
`.github/` customization directories and are not installed globally.

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
reviewed with the repository change that introduced it. It can later move to a
dedicated repository without changing the installed layout.

When extracting it, preserve `agents/`, `skills/`, and `manifest.json`; move the
manager and tests with the bundle; publish immutable releases; and keep installed
files as generated copies rather than canonical source. Third-party additions
must pass the `external-skill-review` workflow before entering the manifest.