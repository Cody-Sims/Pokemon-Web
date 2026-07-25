# Integration Playbook

Use this reference when merging worker branches into the integration branch.

## Merge one branch at a time

```bash
git switch "$integration_branch"
git status --short
git merge --no-ff "$stream_branch"
npm run test
npm run build
git status --short
```

If the gate fails, fix the interaction before merging another branch. Do not merge
all branches first and debug the combined failure pile.

## Conflict handling

For append-only shared documents, preserve both sides and drop only conflict
markers:

```bash
perl -0pi -e 's/^<<<<<<<.*\n|^=======\n|^>>>>>>>.*\n//mg' docs/CHANGELOG.md docs/bugs.md
git diff --check
```

Use that shortcut only for append-only files where duplicate headings and both
entries are acceptable. For source files, inspect the conflict and keep the code
that satisfies the current ownership map and tests.

## Cross-cutting integration fixes

The orchestrator owns fixes that no worker could have seen in isolation, such as:

- Tooling config that stops covering files after a directory move.
- CPU-bound architecture tests that need explicit timeouts under parallel load.
- Build-generated tracked files that become dirty only after merged changes
  interact.

Keep these fixes small, name them in the merge report, and run the full gate again
after each one.

## Wave sequencing checks

Before starting the next wave, answer:

1. Did every merged branch pass the full gate after integration?
2. Are all shared docs conflict-free and chronological enough to read?
3. Did any stream request a cross-boundary change that should become the next
   wave's explicit ownership?
4. Is the live primary checkout still untouched unless its owner consented?
