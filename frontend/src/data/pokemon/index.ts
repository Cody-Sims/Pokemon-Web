// ─── Pokemon Registry ───
// Re-exports the combined pokemonData record from per-type files.

import { PokemonData } from '../interfaces';
import { grassPokemon } from './grass';
import { firePokemon } from './fire';
import { waterPokemon } from './water';
import { bugPokemon } from './bug';
import { normalPokemon } from './normal';
import { poisonPokemon } from './poison';
import { electricPokemon } from './electric';
import { groundPokemon } from './ground';
import { fairyPokemon } from './fairy';
import { fightingPokemon } from './fighting';
import { psychicPokemon } from './psychic';
import { ghostPokemon } from './ghost';
import { rockPokemon } from './rock';
import { icePokemon } from './ice';
import { dragonPokemon } from './dragon';

export const pokemonData: Record<number, PokemonData> = {
  ...grassPokemon,
  ...firePokemon,
  ...waterPokemon,
  ...bugPokemon,
  ...normalPokemon,
  ...poisonPokemon,
  ...electricPokemon,
  ...groundPokemon,
  ...fairyPokemon,
  ...fightingPokemon,
  ...psychicPokemon,
  ...ghostPokemon,
  ...rockPokemon,
  ...icePokemon,
  ...dragonPokemon,
};
