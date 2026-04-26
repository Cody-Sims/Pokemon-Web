# AI Ingestion Optimization Plan

> Plan for optimizing the Pokemon Web codebase for AI agent consumption across
> Copilot, Cursor, Claude Code, Aider, Windsurf, and similar tools.

**Created**: 2025-04-25
**Status**: In Progress

---

## Research Summary

### Techniques Identified (State of the Art)

| Technique | Source / Standard | Purpose |
|---|---|---|
| `AGENTS.md` | Open standard (20k+ stars on GitHub) | Universal AI context file read by Copilot, Cursor, Claude Code, Aider, Windsurf, and others |
| `llms.txt` | llmstxt.org standard | Lightweight index for external LLM contexts and chat-with-docs tools |
| Directory `CONTEXT.md` files | AI-optimized repo patterns (Google, Stripe, Vercel) | Navigational breadcrumbs so agents understand folder purpose without exploring every file |
| Path-specific `.instructions.md` | GitHub Copilot custom instructions | Domain-scoped rules triggered by `applyTo` glob patterns |
| Optimized root instructions | Copilot best practices | Architectural map, key entry points, common task recipes, file-finding shortcuts |
| Barrel-export documentation | AI code navigation pattern | Help agents understand barrel re-export trees |
| Dependency graph hints | Emerging pattern | Tell agents which modules depend on which, short-circuiting search |

### Key Principles

1. **Reduce search time**: AI agents waste tokens exploring directories. Explicit context
   files eliminate blind exploration.
2. **Scope instructions to paths**: Generic global instructions are noisy. Path-specific
   rules apply only when editing matching files.
3. **Universal format first**: AGENTS.md is read by every major AI tool. Copilot
   instructions supplement it for VS Code users.
4. **Concise over comprehensive**: AI context windows are precious. Dense, high-signal
   content beats verbose documentation.
5. **Task-oriented recipes**: "How do I add a move?" recipes beat abstract architecture
   descriptions for agent productivity.

---

## Current State Audit

### What Exists

| File | Quality | Issues |
|---|---|---|
| `AGENTS.md` (root) | Good | Has version drift (says TypeScript 6.x, Vite 8.x — should match actual `package.json`); no dependency graph; no anti-patterns section |
| `.github/instructions/copilot-instructions.md` | Adequate | Duplicates `AGENTS.md` content; lacks architectural map, task recipes, and file-finding shortcuts; version numbers stale |
| `.github/instructions/map-generation.instructions.md` | Good | Well-scoped to `frontend/src/data/maps/**` |
| `docs/architecture.md` | Good | Comprehensive but not AI-optimized (long, narrative) |
| Directory CONTEXT.md files | Missing | None exist — agents must explore every folder blindly |
| `llms.txt` | Missing | No external AI index |
| Battle/data/entity instructions | Missing | High-complexity areas have no scoped guidance |

### Duplication Problem

`AGENTS.md` and `copilot-instructions.md` share approximately 70% of their content.
This causes drift and wastes tokens when both are loaded. The fix: make `AGENTS.md`
the canonical source of truth for project-wide context, and focus
`copilot-instructions.md` on Copilot-specific behavioral rules (mandatory checks,
documentation requirements, git workflow).

---

## Implementation Plan

### Phase 1: Create Plan Document ✅

- [x] Audit current project files
- [x] Research AI ingestion best practices
- [x] Write this plan document

### Phase 2: Fix AGENTS.md (Universal AI Context) ✅

Update the root `AGENTS.md` to be the single source of truth for all AI agents.

- [x] Version numbers verified correct (TypeScript 6.x, Vite 8.x match `package.json`)
- [x] Add **Anti-Patterns** section (9 common AI mistakes with corrections)
- [x] Add **Dependency Graph** section (module import relationships)
- [x] Add **Key Interfaces** quick-reference (7 most-used types from `interfaces.ts`)
- [x] Add **File-Finding Shortcuts** (20 keyword → file mappings)
- [x] Expand **Common Tasks** with more recipes (adding Pokémon, trainers, items, maps)

### Phase 3: Optimize copilot-instructions.md ✅

Refocused on Copilot-specific behavioral rules. Removed duplicated context.

- [x] Remove duplicated project overview / tech stack / layout (now defers to `AGENTS.md`)
- [x] Keep and sharpen: mandatory checks (build, test, changelog, architecture)
- [x] Keep and sharpen: code conventions and git workflow
- [x] Add: **Scene Patterns** section with EventManager and TransitionManager rules
- [x] Add: **Data File Patterns** section with data-file conventions
- [x] Add: **Import Rules** section — barrel re-exports, path alias rules

### Phase 4: Add Directory CONTEXT.md Files ✅

Added `CONTEXT.md` to all 8 major source directories with navigational context.

- [x] `frontend/src/battle/CONTEXT.md` — Battle subsystem overview, FSM states, key classes
- [x] `frontend/src/data/CONTEXT.md` — Data layer overview, interface file location, barrel exports
- [x] `frontend/src/entities/CONTEXT.md` — Entity classes, inheritance chain, sprite conventions
- [x] `frontend/src/managers/CONTEXT.md` — Singleton services, which manager does what
- [x] `frontend/src/systems/CONTEXT.md` — Gameplay systems overview, subdirectory purposes
- [x] `frontend/src/scenes/CONTEXT.md` — Scene organization, domain folders, scene lifecycle
- [x] `frontend/src/ui/CONTEXT.md` — UI component library, theming, widget catalog
- [x] `frontend/src/utils/CONTEXT.md` — Utility module catalog, pure-function conventions

### Phase 5: Add Path-Specific Instruction Files ✅

Created 3 domain-specific instruction files with `applyTo` glob patterns.

- [x] `.github/instructions/battle.instructions.md` — Battle logic rules, FSM conventions,
  damage formula constraints (`applyTo: frontend/src/battle/**`)
- [x] `.github/instructions/data-files.instructions.md` — Data file conventions, interface
  adherence, barrel export rules (`applyTo: frontend/src/data/**`)
- [x] `.github/instructions/scenes.instructions.md` — Scene conventions, event bus patterns,
  scene registration rules (`applyTo: frontend/src/scenes/**`)

### Phase 6: Create llms.txt ✅

Added `llms.txt` in the project root following the llmstxt.org standard.

- [x] Create `llms.txt` with project summary and file index
- [x] Reference key documentation and instruction files

### Phase 7: Review and Validate ✅

- [x] Verify no content duplication between AGENTS.md and copilot-instructions.md
- [x] Verify all CONTEXT.md files are accurate to actual directory contents
- [x] Verify path-specific instruction `applyTo` patterns match real paths
- [x] Run `npm run build` — passes with zero errors
- [x] Update `docs/CHANGELOG.md`

---

## File Inventory (What Gets Created/Modified)

### Modified Files

| File | Change |
|---|---|
| `AGENTS.md` | Fix versions, add dependency graph, anti-patterns, expanded recipes |
| `.github/instructions/copilot-instructions.md` | Remove duplication, add Copilot-specific behavioral rules |
| `docs/CHANGELOG.md` | Log all changes |

### New Files

| File | Purpose |
|---|---|
| `docs/AI-OPTIMIZATION-PLAN.md` | This plan document |
| `frontend/src/battle/CONTEXT.md` | Battle subsystem navigation |
| `frontend/src/data/CONTEXT.md` | Data layer navigation |
| `frontend/src/entities/CONTEXT.md` | Entity classes navigation |
| `frontend/src/managers/CONTEXT.md` | Singleton services navigation |
| `frontend/src/systems/CONTEXT.md` | Gameplay systems navigation |
| `frontend/src/scenes/CONTEXT.md` | Scene organization navigation |
| `frontend/src/ui/CONTEXT.md` | UI components navigation |
| `frontend/src/utils/CONTEXT.md` | Utility modules navigation |
| `.github/instructions/battle.instructions.md` | Battle domain agent rules |
| `.github/instructions/data-files.instructions.md` | Data file agent rules |
| `.github/instructions/scenes.instructions.md` | Scene domain agent rules |
| `llms.txt` | External AI index (llmstxt.org standard) |

---

## Progress Log

| Phase | Status | Notes |
|---|---|---|
| 1. Plan Document | ✅ Complete | This file |
| 2. Fix AGENTS.md | ✅ Complete | Added dependency graph, key interfaces, file-finding shortcuts, expanded recipes, anti-patterns |
| 3. Optimize copilot-instructions.md | ✅ Complete | Removed duplication, added import/scene/data rules |
| 4. Directory CONTEXT.md files | ✅ Complete | 8 CONTEXT.md files across all major src directories |
| 5. Path-specific instructions | ✅ Complete | 3 new .instructions.md files (battle, data, scenes) |
| 6. Create llms.txt | ✅ Complete | llmstxt.org standard file with project index |
| 7. Review and validate | ✅ Complete | Build passes, no duplication, all paths verified |
