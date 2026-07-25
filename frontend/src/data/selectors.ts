import { itemData } from '@data/item-data';
import { moveData, type MoveId } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import type { ItemData, MoveData, PokemonData, PokemonInstance } from '@data/interfaces';
import { MAX_PARTY_SIZE } from '@utils/constants';

export class MissingDataError extends Error {
  constructor(kind: 'Pokémon' | 'move' | 'item', id: string | number) {
    super(`Unknown ${kind} id: ${String(id)}`);
    this.name = 'MissingDataError';
  }
}

export interface PartySlot {
  index: number;
  pokemon: PokemonInstance | null;
  isEmpty: boolean;
  isAlive: boolean;
}

/**
 * Registry selectors throw MissingDataError for unknown IDs so string-typed save,
 * trainer, and move references fail at the lookup boundary instead of rendering
 * stale fallback labels throughout battle and menu code.
 */
export function getPokemonData(id: number): PokemonData {
  const data = pokemonData[id];
  if (!data) throw new MissingDataError('Pokémon', id);
  return data;
}

export function getMoveData(id: MoveId | string): MoveData {
  const data = moveData[id];
  if (!data) throw new MissingDataError('move', id);
  return data;
}

export function getItemData(id: string): ItemData {
  const data = itemData[id];
  if (!data) throw new MissingDataError('item', id);
  return data;
}

export function pokemonDisplayName(instance: PokemonInstance): string {
  const nickname = instance.nickname?.trim();
  return nickname && nickname.length > 0 ? nickname : getPokemonData(instance.dataId).name;
}

export function hpRatio(pokemon: Pick<PokemonInstance, 'currentHp' | 'stats'>): number {
  const maxHp = pokemon.stats.hp;
  if (!Number.isFinite(maxHp) || maxHp <= 0 || !Number.isFinite(pokemon.currentHp)) return 0;
  return Math.max(0, Math.min(1, pokemon.currentHp / maxHp));
}

export function isAlive(pokemon: Pick<PokemonInstance, 'currentHp' | 'stats'>): boolean {
  return hpRatio(pokemon) > 0;
}

export function aliveParty(party: readonly PokemonInstance[]): PokemonInstance[] {
  return party.filter(isAlive);
}

export function partySlots(party: readonly PokemonInstance[], slotCount = MAX_PARTY_SIZE): PartySlot[] {
  const totalSlots = Math.max(0, slotCount, party.length);
  return Array.from({ length: totalSlots }, (_, index) => {
    const pokemon = party[index] ?? null;
    return {
      index,
      pokemon,
      isEmpty: pokemon === null,
      isAlive: pokemon !== null && isAlive(pokemon),
    };
  });
}
