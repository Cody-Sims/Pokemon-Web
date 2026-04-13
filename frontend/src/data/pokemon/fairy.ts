import { PokemonData } from '../interfaces';

/** Fairy-type Pokemon (Gen 1) */
export const fairyPokemon: Record<number, PokemonData> = {
  35: {
    id: 35, name: 'Clefairy', types: ['fairy'],
    baseStats: { hp: 70, attack: 45, defense: 48, spAttack: 60, spDefense: 65, speed: 35 },
    abilities: ['cute-charm'],
    learnset: [
      { level: 1, moveId: 'pound' }, { level: 1, moveId: 'growl' },
      { level: 8, moveId: 'sing' }, { level: 13, moveId: 'double-slap' },
      { level: 18, moveId: 'minimize' }, { level: 24, moveId: 'metronome' },
      { level: 31, moveId: 'defense-curl' }, { level: 39, moveId: 'light-screen' },
    ],
    evolutionChain: [{ pokemonId: 36, condition: { type: 'item', itemId: 'moon-stone' } }],
    catchRate: 150, expYield: 113,
    spriteKeys: { front: 'clefairy-front', back: 'clefairy-back', icon: 'clefairy-icon' },
  },
  36: {
    id: 36, name: 'Clefable', types: ['fairy'],
    baseStats: { hp: 95, attack: 70, defense: 73, spAttack: 95, spDefense: 90, speed: 60 },
    abilities: ['cute-charm'],
    learnset: [
      { level: 1, moveId: 'sing' }, { level: 1, moveId: 'double-slap' },
      { level: 1, moveId: 'minimize' }, { level: 1, moveId: 'metronome' },
    ],
    evolutionChain: [],
    catchRate: 25, expYield: 217,
    spriteKeys: { front: 'clefable-front', back: 'clefable-back', icon: 'clefable-icon' },
  },
};
