import { describe, expect, it } from 'vitest';
import { RegionMapService } from '@systems/overworld/RegionMapService';
import { REGION_NODES } from '@data/region-map';

function visited(keys: readonly string[]): (mapKey: string) => boolean {
  const set = new Set(keys);
  return mapKey => set.has(mapKey);
}

describe('RegionMapService', () => {
  it('resolves direct maps, declared child maps, and town interior suffixes', () => {
    const service = new RegionMapService();

    expect(REGION_NODES[service.resolveNodeIndex('viridian-city')]?.label).toBe('Viridian City');
    expect(REGION_NODES[service.resolveNodeIndex('crystal-cavern-depths')]?.label).toBe('Crystal Cavern');
    expect(REGION_NODES[service.resolveNodeIndex('pewter-pokecenter')]?.label).toBe('Pewter City');
    expect(service.resolveNodeIndex('unknown-map')).toBe(-1);
  });

  it('treats declared child maps as visits to their parent node', () => {
    const service = new RegionMapService();
    const cavernIndex = service.resolveNodeIndex('crystal-cavern');

    expect(service.isNodeVisited(cavernIndex, visited(['crystal-cavern-depths']))).toBe(true);
    expect(service.isNodeVisited(cavernIndex, visited(['route-1']))).toBe(false);
  });

  it('finds the nearest directional node using the town map layout', () => {
    const service = new RegionMapService();
    const selectable = service.getSelectableIndices();
    const viridianCursor = selectable.indexOf(service.resolveNodeIndex('viridian-city'));

    const upCursor = service.findNearestCursor(selectable, viridianCursor, 'up');
    const leftCursor = service.findNearestCursor(selectable, viridianCursor, 'left');

    expect(REGION_NODES[selectable[upCursor]]?.mapKey).toBe('route-2');
    expect(REGION_NODES[selectable[leftCursor]]?.mapKey).toBe('viridian-forest');
  });

  it('returns only visited fly destinations and preserves the current-map fallback', () => {
    const service = new RegionMapService();

    expect(service.getFlyableDestinations(visited(['pallet-town', 'route-1', 'pewter-city']), 'route-1')
      .map(node => node.mapKey)).toEqual(['pallet-town', 'pewter-city']);
    expect(service.getFlyableDestinations(visited([]), 'viridian-city').map(node => node.mapKey))
      .toEqual(['viridian-city']);
  });
});
