import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/EncounterSystem';
import { AchievementManager } from '@managers/AchievementManager';
import type { PokemonInstance } from '@data/interfaces';

export type RodType = 'old' | 'good' | 'super';

/** Determine the best fishing rod the player owns. */
export function getBestRod(): RodType | null {
  const gm = GameManager.getInstance();
  if (gm.getItemCount('super-rod') > 0) return 'super';
  if (gm.getItemCount('good-rod') > 0) return 'good';
  if (gm.getItemCount('old-rod') > 0) return 'old';
  return null;
}

/** Attempt a fishing encounter. Returns the encountered Pokémon or null. */
export function attemptFish(mapKey: string, rod: RodType): PokemonInstance | null {
  const pokemon = EncounterSystem.fishEncounter(mapKey, rod);
  if (pokemon) {
    GameManager.getInstance().markSeen(pokemon.dataId);
    AchievementManager.getInstance().unlock('fish-catch');
  }
  return pokemon;
}
