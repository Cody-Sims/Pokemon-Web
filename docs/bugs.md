# Pokemon Web — Bug Tracker

> Centralized list of **open / deferred** issues. Every resolved issue is
> documented in [docs/CHANGELOG.md](docs/CHANGELOG.md) — search for the bug
> ID or the dated `### Fixed` entry.

---

## Open

### Cycling has no visible sprite swap

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts) (cycling toggle, animation key), [frontend/public/assets/sprites/player/](frontend/public/assets/sprites/player) (no `cycle-*` frames yet).
- **Symptom:** Toggling the bicycle changes movement speed and swaps the
  internal animation key to `cycle-*`, but no `cycle-*` spritesheet has been
  generated, so the rendered animation falls back to the walk cycle at 3×
  speed. The player gets no visual feedback that they're cycling.
- **Status:** Deferred — needs new sprite art. Tracked under
  [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) Tier 4.4.

### Item-balls / signs cannot be walked onto

- **Files:** [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts) — `rebuildNpcOccupiedTiles()`.
- **Symptom:** All entries from `mapDef.objects` (signs, item-balls, PCs,
  doors) are added to `npcOccupiedTiles`, blocking the player from stepping
  onto an item-ball to collect it. Today the player must stand adjacent and
  press the interact key.
- **Status:** Open — design call. Adjacent-interact is consistent with
  signs / PCs / NPCs. Step-on collection would mirror the legacy Pokémon
  games' item-ball behavior. Implementation is small once the design is
  decided (split `objects` into blocking vs. walkable lists during
  spawn).

### Catch shake graphic drifts when enemy sprite is mid-tween

- **Files:** [frontend/src/scenes/battle/BattleCatchHandler.ts](frontend/src/scenes/battle/BattleCatchHandler.ts) — `runShakeSequence()`.
- **Symptom:** Each shake creates a new graphic at
  `(enemySprite.x, enemySprite.y + 20)`. If the enemy sprite is still
  mid-intro tween (rare, requires opening BAG and throwing a ball before
  the slide-in completes) the ball icon hops between shakes.
- **Status:** Open — cosmetic edge case. The throw-origin and orphan-
  highlight issues that made the drift obvious were resolved in the
  round 1 audit pass; this one only triggers if the player races the
  intro animation. Fix would capture the slot anchor once at throw time
  and reuse it for every shake.

---

## Resolved

The following audit passes are fully documented in
[docs/CHANGELOG.md](docs/CHANGELOG.md). Open the changelog for per-bug
file/line references:

| Audit | CHANGELOG entry | Scope |
|-------|-----------------|-------|
| 2026-04-29 | "Playthrough bug audit pass, round 2 (medium / polish)" | Round-2 polish: synthesis aura tracking, Intro portrait stack, catch slot anchor, NPC tile dirty flag, QUIT/EXIT rename, title decorations, immune popup contrast, EmoteBubble depth, banner fallback, NIT-001/002/003 |
| 2026-04-29 | "Playthrough bug audit pass (BUG-001 through BUG-044)" | Round-1: switched-in invisibility, forced-switch softlock, mobile move menu, double-battle proportional layout, Pallet → Littoral Town displayName, Summary/Pokedex portrait clipping, Lighting RT leak, catch-ball origin + highlight, follower depth/scale, level-up message split, dialogue speaker clamp, Intro safe-area + DOM-input cleanup |
| 2026-04-29 | "Mobile UI bug sweep (B1–B7)" | Mobile triage: Challenge Modes BEGIN clip, ConfirmBox depth, HUD-on-title leak, interior warp blocker, NPC face-on-interact, Party slot collision, Party screen mobile exit |

Earlier audit cycles also reused `BUG-NNN` numbering for unrelated issues
(e.g., the `BUG-001 … BUG-097` set documented under entries dated before
2026-04-29). Those numbers do **not** correspond to the IDs above —
treat each audit cycle's IDs as scoped to that cycle's CHANGELOG entry.

---

## How to use this file

- Add a new entry above the **Resolved** section when an issue is found
  during play-testing or code review. Use a descriptive heading rather
  than a numeric ID — they collide across audit cycles.
- When a fix lands, remove the entry from this file and add a dated
  `### Fixed — …` entry to [docs/CHANGELOG.md](docs/CHANGELOG.md). Keep
  this file lean; the changelog is the historical record.
- For sweep-style audits (multi-bug single sitting), it's fine to retain
  numeric IDs scoped to that sweep — just include the prefix
  (e.g., `2026-MM-DD-01`) so they don't collide with future cycles.
