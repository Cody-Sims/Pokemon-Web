import { EvolutionCondition } from '@utils/type-helpers';

/** Evolution data — maps pokemonId → possible evolutions with conditions. */
export const evolutionData: Record<number, { evolvesTo: number; condition: EvolutionCondition }[]> = {
  // ─── Starters ───
  1:  [{ evolvesTo: 2, condition: { type: 'level', level: 16 } }],
  2:  [{ evolvesTo: 3, condition: { type: 'level', level: 32 } }],
  4:  [{ evolvesTo: 5, condition: { type: 'level', level: 16 } }],
  5:  [{ evolvesTo: 6, condition: { type: 'level', level: 36 } }],
  7:  [{ evolvesTo: 8, condition: { type: 'level', level: 16 } }],
  8:  [{ evolvesTo: 9, condition: { type: 'level', level: 36 } }],
  // ─── Bug lines ───
  10: [{ evolvesTo: 11, condition: { type: 'level', level: 7 } }],
  11: [{ evolvesTo: 12, condition: { type: 'level', level: 10 } }],
  13: [{ evolvesTo: 14, condition: { type: 'level', level: 7 } }],
  14: [{ evolvesTo: 15, condition: { type: 'level', level: 10 } }],
  // ─── Normal/Flying ───
  16: [{ evolvesTo: 17, condition: { type: 'level', level: 18 } }],
  17: [{ evolvesTo: 18, condition: { type: 'level', level: 36 } }],
  19: [{ evolvesTo: 20, condition: { type: 'level', level: 20 } }],
  21: [{ evolvesTo: 22, condition: { type: 'level', level: 20 } }],
  // ─── Poison ───
  23: [{ evolvesTo: 24, condition: { type: 'level', level: 22 } }],
  // ─── Electric ───
  25: [{ evolvesTo: 26, condition: { type: 'item', itemId: 'thunder-stone' } }],
  // ─── Ground ───
  27: [{ evolvesTo: 28, condition: { type: 'level', level: 22 } }],
  // ─── Nidoran lines ───
  29: [{ evolvesTo: 30, condition: { type: 'level', level: 16 } }],
  30: [{ evolvesTo: 31, condition: { type: 'item', itemId: 'moon-stone' } }],
  32: [{ evolvesTo: 33, condition: { type: 'level', level: 16 } }],
  33: [{ evolvesTo: 34, condition: { type: 'item', itemId: 'moon-stone' } }],
  // ─── Fairy ───
  35: [{ evolvesTo: 36, condition: { type: 'item', itemId: 'moon-stone' } }],
  // ─── Fire ───
  37: [{ evolvesTo: 38, condition: { type: 'item', itemId: 'fire-stone' } }],
  // ─── Normal/Fairy ───
  39: [{ evolvesTo: 40, condition: { type: 'item', itemId: 'moon-stone' } }],
  // ─── Poison/Flying ───
  41: [{ evolvesTo: 42, condition: { type: 'level', level: 22 } }],
  // ─── Grass/Poison ───
  43: [{ evolvesTo: 44, condition: { type: 'level', level: 21 } }],
  44: [{ evolvesTo: 45, condition: { type: 'item', itemId: 'leaf-stone' } }],
  // ─── Bug ───
  46: [{ evolvesTo: 47, condition: { type: 'level', level: 24 } }],
  48: [{ evolvesTo: 49, condition: { type: 'level', level: 31 } }],
  // ─── Ground ───
  50: [{ evolvesTo: 51, condition: { type: 'level', level: 26 } }],
  // ─── Normal ───
  52: [{ evolvesTo: 53, condition: { type: 'level', level: 28 } }],
  // ─── Water ───
  54: [{ evolvesTo: 55, condition: { type: 'level', level: 33 } }],
  // ─── Fighting ───
  56: [{ evolvesTo: 57, condition: { type: 'level', level: 28 } }],
  // ─── Fire ───
  58: [{ evolvesTo: 59, condition: { type: 'item', itemId: 'fire-stone' } }],
  // ─── Water ───
  60: [{ evolvesTo: 61, condition: { type: 'level', level: 25 } }],
  61: [{ evolvesTo: 62, condition: { type: 'item', itemId: 'water-stone' } }],
  // ─── Psychic ───
  63: [{ evolvesTo: 64, condition: { type: 'level', level: 16 } }],
  64: [{ evolvesTo: 65, condition: { type: 'trade' } }],
  // ─── Fighting ───
  66: [{ evolvesTo: 67, condition: { type: 'level', level: 28 } }],
  67: [{ evolvesTo: 68, condition: { type: 'trade' } }],
  // ─── Grass ───
  69: [{ evolvesTo: 70, condition: { type: 'level', level: 21 } }],
  70: [{ evolvesTo: 71, condition: { type: 'item', itemId: 'leaf-stone' } }],
  // ─── Water/Poison ───
  72: [{ evolvesTo: 73, condition: { type: 'level', level: 30 } }],
  // ─── Rock/Ground ───
  74: [{ evolvesTo: 75, condition: { type: 'level', level: 25 } }],
  75: [{ evolvesTo: 76, condition: { type: 'trade' } }],
  // ─── Fire ───
  77: [{ evolvesTo: 78, condition: { type: 'level', level: 40 } }],
  // ─── Water/Psychic ───
  79: [{ evolvesTo: 80, condition: { type: 'level', level: 37 } }],
  // ─── Electric/Steel ───
  81: [{ evolvesTo: 82, condition: { type: 'level', level: 30 } }],
  // ─── Normal/Flying ───
  84: [{ evolvesTo: 85, condition: { type: 'level', level: 31 } }],
  // ─── Water ───
  86: [{ evolvesTo: 87, condition: { type: 'level', level: 34 } }],
  // ─── Poison ───
  88: [{ evolvesTo: 89, condition: { type: 'level', level: 38 } }],
  // ─── Water ───
  90: [{ evolvesTo: 91, condition: { type: 'item', itemId: 'water-stone' } }],
  // ─── Ghost ───
  92: [{ evolvesTo: 93, condition: { type: 'level', level: 25 } }],
  93: [{ evolvesTo: 94, condition: { type: 'trade' } }],
  // ─── Psychic ───
  96: [{ evolvesTo: 97, condition: { type: 'level', level: 26 } }],
  // ─── Water ───
  98: [{ evolvesTo: 99, condition: { type: 'level', level: 28 } }],
  // ─── Electric ───
  100: [{ evolvesTo: 101, condition: { type: 'level', level: 30 } }],
  // ─── Grass/Psychic ───
  102: [{ evolvesTo: 103, condition: { type: 'item', itemId: 'leaf-stone' } }],
  // ─── Ground ───
  104: [{ evolvesTo: 105, condition: { type: 'level', level: 28 } }],
  // ─── Poison ───
  109: [{ evolvesTo: 110, condition: { type: 'level', level: 35 } }],
  // ─── Ground/Rock ───
  111: [{ evolvesTo: 112, condition: { type: 'level', level: 42 } }],
  // ─── Water ───
  116: [{ evolvesTo: 117, condition: { type: 'level', level: 32 } }],
  118: [{ evolvesTo: 119, condition: { type: 'level', level: 33 } }],
  120: [{ evolvesTo: 121, condition: { type: 'item', itemId: 'water-stone' } }],
  129: [{ evolvesTo: 130, condition: { type: 'level', level: 20 } }],
  // ─── Eevee ───
  133: [
    { evolvesTo: 134, condition: { type: 'item', itemId: 'water-stone' } },
    { evolvesTo: 135, condition: { type: 'item', itemId: 'thunder-stone' } },
    { evolvesTo: 136, condition: { type: 'item', itemId: 'fire-stone' } },
    { evolvesTo: 196, condition: { type: 'friendship', friendship: 220 } }, // Espeon (day)
  ],
  // ─── Friendship-based ───
  // Golbat → Crobat
  42: [
    { evolvesTo: 169, condition: { type: 'friendship', friendship: 220 } },
  ],
  // ─── Fossils ───
  138: [{ evolvesTo: 139, condition: { type: 'level', level: 40 } }],
  140: [{ evolvesTo: 141, condition: { type: 'level', level: 40 } }],
  // ─── Dragon ───
  147: [{ evolvesTo: 148, condition: { type: 'level', level: 30 } }],
  148: [{ evolvesTo: 149, condition: { type: 'level', level: 55 } }],
};
