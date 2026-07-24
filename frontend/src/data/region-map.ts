export type RegionNodeType = 'town' | 'route' | 'dungeon' | 'landmark';

export interface RegionMapNode {
  mapKey: string;
  label: string;
  col: number;
  row: number;
  type: RegionNodeType;
  flyable?: boolean;
  childMaps?: readonly string[];
}

export type RegionMapEdge = readonly [number, number];

export const REGION_CHILD_MAP_SUFFIXES = [
  '-pokecenter',
  '-pokemart',
  '-gym',
  '-museum',
  '-house-',
  '-lab',
] as const;

export const REGION_NODES = [
  { mapKey: 'pallet-town', label: 'Littoral Town', col: 2, row: 8, type: 'town', flyable: true },
  { mapKey: 'route-1', label: 'Route 1', col: 2, row: 7, type: 'route' },
  { mapKey: 'viridian-city', label: 'Viridian City', col: 2, row: 6, type: 'town', flyable: true },
  { mapKey: 'route-2', label: 'Route 2', col: 2, row: 5, type: 'route' },
  { mapKey: 'viridian-forest', label: 'Viridian Forest', col: 1, row: 5, type: 'dungeon' },
  { mapKey: 'pewter-city', label: 'Pewter City', col: 2, row: 4, type: 'town', flyable: true },
  { mapKey: 'route-3', label: 'Route 3', col: 3, row: 4, type: 'route' },
  { mapKey: 'coral-harbor', label: 'Coral Harbor', col: 4, row: 4, type: 'town', flyable: true },
  { mapKey: 'crystal-cavern', label: 'Crystal Cavern', col: 4, row: 5, type: 'dungeon', childMaps: ['crystal-cavern-depths'] },
  { mapKey: 'route-4', label: 'Route 4', col: 4, row: 3, type: 'route' },
  { mapKey: 'ember-mines', label: 'Ember Mines', col: 5, row: 3, type: 'dungeon' },
  { mapKey: 'ironvale-city', label: 'Ironvale City', col: 4, row: 2, type: 'town', flyable: true },
  { mapKey: 'route-5', label: 'Route 5', col: 5, row: 2, type: 'route' },
  { mapKey: 'verdantia-village', label: 'Verdantia Village', col: 6, row: 2, type: 'town', flyable: true },
  { mapKey: 'verdantia-lab', label: 'Verdantia Lab', col: 7, row: 2, type: 'dungeon' },
  { mapKey: 'voltara-city', label: 'Voltara City', col: 6, row: 1, type: 'town', flyable: true },
  { mapKey: 'route-6', label: 'Route 6', col: 4, row: 1, type: 'route' },
  { mapKey: 'wraithmoor-town', label: 'Wraithmoor Town', col: 3, row: 1, type: 'town', flyable: true },
  { mapKey: 'route-7', label: 'Route 7', col: 5, row: 1, type: 'route' },
  { mapKey: 'scalecrest-citadel', label: 'Scalecrest Citadel', col: 5, row: 0, type: 'town', flyable: true },
  { mapKey: 'cinderfall-town', label: 'Cinderfall Town', col: 7, row: 0, type: 'town', flyable: true },
  { mapKey: 'route-8', label: 'Route 8', col: 6, row: 0, type: 'route' },
  { mapKey: 'abyssal-spire-f1', label: 'Abyssal Spire', col: 3, row: 0, type: 'dungeon', childMaps: ['abyssal-spire-f2', 'abyssal-spire-f3', 'abyssal-spire-f4', 'abyssal-spire-f5'] },
  { mapKey: 'victory-road', label: 'Victory Road', col: 1, row: 1, type: 'dungeon' },
  { mapKey: 'pokemon-league', label: 'Pokémon League', col: 1, row: 0, type: 'landmark', childMaps: ['pokemon-league-nerida', 'pokemon-league-theron', 'pokemon-league-lysandra', 'pokemon-league-ashborne', 'pokemon-league-champion'] },
  { mapKey: 'aether-sanctum', label: 'Aether Sanctum', col: 0, row: 0, type: 'dungeon' },
  { mapKey: 'shattered-isles-shore', label: 'Shattered Isles', col: 0, row: 8, type: 'dungeon', childMaps: ['shattered-isles-ruins', 'shattered-isles-temple'] },
] as const satisfies readonly RegionMapNode[];

export const REGION_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 5], [3, 4],
  [5, 6], [6, 7], [7, 8], [7, 9], [9, 11], [9, 10],
  [11, 12], [12, 13], [13, 14], [13, 15], [11, 16], [16, 17],
  [15, 18], [18, 19], [19, 21], [21, 20], [17, 22], [17, 23],
  [23, 24], [24, 25], [0, 26],
] as const satisfies readonly RegionMapEdge[];
