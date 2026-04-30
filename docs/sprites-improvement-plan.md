# Sprites Improvement Plan

> **Status (2026-04-29):** P0, P1, P2, and P3 berry-tree variants are
> implemented and shipped. Remaining work: author bespoke art for `npc-rook`
> and `npc-zara` (currently aliased to existing atlases) and roll out the
> new `door` sprite to building warp tiles. See the **Implementation Status**
> section below.

> Audit of overworld sprite usage across all 66 maps. Identifies missing assets,
> wrong-texture fallbacks, and unique characters currently rendered with generic
> placeholders. Source of truth: `frontend/public/assets/asset-manifest.json`,
> `frontend/public/assets/sprites/npcs/**`, and every `textureKey:` reference in
> `frontend/src/data/maps/**`.

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **P0 — Broken** | Texture key is referenced but no asset exists. Phaser silently renders a placeholder / white box. |
| **P1 — Wrong sprite** | A unique, named character has a dedicated sprite that ships with the game but a generic NPC sprite is used in the map data. Pure fix: change the `textureKey`. |
| **P2 — Object misuse** | A non-item interactable (PC, vent, conduit, fossil, rune) reuses the `item-ball` Poké Ball icon. Needs a new sprite + `textureKey` swap. |
| **P3 — Polish** | Procedural / placeholder sprite that works but could be replaced with a hand-authored one. |

---

## P0 — Broken Texture References (highest priority)

These keys appear in map data but **no atlas / image is loaded** in [PreloadScene.ts](frontend/src/scenes/boot/PreloadScene.ts) or registered in `asset-manifest.json`. Result: missing-texture squares at runtime.

| Key | Referenced In | Character | Action |
|-----|---------------|-----------|--------|
| `npc-rook` | [abyssal-spire-f1.ts](frontend/src/data/maps/dungeons/abyssal-spire-f1.ts#L43), [shattered-isles-shore.ts](frontend/src/data/maps/dungeons/shattered-isles-shore.ts#L58), [shattered-isles-shore.ts](frontend/src/data/maps/dungeons/shattered-isles-shore.ts#L78), [route-7.ts](frontend/src/data/maps/routes/route-7.ts#L42), [aether-sanctum.ts](frontend/src/data/maps/dungeons/aether-sanctum.ts#L40-L60) | Rook (story partner / scout) | **Create new atlas** `npcs/story/npc-rook.png` + `.json`, register in PreloadScene story loop. |
| `npc-zara` | [abyssal-spire-f3.ts](frontend/src/data/maps/dungeons/abyssal-spire-f3.ts#L40), [abyssal-spire-f3.ts](frontend/src/data/maps/dungeons/abyssal-spire-f3.ts#L80) | Admin Zara Lux (defector) | **Create new atlas** `npcs/villains/npc-zara.png` + `.json`, register in PreloadScene villains loop. |

**Implementation note:** Both characters have full dialogue trees, story arcs, and trainer entries — they are major story NPCs and absolutely need bespoke sprites. Use `temp/create_new_npc_sprites.py` as a template. Until art is delivered, a one-line fallback in [PreloadScene.create()](frontend/src/scenes/boot/PreloadScene.ts) using `npc-male-5` / `npc-female-2` as an alias-texture would prevent the broken-square render.

---

## P1 — Wrong Sprite for Unique Character (sprite already exists)

The game ships with full atlases for every gym leader, every Elite Four member, and the Champion. **Five gym leaders and all four E4 + Champion are currently spawned with generic NPC textures** because the map files were authored before the unique sprites were generated.

### Gym Leaders

| Leader (City) | Map File | Current Texture | Should Be |
|---------------|----------|-----------------|-----------|
| Coral (Coral Harbor) | [coral-gym.ts](frontend/src/data/maps/interiors/coral-gym.ts#L59) | `npc-swimmer` | `npc-gym-coral` |
| Drake (Scalecrest) | [scalecrest-gym.ts](frontend/src/data/maps/interiors/scalecrest-gym.ts#L55) | `npc-clerk` | `npc-gym-drake` |
| Ivy (Verdantia) | [verdantia-gym.ts](frontend/src/data/maps/interiors/verdantia-gym.ts#L23) | `npc-female-1` | `npc-gym-ivy` |
| Morwen (Wraithmoor) | [wraithmoor-gym.ts](frontend/src/data/maps/interiors/wraithmoor-gym.ts#L55) | `npc-female-2` | `npc-gym-morwen` |
| Solara (Cinderfall) | [cinderfall-gym.ts](frontend/src/data/maps/interiors/cinderfall-gym.ts#L55), [cinderfall-town.ts](frontend/src/data/maps/cities/cinderfall-town.ts#L43) | `npc-female-4` | `npc-gym-solara` |

Already correct: Brock (`npc-gym-brock`), Blitz (`npc-gym-blitz`), Ferris (`npc-gym-ferris`), Giovanni (`npc-gym-giovanni`).

### Elite Four & Champion

All five live in [pokemon-league.ts](frontend/src/data/maps/interiors/pokemon-league.ts).

| Member | Line | Current Texture | Should Be |
|--------|------|-----------------|-----------|
| Nerida (Water/Ice) | [L92](frontend/src/data/maps/interiors/pokemon-league.ts#L92) | `npc-female-7` | `npc-e4-nerida` |
| Theron (Fighting/Rock) | [L135](frontend/src/data/maps/interiors/pokemon-league.ts#L135) | `npc-clerk` | `npc-e4-theron` |
| Lysandra (Psychic/Fairy) | [L178](frontend/src/data/maps/interiors/pokemon-league.ts#L178) | `npc-female-3` | `npc-e4-lysandra` |
| Ashborne (Dark/Ghost) | [L221](frontend/src/data/maps/interiors/pokemon-league.ts#L221) | `npc-male-5` | `npc-e4-ashborne` |
| Champion Aldric | [L268](frontend/src/data/maps/interiors/pokemon-league.ts#L268) | `npc-male-5` | `npc-champion-aldric` |

> The Champion *is* spawned correctly in [abyssal-spire-f5.ts](frontend/src/data/maps/dungeons/abyssal-spire-f5.ts#L37), so the asset works — the league file just wasn't updated.

### Generic-Trainer Stand-Ins

`generic-trainer` is the masculine "blue-cap" placeholder. It's used 9 times for named or role-specific NPCs:

| Map | NPC | Suggested Replacement |
|-----|-----|----------------------|
| [viridian-city.ts](frontend/src/data/maps/cities/viridian-city.ts#L62) | Townsperson | `npc-male-3` (or assign a real role) |
| [viridian-pokecenter.ts](frontend/src/data/maps/interiors/viridian-pokecenter.ts#L44), [L56](frontend/src/data/maps/interiors/viridian-pokecenter.ts#L56) | Trainer chatter (×2) | `npc-male-2`, `npc-male-4` |
| [pewter-pokecenter.ts](frontend/src/data/maps/interiors/pewter-pokecenter.ts#L44), [L56](frontend/src/data/maps/interiors/pewter-pokecenter.ts#L56) | Trainer chatter (×2) | `npc-male-3`, `npc-bug-catcher` |
| [pallet-oak-lab.ts](frontend/src/data/maps/interiors/pallet-oak-lab.ts#L102) | Lab assistant | `npc-scientist` |
| [shattered-isles-ruins.ts](frontend/src/data/maps/dungeons/shattered-isles-ruins.ts#L48-L91) | 4 Synthesis explorers | `npc-grunt` (×4) — they are Synthesis Collective |
| [abyssal-spire-f3.ts](frontend/src/data/maps/dungeons/abyssal-spire-f3.ts#L63) | Security console (object, not NPC) | Make a real `pc` / `console` object — see P2 |

---

## P2 — Object Sprite Misuse (item-ball used for non-items)

`item-ball` is the red-and-white Poké Ball icon. It is currently overloaded as a generic "interact-here" pin for several non-item objects. New sprites are needed.

### PC Terminals — 5 instances

Every PokéCenter PC (`objectType: 'pc'`) renders as a Poké Ball on the floor. This is the most visually jarring case because the player accesses the **PC Storage System** through it.

| Map | Line |
|-----|------|
| [verdantia-pokecenter.ts](frontend/src/data/maps/interiors/verdantia-pokecenter.ts#L31) | `verdantia-pc` |
| [ironvale-pokecenter.ts](frontend/src/data/maps/interiors/ironvale-pokecenter.ts#L31) | `ironvale-pc` |
| [voltara-pokecenter.ts](frontend/src/data/maps/interiors/voltara-pokecenter.ts#L31) | `voltara-pc` |
| [wraithmoor-pokecenter.ts](frontend/src/data/maps/interiors/wraithmoor-pokecenter.ts#L30) | `wraithmoor-pc` |
| [scalecrest-pokecenter.ts](frontend/src/data/maps/interiors/scalecrest-pokecenter.ts#L30) | `scalecrest-pc` |

**Action:**
1. Create `frontend/public/assets/sprites/npcs/trainers/pc-terminal.png` (16×16 or 16×24 for taller monitor) — a CRT/desktop computer with a glowing screen. Atlas with a single frame `idle` (or a 2-frame blink animation).
2. Register the key `pc-terminal` in [PreloadScene.ts](frontend/src/scenes/boot/PreloadScene.ts#L179) loader.
3. Add to `asset-manifest.json` `npc-objects` category.
4. Replace `textureKey: 'item-ball'` with `textureKey: 'pc-terminal'` in all 5 maps.

### Victory Road Volcanic Vents — 5 instances

The five steam vents in [victory-road.ts](frontend/src/data/maps/dungeons/victory-road.ts#L62-L74) (`vr-vent-1` … `vr-vent-5`) are story-driven temperature-recording objects, not items.

**Action:** Create `vent` sprite (rocky cone with rising steam puff). Replace `textureKey` and `objectType` to a new `'vent'` sub-type **OR** keep `objectType: 'item-ball'` (engine treats it as a once-use trigger) but only swap the texture.

### Voltara City Power Conduits — 3 instances

[voltara-city.ts](frontend/src/data/maps/cities/voltara-city.ts#L169-L185) has 3 broken conduits the player repairs as a side quest. Currently Poké Balls.

**Action:** Create `conduit-broken.png` and `conduit-fixed.png` sprite pair (sparking electric box). Use `requireFlag` / `setsFlag` already in place to switch frames.

### Other one-offs

| Map | Object | Suggested |
|-----|--------|-----------|
| [aether-sanctum.ts](frontend/src/data/maps/dungeons/aether-sanctum.ts#L57) | "sanctum-sign" — runic stone humming with Aether | New `aether-rune.png` sprite (or simply `sign-post` with `objectType: 'sign'`) |
| [crystal-cavern-depths.ts](frontend/src/data/maps/dungeons/crystal-cavern-depths.ts#L74) | `depths-claw-fossil` (Claw Fossil pickup) | New `fossil-claw.png` sprite (and matching `fossil-wing.png`) |
| [shattered-isles-ruins.ts](frontend/src/data/maps/dungeons/shattered-isles-ruins.ts#L109) | Ancient pedestal | New `ruins-pedestal.png` |
| [crystal-cavern.ts](frontend/src/data/maps/dungeons/crystal-cavern.ts#L137-L145) | Glittering crystal clusters | New `crystal-cluster.png` (large violet shard) |
| [route8-berry-tree-sitrus](frontend/src/data/maps/routes/route-8.ts#L62), [route1-berry-tree-oran](frontend/src/data/maps/routes/route-1.ts#L149-L154), [route5-berry-tree-pecha](frontend/src/data/maps/routes/route-5.ts#L159-L164) | Berry trees | See P3 |

---

## P3 — Polish (procedural / generic, but functional)

### Berry Trees

Currently generated procedurally in [PreloadScene.create()](frontend/src/scenes/boot/PreloadScene.ts#L220-L242) — a brown trunk with green foliage and three red dots. Works, but:

- Looks identical regardless of which berry the tree yields (Sitrus / Oran / Pecha all look like generic red berries).
- Doesn't match the pixel-art quality of authored sprites.

**Action:** Author 16×16 berry tree atlases with per-berry frame variants:
- `berry-tree-oran.png` (blue berries)
- `berry-tree-sitrus.png` (yellow berries)
- `berry-tree-pecha.png` (pink berries)
- Optional `harvested` frame (shrub without berries) keyed off `requireFlag`.

Update map references and remove the procedural-generation block from [PreloadScene.ts](frontend/src/scenes/boot/PreloadScene.ts#L220-L242).

### Doors

`ObjectType` includes `'door'` ([map-interfaces.ts](frontend/src/data/maps/map-interfaces.ts#L54)) but **zero maps use it** — every building entrance is a `warp`, not an interactable door object. Decision needed:

- Either add door sprites for visual cues over warp tiles (matches Gen-3 style) and start using `objectType: 'door'`,
- Or remove `'door'` from the `ObjectType` union to reduce surface area.

Recommended: ship door sprite + use it on every Pokécenter / Pokémart / Gym / House warp tile so warp destinations are visible to the player.

---

## Unused Sprites (already loaded, no map references)

These atlases ship in the build but never appear on screen. Either delete them or assign them to NPCs that currently use generic textures.

| Sprite | Suggested Use |
|--------|--------------|
| `npc-male-4` | Available — assign to a Pokécenter chatter or sign-reader |
| `npc-female-5` | Available — assign to a Pokémart shopper |
| `npc-female-6` | Available |
| `npc-female-8` | Available |
| `npc-female-9` | Available |
| `npc-blitz` (story atlas, separate from `npc-gym-blitz`) | Pre-gym story scenes (currently unused) — could be used in cinderfall pre-quest cutscenes |

---

## Recommended Implementation Order

1. **P1 sprite swaps** (data-only, ~15 minutes total) — touches only map files, no new art needed. Immediate visual upgrade for every gym, the league, and the post-game lab. **Do this first.**
2. **P0 fallback aliases** — add `this.textures.addAlias('npc-rook', 'npc-male-5')` and `'npc-zara' → 'npc-female-2'` (or similar) in [PreloadScene.create()](frontend/src/scenes/boot/PreloadScene.ts) until real art is authored. Eliminates broken-square renders.
3. **P0 real art** — author `npc-rook` and `npc-zara` atlases.
4. **P2 PC terminal sprite** — single new sprite unblocks 5 map fixes; high visibility.
5. **P2 vents / conduits / fossils** — bundle into one art pass; each is a single 16×16 sprite.
6. **P3 berry tree variants** — replaces procedural texture; may also touch [OverworldInteraction.ts](frontend/src/scenes/overworld/OverworldInteraction.ts#L450-L452) if per-berry textures are wired through `interactionData`.
7. **P3 doors** — design decision required before art work.

## Verification After Each Phase

```bash
npm run build           # type-check + Vite build
npm run test            # unit + integration
npm run map:validate    # ensures all textureKey references load
npm run test:e2e        # playthrough (only if scene/UI changes)
```

Manual check: walk into Coral Harbor Gym, the Pokémon League, and a PokéCenter — confirm the leader sprite, E4 sprites, and PC sprite all render distinct from the placeholders.

## Acceptance Criteria

- [x] Zero `textureKey` strings in [frontend/src/data/maps/**](frontend/src/data/maps) reference an unloaded asset.
- [x] Every named gym leader, Elite Four member, and the Champion uses their dedicated `npc-gym-*` / `npc-e4-*` / `npc-champion-*` atlas in their primary spawn.
- [x] No `objectType: 'pc'` uses `textureKey: 'item-ball'`.
- [x] Berry trees, fossils, vents, conduits, and runes use sprites distinct from the generic Poké Ball.
- [x] [docs/CHANGELOG.md](CHANGELOG.md) updated with each shipped phase.

## Implementation Status

Cross-references the work shipped in [docs/CHANGELOG.md](CHANGELOG.md) under
the 2026-04-29 sprite-improvement entries.

| Tier | Item | Status | Notes |
|------|------|--------|-------|
| P0 | `npc-rook` broken texture | ✅ Aliased | Loads `npc-male-5` atlas under the `npc-rook` key in [PreloadScene.preload](../frontend/src/scenes/boot/PreloadScene.ts). Bespoke art still pending. |
| P0 | `npc-zara` broken texture | ✅ Aliased | Loads `npc-female-2` atlas under the `npc-zara` key in [PreloadScene.preload](../frontend/src/scenes/boot/PreloadScene.ts). Bespoke art still pending. |
| P1 | Gym leaders Coral / Drake / Ivy / Morwen / Solara | ✅ Shipped | Now use their `npc-gym-*` atlases in [coral-gym](../frontend/src/data/maps/interiors/coral-gym.ts), [scalecrest-gym](../frontend/src/data/maps/interiors/scalecrest-gym.ts), [verdantia-gym](../frontend/src/data/maps/interiors/verdantia-gym.ts), [wraithmoor-gym](../frontend/src/data/maps/interiors/wraithmoor-gym.ts), [cinderfall-gym](../frontend/src/data/maps/interiors/cinderfall-gym.ts), and the [cinderfall-town](../frontend/src/data/maps/cities/cinderfall-town.ts) story spawn. |
| P1 | Elite Four + Champion | ✅ Shipped | Nerida, Theron, Lysandra, Ashborne, Aldric in [pokemon-league.ts](../frontend/src/data/maps/interiors/pokemon-league.ts) now use their `npc-e4-*` / `npc-champion-aldric` atlases. |
| P1 | `generic-trainer` placeholders | ✅ Shipped | Zero references remain in [frontend/src/data/maps/**](../frontend/src/data/maps); replaced with role-appropriate NPCs (Viridian gym blocker, two PokéCenter chatterers) or converted to objects (3 PCs + Abyssal Spire console + 4 Shattered Isles ruins clues). |
| P2 | `pc-terminal` for all storage PCs | ✅ Shipped | All 8 PC objects (5 PokéCenters + Viridian / Pewter Centers + Oak's Lab + Abyssal Spire F3 console) render the dedicated CRT sprite. |
| P2 | `vent` for Victory Road | ✅ Shipped | All 5 vents in [victory-road.ts](../frontend/src/data/maps/dungeons/victory-road.ts) use the rocky-cone-with-steam sprite. |
| P2 | `conduit-broken` for Voltara repairs | ✅ Shipped | All 3 conduits in [voltara-city.ts](../frontend/src/data/maps/cities/voltara-city.ts) use the sparking-box sprite. (Companion `conduit-fixed` sprite is generated for future before/after support.) |
| P2 | `fossil-claw` | ✅ Shipped | The Claw Fossil pickup in [crystal-cavern-depths.ts](../frontend/src/data/maps/dungeons/crystal-cavern-depths.ts) uses the dedicated sprite. Other in-cave items remain `item-ball` since they ARE items (Revives, Escape Ropes). |
| P2 | `aether-rune` | ✅ Shipped | The hum-ing rune object in [aether-sanctum.ts](../frontend/src/data/maps/dungeons/aether-sanctum.ts) uses the dedicated sprite. |
| P2 | `ruins-pedestal` | ✅ Shipped | All 5 journal-clue objects in [shattered-isles-ruins.ts](../frontend/src/data/maps/dungeons/shattered-isles-ruins.ts) use the stone-pillar sprite. |
| P2 | `memory-fragment` | ✅ Shipped | All 3 wraithmoor memory pickups in [wraithmoor-town.ts](../frontend/src/data/maps/cities/wraithmoor-town.ts) use the glowing-fragment sprite (added beyond the original plan). |
| P2 | `crystal-cluster` | ⏳ Sprite ready, unused | Sprite is generated in [PreloadScene](../frontend/src/scenes/boot/PreloadScene.ts) but the Crystal Cavern items it would replace are real Revive / Escape Rope pickups (legitimate `item-ball`). Available for future decorative crystal placements. |
| P3 | Berry-tree color variants | ✅ Shipped | `berry-tree-oran` (blue), `berry-tree-pecha` (pink), `berry-tree-sitrus` (yellow) replace the procedural red-berry default on Routes 1, 5, 8. |
| P3 | Door sprite | ⏳ Sprite ready, unused | The `door` texture is generated in [PreloadScene](../frontend/src/scenes/boot/PreloadScene.ts) but no map currently uses `objectType: 'door'`. Rolling it out to every PokéCenter / Pokémart / Gym / House warp tile is a follow-up pass — non-blocking collision behaviour for objects on warp tiles needs verification first. |
| P3 | Unused atlases (`npc-male-4`, `npc-female-5/6/8/9`, story `npc-blitz`) | ⏳ Deferred | No regressions to fix here; they're available when new NPCs are authored. Optional future polish. |

### Verification

- `npm run build` → zero errors
- `npm run test` → 2148 / 2148 passing
- `npm run map:validate` → 66 / 66 maps passing
- Manual: PokéCenter PCs, Coral / Drake / Ivy / Morwen / Solara gyms, every E4
  room, the Champion's chamber, Victory Road vents, Voltara conduits, Aether
  Sanctum rune, Shattered Isles ruins clues, Wraithmoor memory fragments, and
  the three berry trees all render distinct, thematic sprites instead of the
  generic Poké Ball or generic-trainer fallback.
