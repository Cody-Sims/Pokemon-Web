import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import type { PokemonType } from '@utils/type-helpers';

// ─── TM Data ───────────────────────────────────────────────────────────────────

export interface TMData {
  id: string;
  moveId: string;
  name: string;
  price: number;
  location: string;
  reusable: boolean;
}

export const tmData: Record<string, TMData> = {
  // ─── Gym Reward TMs ──────────────────────────────────────────────────────────
  'tm03': { id: 'tm03', moveId: 'water-pulse',    name: 'TM03 Water Pulse',    price: 0, location: 'Coral Gym reward',        reusable: true },
  'tm09': { id: 'tm09', moveId: 'solar-beam',     name: 'TM09 Solar Beam',     price: 0, location: 'Verdantia Gym reward',    reusable: true },
  'tm20': { id: 'tm20', moveId: 'iron-tail',      name: 'TM20 Iron Tail',      price: 0, location: 'Ironvale Gym reward',     reusable: true },
  'tm22': { id: 'tm22', moveId: 'rock-slide',     name: 'TM22 Rock Slide',     price: 0, location: 'Pewter Gym reward',       reusable: true },
  'tm24': { id: 'tm24', moveId: 'thunderbolt',    name: 'TM24 Thunderbolt',    price: 0, location: 'Voltara Gym reward',      reusable: true },
  'tm26': { id: 'tm26', moveId: 'psychic',        name: 'TM26 Psychic',        price: 0, location: 'Wraithmoor Gym reward',   reusable: true },
  'tm30': { id: 'tm30', moveId: 'flamethrower',   name: 'TM30 Flamethrower',   price: 0, location: 'Cinderfall Gym reward',   reusable: true },
  'tm44': { id: 'tm44', moveId: 'dragon-claw',    name: 'TM44 Dragon Claw',    price: 0, location: 'Scalecrest Gym reward',   reusable: true },

  // ─── Route / Dungeon Pickup TMs ──────────────────────────────────────────────
  'tm01': { id: 'tm01', moveId: 'focus-punch',    name: 'TM01 Focus Punch',    price: 0, location: 'Victory Road',            reusable: true },
  'tm04': { id: 'tm04', moveId: 'calm-mind',      name: 'TM04 Calm Mind',      price: 0, location: 'Route 5',                 reusable: true },
  'tm05': { id: 'tm05', moveId: 'roar',           name: 'TM05 Roar',           price: 0, location: 'Route 2',                 reusable: true },
  'tm06': { id: 'tm06', moveId: 'toxic',          name: 'TM06 Toxic',          price: 0, location: 'Route 4',                 reusable: true },
  'tm10': { id: 'tm10', moveId: 'facade',         name: 'TM10 Facade',         price: 0, location: 'Route 3',                 reusable: true },
  'tm14': { id: 'tm14', moveId: 'blizzard',       name: 'TM14 Blizzard',       price: 0, location: 'Victory Road',            reusable: true },
  'tm21': { id: 'tm21', moveId: 'return',         name: 'TM21 Return',         price: 0, location: 'Littoral Town (Prof. Willow)', reusable: true },
  'tm23': { id: 'tm23', moveId: 'thunder',        name: 'TM23 Thunder',        price: 0, location: 'Route 7',                 reusable: true },
  'tm25': { id: 'tm25', moveId: 'earthquake',     name: 'TM25 Earthquake',     price: 0, location: 'Victory Road',            reusable: true },
  'tm27': { id: 'tm27', moveId: 'double-team',    name: 'TM27 Double Team',    price: 0, location: 'Route 3',                 reusable: true },
  'tm32': { id: 'tm32', moveId: 'aerial-ace',     name: 'TM32 Aerial Ace',     price: 0, location: 'Route 4',                 reusable: true },
  'tm34': { id: 'tm34', moveId: 'swords-dance',   name: 'TM34 Swords Dance',   price: 0, location: 'Victory Road',            reusable: true },
  'tm35': { id: 'tm35', moveId: 'fly',            name: 'TM35 Fly',            price: 0, location: 'Route 5',                 reusable: true },
  'tm36': { id: 'tm36', moveId: 'surf',           name: 'TM36 Surf',           price: 0, location: 'Coral Harbor',            reusable: true },
  'tm41': { id: 'tm41', moveId: 'dig',            name: 'TM41 Dig',            price: 0, location: 'Crystal Cavern',          reusable: true },
  'tm43': { id: 'tm43', moveId: 'rest',           name: 'TM43 Rest',           price: 0, location: 'Route 1',                 reusable: true },
  'tm47': { id: 'tm47', moveId: 'dark-pulse',     name: 'TM47 Dark Pulse',     price: 0, location: 'Ember Mines',             reusable: true },

  // ─── Shop TMs ────────────────────────────────────────────────────────────────
  'tm02': { id: 'tm02', moveId: 'dragon-rage',    name: 'TM02 Dragon Rage',    price: 5000,  location: 'Scalecrest shop',      reusable: true },
  'tm07': { id: 'tm07', moveId: 'hail',           name: 'TM07 Hail',           price: 3000,  location: 'Scalecrest shop',      reusable: true },
  'tm08': { id: 'tm08', moveId: 'body-slam',      name: 'TM08 Body Slam',      price: 3000,  location: 'Ironvale shop',        reusable: true },
  'tm11': { id: 'tm11', moveId: 'sunny-day',      name: 'TM11 Sunny Day',      price: 3000,  location: 'Cinderfall shop',      reusable: true },
  'tm12': { id: 'tm12', moveId: 'attract',        name: 'TM12 Attract',        price: 1500,  location: 'Verdantia shop',       reusable: true },
  'tm13': { id: 'tm13', moveId: 'ice-beam',       name: 'TM13 Ice Beam',       price: 5500,  location: 'Scalecrest shop',      reusable: true },
  'tm15': { id: 'tm15', moveId: 'hyper-beam',     name: 'TM15 Hyper Beam',     price: 7500,  location: 'Pokemon League shop',  reusable: true },
  'tm16': { id: 'tm16', moveId: 'light-screen',   name: 'TM16 Light Screen',   price: 3000,  location: 'Voltara shop',         reusable: true },
  'tm17': { id: 'tm17', moveId: 'protect',        name: 'TM17 Protect',        price: 3000,  location: 'Viridian shop',        reusable: true },
  'tm18': { id: 'tm18', moveId: 'rain-dance',     name: 'TM18 Rain Dance',     price: 3000,  location: 'Coral Harbor shop',    reusable: true },
  'tm19': { id: 'tm19', moveId: 'mega-drain',     name: 'TM19 Mega Drain',     price: 3000,  location: 'Verdantia shop',       reusable: true },
  'tm28': { id: 'tm28', moveId: 'shadow-ball',    name: 'TM28 Shadow Ball',    price: 5500,  location: 'Wraithmoor shop',      reusable: true },
  'tm29': { id: 'tm29', moveId: 'brick-break',    name: 'TM29 Brick Break',    price: 3000,  location: 'Ironvale shop',        reusable: true },
  'tm31': { id: 'tm31', moveId: 'fire-blast',     name: 'TM31 Fire Blast',     price: 5500,  location: 'Cinderfall shop',      reusable: true },
  'tm33': { id: 'tm33', moveId: 'reflect',        name: 'TM33 Reflect',        price: 3000,  location: 'Voltara shop',         reusable: true },
  'tm37': { id: 'tm37', moveId: 'fire-punch',     name: 'TM37 Fire Punch',     price: 3000,  location: 'Ironvale shop',        reusable: true },
  'tm38': { id: 'tm38', moveId: 'ice-punch',      name: 'TM38 Ice Punch',      price: 3000,  location: 'Ironvale shop',        reusable: true },
  'tm39': { id: 'tm39', moveId: 'thunder-punch',  name: 'TM39 Thunder Punch',  price: 3000,  location: 'Ironvale shop',        reusable: true },
  'tm40': { id: 'tm40', moveId: 'rock-tomb',      name: 'TM40 Rock Tomb',      price: 1500,  location: 'Pewter shop',          reusable: true },
  'tm42': { id: 'tm42', moveId: 'substitute',     name: 'TM42 Substitute',     price: 4000,  location: 'Pokemon League shop',  reusable: true },
  'tm45': { id: 'tm45', moveId: 'sandstorm',      name: 'TM45 Sandstorm',      price: 3000,  location: 'Pewter shop',          reusable: true },
  'tm46': { id: 'tm46', moveId: 'thunder-wave',   name: 'TM46 Thunder Wave',   price: 2000,  location: 'Voltara shop',         reusable: true },
  'tm48': { id: 'tm48', moveId: 'flash-cannon',  name: 'TM48 Flash Cannon',  price: 5500,  location: 'Ironvale shop',        reusable: true },
  'tm49': { id: 'tm49', moveId: 'swift',          name: 'TM49 Swift',          price: 2000,  location: 'Viridian shop',        reusable: true },
  'tm50': { id: 'tm50', moveId: 'energy-ball',    name: 'TM50 Energy Ball',    price: 5500,  location: 'Verdantia shop',       reusable: true },
};

// ─── Move Tutor Data ───────────────────────────────────────────────────────────

export interface MoveTutorData {
  id: string;
  name: string;
  location: string;
  moves: { moveId: string; cost: number; costType: 'money' | 'heart-scale' }[];
}

export const moveTutorData: Record<string, MoveTutorData> = {
  'tutor-verdantia': {
    id: 'tutor-verdantia',
    name: 'Verdantia Move Tutor',
    location: 'verdantia-village',
    moves: [
      { moveId: 'solar-beam',  cost: 2, costType: 'heart-scale' },
      { moveId: 'mega-drain',  cost: 1, costType: 'heart-scale' },
      { moveId: 'razor-leaf',  cost: 1, costType: 'heart-scale' },
      { moveId: 'petal-dance', cost: 2, costType: 'heart-scale' },
      { moveId: 'leech-seed',  cost: 1, costType: 'heart-scale' },
    ],
  },
  'tutor-ironvale': {
    id: 'tutor-ironvale',
    name: 'Ironvale Punch Tutor',
    location: 'ironvale-city',
    moves: [
      { moveId: 'fire-punch',    cost: 4000, costType: 'money' },
      { moveId: 'ice-punch',     cost: 4000, costType: 'money' },
      { moveId: 'thunder-punch', cost: 4000, costType: 'money' },
      { moveId: 'mega-punch',    cost: 3000, costType: 'money' },
      { moveId: 'mega-kick',     cost: 3000, costType: 'money' },
    ],
  },
  'tutor-scalecrest': {
    id: 'tutor-scalecrest',
    name: 'Scalecrest Dragon Tutor',
    location: 'scalecrest-citadel',
    moves: [
      { moveId: 'dragon-claw',   cost: 3, costType: 'heart-scale' },
      { moveId: 'draco-meteor',  cost: 4, costType: 'heart-scale' },
      { moveId: 'outrage',       cost: 3, costType: 'heart-scale' },
      { moveId: 'dragon-rage',   cost: 1, costType: 'heart-scale' },
    ],
  },
  'tutor-league': {
    id: 'tutor-league',
    name: 'Pokemon League Tutor',
    location: 'pokemon-league',
    moves: [
      { moveId: 'hyper-beam',    cost: 8000, costType: 'money' },
      { moveId: 'giga-impact',   cost: 8000, costType: 'money' },
      { moveId: 'blast-burn',    cost: 10000, costType: 'money' },
      { moveId: 'hydro-cannon',  cost: 10000, costType: 'money' },
      { moveId: 'frenzy-plant',  cost: 10000, costType: 'money' },
    ],
  },
  'tutor-wraithmoor': {
    id: 'tutor-wraithmoor',
    name: 'Wraithmoor Shadow Tutor',
    location: 'wraithmoor-town',
    moves: [
      { moveId: 'shadow-ball',   cost: 2, costType: 'heart-scale' },
      { moveId: 'night-shade',   cost: 1, costType: 'heart-scale' },
      { moveId: 'confuse-ray',   cost: 1, costType: 'heart-scale' },
      { moveId: 'dream-eater',   cost: 2, costType: 'heart-scale' },
    ],
  },
};

// ─── Move Compatibility ────────────────────────────────────────────────────────

/** Moves any Pokemon can learn regardless of type. */
const UNIVERSAL_MOVES = new Set<string>([
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

/**
 * Per-Pokemon overrides for moves they can learn outside their own type(s).
 * Key = pokemonData id, value = array of extra moveIds they can learn.
 */
const SPECIAL_OVERRIDES: Record<number, string[]> = {
  // Charizard (Fire/Flying) — can learn Dragon and Fighting moves
  6:   ['dragon-claw', 'dragon-rage', 'brick-break', 'focus-punch', 'earthquake', 'dig', 'solar-beam'],
  // Ninetales (Fire) — can learn Psychic-type and Dark-type TMs
  38:  ['psychic', 'calm-mind', 'dark-pulse'],
  // Arcanine (Fire) — can learn various coverage moves
  59:  ['dig', 'dragon-rage', 'iron-tail', 'aerial-ace'],
  // Moltres (Fire/Flying) — can learn Solar Beam, Psychic coverage
  146: ['solar-beam', 'psychic'],
  // Dragonite (Dragon/Flying) — can learn many TMs across types
  149: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder', 'ice-beam', 'blizzard',
        'flamethrower', 'fire-blast', 'earthquake', 'brick-break', 'surf', 'waterfall', 'iron-tail'],
  // Blastoise-line (Water) — can learn Ice and some Fighting moves
  7:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  8:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  9:   ['ice-beam', 'blizzard', 'ice-punch', 'earthquake', 'dig', 'brick-break', 'iron-tail'],
  // Venusaur-line (Grass/Poison) — can learn Earthquake, Body Slam
  1:   ['earthquake', 'body-slam', 'swords-dance'],
  2:   ['earthquake', 'body-slam', 'swords-dance'],
  3:   ['earthquake', 'body-slam', 'swords-dance'],
  // Machamp-line (Fighting) — can learn elemental punches, Rock, Ground moves
  66:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  67:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  68:  ['fire-punch', 'ice-punch', 'thunder-punch', 'rock-slide', 'rock-tomb', 'earthquake', 'dig'],
  // Hitmonchan (Fighting) — elemental punches specialist
  107: ['fire-punch', 'ice-punch', 'thunder-punch'],
  // Hitmonlee (Fighting)
  106: ['rock-slide', 'earthquake', 'brick-break'],
  // Primeape-line (Fighting)
  56:  ['rock-slide', 'dig', 'thunder-punch', 'ice-punch', 'fire-punch'],
  57:  ['rock-slide', 'dig', 'thunder-punch', 'ice-punch', 'fire-punch'],
  // Pidgeot-line (Normal/Flying) — can learn some coverage
  16:  ['steel-wing'],
  17:  ['steel-wing'],
  18:  ['steel-wing', 'aerial-ace'],
  // Fearow (Normal/Flying)
  22:  ['aerial-ace', 'drill-peck'],
  // Raticate (Normal)
  20:  ['dig', 'ice-beam', 'thunderbolt', 'shadow-ball'],
  // Jigglypuff/Wigglytuff (Normal/Fairy) — wide movepool
  39:  ['ice-beam', 'thunderbolt', 'flamethrower', 'psychic', 'shadow-ball', 'fire-punch', 'ice-punch', 'thunder-punch'],
  40:  ['ice-beam', 'thunderbolt', 'flamethrower', 'psychic', 'shadow-ball', 'fire-punch', 'ice-punch', 'thunder-punch'],
  // Dratini/Dragonair (Dragon) — wide TM coverage
  147: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder-wave', 'ice-beam',
        'flamethrower', 'surf', 'waterfall', 'iron-tail'],
  148: ['fire-punch', 'ice-punch', 'thunder-punch', 'thunderbolt', 'thunder-wave', 'ice-beam',
        'flamethrower', 'surf', 'waterfall', 'iron-tail'],
};

/**
 * Check if a specific Pokemon can learn a move via TM or tutor.
 *
 * Uses a lenient approach:
 * 1. Universal moves (Toxic, Protect, etc.) are learnable by all.
 * 2. Pokemon can learn moves matching any of their own type(s).
 * 3. Specific per-Pokemon override lists for cross-type coverage.
 */
export function canLearnMove(pokemonId: number, moveId: string): boolean {
  // Universal moves — every Pokemon can learn these
  if (UNIVERSAL_MOVES.has(moveId)) return true;

  // Per-Pokemon override
  const overrides = SPECIAL_OVERRIDES[pokemonId];
  if (overrides?.includes(moveId)) return true;

  // Type-based matching: Pokemon can learn moves that match their type(s)
  const pokemon = pokemonData[pokemonId];
  const move = moveData[moveId];
  if (!pokemon || !move) return false;

  const pokemonTypes: readonly PokemonType[] = pokemon.types;
  return pokemonTypes.includes(move.type);
}

// ─── Heart Scale Item ──────────────────────────────────────────────────────────

export const HEART_SCALE_ITEM = {
  id: 'heart-scale',
  name: 'Heart Scale',
  category: 'key' as const,
  description: 'A pretty heart-shaped scale. Needed by certain Move Tutors.',
  buyPrice: 0,
};
