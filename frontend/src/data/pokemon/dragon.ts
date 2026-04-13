import { PokemonData } from '../interfaces';

/** Dragon-type Pokemon (Gen 1) */
export const dragonPokemon: Record<number, PokemonData> = {
  147: {
    id: 147, name: 'Dratini', types: ['dragon'],
    baseStats: { hp: 41, attack: 64, defense: 45, spAttack: 50, spDefense: 50, speed: 50 },
    abilities: ['shed-skin'],
    learnset: [
      { level: 1, moveId: 'wrap' }, { level: 1, moveId: 'leer' },
      { level: 10, moveId: 'thunder-wave' }, { level: 20, moveId: 'dragon-rage' },
      { level: 30, moveId: 'slam' }, { level: 40, moveId: 'agility' },
    ],
    evolutionChain: [{ pokemonId: 148, condition: { type: 'level', level: 30 } }],
    catchRate: 45, expYield: 60,
    spriteKeys: { front: 'dratini-front', back: 'dratini-back', icon: 'dratini-icon' },
  },
  148: {
    id: 148, name: 'Dragonair', types: ['dragon'],
    baseStats: { hp: 61, attack: 84, defense: 65, spAttack: 70, spDefense: 70, speed: 70 },
    abilities: ['shed-skin'],
    learnset: [
      { level: 1, moveId: 'wrap' }, { level: 1, moveId: 'leer' },
      { level: 10, moveId: 'thunder-wave' }, { level: 20, moveId: 'dragon-rage' },
      { level: 35, moveId: 'slam' }, { level: 45, moveId: 'agility' },
      { level: 55, moveId: 'hyper-beam' },
    ],
    evolutionChain: [{ pokemonId: 149, condition: { type: 'level', level: 55 } }],
    catchRate: 45, expYield: 147,
    spriteKeys: { front: 'dragonair-front', back: 'dragonair-back', icon: 'dragonair-icon' },
  },
  149: {
    id: 149, name: 'Dragonite', types: ['dragon', 'flying'],
    baseStats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 },
    abilities: ['inner-focus'],
    learnset: [
      { level: 1, moveId: 'wrap' }, { level: 1, moveId: 'leer' },
      { level: 1, moveId: 'thunder-wave' }, { level: 1, moveId: 'dragon-rage' },
      { level: 55, moveId: 'slam' }, { level: 60, moveId: 'agility' },
      { level: 65, moveId: 'hyper-beam' },
    ],
    evolutionChain: [],
    catchRate: 45, expYield: 270,
    spriteKeys: { front: 'dragonite-front', back: 'dragonite-back', icon: 'dragonite-icon' },
  },
};
