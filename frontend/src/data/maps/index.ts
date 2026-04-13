// ─── Map Registry ───
// Re-exports all shared types/constants and assembles the map registry.

export {
  Tile,
  TILE_COLORS,
  SOLID_TILES,
  OVERLAY_BASE,
  FOREGROUND_TILES,
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
// Interior maps
import { palletPlayerHouse } from './pallet-player-house';
import { palletRivalHouse } from './pallet-rival-house';
import { palletOakLab } from './pallet-oak-lab';
import { viridianPokecenter } from './viridian-pokecenter';
import { viridianPokemart } from './viridian-pokemart';
import { pewterPokecenter } from './pewter-pokecenter';
import { pewterGym } from './pewter-gym';
import { pewterMuseum } from './pewter-museum';
// Dungeons
import { crystalCavern } from './crystal-cavern';

export const mapRegistry: Record<string, MapDefinition> = {
  'pallet-town': palletTown,
  'route-1': route1,
  'viridian-city': viridianCity,
  'route-2': route2,
  'viridian-forest': viridianForest,
  'pewter-city': pewterCity,
  // Interiors
  'pallet-player-house': palletPlayerHouse,
  'pallet-rival-house': palletRivalHouse,
  'pallet-oak-lab': palletOakLab,
  'viridian-pokecenter': viridianPokecenter,
  'viridian-pokemart': viridianPokemart,
  'pewter-pokecenter': pewterPokecenter,
  'pewter-gym': pewterGym,
  'pewter-museum': pewterMuseum,
  // Dungeons
  'crystal-cavern': crystalCavern,
};
