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

// Cities & Towns
import { palletTown } from './cities/pallet-town';
import { viridianCity } from './cities/viridian-city';
import { pewterCity } from './cities/pewter-city';
import { coralHarbor } from './cities/coral-harbor';
import { ironvaleCity } from './cities/ironvale-city';
import { verdantiaVillage } from './cities/verdantia-village';
import { voltaraCity } from './cities/voltara-city';
import { wraithmoorTown } from './cities/wraithmoor-town';
import { scalecrestCitadel } from './cities/scalecrest-citadel';
import { cinderfallTown } from './cities/cinderfall-town';

// Routes
import { route1 } from './routes/route-1';
import { route2 } from './routes/route-2';
import { route3 } from './routes/route-3';
import { route4 } from './routes/route-4';
import { route5 } from './routes/route-5';
import { route6 } from './routes/route-6';
import { route7 } from './routes/route-7';

// Interiors
import { palletPlayerHouse } from './interiors/pallet-player-house';
import { palletRivalHouse } from './interiors/pallet-rival-house';
import { palletOakLab } from './interiors/pallet-oak-lab';
import { viridianPokecenter } from './interiors/viridian-pokecenter';
import { viridianPokemart } from './interiors/viridian-pokemart';
import { pewterPokecenter } from './interiors/pewter-pokecenter';
import { pewterGym } from './interiors/pewter-gym';
import { pewterMuseum } from './interiors/pewter-museum';
import { coralPokecenter } from './interiors/coral-pokecenter';
import { coralPokemart } from './interiors/coral-pokemart';
import { coralGym } from './interiors/coral-gym';
import { ironvalePokecenter } from './interiors/ironvale-pokecenter';
import { ironvalePokemart } from './interiors/ironvale-pokemart';
import { ironvaleGym } from './interiors/ironvale-gym';
import { verdantiaPokecenter } from './interiors/verdantia-pokecenter';
import { verdantiaPokemart } from './interiors/verdantia-pokemart';
import { verdantiaGym } from './interiors/verdantia-gym';
import { voltaraPokecenter } from './interiors/voltara-pokecenter';
import { voltaraPokemart } from './interiors/voltara-pokemart';
import { voltaraGym } from './interiors/voltara-gym';
import { wraithmoorPokecenter } from './interiors/wraithmoor-pokecenter';
import { wraithmoorPokemart } from './interiors/wraithmoor-pokemart';
import { wraithmoorGym } from './interiors/wraithmoor-gym';
import { scalecrestPokecenter } from './interiors/scalecrest-pokecenter';
import { scalecrestPokemart } from './interiors/scalecrest-pokemart';
import { scalecrestGym } from './interiors/scalecrest-gym';
import { cinderfallPokecenter } from './interiors/cinderfall-pokecenter';
import { cinderfallPokemart } from './interiors/cinderfall-pokemart';
import { cinderfallGym } from './interiors/cinderfall-gym';
import { pokemonLeague } from './interiors/pokemon-league';

// Dungeons
import { viridianForest } from './dungeons/viridian-forest';
import { crystalCavern } from './dungeons/crystal-cavern';
import { emberMines } from './dungeons/ember-mines';
import { victoryRoad } from './dungeons/victory-road';

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
  // Act 3
  'route-6': route6,
  'wraithmoor-town': wraithmoorTown,
  'wraithmoor-pokecenter': wraithmoorPokecenter,
  'wraithmoor-pokemart': wraithmoorPokemart,
  'wraithmoor-gym': wraithmoorGym,
  'route-7': route7,
  'scalecrest-citadel': scalecrestCitadel,
  'scalecrest-pokecenter': scalecrestPokecenter,
  'scalecrest-pokemart': scalecrestPokemart,
  'scalecrest-gym': scalecrestGym,
  'cinderfall-town': cinderfallTown,
  'cinderfall-pokecenter': cinderfallPokecenter,
  'cinderfall-pokemart': cinderfallPokemart,
  'cinderfall-gym': cinderfallGym,
  // Act 4
  'victory-road': victoryRoad,
  'pokemon-league': pokemonLeague,
};
