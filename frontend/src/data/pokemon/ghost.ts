import { PokemonData } from '../interfaces';

/** Ghost-type Pokemon (Gen 1) */
export const ghostPokemon: Record<number, PokemonData> = {
  92: {
    id: 92, name: 'Gastly', types: ['ghost', 'poison'],
    baseStats: { hp: 30, attack: 35, defense: 30, spAttack: 100, spDefense: 35, speed: 80 },
    abilities: ['levitate'],
    learnset: [
      { level: 1, moveId: 'lick' }, { level: 1, moveId: 'confuse-ray' },
      { level: 1, moveId: 'hypnosis' }, { level: 27, moveId: 'night-shade' },
      { level: 35, moveId: 'dream-eater' },
    ],
    evolutionChain: [{ pokemonId: 93, condition: { type: 'level', level: 25 } }],
    catchRate: 190, expYield: 62,
    spriteKeys: { front: 'gastly-front', back: 'gastly-back', icon: 'gastly-icon' },
  },
  93: {
    id: 93, name: 'Haunter', types: ['ghost', 'poison'],
    baseStats: { hp: 45, attack: 50, defense: 45, spAttack: 115, spDefense: 55, speed: 95 },
    abilities: ['levitate'],
    learnset: [
      { level: 1, moveId: 'lick' }, { level: 1, moveId: 'confuse-ray' },
      { level: 1, moveId: 'hypnosis' }, { level: 29, moveId: 'night-shade' },
      { level: 38, moveId: 'dream-eater' },
    ],
    evolutionChain: [{ pokemonId: 94, condition: { type: 'trade' } }],
    catchRate: 90, expYield: 142,
    spriteKeys: { front: 'haunter-front', back: 'haunter-back', icon: 'haunter-icon' },
  },
  94: {
    id: 94, name: 'Gengar', types: ['ghost', 'poison'],
    baseStats: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
    abilities: ['cursed-body'],
    learnset: [
      { level: 1, moveId: 'lick' }, { level: 1, moveId: 'confuse-ray' },
      { level: 1, moveId: 'hypnosis' }, { level: 29, moveId: 'night-shade' },
      { level: 38, moveId: 'dream-eater' },
    ],
    evolutionChain: [],
    catchRate: 45, expYield: 225,
    spriteKeys: { front: 'gengar-front', back: 'gengar-back', icon: 'gengar-icon' },
  },
};
