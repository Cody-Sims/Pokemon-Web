import { pokemonData } from '@data/pokemon';
import { moveData, type MoveId } from '@data/moves';
import type { PokemonType } from '@utils/type-helpers';

const UNIVERSAL_MOVES = new Set<MoveId>([
  'toxic',
  'protect',
  'rest',
  'return',
  'double-team',
  'facade',
  'attract',
  'substitute',
  'swift',
  'strength',
  'roar',
  'hyper-beam',
]);

const SPECIAL_OVERRIDES: Record<number, MoveId[]> = {
  6:   ['dragon-claw', 'dragon-rage', 'brick-break', 'focus-punch', 'earthquake', 'dig', 'solar-beam'],
  38:  ['psychic', 'calm-mind', 'dark-pulse'],
  59:  ['dig', 'dragon-rage', 'iron-tail', 'aerial-ace'],
  146: ['solar-beam', 'psychic'],
  149: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder', 'ice-beam', 'blizzard',
        'flamethrower', 'fire-blast', 'earthquake', 'brick-break', 'surf', 'waterfall', 'iron-tail'],
  7:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  8:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  9:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  1:   ['earthquake', 'body-slam', 'swords-dance'],
  2:   ['earthquake', 'body-slam', 'swords-dance'],
  3:   ['earthquake', 'body-slam', 'swords-dance'],
  66:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  67:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  68:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  107: ['fire-punch', 'ice-punch', 'thunder-punch'],
  106: ['rock-slide', 'earthquake', 'brick-break'],
  56:  ['rock-slide', 'dig', 'thunder-punch', 'ice-punch', 'fire-punch'],
  57:  ['rock-slide', 'dig', 'thunder-punch', 'ice-punch', 'fire-punch'],
  16:  ['steel-wing'],
  17:  ['steel-wing'],
  18:  ['steel-wing', 'aerial-ace'],
  22:  ['aerial-ace', 'drill-peck'],
  20:  ['dig', 'ice-beam', 'thunderbolt', 'shadow-ball'],
  39:  ['ice-beam', 'thunderbolt', 'flamethrower', 'psychic', 'shadow-ball', 'fire-punch', 'ice-punch', 'thunder-punch'],
  40:  ['ice-beam', 'thunderbolt', 'flamethrower', 'psychic', 'shadow-ball', 'fire-punch', 'ice-punch', 'thunder-punch'],
  147: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder-wave', 'ice-beam',
        'flamethrower', 'surf', 'waterfall', 'iron-tail'],
  148: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder-wave', 'ice-beam',
        'flamethrower', 'surf', 'waterfall', 'iron-tail'],
};

export function canLearnMove(pokemonId: number, moveId: string): boolean {
  if (UNIVERSAL_MOVES.has(moveId as MoveId)) return true;

  const overrides = SPECIAL_OVERRIDES[pokemonId];
  if (overrides?.includes(moveId as MoveId)) return true;

  const pokemon = pokemonData[pokemonId];
  const move = moveData[moveId];
  if (!pokemon || !move) return false;

  const pokemonTypes: readonly PokemonType[] = pokemon.types;
  return pokemonTypes.includes(move.type);
}
