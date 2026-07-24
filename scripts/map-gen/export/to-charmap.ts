/**
 * Export a numeric tile Grid back to character strings using TILE_TO_CHAR.
 * Inverse of parseMap() — converts tile IDs back to their character representation.
 */
import { Grid } from '../core/grid';

/**
 * Reverse mapping: tile ID → character.
 * Built from the CHAR_TO_TILE mapping in frontend/src/data/maps/map-parser.ts.
 * When multiple characters map to the same tile, the first (most common) is used.
 */
const TILE_TO_CHAR: Record<number, string> = {
  0: '.',     // GRASS
  1: 'P',     // PATH
  2: 'G',     // TALL_GRASS
  3: 'T',     // TREE
  4: 'W',     // WATER
  5: 'H',     // HOUSE_WALL
  6: 'R',     // HOUSE_ROOF
  7: 'D',     // HOUSE_DOOR
  8: 'F',     // FENCE
  9: 'f',     // FLOWER
  10: 'S',    // SIGN
  11: 'L',    // LAB_WALL
  12: 'B',    // LAB_ROOF
  13: 'E',    // LAB_DOOR
  14: 'J',    // LEDGE
  15: 'c',    // CENTER_WALL
  16: 'C',    // CENTER_ROOF
  17: 'e',    // CENTER_DOOR
  18: 'm',    // MART_WALL
  19: 'M',    // MART_ROOF
  20: 'n',    // MART_DOOR
  21: 'g',    // GYM_WALL
  22: 'A',    // GYM_ROOF
  23: 'a',    // GYM_DOOR
  24: 'X',    // DENSE_TREE
  25: '_',    // FLOOR
  26: '#',    // INDOOR_WALL
  27: 'k',    // COUNTER
  28: 't',    // TABLE
  29: 'b',    // BOOKSHELF
  30: 'r',    // RUG
  31: 'v',    // MAT
  32: 'p',    // PC_TILE
  33: 'h',    // HEAL_MACHINE
  34: 'w',    // WINDOW
  35: 'i',    // CHAIR
  36: 'o',    // POKEBALL_ITEM
  37: 'y',    // GYM_FLOOR
  38: 'z',    // GYM_STATUE
  39: 'V',    // TV
  40: 'Z',    // BED
  41: 'N',    // PLANT
  42: 'U',    // STAIRS
  43: 'O',    // CENTER_FLOOR
  44: 'K',    // PINK_COUNTER
  45: 'I',    // MART_FLOOR
  46: 'Y',    // MART_SHELF
  47: 'l',    // LAB_FLOOR
  48: 'x',    // LAB_MACHINE
  49: 'd',    // DISPLAY_CASE
  50: 'j',    // FOSSIL
  51: 'u',    // ROCK_FLOOR
  52: 'q',    // BOULDER
  53: 'Q',    // ARENA_MARK
  54: 's',    // SAND
  55: '~',    // ROCK
  56: '%',    // BUSH
  57: '^',    // CLIFF_FACE
  58: ',',    // CAVE_FLOOR
  59: ';',    // CAVE_WALL
  60: '&',    // HOUSE_WINDOW
  61: '@',    // LAB_WINDOW
  62: '$',    // CENTER_WINDOW
  63: '1',    // PINE_TREE
  64: '2',    // AUTUMN_TREE
  65: '3',    // PALM_TREE
  66: '4',    // DARK_GRASS
  67: '5',    // LIGHT_GRASS
  68: '6',    // TIDE_POOL
  69: '7',    // WET_SAND
  70: '8',    // DOCK_PLANK
  71: '9',    // CORAL_BLOCK
  72: 'Ø',    // LAVA_ROCK
  73: 'µ',    // MAGMA_CRACK
  74: 'Þ',    // VOLCANIC_WALL
  75: '=',    // MINE_TRACK
  76: '|',    // MINE_SUPPORT
  77: 'Ʃ',    // METAL_FLOOR
  78: 'Ɯ',    // METAL_WALL
  79: 'π',    // PIPE
  80: 'Ω',    // GEAR
  81: '¡',    // VINE
  82: '¢',    // MOSS_STONE
  83: '£',    // GIANT_ROOT
  84: '¤',    // BERRY_TREE
  85: '¥',    // CONDUIT
  86: '¦',    // ELECTRIC_PANEL
  87: '§',    // WIRE_FLOOR
  88: '†',    // GRAVE_MARKER
  89: '‡',    // CRACKED_FLOOR
  90: '®',    // RUIN_WALL
  91: '©',    // RUIN_PILLAR
  92: '°',    // MIST
  93: 'Ð',    // DRAGON_SCALE_FLOOR
  94: 'ð',    // DRAGON_STATUE
  95: 'Æ',    // FORTRESS_WALL
  96: '«',    // ASH_GROUND
  97: '»',    // EMBER_VENT
  98: '±',    // HOT_SPRING
  99: 'Ŧ',    // SYNTHESIS_FLOOR
  100: 'Ħ',   // SYNTHESIS_WALL
  101: 'Đ',   // SYNTHESIS_DOOR
  102: 'Ŋ',   // CONTAINMENT_POD
  103: 'Ɖ',   // AETHER_CONDUIT
  104: 'ƫ',   // TERMINAL
  105: '¬',   // SHATTERED_GROUND
  106: '÷',   // AETHER_CRYSTAL
  107: '×',   // LEAGUE_FLOOR
  108: 'Ł',   // LEAGUE_WALL
  109: 'Ý',   // CHAMPION_THRONE
  110: 'T',   // CUT_TREE (renders as tree)
  111: '~',   // CRACKED_ROCK (renders as rock)
  112: 'q',   // STRENGTH_BOULDER (renders as boulder)
  113: 'J',   // LEDGE_LEFT
  114: 'J',   // LEDGE_RIGHT
};

/**
 * Convert a Grid of tile IDs to character string rows.
 */
export function gridToCharMap(grid: Grid): string[] {
  const rows: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    let row = '';
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.get(x, y);
      row += TILE_TO_CHAR[tile] ?? '.';
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Convert a simple 0/1 generation grid to characters using provided mappings.
 * Useful for BSP dungeon and cellular cave output.
 */
export function simpleGridToCharMap(
  grid: Grid,
  mapping: Record<number, string>,
): string[] {
  const rows: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    let row = '';
    for (let x = 0; x < grid.width; x++) {
      const v = grid.get(x, y);
      row += mapping[v] ?? '.';
    }
    rows.push(row);
  }
  return rows;
}

export { TILE_TO_CHAR };
