# Pokemon Web — Plan

> **Single source of truth for remaining work.** | April 2026
>
> A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**, set in the **Aurum Region**. The game is functionally complete — story, mechanics, performance, mobile, and visual polish all shipped. What remains is content expansion, replayability, and stretch features.

> References: [storyline.md](storyline.md) · [architecture.md](architecture.md) · [TestingArchitecture.md](TestingArchitecture.md) · [CHANGELOG.md](CHANGELOG.md)

---

## Current State

| Metric | Value |
|--------|-------|
| Build | Clean (zero TS errors) |
| Tests | 1,084 unit/integration + 18 E2E (Playwright) |
| Open bugs | 0 |
| Bundle | ~1.8 MB total (phaser 1.2 MB, battle 170 KB, index 393 KB) |
| Pokémon | 153 species · 217 moves · 79 maps · 50 achievements |
| Phases shipped | 20 development phases + 8 polish sprints |

The game is feature-complete: full 4-act storyline, 8 gyms, Elite Four, post-game,
deep battle system (singles/doubles/tag/synthesis/weather/abilities/items),
mobile-first UX, PWA, follower Pokémon, town map, minimap, scheduled NPCs,
async error boundaries, typed `EventManager`, decomposed `GameManager`/`BattleUIScene`,
Phaser tilemap rendering, texture atlas pipeline, dynamic music transitions,
weather-per-map, and a complete cutscene system.

The remaining roadmap is **content expansion**, **replayability**, and **stretch goals**.
Visual map polish and a few medium-effort battle/UX items round out the medium-term work.

> Detailed history of completed work lives in [CHANGELOG.md](CHANGELOG.md).

---

## Tier A — Content Expansion

*New things to do, fight, and find. Each item leverages the existing data-driven systems.*

### A.1 Battle Tower

Endless streak mode unlocked from the Pokémon League lobby.

- 7-battle streaks with Battle Points (BP) rewards.
- Tiers: Normal (Lv 50 cap), Super (Lv 100), Rental (pre-built teams).
- Every 7th battle is a Tower Tycoon boss with unique team and dialogue.
- BP shop: Choice Specs, Assault Vest, Life Orb, rare berries, ability capsules.
- New scene `BattleTowerScene` in `frontend/src/scenes/battle/`. Data-driven via a `TowerConfig` interface mirroring `TrainerData`.

### A.2 Side-Quest Expansion (8 new quests, 20 total)

| # | Quest | Location | Type | Reward |
|---|-------|----------|------|--------|
| 13 | Aether Anomalies | Regional (6 spots) | Exploration | Aether Charm (×2 shiny rate) |
| 14 | The Photographer | Routes 1–8 | Collection | Camera key item + Photo Album scene |
| 15 | Voltorb Tournament | Voltara City | Minigame | Coin Case + Game Corner access |
| 16 | The Fossil Collector | Pewter Museum → Caves | Fetch | Fossil revival → 2 fossil Pokémon |
| 17 | Rook's Redemption | Post-game, Shattered Isles | Story | Rook joins as optional partner |
| 18 | Gym Leader Gauntlet | Post-game, League | Battle | All 8 leaders sequentially → Gold Trainer Card |
| 19 | Marina's Expedition | Post-game, 3 rare habitats | Exploration | 3 new encounter zones |
| 20 | The Synthesis Cure | Post-game, Verdantia Lab | Story | Cure item for any Synthetic Pokémon |

### A.3 Fossil Pokémon (#154–155)

| ID | Name | Type | Fossil | Found |
|----|------|------|--------|-------|
| 154 | Lithoclaw | Rock/Water | Claw Fossil | Crystal Cavern Depths |
| 155 | Aerolith | Rock/Flying | Wing Fossil | Ember Mines |

Revival at Pewter Museum for 5,000 money.

### A.4 Move Pool Expansion (~30 new moves)

Fill gaps in underrepresented types so every type has at least 8 moves covering physical/special/status.

| Type | Current | Target | Examples |
|------|--------:|-------:|----------|
| Bug | 4 | 8 | Lunge, First Impression, U-Turn, Pollen Puff |
| Rock | 4 | 8 | Power Gem, Head Smash, Stealth Rock, Accelerock |
| Electric | 5 | 8 | Volt Switch, Wild Charge, Electroweb |
| Ice | 6 | 9 | Freeze-Dry, Icicle Crash, Aurora Veil |
| Ghost | 7 | 10 | Phantom Force, Spirit Shackle, Poltergeist |
| Steel | 7 | 9 | Bullet Punch, Heavy Slam |

### A.5 Berry & Held-Item Expansion

- 15 holdable berries (Sitrus, Lum, Chesto, Rawst, Aspear, Leppa, Oran, Persim, Pecha, Cheri, Figy, Wiki, Mago, Aguav, Iapapa).
- Berry trees on routes that regrow with `GameClock` time.
- 10 competitive held items: Choice Specs, Assault Vest, Rocky Helmet, Eviolite, Black Sludge, Weakness Policy, Light Clay, Heat Rock, Damp Rock, Smooth Rock.

---

## Tier B — Replayability

*Multiply the existing content rather than adding more of it.*

### B.1 Randomizer Mode

Seed-based shuffle layered over the data files at game start. Wraps `pokemon/`, `trainers/`, `encounter-tables.ts`, `tm-data.ts`, and `shop-data.ts`.

```typescript
interface RandomizerConfig {
  seed: string;
  shuffleWild: boolean;
  shuffleTrainers: boolean;
  shuffleStarters: boolean;
  shuffleTMs: boolean;
  shuffleShops: boolean;
  levelScaling: 'match' | 'progressive' | 'random';
}
```

### B.2 New Game+

- Carry one Pokémon from the previous run.
- All trainers scaled +5 levels.
- Gym Leaders use competitive teams with held items, EVs, and coverage moves.
- New post-Champion dialogue.
- Exclusive NG+ encounter: **Noctharion** at the end of Victory Road.

### B.3 Speed-Run Timer

- In-game timer overlay with splits at each gym, act transition, and champion defeat.
- Personal-best tracking in `GameStats`.
- Settings toggle. Splits exportable as JSON.

### B.4 Challenge Run Presets

Extends the existing Classic/Hard/Nuzlocke difficulty system.

| Mode | Rules |
|------|-------|
| Monotype | Only Pokémon of one chosen type |
| Solo Run | Only your starter, no party members |
| No Items | Items disabled outside Pokémon Centers |
| Minimal Catches | Beat the game with ≤6 total Pokémon |
| Randomizer Nuzlocke | Randomizer + Nuzlocke combined |

Each is a checkbox on the New Game screen. Track per-mode completion in achievements.

---

## Tier C — Visual & UX Polish

*Map-quality and visual polish items still open.*

### C.1 Map Visual Redesigns

Use `npm run map:gen`, `npm run map:compose`, `npm run map:validate`, and `npm run map:preview`. See [.github/instructions/map-generation.instructions.md](../.github/instructions/map-generation.instructions.md) for the toolchain.

#### City uniqueness (6 cities still using template layouts)

| City | Target biome tiles | Signature feature |
|------|---------------------|--------------------|
| Ironvale City | `METAL_FLOOR`, `PIPE`, `GEAR`, `CONDUIT`, `CLIFF_FACE` | Central forge with smoke |
| Voltara City | `CONDUIT`, `ELECTRIC_PANEL`, `WIRE_FLOOR`, `METAL_FLOOR` | Neon-lit tech plaza |
| Wraithmoor Town | `CRACKED_FLOOR`, `RUIN_WALL`, `RUIN_PILLAR`, `GRAVE_MARKER`, `MIST` | Ruined cathedral, graveyard |
| Scalecrest Citadel | `FORTRESS_WALL`, `DRAGON_SCALE_FLOOR`, `DRAGON_STATUE`, `CLIFF_FACE` | Fortress with courtyard |
| Cinderfall Town | `ASH_GROUND`, `EMBER_VENT`, `HOT_SPRING`, `LAVA_ROCK`, `MAGMA_CRACK` | Hot-spring caldera plaza |
| Coral Harbor | `DOCK_PLANK`, `WET_SAND`, `TIDE_POOL`, `PALM_TREE`, `CORAL_BLOCK` | Boardwalk + lighthouse |

Each city needs an organic (non-grid) building arrangement and at least one visible setpiece on entry.

#### Route polish

- **Route 6** (Voltara → Wraithmoor): tech-to-ruins gradient — `CONDUIT` remnants → `DARK_GRASS`, `AUTUMN_TREE` → `CRACKED_FLOOR`, `RUIN_PILLAR`, `MIST`.
- **Route 7** (Wraithmoor → Scalecrest): mountain pass — `CLIFF_FACE` walls, switchback paths, `BOULDER` obstacles, fog.
- **Route 4** (Basalt Ridge): more volcanic detail — `LAVA_ROCK`, `MAGMA_CRACK`, `VOLCANIC_WALL`.
- **Route 5** (Canopy Trail): jungle density — `VINE`, `MOSS_STONE`, `GIANT_ROOT`, `BERRY_TREE`.

#### Dungeon and interior polish

- **Ember Mines** — add `CONTAINMENT_POD`, `TERMINAL`, `AETHER_CONDUIT`, `SYNTHESIS_FLOOR`/`WALL` to the lab section.
- **Pokémon League** — expand the compact 10×10 chambers into proper multi-room layouts with unique per-E4 theming.
- **Pewter Museum** — expand with fossil exhibits, interactive displays, and quest items.
- **Viridian Gym** — currently NPC-blocked. Once flag-gated warp removal lands, switch to `requireFlag: 'gym8_unlocked'` warp.

### C.2 Battle UI Sprite Frames

Replace remaining rectangle-based battle UI elements with sprite-frame versions: HP/EXP bar containers, info panels, Pokémon platforms, move-grid backgrounds with type-colored frames.

### C.3 Overworld Visual Polish

- Window light shafts in interiors.
- Voltara neon glow.
- Aether crystal pulse animation.
- Quest-tracker HUD polish (icon, fade transitions).

### C.4 Custom Pixel Font and UI Atlas

- BMFont-format pixel font replacing Phaser's built-in text.
- Consolidated UI atlas (badge artwork, cursor sprites, gender icons).

### C.5 Cutscene Coverage

Author the remaining narrative beats so every major story moment has a cutscene (currently 18 shipped; about 10 outstanding moments).

### C.6 Achievement Trigger Coverage

Wire remaining triggers: every gym badge unlock, sweep-trainer, underdog-win, type-mastery milestones.

### C.7 Region Overview Map

Auto-generate a region map image from the warp graph — useful for the Town Map and for marketing screenshots.

---

## Tier D — Stretch Features

*High-effort items considered separately.*

### D.1 Multiplayer (WebRTC)

- Peer-to-peer 1v1 link battles.
- Lobby system with shareable room codes.
- Team preview, lead selection, JSON-serialized turn protocol.
- Spectator mode (read-only third client).

### D.2 Trading System

- Same room-code pairing as battles.
- Offer/confirm/trade flow with preview.
- Trade evolutions trigger on receive.
- Stretch: GTS-style async trading via lightweight backend.

### D.3 Safari Zone

- No battling — bait/rocks alter catch and flee rates.
- 30 Safari Balls per entry, 500-step limit.
- 5–8 exclusive species.
- Daily rotating Pokémon tied to `GameClock`.

### D.4 Breeding & Egg Hatching

- Pokémon Nursery in Verdantia Village.
- Egg groups based on species compatibility.
- Egg-move inheritance.
- Steps-to-hatch counter, accelerated by Bicycle.

### D.5 Photo Mode

- Pause → free camera with zoom and filters.
- Save as PNG to device.
- Photo Album scene in the menu.

### D.6 Save System Cloud Sync

- Export/import save as JSON file (zero-backend).
- Optional: tiny backend (Cloudflare Worker + KV) for cloud saves.
- Save versioning with migration functions.

### D.7 Localization (i18n) and Mod Support

- Multi-language support via a string registry.
- Custom JSON content loading for community mods.

---

## Working Principles

- **Data-driven**: Pokémon, moves, items, trainers, maps stay as plain data objects.
- **Scene isolation**: Scenes communicate via `EventManager` and `GameManager` only.
- **Barrel imports**: Import from directory `index.ts`, not individual module files.
- **Test before commit**: `npm run build` and `npm run test` are mandatory.
- **Update [CHANGELOG.md](CHANGELOG.md)** with date-grouped entries (Added/Changed/Fixed/Removed) for every code change.
- **Keep `CONTEXT.md` and `AGENTS.md` current** when adding, removing, or renaming files.
