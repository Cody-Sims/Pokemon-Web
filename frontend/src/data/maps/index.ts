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
// Act 2 maps
import { route3 } from './route-3';
import { coralHarbor } from './coral-harbor';
import { coralPokecenter } from './coral-pokecenter';
import { coralPokemart } from './coral-pokemart';
import { coralGym } from './coral-gym';
import { route4 } from './route-4';
import { emberMines } from './ember-mines';
import { ironvaleCity } from './ironvale-city';
import { ironvalePokecenter } from './ironvale-pokecenter';
import { ironvalePokemart } from './ironvale-pokemart';
import { ironvaleGym } from './ironvale-gym';
import { route5 } from './route-5';
import { verdantiaVillage } from './verdantia-village';
import { verdantiaPokecenter } from './verdantia-pokecenter';
import { verdantiaPokemart } from './verdantia-pokemart';
import { verdantiaGym } from './verdantia-gym';
import { voltaraCity } from './voltara-city';
import { voltaraPokecenter } from './voltara-pokecenter';
import { voltaraPokemart } from './voltara-pokemart';
import { voltaraGym } from './voltara-gym';

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
  // Act 2
  'route-3': route3,
  'coral-harbor': coralHarbor,
  'coral-pokecenter': coralPokecenter,
  'coral-pokemart': coralPokemart,
  'coral-gym': coralGym,
  'route-4': route4,
  'ember-mines': emberMines,
  'ironvale-city': ironvaleCity,
  'ironvale-pokecenter': ironvalePokecenter,
  'ironvale-pokemart': ironvalePokemart,
  'ironvale-gym': ironvaleGym,
  'route-5': route5,
  'verdantia-village': verdantiaVillage,
  'verdantia-pokecenter': verdantiaPokecenter,
  'verdantia-pokemart': verdantiaPokemart,
  'verdantia-gym': verdantiaGym,
  'voltara-city': voltaraCity,
  'voltara-pokecenter': voltaraPokecenter,
  'voltara-pokemart': voltaraPokemart,
  'voltara-gym': voltaraGym,
};
