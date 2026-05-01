# Map Improvements Plan — Aurum Region

> **Goal:** Transform every overworld, route, and dungeon map from a featureless rectangle into an
> elaborate, exploratory layout in the spirit of mainline Pokémon games (irregular borders, branching
> paths, ledges, hidden alcoves, field-ability gates, multi-tier elevation, and memorable landmarks).
>
> **Strategy:** Ship one focused phase at a time. Each phase covers a small, contiguous slice of the
> player's journey (typically 2–4 maps) so we can fully redesign, validate, and playtest that zone
> before moving on. **Do not start a new phase until the previous one is merged, validated, and
> tested.**
>
> **Last updated:** 2026-04-30

---

## 1. Why this matters

A quick audit of [frontend/src/data/maps](frontend/src/data/maps) shows:

| Issue | Evidence |
|---|---|
| All routes are perfect rectangles with a single straight central path | [route-1.ts](frontend/src/data/maps/routes/route-1.ts), [route-3.ts](frontend/src/data/maps/routes/route-3.ts), [route-5.ts](frontend/src/data/maps/routes/route-5.ts) — all 20 wide, single `PP` corridor down the middle |
| Cities are uniform grids of buildings around a cross-road | [viridian-city.ts](frontend/src/data/maps/cities/viridian-city.ts), [pewter-city.ts](frontend/src/data/maps/cities/pewter-city.ts) — both 30×30 with identical 4-quadrant layout |
| Dungeons are wide rectangles with east-west connectors | [viridian-forest.ts](frontend/src/data/maps/dungeons/viridian-forest.ts), [crystal-cavern.ts](frontend/src/data/maps/dungeons/crystal-cavern.ts) |
| Field abilities (Cut, Surf, Strength, Rock Smash) are implemented but never gate anything in the overworld | [OverworldAbilities.ts](frontend/src/systems/overworld/OverworldAbilities.ts) defines all six but virtually no map uses them as a gate |
| Ledges are placed sparsely and only as one-tile shortcuts, not as a real navigation system | grep `'J'` across [routes/](frontend/src/data/maps/routes) — almost always 1–2 row blocks |
| No optional/hidden rooms, no backtracking incentive, no items behind cuttable trees | only `route-1.ts` has any visible side-content and even that is symmetric |

Result: every map plays the same. Walk to the top, walk to the bottom. We can do better.

---

## 2. Design principles (apply to every phase)

### 2.1 Shape & flow

- **Break the rectangle.** Use [DENSE_TREE](frontend/src/data/maps/tiles.ts) (`X`), [TREE](frontend/src/data/maps/tiles.ts) (`T`), [CLIFF_FACE](frontend/src/data/maps/tiles.ts) (`^`), and water (`W`) to carve out non-rectangular playable areas. Coves, peninsulas, jutting headlands, inset clearings — never a clean 4-edge box.
- **Give every route a silhouette.** Routes should read as unique landforms, not bordered rectangles with a bent path inside. Use jagged treelines, diagonal cliff bands, water intrusions, grass islands, and asymmetric edge closures so the traversable area has a recognizable shape.
- **Branching paths.** Every route should have at least **one main path + one optional branch**. Cities should have at least **two through-routes** so the player chooses where to enter buildings from.
- **Loop, don't dead-end.** Hidden detours should rejoin the main path, not force a U-turn (unless they end at a reward).
- **Sightlines.** Trainer line-of-sight is a feature. Place trees, signs, and ledges to create detour-or-fight choices.
- **Door paths narrow to the door.** Building approaches should funnel to the actual door tile only. Do not draw wide `P` rectangles against walls or create visual side entrances into houses.
- **One physical door = one warp.** If a building façade has one `D`/`E`/`e`/`n`/`a` door tile, it should have exactly one building warp on that door. Multi-tile route exits are fine for outdoor boundaries, but building doors must not use multiple invisible side warps.

### 2.2 Verticality & ledges

- **Ledges are one-way shortcuts.** Use them to make backtracking from north → south fast while forcing south → north travelers to take the scenic route. Pattern: a long ledge run that drops the player two screens of progress.
- **Multi-tier maps.** For maps with `CLIFF_FACE` available (cave-side routes, mountains), use 2–3 elevation bands with stair tiles (`U`) and ledges (`J`) connecting them. The player should be able to *see* an item on a higher tier and have to find the way up.

### 2.3 Field-ability gates (most impactful change)

Every field ability should gate **at least one optional reward and one shortcut** in the post-Badge-2 game.

| Ability | Tile | Suggested usage |
|---|---|---|
| **Cut** (`cut`) | small-tree variant of `T` next to a path | Block side rooms with hidden TMs; open shortcuts on backtrack |
| **Surf** (`surf`) | `W` (water) | Open coastal expansions on Routes 3, 4, 7; ferry-only islets |
| **Rock Smash** (`rock-smash`) | `‡` (`CRACKED_FLOOR`) and similar | Cave shortcuts; hidden cave entrances on overworld routes |
| **Strength** (`strength`) | `q` (`BOULDER`) | Block dungeon doors; sliding-block puzzles in Crystal Cavern |
| **Flash** (`flash`) | `isDark: true` maps | Already used in Crystal Cavern; extend to Viridian Forest interior, Ember Mines |
| **Fly** | n/a | UX, not map design — covered in [IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) |

> **Note:** Use a "cuttable tree" tile (consider adding `Tile.CUT_TREE`) distinct from `T`/`X` so the
> player can tell at a glance what's interactive. Coordinate with [tiles.ts](frontend/src/data/maps/tiles.ts) and
> [tile-metadata.ts](frontend/src/data/maps/tile-metadata.ts).

### 2.4 Hidden content density

Aim for, per route or dungeon:
- 2–3 visible item balls (existing pattern is fine)
- 2–3 **hidden** items behind cuttable trees, smashable rocks, surf-only islets, or in flower clusters
- 1 cave/sub-area entrance (where biome supports it)
- 1 NPC tucked into a side path (lore, free heal, or item give)

### 2.5 Landmarks

Each map should have **one distinct visual landmark** the player can describe in one sentence:
"The route with the fishing pier", "The town with the pond", "The forest with the giant moss
boulder". Right now most maps would be described as "the rectangle".

### 2.6 Flexible dimensions

Map size is a design choice, not a constraint. Keep existing dimensions when the redesign fits, but
grow or shrink the grid when the silhouette, pacing, or landmark needs it. Do not enlarge maps just
to add empty grass; use added space for real branches, landmarks, or traversal choices.

Routes should especially prioritize unique shapes over fixed dimensions. A route can be tall and
narrow, squat and coastal, L-shaped, hourglass-shaped, or split by water/cliffs as long as its
connecting warps and spawn points are updated in lockstep.

#### Should we make routes wider?

Mostly yes — but only on routes that earn it. The current 20-wide template was built for a single
central path; once we introduce coastlines, peninsulas, cliff tiers, or branching, **20 columns is
cramped** because each of these features eats 3-6 columns of edge space. Use these targets:

| Silhouette                | Recommended width | Why                                                                                          |
|---------------------------|-------------------|----------------------------------------------------------------------------------------------|
| Forest interior           | 20-22             | Tree fringe takes 4-5 cols; a 3-wide path + 1 alcove run fits with room to wander            |
| Coastal (one shore)       | 22-26             | South shore eats ~5 cols of water + sand; need 16+ playable cols above it                    |
| Cliffside                 | 24-28             | Cliff face + soft fringe ~ 6 cols; reserve 16-20 for the path tier and any upper bench       |
| Peninsula (sea on 2 sides)| 22-28             | Each shore eats ~4 cols; the landmass narrows toward a tip                                   |
| Wide overworld (Routes 4, 7, 8 — coastal sweeps, plateaus) | 28-36 | Real horizontal routes; lets us place 2 parallel paths split by a ledge or water    |
| City                      | 30-36             | Existing 30-wide cities are fine; only grow when adding a real new district (e.g. Phase 4)   |
| Dungeon (BSP / cellular)  | 25-33 (odd)       | BSP requires odd dims; cellular caves below 22 produce mostly noise                          |

Heights stay roughly the same as today (24-40 for routes, 25-32 for dungeons). The biggest player
impact comes from **adding 2-6 columns of width** to coastal/peninsula/cliff routes, not from
stretching them taller. Anything ≥ 30 wide should justify the size with a real branch or split, not
empty grass.

### 2.7 Placement safety

- NPCs and trainers must not spawn on objects (`sign`, `item-ball`, `pc`, `door`, berry trees, etc.).
- Objects must be on walkable base tiles unless they intentionally replace a tile that the interaction
  system handles.
- Re-run the validator after every coordinate change; overlap warnings are blockers for the current
  phase even if the validator reports them as warnings for legacy-map compatibility.

### 2.8 Things to NOT change

- **Warp coordinates** stay where the connecting map expects them (or both sides update together).
- **Story-critical NPCs** (Rook, Pip, Wade, Kael, Marina, gym leaders) keep their roles and badge gating.
- **Encounter table keys** stay the same; tweak the table data, not the key, when changing grass density.
- **Interior gym/center/mart/lab maps** are already small and purposeful — they are **out of scope** for layout overhauls. Polish only (see Phase 13).

---

## 3. Per-map workflow (use for every map in every phase)

For each map in the phase:

1. **Read the current file** end-to-end. Note all NPC, trainer, object, warp, and spawn coords.
2. **Sketch the new layout** in a comment block at the top of the redesigned grid (or in `temp/`). Identify: main path, branches, ledges, gates, landmark, hidden items.
3. **Edit the character grid in-place** with targeted edits. Per [AGENTS.md anti-patterns](AGENTS.md), never rewrite the whole grid — preserve unchanged regions to keep diffs reviewable.
4. **Update coordinates** for any NPC/trainer/object whose tile shifted. Use the line-comment `// 0` ... `// 39` row markers to keep counting honest, and verify no NPC/trainer shares a tile with an object.
5. **Re-validate warps and doors.** If the entry/exit `PP` columns moved, also update the connecting map's `warps` block and any `SpawnPoint`. For buildings, keep one physical door tile paired with one warp, then make the path narrow to that door.
6. **Run the toolchain:**
   ```bash
   npm run map:validate -- --map <map-key>
   npm run map:preview  -- --map <map-key>
   open temp/map-previews/<map-key>.ppm   # eyeball it
   ```
7. **Run targeted tests:**
   ```bash
   npm run test -- <map-key>
   ```
8. **Full build + tests:**
   ```bash
   npm run build && npm run test
   ```
9. **Update [docs/CHANGELOG.md](docs/CHANGELOG.md)** under today's date with a `Changed` entry per redesigned map.
10. **Update the phase checklist below** by ticking the map.

---

## 4. Phase Roadmap

Phases are ordered by **player progression**. Finish a phase fully before starting the next so each
zone ships as a complete experience.

| # | Phase | Maps | Theme |
|---|---|---|---|
| 0 | Tooling & shared tiles | tile additions, parser, validator | Foundations for the rest |
| 1 | Littoral Town arc | `pallet-town`, `route-1` | Coastal start, dock landmark |
| 2 | Viridian arc | `viridian-city`, `route-2`, `viridian-forest` | Forest sprawl & first dungeon |
| 3 | Pewter & Tide Pools | `pewter-city`, `route-3` | Mountain town meets seaside |
| 4 | Coral Harbor & Route 4 | `coral-harbor`, `route-4` | Surfable peninsula |
| 5 | Ironvale & Ember Mines | `ironvale-city`, `route-5`, `ember-mines` | Industrial + hot mine puzzle |
| 6 | Verdantia & the Canopy | `verdantia-village`, `verdantia-lab`, `route-6` | Treetop village, dense canopy |
| 7 | Voltara & Route 7 | `voltara-city`, `route-7` | Storm coast, electrified plateau |
| 8 | Cinderfall & Route 8 | `cinderfall-town`, `route-8` | Volcanic ridges, lava cliffs |
| 9 | Wraithmoor & Crystal Cavern | `wraithmoor-town`, `crystal-cavern`, `crystal-cavern-depths` | Misty graveyard + crystal maze |
| 10 | Scalecrest & Victory Road | `scalecrest-citadel`, `victory-road` | Final dragon citadel + gauntlet |
| 11 | Pokémon League | `pokemon-league` | Champion's hall (interior only) |
| 12 | Post-game dungeons | `abyssal-spire-f1`–`f5`, `aether-sanctum`, `shattered-isles-shore`/`ruins`/`temple` | End-game depth |
| 13 | Interior polish pass | all 33 interiors | Touch-up only |
| 14 | Region-map & connectivity audit | cross-map | Verify the world reads as a region |

---

## Phase 0 — Tooling & shared tiles

**Goal:** Make sure later phases have everything they need before we touch a single map.

### 0.1 Add a dedicated cuttable-tree tile

Right now `T` and `X` are both visually trees and neither is interactive. Add:

- `Tile.CUT_TREE` in [tiles.ts](frontend/src/data/maps/tiles.ts)
- Char mapping (suggest `'>'` or `'¿'` to avoid existing chars) in [map-parser.ts](frontend/src/data/maps/map-parser.ts)
- Sprite/color in [tile-metadata.ts](frontend/src/data/maps/tile-metadata.ts)
- Hook into [OverworldAbilities](frontend/src/systems/overworld/OverworldAbilities.ts) so `cut` clears the tile (write to a runtime overlay; do not mutate the source grid)
- Unit test in [tests/unit](tests/unit) covering: walk-into → prompt; cut → walkable

### 0.2 Audit the smashable-rock tile

`‡` (`CRACKED_FLOOR`) is in the parser but no map uses it. Decide: use `~` (existing `ROCK`) for
smashables or introduce `Tile.SMASH_ROCK`. Pick one and document it in [maps/CONTEXT.md](frontend/src/data/maps/CONTEXT.md).

### 0.3 Map-validator upgrades

Extend [tools that back](frontend/src/data/maps/map-parser.ts) `npm run map:validate` to flag:

- A map whose playable area is a perfect rectangle (heuristic: count border tiles that are tree/cliff/water — should be irregular)
- A map with no field-ability tile at all post-Badge-2 (warning, not error)
- Warps that do not match the connecting map's spawn point

### 0.4 Region-map preview script

Update `npm run map:region` ([temp/region-map.ppm](temp/region-map.ppm)) so we can eyeball the whole
Aurum region after each phase and confirm the world still feels coherent.

### 0.5 Procedural non-rectangular generator (shipped 2026-04-30)

The original phases of this plan all start from a *rectangular* generated grid and then carve. To
make redesign cheaper, the toolchain now ships a procedural alternative that produces
non-rectangular layouts directly. Use it as a **first-draft tool** for any route in Phases 1-10 —
not as a one-shot map generator.

#### What it provides

- [temp/scripts/map-gen/core/value-noise.ts](temp/scripts/map-gen/core/value-noise.ts) — seeded 2-D value noise + fBm.
- [temp/scripts/map-gen/core/border-shaper.ts](temp/scripts/map-gen/core/border-shaper.ts) — `shapeOrganicBorder`, `carveCoastline`, `carveCliffEdge`, `punchEntrance`. Every pass runs a flood-fill connectivity guard so the player can never be walled off.
- [temp/scripts/map-gen/algorithms/organic-route.ts](temp/scripts/map-gen/algorithms/organic-route.ts) — `generateOrganicRoute` with four silhouettes (`forest`, `coastal`, `cliffside`, `peninsula`), meandering paths, branch alcoves and one-way ledges.
- CLI: `npm run map:gen -- organic-route` with `--shape`, `--roughness`, `--seed`, `--biome`, `--format`, `--no-ledges`.

The generator emits the same neutral character alphabet as `route-carver`, so all 10 biome themes
(`volcanic`, `ghost`, `dragon`, `mine`, `electric`, `synthesis`, `cave`, …) and TypeScript export
work unchanged.

#### Recipe: use it on a real map

For any route in Phases 1-10, follow this recipe instead of authoring the grid by hand:

1. **Pick the silhouette** that matches the phase brief and the width target from
   [Section 2.6](#26-flexible-dimensions). For example, Phase 1 Route 1 wants a
   `coastal` shape at 22-24 wide.

2. **Generate 3-5 candidates** with different seeds and write them to disk so you can compare:

   ```bash
   for seed in 7 13 21 42 99; do
     npm run map:gen -- organic-route \
       --width 24 --height 38 --shape coastal --seed $seed \
       --format grid --out temp/map-previews/route-1-draft-$seed.txt
   done
   ```

3. **Eyeball each draft** and pick the one whose path runs near where the existing warps live.
   The generator's default entrances are north/south at the centre — if your real map needs warps
   off-centre, edit `entrances` directly in a small wrapper script under `temp/scripts/`.

4. **Export to TypeScript** for the chosen seed:

   ```bash
   npm run map:gen -- organic-route \
     --width 24 --height 38 --shape coastal --seed 13 \
     --format typescript --out temp/generated-maps/route-1-draft.ts
   ```

5. **Lift the `parseMap([...])` block only** into [route-1.ts](frontend/src/data/maps/routes/route-1.ts).
   Keep the existing `npcs`, `trainers`, `objects`, `warps`, and `spawnPoints` arrays — *do not*
   blow them away. The generated `MapDefinition` object exists only as a scaffold for the grid.

6. **Re-anchor coordinates.** For every NPC, trainer, sign, item ball and warp, re-pick a tile in
   the new grid that is walkable and on or beside the meandering path. Ledges (`J`) must not block
   the only northbound route.

7. **Sanity-check:** the generator prints the alcove and ledge counts to stderr — record them in
   the commit message. Two alcoves are the natural homes for hidden items behind cuttable trees.

8. **Run the toolchain** from [Section 3](#3-per-map-workflow-use-for-every-map-in-every-phase):

   ```bash
   npm run map:validate -- --map route-1
   npm run map:preview  -- --map route-1
   npm run build && npm run test
   ```

#### When *not* to use the generator

- **Cities and interiors.** The generator does not understand buildings, so towns still need to be
  hand-authored or driven by `npm run map:compose`. Use the organic generator only for the
  surrounding landscape if a town has one.
- **Story-critical map shapes.** Any map whose layout is referenced by a cutscene script (e.g.
  Wraithmoor's misty graveyard) must be hand-tuned to match the storyline beats.
- **Final polish.** The generator is for the *first draft*. Hand-edit the output for landmarks,
  trainer lines of sight, and the one-screen-readable feel.

#### Quick reference

```bash
# Forest interior route
npm run map:gen -- organic-route --width 22 --height 36 --shape forest --seed 7

# Coastal route with a wavy southern shore
npm run map:gen -- organic-route --width 24 --height 32 --shape coastal --seed 13

# Cliffside route, biome-themed for Verdantia
npm run map:gen -- organic-route --width 26 --height 30 --shape cliffside --biome forest --seed 5

# Peninsula route (sea on east + west)
npm run map:gen -- organic-route --width 24 --height 30 --shape peninsula --seed 21

# Volcanic route with biome substitution
npm run map:gen -- organic-route --width 24 --height 32 --shape coastal --biome volcanic --seed 9
```

**Acceptance:** New tiles render in `npm run map:preview`. `npm run build && npm run test` is green.
[docs/CHANGELOG.md](docs/CHANGELOG.md) and [maps/CONTEXT.md](frontend/src/data/maps/CONTEXT.md) updated.

---

## Phase 1 — Littoral Town arc

**Maps:** [pallet-town.ts](frontend/src/data/maps/cities/pallet-town.ts) (Littoral Town),
[route-1.ts](frontend/src/data/maps/routes/route-1.ts)

### 1.1 Littoral Town redesign

**Current:** Symmetric 2-house town with a southern dock and lab.

**Target:** Crescent-shaped seaside town hugging a curved bay.

- Replace the straight north tree-line with a **shallow inland cliff** (`^`) that curves along the
  northwest, hiding a small cuttable-tree alcove with a hidden Potion (gateable post-Cut).
- Bend the southern coastline into a **C-shaped bay**: dock juts further out east, sandy beach
  curves around to the west, with **tide pools** (`6`/`7`) replacing the southwest water column.
- Put Wade's dock **off-center** (currently dead-center) and add a **rowboat object** at the end as a
  visual anchor (post-game: enables a hidden-island warp).
- Add a **flower garden** south of Player's house (one of the houses) so the home block reads as
  someone's actual yard.
- The two southernmost rows of houses should each have a small wooden fence around the yard, not
  just open grass.

### 1.2 Route 1 redesign

**Current:** Single straight `PP` corridor down the middle, two ledges, four meadows.

**Target:** S-curve route with a forked midsection.

- Bend the path into a true **S-curve**: starts west-of-center at the north entry, swings east across
  the middle, then west again before exiting south.
- Add a **fork** around row 18–22: the main path continues south, a side branch leads east to a
  small clearing with a flower bed, a bench (sign), and a **cuttable tree** blocking a hidden Antidote
  (Phase 1 ships the tree empty; Phase 0 powers Cut, but Cut is post-Badge-2 — that's the point).
- Add **two long ledges** running 4–6 tiles wide, one on each fork branch, so southbound runners get
  a real shortcut while northbound trainers must engage the trainers.
- Replace the symmetric grass blocks with **organic patches** of varying size (3, 5, 8 tiles) and add
  one `LIGHT_GRASS` (`5`) cluster to telegraph low-level encounters.
- Add a small **stream** (3-tile wide `W` band) crossing the route west-to-east near row 26, with two
  log-bridge tiles (`P` over `W` visually, but kept as `P`). Surf-only side path opens a hidden item.
- Move Rook's flower clearing to the new east branch; he stays in the same logical position
  narratively (player rest stop) but it now feels like a discovered place, not a corridor.

**Acceptance for Phase 1:**

- [ ] Both maps validate; both render correctly in `map:preview`.
- [ ] All existing NPC/trainer/warp coords still work or are updated in lockstep.
- [ ] Building approaches narrow to the door tile; no house has a visual side entrance or multiple building warps for one door.
- [ ] No NPC/trainer shares a tile with a map object.
- [ ] The full route can be traversed top-to-bottom without ledge backtracking; bottom-to-top requires engaging at least one trainer.
- [ ] At least one Cut-gated and one Surf-gated reward exists across the two maps.
- [ ] Tests in [tests/integration](tests/integration) covering Route 1 traversal still pass.

---

## Phase 2 — Viridian arc

**Maps:** [viridian-city.ts](frontend/src/data/maps/cities/viridian-city.ts) (30×30),
[route-2.ts](frontend/src/data/maps/routes/route-2.ts) (20×30),
[viridian-forest.ts](frontend/src/data/maps/dungeons/viridian-forest.ts) (25×40)

### 2.1 Viridian City redesign

- Replace the perfectly symmetric 4-block layout with a **river running through the city** (NW → SE
  diagonal `W` band) crossed by 2 bridges.
- North side: PokéMart + PokéCenter on the high bank.
- South side: Gym + civilian houses on the low bank.
- Add a **west-side park** (flowers, pond, bench signs) where the gym-block NPC currently stands.
- The northern Route 2 exit should be at the **northeast** corner instead of dead-center, forcing
  the player to walk through the city.
- Add a **Cut tree** blocking access to a small alley with a free Repel (post-Badge-2 backtrack).

### 2.2 Route 2 redesign

- Convert into an **L-shaped** route: north entry from Viridian Forest is at the top-right; route
  bends west halfway down, then south into Viridian City.
- The L-bend should sit on a **2-tile cliff** with stairs (`U`) so the player can see the south leg
  from the north leg before they get there.
- Add a **lone NPC's house** (single `R`/`H`/`D` building) tucked into the bend's interior — this is
  the Day Care candidate site (or a free-heal old man, designer's choice).
- Add 2 cuttable trees along the cliff face: one blocks an item ball (Awakening), one opens a
  dungeon back-entrance to Viridian Forest from the south side.

### 2.3 Viridian Forest redesign

This is our **first real exploration map** — it should set the tone for every dungeon.

- Replace the 4 east-west connector strips with a **branching tree-trail layout**: imagine a
  capital-Y shape rotated 90°. Player enters from the south, can take left or right at the first
  fork, both forks rejoin at a north clearing, north clearing exits to Pewter.
- Make the entire interior `isDark: false` but **add a "deep grove"** sub-area (5×6 cells of
  `DARK_GRASS` (`4`) and `MOSS_STONE` (`¢`)) that *is* dark — gated by a Flash-equivalent or just
  thematically dim. Trainers in the grove are higher-level "lost in the forest" trainers.
- Add **3 cuttable trees** opening hidden item alcoves: a Net Ball, a Repel, a Berry Tree (`¤`).
- Add a **giant root** (`£`) landmark at the central clearing — a literal "you are here".
- Hide one trainer behind dense foliage so the player walks into the line-of-sight by surprise.

**Acceptance:** All three maps validate, render, test. Player journey from Littoral → Pewter feels
like three different places now. Forest can be traversed in 2–3 distinct paths.

---

## Phase 3 — Pewter & Tide Pools

**Maps:** [pewter-city.ts](frontend/src/data/maps/cities/pewter-city.ts) (30×30),
[route-3.ts](frontend/src/data/maps/routes/route-3.ts) (20×40)

### 3.1 Pewter City — mountain town

- North half of the city sits on a **raised plateau** (cliff face along row 12), accessed via a
  central staircase. Museum and Gym are up top.
- South half (low ground) holds the PokéCenter, Mart, and houses.
- Add a **rocky outcrop** in the NE corner with smashable rocks (post-Badge-2) hiding a Hard Stone
  (held item).
- The west exit toward Route 3 should be a **switchback path** down the cliff, not a straight gap.

### 3.2 Route 3 redesign

**Current:** Coastal route with rigid alternating "tide pool / inland meadow" bands.

**Target:** True coastal cliffside route.

- Replace the alternating bands with a **continuous cliff line** along the west edge with 1–2
  natural breaks where the player can drop down to the beach.
- Beach below the cliff: surf-only segment leading to a **small islet** with a hidden Heart Scale
  pile (3 hidden items).
- Inland (east of the path): one larger meadow block with **3 trainers** placed to give choice-of-
  fight via ledges, not symmetry.
- Add a **rope bridge** (sequence of `8` dock-plank tiles over `W`) crossing a tide-pool gully
  midway.
- Move the lone palm tree from the existing rigid pattern to a memorable lone-palm-on-a-rock
  landmark.

**Acceptance:** Route 3 can be traversed without surf, but ~30% of items require Surf and ~10%
require Rock Smash (backtracking content).

---

## Phase 4 — Coral Harbor & Route 4

**Maps:** [coral-harbor.ts](frontend/src/data/maps/cities/coral-harbor.ts) (25×30),
[route-4.ts](frontend/src/data/maps/routes/route-4.ts) (20×30)

### 4.1 Coral Harbor — multi-pier town

- Convert the southern coast into **3 distinct piers** at different lengths, with the gym (water
  type) at the end of the longest pier — surrounded by water on 3 sides.
- Add **floating dock walkways** (`8` tiles) connecting two of the piers so you can shortcut
  across without backtracking inland.
- North of the city: a **boardwalk** loop (a small ring of path tiles around a market square with
  benches/signs).
- Hidden NPC fisher on a remote pier gives a Good Rod (currently Good Rod is gated by a different
  trigger — coordinate with [docs/storyline.md](docs/storyline.md)).

### 4.2 Route 4 — peninsula loop

- Make Route 4 a **peninsula** rather than a corridor. Player enters from the north, the route
  branches east + west around a central body of water, and both branches end at warps to the next
  area.
- The **east branch** is the canonical (story-required) path with trainers.
- The **west branch** requires Surf to fully complete and rewards hidden items + a wild encounter
  zone with Water Pokémon (re-use the encounter table or add a `route-4-west` variant).
- Add a **tiny offshore islet** (3×3) reachable only by Surf with a sign giving regional lore.

---

## Phase 5 — Ironvale & Ember Mines

**Maps:** [ironvale-city.ts](frontend/src/data/maps/cities/ironvale-city.ts) (24×30),
[route-5.ts](frontend/src/data/maps/routes/route-5.ts) (22×30),
[ember-mines.ts](frontend/src/data/maps/dungeons/ember-mines.ts) (20×25)

### 5.1 Ironvale — industrial district

- Use the **METAL_FLOOR** (`Ʃ`), **METAL_WALL** (`Ɯ`), **PIPE** (`π`), **GEAR** (`Ω`) tiles
  liberally — currently underused.
- Layout: **factory complex** (large building) on the east, residential on the west, separated by a
  rail line (`=` MINE_TRACK as a horizontal band).
- Gym is integrated into the factory — its entrance is at the end of an alley between two factory
  blocks.
- Synthesis Collective storyline beat: a **suspicious warehouse** with a guard NPC (currently
  generic) tucked behind a Strength-blocked alley (post-Badge-4 reveal).

### 5.2 Route 5 — rail-side path

- The route runs **alongside a rail line** (`=` band) rather than down the middle. The rail crosses
  the path at one point — uses path tiles, not a tile mechanic.
- East side: industrial debris (rocks, pipe segments, a **strength-blocked** warehouse door
  hiding a Macho Brace).
- West side: an abandoned **mine shaft entrance** (warp into Ember Mines back-door, requires Cut to
  reach).

### 5.3 Ember Mines — first proper puzzle dungeon

- Currently 20×25 of cave with no puzzle.
- Add **boulder pushing**: 3 boulders (`q`) the player must push (Strength) onto pressure plates
  (`±` HOT_SPRING repurposed, or a new `Tile.PRESSURE_PLATE`) to open a south door.
- Add **mine tracks** (`=`) with **mine-cart objects** that act as one-way ledges.
- Add **lava cracks** (`µ`) the player must navigate around — visual hazard, not damage.
- Reward: TM Earthquake or similar gym-equivalent prize at the bottom.

> **Note:** Boulder-push is a runtime mechanic. Coordinate with [overworld systems](frontend/src/systems/overworld/).
> If unsupported, ship Phase 5 with `q` as static decor and file a follow-up.

---

## Phase 6 — Verdantia & the Canopy

**Maps:** [verdantia-village.ts](frontend/src/data/maps/cities/verdantia-village.ts) (24×25),
[verdantia-lab.ts](frontend/src/data/maps/dungeons/verdantia-lab.ts) (15×18),
[route-6.ts](frontend/src/data/maps/routes/route-6.ts)

### 6.1 Verdantia Village — treetop town

- Convert to a **layered village** built into a forest. Use `GIANT_ROOT` (`£`), `VINE` (`¡`), and
  `BERRY_TREE` (`¤`) as architectural elements.
- Houses are **small clearings** scattered among trees, connected by paths — not a grid block.
- The Gym (Grass type) is set deep among trees; entrance requires walking through a **vine corridor**
  that conceals it from the main square.
- Marina's research lab cabin is **west of the village**, off the main path, so meeting her there
  feels intimate.

### 6.2 Verdantia Lab — interior puzzle pass

- Currently 15×18 small interior. Add a **basement** (multi-floor variant) with a research console
  the player needs to interact with for an Act 2 plot beat. (Coordinate with
  [cutscene-data.ts](frontend/src/data/cutscene-data.ts).)

### 6.3 Route 6 — Canopy Trail

- Layer the route into **two elevation tiers**: a forest floor (default ground) and a **raised
  vine bridge** loop (path tiles framed by `¡` vines).
- The vine bridges are reached via stairs (`U`) on tree trunks (`£`).
- Dense canopy (`X`) sections require zig-zag navigation; one of them hides a third path that
  bypasses the canopy — discoverable only by reading a sign.

---

## Phase 7 — Voltara & Route 7

**Maps:** [voltara-city.ts](frontend/src/data/maps/cities/voltara-city.ts) (24×30), `route-7.ts`

### 7.1 Voltara City — high-tech plateau

- Use **WIRE_FLOOR** (`§`), **CONDUIT** (`¥`), **ELECTRIC_PANEL** (`¦`).
- Layout: city is on a **plateau** with stair-cliff descents on three sides; **lightning rod
  towers** at the four corners are visual landmarks.
- The PokéCenter is half-built into a former power substation (interior reuses INDOOR_WALL).
- Hidden NPC: Magnus's contact, behind a **Strength-blocked** maintenance door near the gym.

### 7.2 Route 7 — Stormbreak approach

- Route 7 enters Stormbreak Pass storyline; layout should foreshadow a stormy ridge.
- Use `ASH_GROUND` (`«`), `EMBER_VENT` (`»`) sparingly to hint at volcanic territory ahead.
- Cliffside route with **frequent ledges** the player can drop from to bypass trainers (one-way).
- A **lookout point** sub-clearing midway with a sign giving lore about the ley lines.

---

## Phase 8 — Cinderfall & Route 8

**Maps:** [cinderfall-town.ts](frontend/src/data/maps/cities/cinderfall-town.ts), `route-8.ts`

### 8.1 Cinderfall Town — volcanic ridge

- Build the town **into the slope of a volcano**: northern half is on a high cliff (with the gym +
  PokéCenter), southern half is at sea level (with the houses and a small port).
- A **central staircase** is the only safe way up; a lava-rock scramble on the east side is a
  Strength shortcut.
- Use `LAVA_ROCK` (`Ø`), `MAGMA_CRACK` (`µ`), `VOLCANIC_WALL` (`Þ`) for thematic borders.

### 8.2 Route 8 — Stormbreak Pass

- The most dramatic route. **Three-tier cliff** layout:
  - Top tier: cold/wind-swept narrow path, most trainers, the rival encounter.
  - Middle tier: cave entrance to Crystal Cavern, optional fight.
  - Bottom tier: shoreline with surf access to a hidden Heart Scale beach.
- The path **switchbacks** down the cliff with stairs and ledges — ledges drop you down a tier
  one-way.
- Use `MIST` (`°`) on the top tier so the cliff feels treacherous.

---

## Phase 9 — Wraithmoor & Crystal Cavern

**Maps:** [wraithmoor-town.ts](frontend/src/data/maps/cities/wraithmoor-town.ts),
[crystal-cavern.ts](frontend/src/data/maps/dungeons/crystal-cavern.ts) (20×30),
[crystal-cavern-depths.ts](frontend/src/data/maps/dungeons/crystal-cavern-depths.ts)

### 9.1 Wraithmoor Town — graveyard town

- Use `GRAVE_MARKER` (`†`), `MIST` (`°`), `CRACKED_FLOOR` (`‡`), `RUIN_PILLAR` (`©`).
- Layout: town wraps around a **cemetery hill** in the center. Gym is at the top of the hill,
  reached by a path that **spirals up** between gravestones.
- Mist obscures sightlines (visual only); a sign at each gate warns travelers.

### 9.2 Crystal Cavern — vertical maze

- Already 20×30 with a "boulder maze" intent but is one rectangle. Re-design as a **3-chamber
  vertical maze** with twisting corridors:
  - Entrance hall (south)
  - Boulder maze chamber (middle) — actual Strength puzzle gates the way north
  - Crystal shrine chamber (north) — landmark with a glowing crystal cluster (`÷`)
- Add a **light-source layout** that rewards Flash use — currently lights are placed at fixed
  spots; instead, leave parts of the cavern dark with a single light source so Flash genuinely
  helps.

### 9.3 Crystal Cavern Depths

- Post-game dungeon. Make this **multi-level** (use 2–3 stitched maps if a single grid is too small)
  with branching paths, all leading to a legendary encounter chamber. Out of scope to fully spec
  here — Phase 12 covers post-game in detail.

---

## Phase 10 — Scalecrest & Victory Road

**Maps:** [scalecrest-citadel.ts](frontend/src/data/maps/cities/scalecrest-citadel.ts),
[victory-road.ts](frontend/src/data/maps/dungeons/victory-road.ts)

### 10.1 Scalecrest Citadel — fortress city

- This is the dragon-themed Badge 8 city. Currently a town; should feel like a **citadel**.
- Use `FORTRESS_WALL` (`Æ`), `DRAGON_SCALE_FLOOR` (`Ð`), `DRAGON_STATUE` (`ð`).
- Layout: outer ward (commerce, civilians) → inner ward (gym + champion's hall facade) →
  draconic shrine. Two gates separate the wards.
- Champion's facade is a visible landmark (closed until post-League).

### 10.2 Victory Road — gauntlet dungeon

- This must feel like a final challenge. Multi-room dungeon with:
  - Boulder Strength puzzles
  - Flash-required dark sections
  - Optional Surf path leading to a side room with a TM
  - Multiple trainers placed at choke points
  - One **shortcut** that opens after the first time through (one-way ledge back to the entrance)
- 30+ tile width acceptable; don't artificially constrain.

---

## Phase 11 — Pokémon League

**Map:** [pokemon-league.ts](frontend/src/data/maps/interiors/pokemon-league.ts)

This is an interior. Layout improvements only:

- Distinct **room shapes** for each E4 member matching their type (water arena, rock arena,
  psychic-runed arena, dark/ghost shadowed arena).
- Champion's hall with a long approach corridor for dramatic effect.
- See [sprites-improvement-plan.md](docs/sprites-improvement-plan.md) for sprite fixes — coordinate.

---

## Phase 12 — Post-game dungeons

**Maps:** [abyssal-spire-f1.ts](frontend/src/data/maps/dungeons/abyssal-spire-f1.ts) through
[abyssal-spire-f5.ts](frontend/src/data/maps/dungeons/abyssal-spire-f5.ts),
[aether-sanctum.ts](frontend/src/data/maps/dungeons/aether-sanctum.ts),
[shattered-isles-shore.ts](frontend/src/data/maps/dungeons/shattered-isles-shore.ts),
[shattered-isles-ruins.ts](frontend/src/data/maps/dungeons/shattered-isles-ruins.ts),
[shattered-isles-temple.ts](frontend/src/data/maps/dungeons/shattered-isles-temple.ts)

These are end-game; they should be the **most elaborate** maps in the game.

### 12.1 Abyssal Spire — 5-floor tower

- Each floor a distinct shape and challenge. Some ideas:
  - **F1:** entry hall with a maze of Synthesis containment pods (`Ŋ`)
  - **F2:** lab corridors with terminals (`ƫ`) the player interacts with
  - **F3:** Synthesis floor with a "moving" patrol pattern (Zara's NPCs, line-of-sight gates)
  - **F4:** Aether-conduit puzzle floor (`Ɖ`)
  - **F5:** Champion's confrontation arena (already small; add a dramatic approach)

### 12.2 Aether Sanctum

- The post-game finale. **Shattered floor pattern** with floating `RUIN_PILLAR` (`©`) platforms
  separated by `SHATTERED_GROUND` (`¬`).
- Surf required for one branch; Strength + Rock Smash for another.

### 12.3 Shattered Isles trio

- These should function as a **3-map archipelago**: shore (entry from boat), ruins (puzzle), temple
  (boss/legendary). Each map should reference the others visually.
- Use `RUIN_WALL` (`®`), `MIST` (`°`), `TIDE_POOL` (`6`/`7`) liberally.

---

## Phase 13 — Interior polish pass

**Maps:** all 33 in [interiors/](frontend/src/data/maps/interiors).

Small-scope. Per interior:
- Fix any sprite-key bugs flagged in [sprites-improvement-plan.md](docs/sprites-improvement-plan.md).
- Ensure NPCs are not standing on impassable tiles.
- Add **one piece of furniture** that hints at the building's owner (a microscope in a researcher's
  house, a guitar in a teen's room, etc.).
- Ensure every interior has a **window** (`&`/`@`/`$`) so it doesn't feel like a sealed bunker.

**Out of scope:** layout overhauls. Interiors are small functional spaces.

---

## Phase 14 — Region-map & connectivity audit

After Phase 13, the world is essentially redesigned. Run a final pass:

1. Generate the region map: `npm run map:region`
2. Eyeball [temp/region-map.ppm](temp/region-map.ppm) — does the Aurum region read as a coherent
   geography? (Coast on east, mountains north, volcano south, etc.)
3. Check every warp pair end-to-end: walk every connection in dev mode.
4. Add **between-map signage**: every route should have a sign at each end naming the connecting
   areas, mainline-style ("ROUTE 3 / TIDE POOL PATH / Pewter City — North / Coral Harbor — South").
5. Update [docs/storyline.md](docs/storyline.md) area descriptions to match the new layouts where
   they drifted.
6. Update [docs/architecture.md](docs/architecture.md) if any new interfaces or systems landed.

---

## 5. Tracking

Maintain progress here. Tick a phase only when **every map in it** has been redesigned, validated,
tested, and documented in the changelog.

| Phase | Status | PR / commit |
|---|---|---|
| 0 — Tooling & shared tiles | ✅ Complete (2026-04-30) | parser chars + validator checks + 17 unit tests |
| 1 — Littoral arc | ☐ Not started | — |
| 2 — Viridian arc | ☐ Not started | — |
| 3 — Pewter & Tide Pools | ☐ Not started | — |
| 4 — Coral Harbor & Route 4 | ☐ Not started | — |
| 5 — Ironvale & Ember Mines | ☐ Not started | — |
| 6 — Verdantia & the Canopy | ☐ Not started | — |
| 7 — Voltara & Route 7 | ☐ Not started | — |
| 8 — Cinderfall & Route 8 | ☐ Not started | — |
| 9 — Wraithmoor & Crystal Cavern | ☐ Not started | — |
| 10 — Scalecrest & Victory Road | ☐ Not started | — |
| 11 — Pokémon League | ☐ Not started | — |
| 12 — Post-game dungeons | ☐ Not started | — |
| 13 — Interior polish pass | ☐ Not started | — |
| 14 — Region-map audit | ☐ Not started | — |

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Warp coords drift when borders move | Always update both sides of a warp in the same commit; `map:validate` checks both |
| Trainer/NPC coords stranded on solid tiles after a redesign | Run [tests/integration](tests/integration) NPC-spawn tests; new validator check in Phase 0 |
| Encounter density changes break difficulty curve | Keep `encounterTableKey` stable; rebalance the table separately if needed |
| Cut/Strength/Smash gates lock players out of mandatory paths | Every gated path is **optional**. Mandatory progression never requires a field ability the player doesn't yet have. |
| Test churn from coord changes | Where possible, factor "spawn point" tests to use named landmarks rather than literal `(x,y)` pairs |
| Boulder-push and other dynamic tile mechanics not yet implemented | Phase 0 confirms what's possible; ship static-decor versions where runtime support is missing and file a tech follow-up |
| Map files become huge and hard to review | Keep redesigns in small targeted edits per [AGENTS.md](AGENTS.md); never paste a 40-row grid wholesale into a PR |

---

## 7. References

- [AGENTS.md](AGENTS.md) — project conventions, anti-patterns, common tasks
- [.github/instructions/copilot-instructions.md](.github/instructions/copilot-instructions.md) — global rules
- [.github/instructions/map-generation.instructions.md](.github/instructions/map-generation.instructions.md) — map toolchain rules
- [docs/storyline.md](docs/storyline.md) — narrative bible (do not break)
- [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) — non-story technical roadmap
- [frontend/src/data/maps/CONTEXT.md](frontend/src/data/maps/CONTEXT.md) — map module map
- [frontend/src/data/maps/tiles.ts](frontend/src/data/maps/tiles.ts) / [map-parser.ts](frontend/src/data/maps/map-parser.ts) — full tile vocabulary
- [frontend/src/systems/overworld/OverworldAbilities.ts](frontend/src/systems/overworld/OverworldAbilities.ts) — field abilities catalogue
