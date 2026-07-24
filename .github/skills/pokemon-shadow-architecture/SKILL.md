---
name: pokemon-shadow-architecture
description: 'Build, inspect, check, update, or render Pokemon Web''s .shadow decision architecture. Use for repository architecture decisions, evidence, and drift.'
user-invocable: true
disable-model-invocation: false
---

# Pokemon Shadow Architecture

Maintain this repository's `.shadow` decision architecture as an evidence-backed
view of the codebase. Treat hand-authored decision records as source and generated
indexes, graphs, dashboards, and reports as derived output.

## Start

1. Read `AGENTS.md` and the instructions that apply to every file in scope.
2. Read `.shadow/README.md`, then `.shadow/index.json` before other records.
3. Determine the requested mode: `inspect`, `build`, `check`, `update`, or `render`.
   When ambiguous, run read-only `inspect` and `check`.
4. Use `.shadow/features.json` to locate the owning domain and relevant decisions.

## Evidence Rules

* Anchor every material claim to current code, documentation, or tests using
  workspace-relative paths and symbols or headings when available.
* Record conflicting or missing evidence as drift or unknowns. Do not turn
  assumptions into decisions or infer historical intent.
* Keep observed behavior separate from proposed and accepted architecture.
* Treat derived output as disposable and never use it as a record's sole evidence.

## Modes

### Inspect

1. Inventory the index, source records, feature map, and derived output.
2. Trace each requested decision to its current anchors and evidence.
3. Report lifecycle state, contradictions, stale links, drift, and unknowns.

### Build

1. Build records only from verified repository evidence.
2. Draft desired decisions with `proposed` status.
3. Require human approval before moving a proposal to `accepted`.
4. Preserve unknown rationale rather than reconstructing history.

### Check

1. Run `npm run shadow:validate`.
2. Compare indexed claims with current code, docs, tests, and repository structure.
3. Report orphaned records, missing anchors, contradictions, and material changes
   that lack a decision record.
4. Do not repair findings unless `update` or `build` was requested.

### Update

1. Identify the architecture change and evidence before editing records.
2. Update affected records, the index, and feature mappings with the code change.
3. Never rewrite accepted history. Add a linked decision with `supersedes` and mark
   the old record `superseded`.
4. Refresh only derived output affected by source changes.

### Render

1. Read only reviewed records and indexes as authoritative inputs.
2. Mark output as derived and include regeneration provenance.
3. Never alter decision text, status, or evidence while rendering.

## Response

Return the mode performed, records read or changed, evidence paths, validation
results, drift, unknowns, and decisions awaiting human approval.