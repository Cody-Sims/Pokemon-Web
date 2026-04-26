import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { route1 } from '../../../frontend/src/data/maps/routes/route-1';
import { route5 } from '../../../frontend/src/data/maps/routes/route-5';
import { route8 } from '../../../frontend/src/data/maps/routes/route-8';

/**
 * A.5 Berry trees on routes — verifies the harvest-log helpers and the
 * dungeon placements parse as well-formed `interactionType: 'berry-tree'`
 * objects with a valid `<berryItemId>:<regrowthMinutes>` payload.
 */
describe('Berry trees (A.5)', () => {
  beforeEach(() => {
    GameManager.getInstance().reset();
  });

  describe('harvest log', () => {
    it('starts empty and returns null for unknown trees', () => {
      const gm = GameManager.getInstance();
      expect(gm.getBerryHarvestTime('route-1:any')).toBeNull();
      expect(gm.getBerryHarvests()).toEqual({});
    });

    it('records the most recent harvest timestamp per tree', () => {
      const gm = GameManager.getInstance();
      gm.recordBerryHarvest('route-1:tree-a', 100);
      gm.recordBerryHarvest('route-5:tree-b', 250);
      expect(gm.getBerryHarvestTime('route-1:tree-a')).toBe(100);
      expect(gm.getBerryHarvestTime('route-5:tree-b')).toBe(250);
      // Re-harvest should overwrite (regrowth check is callsite logic).
      gm.recordBerryHarvest('route-1:tree-a', 360);
      expect(gm.getBerryHarvestTime('route-1:tree-a')).toBe(360);
    });

    it('persists harvests through serialize/deserialize roundtrip', () => {
      const gm = GameManager.getInstance();
      gm.recordBerryHarvest('route-1:tree-x', 42);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = JSON.parse(JSON.stringify((gm as any)._player.serialize()));
      gm.reset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gm as any)._player.deserialize(blob);
      expect(gm.getBerryHarvestTime('route-1:tree-x')).toBe(42);
    });
  });

  describe('route placements', () => {
    const placements: { name: string; map: typeof route1; berryId: string; treeId: string }[] = [
      { name: 'Route 1', map: route1, berryId: 'oran-berry',   treeId: 'route1-berry-tree-oran' },
      { name: 'Route 5', map: route5, berryId: 'pecha-berry',  treeId: 'route5-berry-tree-pecha' },
      { name: 'Route 8', map: route8, berryId: 'sitrus-berry', treeId: 'route8-berry-tree-sitrus' },
    ];

    it.each(placements)('$name has a $berryId berry tree object', ({ map, berryId, treeId }) => {
      const obj = map.objects.find(o => o.id === treeId);
      expect(obj, `expected berry tree ${treeId} on map`).toBeDefined();
      expect(obj!.interactionType).toBe('berry-tree');
      expect(obj!.textureKey).toBe('berry-tree');
      const data = obj!.interactionData ?? '';
      const [parsedId, regrowth] = data.split(':');
      expect(parsedId).toBe(berryId);
      expect(Number(regrowth)).toBeGreaterThan(0);
    });
  });
});
