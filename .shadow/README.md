---
title: Copilot Decision Graph
description: Observed architecture decisions for human and agent review
---

## Purpose

This directory is a concise, Copilot-oriented view of observed project decisions.
It is inspired by decision-graph approaches such as ShadowRepo, but `.shadow/` is
a project convention. It is not an official GitHub Copilot or ShadowRepo format,
and it does not claim plugin compatibility.

## Authority And Approval

Source code, tests, package scripts, and maintained project documentation take
precedence over this graph. Human maintainers approve changes through normal
review. Agents may propose updates, but must not treat an unreviewed record as
permission to override the repository.

## Agent Use

1. Start with `index.json` to find a relevant decision.
2. Use `features.json` to locate the owning domain.
3. Read the decision's anchors and evidence before changing code.
4. Recheck the current source when a record conflicts with implementation.

## Maintenance

When a code or workflow change alters an observed decision, update the affected
record, index, and feature mapping in the same change. Keep records concise and
preserve unresolved history in `Unknowns` rather than inferring intent.

Decision status has a reviewable lifecycle:

* `proposed` describes a desired decision awaiting maintainer approval.
* `observed` records a boundary verified in current implementation or guidance.
* `accepted` records an explicitly approved direction.
* `superseded` preserves a decision replaced by a linked newer record.
* `rejected` preserves a considered proposal that maintainers declined.

Relations use only the vocabulary declared in `index.json`. Replace accepted
history through a new `supersedes` relation rather than rewriting the old record.

## Generated Output

Derived summaries, diagrams, and caches are disposable generated output. They
must not replace these reviewed files or become authoritative. Commit generated
output only when a repository workflow explicitly requires it and a maintainer
reviews it.

## Contents

* `index.json` lists decision records and the allowed vocabulary.
* `features.json` maps repository domains to current paths.
* `decisions/` contains the observed decision records.
