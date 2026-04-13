# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through gym challenges. The entire game runs client-side as a static web app.

---

## Phase 1: Environment & Tooling Setup — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Dev server running, folder structure set up, assets sourced.

---

## Phase 2: Core Scenes Skeleton — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. All 12 scenes created with full Boot→Preload→Title→Overworld→Battle flow.

---

## Phase 3: The Data Layer — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. ~30 Pokémon, ~50 moves, ~15 items, 7 trainers, type chart, encounter tables, evolution data.

---

## Phase 4: Overworld Systems — ✅ COMPLETE\n> See [CHANGELOG.md](CHANGELOG.md) for details. Grid movement, Player/NPC/Trainer entities, EncounterSystem, InputManager, AnimationHelper, procedural map rendering, NPC spawning with flag-gated dialogue, map transitions via warps, wild encounter triggers in tall grass.

---

## Phase 5: Battle System — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Full turn-based battle with damage formula, type effectiveness, STAB, crits, status effects, EXP/level-up, nature modifiers, catch mechanics, AI controller.

---

## Phase 6: UI & Menus — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. All menus (Menu, Party, Summary, Inventory, Battle UI) navigable with keyboard + mouse. Shared theme system. 3-tab Summary with INFO/STATS/MOVES.

---

## Phase 7: Audio — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. AudioManager with crossfade, autoplay policy, safe playback. 8 BGM tracks + 16 SFX (synthesized placeholders). BGM wired into Title/Overworld/Battle scenes. SFX wired into menus and battle actions.

---

## Phase 8: Save / Load System — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. SaveManager with localStorage, SaveData interface, serialize/deserialize, Continue from title screen.

---

## Phase 9: Game Content — World Building — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. 6 maps (Pallet Town, Route 1, Viridian City, Route 2, Viridian Forest, Pewter City), starter selection, flag-gated NPCs, PokéCenter healing, trainer rewards & badges, story flow from Oak’s Lab to Boulder Badge.

---

## Phase 10: Polish & Quality of Life — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Battle intro animations, EXP bar, stripe/circle/fade transitions, evolution animation, configurable text speed, save from menu, continue from save.

---

## Phase 11: Deployment

**Goal:** The game is live on the web for anyone to play.

### 11.1 — Production Build
```bash
npm run build    # Outputs to dist/
```
- Vite tree-shakes, minifies, and bundles all TypeScript + assets.
- Verify the `dist/` folder runs locally via `npm run preview`.

### 11.2 — Hosting Options

| Platform | Method | Notes |
|----------|--------|-------|
| **GitHub Pages** | `npx gh-pages -d dist` or GitHub Actions | Free, simple, custom domain support |
| **Netlify** | Drag-and-drop `dist/` or Git integration | Free tier, automatic deploys on push |
| **Vercel** | Git integration | Free tier, fast CDN |
| **itch.io** | Upload `dist/` as HTML game | Game-focused community, embed support |

### 11.3 — CI/CD (Optional)
- GitHub Actions workflow: on push to `main` → `npm ci` → `npm run build` → deploy to GitHub Pages.
- Run `tsc --noEmit` as a type-check step before building.

### Deliverable
A public URL where anyone can play the game in their browser.

---

## Phase 12: Future Enhancements (Post-MVP)

These are stretch goals to expand the game after the core loop is complete:

### Content Expansion
- More towns, routes, and gyms (8 gym badges → Elite Four).
- Full 151 Pokédex (or a custom regional dex).
- Side quests and optional areas (caves, Safari Zone).
- Day/night cycle affecting encounters and NPC schedules.

### Features
- **Pokémon Evolution animations** with multi-condition support (level, item, trade-simulated).
- **TMs and HMs** — teach moves from items; HMs usable in overworld (Cut, Surf, Strength).
- **Pokémon Center & PokéMart** — healing animation, buy/sell items.
- **PC Storage System** — box-based Pokémon storage (Bill's PC).
- **Fishing** — rod items + water encounter tables.
- **Egg Hatching** — breeding-lite system.
- **Abilities** — passive effects per Pokémon species.
- **Held Items** — items with in-battle effects.
- **Weather** — rain, sun, sandstorm affecting battles and overworld visuals.
- **Mini-games** — Slot machines, Bug-Catching Contest.

### Multiplayer (Ambitious)
- WebSocket or WebRTC peer-to-peer battles.
- Trade Pokémon between players.
- Shared leaderboard.

### Technical
- **Mobile touch controls** — virtual D-pad overlay.
- **PWA support** — offline play via service worker.
- **Localization (i18n)** — multi-language text support.
- **Mod support** — load custom Pokémon/maps from JSON.
- **Automated testing** — unit tests for damage calc, save/load; integration tests for battle flow using Phaser's headless mode.

---

## Development Principles

### Modular & Data-Driven
Every Pokémon, move, item, and trainer is defined as data, not code. Adding new content means adding objects to arrays, not writing new classes.

### Scene Isolation
Scenes communicate only through `EventManager` and `GameManager`. No scene directly references another scene's internals.

### Build Small, Test Often
Each phase has a concrete deliverable. Test that deliverable manually before moving on. Don't build Phase 5 (battles) before Phase 4 (overworld) is solid.

### Copilot-Friendly Code
- **Descriptive function and variable names** — Copilot fills in logic better when names are clear.
- **Rich comments before complex functions** — describe intent, inputs, outputs, and edge cases.
- **Small, focused files** — one class or system per file. Copilot struggles with 500+ line files.
- **Typed everything** — interfaces and enums give Copilot the context to generate correct code.

### Version Control
- Commit at the end of each sub-phase.
- Use feature branches for large systems (e.g., `feature/battle-system`).
- Write brief commit messages describing what works now.

---

## Estimated Scope per Phase

| Phase | Description | Relative Effort |
|-------|-------------|----------------|
| 1 | Environment Setup | Small |
| 2 | Scene Skeleton | Small |
| 3 | Data Layer | Medium |
| 4 | Overworld Systems | Large |
| 5 | Battle System | Large |
| 6 | UI & Menus | Medium |
| 7 | Audio | Small |
| 8 | Save / Load | Small |
| 9 | World Content | Large |
| 10 | Polish | Medium |
| 11 | Deployment | Small |
| 12 | Future Enhancements | Ongoing |

---

## Quick-Start Checklist

- [x] Clone Phaser Vite TS template & verify dev server runs
- [x] Set up folder structure per architecture.md
- [x] Create all Scene stub classes (Boot → Preload → Title → Overworld → Battle)
- [x] Define TypeScript interfaces for PokemonData, MoveData, ItemData
- [x] Populate data for 3 starters + 10 route Pokémon + 20 moves
- [ ] Build first Tiled map (Pallet Town) with collision layers
- [x] Implement grid-based player movement with tween
- [ ] Implement NPC dialogue system
- [ ] Implement map transitions (warps)
- [ ] Implement wild encounter trigger in tall grass
- [x] Build the battle state machine (INTRO → turns → VICTORY/DEFEAT)
- [x] Implement damage formula with type effectiveness
- [x] Implement Poké Ball catching mechanic
- [x] Implement EXP gain and level-up
- [x] Build pause menu with party/bag/save options
- [x] Implement save/load to localStorage
- [x] Build Pokemon Summary screen (INFO / STATS / MOVES tabs)
- [x] Implement nature stat modifiers (+10%/-10%)
- [x] Add shared UI theme system (colors, fonts, spacing)
- [x] Download and integrate PokéAPI sprites (front/back/icon)
- [x] Add player walk-cycle spritesheet and animations
- [x] Load and display actual Pokemon sprites in battles and summary
- [ ] Add background music and sound effects
- [ ] Build maps for Route 1, Viridian City, Viridian Forest, Pewter City
- [ ] Implement first gym battle (Brock)
- [ ] Polish animations and transitions
- [ ] Deploy to GitHub Pages
