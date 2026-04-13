// ─── Map Registry ───
// Re-exports all shared types/constants and assembles the map registry.

export {
  Tile,
  TILE_COLORS,
  SOLID_TILES,
  parseMap,
  type NpcSpawn,
  type TrainerSpawn,
  type WarpDefinition,
  type SpawnPoint,
  type MapDefinition,
} from './shared';

import { MapDefinition } from './shared';
import { palletTown } from './pallet-town';
import { route1 } from './route-1';
import { viridianCity } from './viridian-city';
import { route2 } from './route-2';
import { viridianForest } from './viridian-forest';
import { pewterCity } from './pewter-city';

export const mapRegistry: Record<string, MapDefinition> = {
  'pallet-town': palletTown,
  'route-1': route1,
  'viridian-city': viridianCity,
  'route-2': route2,
  'viridian-forest': viridianForest,
  'pewter-city': pewterCity,
};
