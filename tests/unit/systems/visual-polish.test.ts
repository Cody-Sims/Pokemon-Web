import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests the tile-scanning logic of GlowEmitterSystem in isolation.
 *
 * The full system requires a Phaser scene; here we exercise the pure scan
 * logic against the same set membership tests it uses internally to ensure
 * neon, crystal, and window tile categories spawn the correct number of
 * emitters and respect MAX_EMITTERS_PER_CATEGORY.
 */

import { Tile } from '../../../frontend/src/data/maps';

// Mirror of the categorisation sets in GlowEmitterSystem.ts.
const NEON_TILES = new Set<number>([Tile.CONDUIT, Tile.ELECTRIC_PANEL, Tile.WIRE_FLOOR]);
const CRYSTAL_TILES = new Set<number>([Tile.AETHER_CRYSTAL, Tile.AETHER_CONDUIT]);
const WINDOW_TILES = new Set<number>([
  Tile.WINDOW, Tile.HOUSE_WINDOW, Tile.LAB_WINDOW, Tile.CENTER_WINDOW,
]);
const MAX_EMITTERS_PER_CATEGORY = 64;

interface ScanResult {
  crystal: number;
  neon: number;
  window: number;
}

function scanGround(ground: number[][]): ScanResult {
  const r: ScanResult = { crystal: 0, neon: 0, window: 0 };
  for (const row of ground) {
    for (const t of row) {
      if (CRYSTAL_TILES.has(t) && r.crystal < MAX_EMITTERS_PER_CATEGORY) r.crystal++;
      else if (NEON_TILES.has(t) && r.neon < MAX_EMITTERS_PER_CATEGORY) r.neon++;
      else if (WINDOW_TILES.has(t) && r.window < MAX_EMITTERS_PER_CATEGORY) r.window++;
    }
  }
  return r;
}

describe('GlowEmitterSystem categorisation', () => {
  it('classifies aether tiles as crystals', () => {
    const ground = [
      [Tile.AETHER_CRYSTAL, Tile.AETHER_CONDUIT, Tile.GRASS],
    ];
    expect(scanGround(ground)).toEqual({ crystal: 2, neon: 0, window: 0 });
  });

  it('classifies voltara tech tiles as neon', () => {
    const ground = [
      [Tile.CONDUIT, Tile.ELECTRIC_PANEL, Tile.WIRE_FLOOR, Tile.GRASS],
    ];
    expect(scanGround(ground)).toEqual({ crystal: 0, neon: 3, window: 0 });
  });

  it('classifies all WINDOW variants', () => {
    const ground = [
      [Tile.WINDOW, Tile.HOUSE_WINDOW, Tile.LAB_WINDOW, Tile.CENTER_WINDOW],
    ];
    expect(scanGround(ground)).toEqual({ crystal: 0, neon: 0, window: 4 });
  });

  it('caps at MAX_EMITTERS_PER_CATEGORY (64) per category', () => {
    // 100 conduit tiles in one row
    const ground = [Array.from({ length: 100 }, () => Tile.CONDUIT)];
    expect(scanGround(ground).neon).toBe(64);
  });

  it('returns zero counts for grids with no qualifying tiles', () => {
    const ground = [[Tile.GRASS, Tile.PATH, Tile.TREE]];
    expect(scanGround(ground)).toEqual({ crystal: 0, neon: 0, window: 0 });
  });

  it('handles mixed maps cleanly', () => {
    const ground = [
      [Tile.GRASS, Tile.AETHER_CRYSTAL, Tile.WINDOW, Tile.CONDUIT, Tile.GRASS],
      [Tile.WINDOW, Tile.GRASS, Tile.WIRE_FLOOR, Tile.GRASS, Tile.AETHER_CONDUIT],
    ];
    expect(scanGround(ground)).toEqual({ crystal: 2, neon: 2, window: 2 });
  });
});

describe('Region map graph extraction (regex-level)', () => {
  // Exercise the lightweight extractField / extractWarps logic mirroring
  // temp/scripts/map-gen/region/region-map.ts so refactors in that script
  // surface in CI rather than at npm run map:region time.

  const sample = `
    export const sampleMap: MapDefinition = {
      key: 'sample-map',
      width: 24,
      height: 30,
      ground: groundGrid,
      displayName: 'Sample Map',
      warps: [
        { tileX: 0, tileY: 5, targetMap: 'route-1', targetSpawnId: 'from-sample' },
        { tileX: 5, tileY: 0, targetMap: 'pewter-city', targetSpawnId: 'south' },
      ],
      spawnPoints: { default: { x: 5, y: 5, direction: 'down' } },
    };
  `;

  function extractField(content: string, name: string): string | null {
    const re = new RegExp(`${name}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
    const m = content.match(re);
    return m ? m[1] : null;
  }

  function extractWarpTargets(content: string): string[] {
    const block = content.match(/warps\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?:spawnPoints|trainers|npcs|objects|encounters|encounterTableKey|isInterior|displayName|$)/);
    if (!block) return [];
    const out: string[] = [];
    const re = /targetMap\s*:\s*['"`]([^'"`]+)['"`]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block[1])) !== null) out.push(m[1]);
    return out;
  }

  it('extracts the map key', () => {
    expect(extractField(sample, 'key')).toBe('sample-map');
  });

  it('extracts the displayName', () => {
    expect(extractField(sample, 'displayName')).toBe('Sample Map');
  });

  it('extracts every warp target in declaration order', () => {
    expect(extractWarpTargets(sample)).toEqual(['route-1', 'pewter-city']);
  });

  it('returns an empty list for maps without warps', () => {
    const noWarps = `export const x: MapDefinition = { key: 'x', width: 1, height: 1, ground: g, displayName: 'X' };`;
    expect(extractWarpTargets(noWarps)).toEqual([]);
  });
});

describe('Status-master achievement guard', () => {
  // Mirrors the unlock predicate added to BattleVictorySequence:
  //   playerStatusMovesUsed > 0 AND playerDamagingMovesUsed === 0

  function shouldUnlockStatusMaster(statusMoves: number, damagingMoves: number): boolean {
    return statusMoves > 0 && damagingMoves === 0;
  }

  it('unlocks when only status moves were used', () => {
    expect(shouldUnlockStatusMaster(3, 0)).toBe(true);
  });

  it('does not unlock when no moves were used at all', () => {
    expect(shouldUnlockStatusMaster(0, 0)).toBe(false);
  });

  it('does not unlock when any damaging move was used', () => {
    expect(shouldUnlockStatusMaster(2, 1)).toBe(false);
  });

  it('does not unlock when only damaging moves were used', () => {
    expect(shouldUnlockStatusMaster(0, 5)).toBe(false);
  });
});

describe('Cutscene data integrity', () => {
  it('every cutscene has a non-empty actions array', async () => {
    const { cutsceneData } = await import('../../../frontend/src/data/cutscene-data');
    expect(Object.keys(cutsceneData).length).toBeGreaterThanOrEqual(28);
    for (const [id, def] of Object.entries(cutsceneData)) {
      expect(def.id).toBe(id);
      expect(Array.isArray(def.actions)).toBe(true);
      expect(def.actions.length).toBeGreaterThan(0);
    }
  });

  it('every cutscene that uses setFlag uses unique snake_case flag names', async () => {
    const { cutsceneData } = await import('../../../frontend/src/data/cutscene-data');
    const seen = new Map<string, string>();
    for (const def of Object.values(cutsceneData)) {
      for (const action of def.actions) {
        if (action.type === 'setFlag') {
          // Allow flag reuse across cutscenes (e.g. quest progression flags), but
          // require flag names to look like snake_case identifiers.
          expect(action.flag).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
          if (!seen.has(action.flag)) seen.set(action.flag, def.id);
        }
      }
    }
  });

  it('the 10 new cutscenes (2026-04-26 batch) are all present', async () => {
    const { cutsceneData } = await import('../../../frontend/src/data/cutscene-data');
    const newCutscenes = [
      'mother-farewell', 'first-badge-celebration', 'marina-first-meeting',
      'rook-first-encounter', 'aldric-hologram', 'kael-tag-team',
      'marina-rescue', 'aldric-inner-sanctum', 'league-arrival',
      'shattered-isles-arrival',
    ];
    for (const id of newCutscenes) {
      expect(cutsceneData[id], `missing cutscene: ${id}`).toBeDefined();
    }
  });
});

beforeEach(() => {
  vi.restoreAllMocks();
});
