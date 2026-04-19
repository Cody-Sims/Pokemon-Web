// ─── Map Registry ───
// Re-exports all shared types/constants and assembles the map registry.

export { Tile, LEDGE_TILES } from './tiles';
export { TILE_COLORS, SOLID_TILES, OVERLAY_BASE, FOREGROUND_TILES } from './tile-metadata';
export { parseMap } from './map-parser';
export type { NpcSpawn, TrainerSpawn, WarpDefinition, SpawnPoint, MapDefinition } from './map-interfaces';

import type { MapDefinition } from './map-interfaces';

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
import { pewterPokemart } from './interiors/pewter-pokemart';
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
import {
  pokemonLeague,
  pokemonLeagueNerida,
  pokemonLeagueTheron,
  pokemonLeagueLysandra,
  pokemonLeagueAshborne,
  pokemonLeagueChampion,
} from './interiors/pokemon-league';

// Dungeons
import { viridianForest } from './dungeons/viridian-forest';
import { crystalCavern } from './dungeons/crystal-cavern';
import { emberMines } from './dungeons/ember-mines';
import { victoryRoad } from './dungeons/victory-road';
import { verdantiaLab } from './dungeons/verdantia-lab';
import { aetherSanctum } from './dungeons/aether-sanctum';
import { crystalCavernDepths } from './dungeons/crystal-cavern-depths';
import { abyssalSpireF1 } from './dungeons/abyssal-spire-f1';
import { abyssalSpireF2 } from './dungeons/abyssal-spire-f2';
import { abyssalSpireF3 } from './dungeons/abyssal-spire-f3';
import { abyssalSpireF4 } from './dungeons/abyssal-spire-f4';
import { abyssalSpireF5 } from './dungeons/abyssal-spire-f5';
import { shatteredIslesShore } from './dungeons/shattered-isles-shore';
import { shatteredIslesRuins } from './dungeons/shattered-isles-ruins';
import { shatteredIslesTemple } from './dungeons/shattered-isles-temple';
import { route8 } from './routes/route-8';
import {
  palletHouse1, viridianHouse1, viridianHouse2, pewterHouse1, pewterHouse2, coralHouse1,
  ironvaleHouse1, verdantiaHouse1, voltaraHouse1,
  wraithmoorHouse1, scalecrestHouse1, cinderfallHouse1,
} from './interiors/generic-house';

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
  'pewter-pokemart': pewterPokemart,
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
  'verdantia-lab': verdantiaLab,
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
  'route-8': route8,
  // Abyssal Spire (Act 3 climax dungeon)
  'abyssal-spire-f1': abyssalSpireF1,
  'abyssal-spire-f2': abyssalSpireF2,
  'abyssal-spire-f3': abyssalSpireF3,
  'abyssal-spire-f4': abyssalSpireF4,
  'abyssal-spire-f5': abyssalSpireF5,
  // Act 4
  'victory-road': victoryRoad,
  'pokemon-league': pokemonLeague,
  'pokemon-league-nerida': pokemonLeagueNerida,
  'pokemon-league-theron': pokemonLeagueTheron,
  'pokemon-league-lysandra': pokemonLeagueLysandra,
  'pokemon-league-ashborne': pokemonLeagueAshborne,
  'pokemon-league-champion': pokemonLeagueChampion,
  // Post-game dungeons
  'aether-sanctum': aetherSanctum,
  'crystal-cavern-depths': crystalCavernDepths,
  // Post-game — Shattered Isles
  'shattered-isles-shore': shatteredIslesShore,
  'shattered-isles-ruins': shatteredIslesRuins,
  'shattered-isles-temple': shatteredIslesTemple,
  // Generic house interiors
  'pallet-town-house-1': palletHouse1,
  'viridian-city-house-1': viridianHouse1,
  'viridian-city-house-2': viridianHouse2,
  'pewter-city-house-1': pewterHouse1,
  'pewter-city-house-2': pewterHouse2,
  'coral-harbor-house-1': coralHouse1,
  'ironvale-city-house-1': ironvaleHouse1,
  'verdantia-village-house-1': verdantiaHouse1,
  'voltara-city-house-1': voltaraHouse1,
  'wraithmoor-town-house-1': wraithmoorHouse1,
  'scalecrest-citadel-house-1': scalecrestHouse1,
  'cinderfall-town-house-1': cinderfallHouse1,
};
