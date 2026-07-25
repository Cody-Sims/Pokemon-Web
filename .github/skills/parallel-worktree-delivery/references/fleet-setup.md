# Fleet Setup Reference

Use this reference when creating, preparing, or prompting isolated worker
worktrees.

## Preconditions

- Pick an integration branch that already contains the common base for the wave.
- Confirm the current checkout is clean or that any uncommitted work belongs to
  the current operator.
- Verify ignored prerequisites that every worktree needs. In this repository,
  `node_modules` may be a shared symlink; do not run `npm install` blindly in a
  worktree that is meant to share it.

## Worktree creation

Run from the repository that owns the integration branch:

```bash
git worktree list
git worktree add -b "$stream_branch" "$worktree_path" "$integration_branch"
```

Name branches by stream, not by agent identity, for example
`revamp/battle-effects` or `agent/import-cycle-guard`.

## Symlink ignored prerequisites

If the integration checkout already has a usable shared dependency directory and
the stream should reuse it, link it explicitly:

```bash
ln -s "$(pwd)/node_modules" "$worktree_path/node_modules"
test -L "$worktree_path/node_modules" && readlink "$worktree_path/node_modules"
```

If a stream intentionally needs an isolated install, document that choice before
running package-manager commands. `npm install` inside a worktree can replace a
`node_modules` symlink with a real directory, which changes isolation and cleanup
expectations.

## Ownership partitioning

Prefer directory-level ownership:

| Stream type | Example ownership boundary |
|---|---|
| Scene decomposition | `frontend/src/scenes/menu/**` plus matching tests |
| Battle effects | `frontend/src/battle/effects/**` plus effect tests |
| Test infrastructure | `tests/unit/architecture/**` and `scripts/validate-agent-workflows.mjs` |
| Documentation append | Orchestrator-owned `docs/CHANGELOG.md` and `docs/bugs.md` merge entries |

For shared files, partition inside the file:

- One stream may own only the `scripts` object in `package.json`.
- Another stream may own only `dependencies` and `devDependencies` in
  `package.json`.
- A worker may make one exact import-export line in an index file only when the
  prompt names that line.

## Worker prompt template

```text
You are working in worktree $worktree_path on branch $stream_branch based on
$integration_branch. Own only these paths or sections: $ownership. Do not edit
other files. If you discover a required cross-boundary change, report it instead
of making it unless this prompt names the exact one-line edit. Reuse the existing
node_modules symlink; do not run npm install. Run $checks and report validation,
changed files, conflicts, and follow-up risks.
```
