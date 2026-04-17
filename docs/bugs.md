# Bug Report — Pokemon Web (Consolidated)

> **Last updated:** 2026-04-16
> **Status:** 108 of 110 total bugs resolved. See [CHANGELOG.md](CHANGELOG.md) for fix details.

---

## Summary

| Severity | Count |
|----------|-------|
| Medium   | 2     |
| **Total**| **2** |

---

## Remaining Bugs

### BUG-039: Dual source of truth for evolution data

- **Files:** `frontend/src/data/evolution-data.ts`, `frontend/src/data/pokemon/*.ts`
- **Description:** Evolution chains are defined both in `evolutionData` and in each Pokemon's `evolutionChain` field. These can get out of sync.
- **Status:** Accepted risk. Both sources are validated by existing integration tests.

### NEW-006: Surf state not reset if spawn point is on water after warp

- **File:** `frontend/src/scenes/overworld/OverworldScene.ts`
- **Description:** `init()` resets `surfing = false`. If the player is placed on a water tile by a spawn point after a warp, they are stuck.
- **Expected:** Auto-enable surfing if the spawn point is on a water tile. Requires tile lookup at spawn time which depends on map loading order.

---

## Fixed Bug Reference

All other bugs have been resolved. See [CHANGELOG.md](CHANGELOG.md) for details.

- Original bugs: BUG-001 through BUG-097 (95 of 97 fixed)
- Research audit bugs: NEW-001 through NEW-013 (12 of 13 fixed)
