import { PokemonData } from '../interfaces';

/** Ice-type Pokemon (Gen 1) */
export const icePokemon: Record<number, PokemonData> = {
  124: {
    id: 124, name: 'Jynx', types: ['ice', 'psychic'],
    baseStats: { hp: 65, attack: 50, defense: 35, spAttack: 115, spDefense: 95, speed: 95 },
    abilities: ['oblivious'],
    learnset: [
      { level: 1, moveId: 'pound' }, { level: 1, moveId: 'lovely-kiss' },
      { level: 18, moveId: 'lick' }, { level: 23, moveId: 'double-slap' },
      { level: 31, moveId: 'ice-punch' }, { level: 39, moveId: 'body-slam' },
      { level: 47, moveId: 'blizzard' },
    ],
    evolutionChain: [],
    catchRate: 45, expYield: 159,
    spriteKeys: { front: 'jynx-front', back: 'jynx-back', icon: 'jynx-icon' },
  },
  144: {
    id: 144, name: 'Articuno', types: ['ice', 'flying'],
    baseStats: { hp: 90, attack: 85, defense: 100, spAttack: 95, spDefense: 125, speed: 85 },
    abilities: ['pressure'],
    learnset: [
      { level: 1, moveId: 'peck' }, { level: 1, moveId: 'ice-beam' },
      { level: 51, moveId: 'blizzard' }, { level: 55, moveId: 'agility' },
      { level: 60, moveId: 'mist' },
    ],
    evolutionChain: [],
    catchRate: 3, expYield: 261,
    spriteKeys: { front: 'articuno-front', back: 'articuno-back', icon: 'articuno-icon' },
  },
};
