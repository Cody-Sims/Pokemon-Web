// ─── Challenge mode rule enforcement ───
// Pure helpers that inspect GameManager state and decide whether a
// challenge-mode rule blocks a runtime action. Keep all rule logic here so
// callers (catch handler, PC, inventory) only need to ask `canDoX()`.

import { GameManager } from '@managers/GameManager';
import { PokemonInstance, PokemonData } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { MINIMAL_CATCHES_LIMIT } from '@data/challenge-modes';

/** Reason a rule blocked the action (`null` when allowed). */
export type ChallengeBlock = string | null;

/**
 * Should this Pokémon be allowed into the player's party (or storage)?
 * Returns null when allowed, or a short user-facing message when blocked.
 *
 * - Solo Run: only the starter (party slot 0 of a fresh game) is allowed.
 *   Practically: any party-add after the starter is blocked.
 * - Monotype: incoming Pokémon must share the locked-in starter type.
 */
export function blockReasonForPartyAdd(pokemon: PokemonInstance): ChallengeBlock {
  const gm = GameManager.getInstance();

  if (gm.hasChallengeMode('soloRun')) {
    if (gm.getParty().length > 0 || gm.getBoxes().some(b => b.length > 0)) {
      return 'Solo Run: only your starter may join the party.';
    }
  }

  if (gm.hasChallengeMode('monotype')) {
    const lock = gm.getMonotypeLock();
    if (lock) {
      const data: PokemonData | undefined = pokemonData[pokemon.dataId];
      if (!data || !data.types.includes(lock)) {
        return `Monotype: must include the ${lock.toUpperCase()} type.`;
      }
    }
  }

  return null;
}

/**
 * Should the player be allowed to catch / accept a wild Pokémon?
 * Layered on top of the party-add rules: even if there is room in the box,
 * `minimalCatches` caps the lifetime catch count.
 */
export function blockReasonForCatch(pokemon: PokemonInstance): ChallengeBlock {
  const gm = GameManager.getInstance();

  if (gm.hasChallengeMode('minimalCatches')) {
    const caught = gm.getGameStats().totalCatches;
    if (caught >= MINIMAL_CATCHES_LIMIT) {
      return `Minimal Catches: limit of ${MINIMAL_CATCHES_LIMIT} caught reached.`;
    }
  }

  return blockReasonForPartyAdd(pokemon);
}

/**
 * Should the player be allowed to use a bag item right now?
 * `noItems` blocks item use everywhere except Pokémon Centers (`pc-*` /
 * map keys ending in `-pokecenter`).
 */
export function blockReasonForItemUse(): ChallengeBlock {
  const gm = GameManager.getInstance();
  if (!gm.hasChallengeMode('noItems')) return null;
  const map = gm.getCurrentMap();
  // Centers in this game are named `<city>-pokecenter` (and a few `pc-*` aliases).
  if (map.endsWith('-pokecenter') || map.startsWith('pc-')) return null;
  return 'No Items: only usable inside Pokémon Centers.';
}
