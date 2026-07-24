import {
  REGION_CHILD_MAP_SUFFIXES,
  REGION_EDGES,
  REGION_NODES,
  type RegionMapEdge,
  type RegionMapNode,
} from '@data/region-map';
import { manhattanDistance } from '@utils/grid-math';

export type RegionVisitLookup = (mapKey: string) => boolean;
export type RegionMapDirection = 'up' | 'down' | 'left' | 'right';

const DIRECTION_VECTORS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
} as const satisfies Record<RegionMapDirection, { dx: number; dy: number }>;

export class RegionMapService {
  private readonly childLookup: ReadonlyMap<string, number>;

  constructor(
    private readonly nodes: readonly RegionMapNode[] = REGION_NODES,
    private readonly edges: readonly RegionMapEdge[] = REGION_EDGES,
  ) {
    this.childLookup = this.buildChildLookup();
  }

  getNodes(): readonly RegionMapNode[] {
    return this.nodes;
  }

  getEdges(): readonly RegionMapEdge[] {
    return this.edges;
  }

  getSelectableIndices(): number[] {
    return this.nodes.map((_node, index) => index);
  }

  resolveNodeIndex(mapKey: string): number {
    const direct = this.nodes.findIndex(node => node.mapKey === mapKey);
    if (direct >= 0) return direct;

    const child = this.childLookup.get(mapKey);
    if (child !== undefined) return child;

    for (const suffix of REGION_CHILD_MAP_SUFFIXES) {
      if (!mapKey.includes(suffix)) continue;
      const prefix = mapKey.substring(0, mapKey.indexOf(suffix));
      const townIndex = this.nodes.findIndex(node => node.mapKey.startsWith(prefix) && node.type === 'town');
      if (townIndex >= 0) return townIndex;
    }

    return -1;
  }

  isNodeVisited(nodeIndex: number, hasVisitedMap: RegionVisitLookup): boolean {
    const node = this.nodes[nodeIndex];
    if (!node) return false;
    return hasVisitedMap(node.mapKey) || (node.childMaps?.some(child => hasVisitedMap(child)) ?? false);
  }

  isNodeFlyable(nodeIndex: number, canFly: boolean, hasVisitedMap: RegionVisitLookup): boolean {
    const node = this.nodes[nodeIndex];
    return Boolean(canFly && node?.flyable && this.isNodeVisited(nodeIndex, hasVisitedMap));
  }

  getFlyableDestinations(hasVisitedMap: RegionVisitLookup, currentMapKey: string): readonly RegionMapNode[] {
    const destinations = this.nodes.filter((node, index) => node.flyable === true && this.isNodeVisited(index, hasVisitedMap));
    if (destinations.length > 0) return destinations;
    return this.nodes.filter(node => node.flyable === true && node.mapKey === currentMapKey);
  }

  findNearestCursor(
    selectableIndices: readonly number[],
    cursor: number,
    direction: RegionMapDirection,
  ): number {
    const currentNode = this.nodes[selectableIndices[cursor]];
    if (!currentNode) return cursor;

    const vector = DIRECTION_VECTORS[direction];
    let bestCursor = cursor;
    let bestScore = Number.POSITIVE_INFINITY;

    selectableIndices.forEach((nodeIndex, candidateCursor) => {
      if (candidateCursor === cursor) return;
      const candidate = this.nodes[nodeIndex];
      if (!candidate) return;

      const dCol = candidate.col - currentNode.col;
      const dRow = candidate.row - currentNode.row;
      const aligned = (vector.dx !== 0 && Math.sign(dCol) === vector.dx)
        || (vector.dy !== 0 && Math.sign(dRow) === vector.dy);
      if (!aligned) return;

      const distance = manhattanDistance(currentNode.col, currentNode.row, candidate.col, candidate.row);
      const offAxis = vector.dx !== 0 ? Math.abs(dRow) : Math.abs(dCol);
      const score = distance + offAxis * 2;
      if (score < bestScore) {
        bestScore = score;
        bestCursor = candidateCursor;
      }
    });

    return bestCursor;
  }

  private buildChildLookup(): ReadonlyMap<string, number> {
    const lookup = new Map<string, number>();
    this.nodes.forEach((node, index) => {
      node.childMaps?.forEach(child => lookup.set(child, index));
    });
    return lookup;
  }
}
