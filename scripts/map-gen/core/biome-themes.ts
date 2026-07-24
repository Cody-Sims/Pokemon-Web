/**
 * Biome theme definitions and substitution system.
 * Author maps in neutral biome, then substitute for any target biome.
 */

export interface BiomeTheme {
  name: string;
  ground: string;       // default fill character
  border: string;       // border/wall character
  path: string;         // path character
  decorative: string;   // decorative element
  special: string;      // special feature
  /** Full substitution map: neutral char → biome char */
  substitutions: Record<string, string>;
}

/** Neutral/standard biome characters — used as the canonical authoring alphabet */
export const NEUTRAL_CHARS = {
  ground: '.',
  border: 'T',
  path: 'P',
  tallGrass: 'G',
  water: 'W',
  flower: 'f',
  rock: '~',
  sand: 's',
  bush: '%',
  cliff: '^',
  caveFloor: ',',
  caveWall: ';',
} as const;

export const BIOME_THEMES: Record<string, BiomeTheme> = {
  standard: {
    name: 'Standard',
    ground: '.',
    border: 'T',
    path: 'P',
    decorative: 'f',
    special: 'W',
    substitutions: {}, // identity — no changes
  },

  volcanic: {
    name: 'Volcanic',
    ground: '«',    // ASH_GROUND
    border: 'Þ',    // VOLCANIC_WALL
    path: 'P',
    decorative: '»', // EMBER_VENT
    special: 'Ø',    // LAVA_ROCK
    substitutions: {
      '.': '«',
      'T': 'Þ',
      'f': '»',
      'W': 'Ø',
      'G': '«',      // no tall grass in volcanic
      's': '«',
      '~': 'Ø',
      '^': 'Þ',
      ',': 'Ø',      // cave floor → lava rock
      ';': 'Þ',      // cave wall → volcanic wall
    },
  },

  coastal: {
    name: 'Coastal',
    ground: 's',     // SAND
    border: '3',     // PALM_TREE
    path: 'P',
    decorative: '6', // TIDE_POOL
    special: 'W',    // WATER
    substitutions: {
      '.': 's',
      'T': '3',
      'f': '6',
      'G': '7',      // WET_SAND as tall-grass equivalent
      '~': '9',      // CORAL_BLOCK
      '^': '9',
    },
  },

  forest: {
    name: 'Forest',
    ground: '4',     // DARK_GRASS
    border: '1',     // PINE_TREE
    path: 'P',
    decorative: '¡', // VINE
    special: '¤',    // BERRY_TREE
    substitutions: {
      '.': '4',
      'T': '1',
      'f': '¡',
      'G': '4',
      '~': '¢',      // MOSS_STONE
      '^': '£',      // GIANT_ROOT
    },
  },

  ghost: {
    name: 'Ghost/Ruin',
    ground: '‡',     // CRACKED_FLOOR
    border: '®',     // RUIN_WALL
    path: 'P',
    decorative: '†',  // GRAVE_MARKER
    special: '°',     // MIST
    substitutions: {
      '.': '‡',
      'T': '®',
      'f': '†',
      'G': '°',
      'W': '°',
      '~': '©',      // RUIN_PILLAR
      '^': '®',
      ',': '‡',
      ';': '®',
    },
  },

  dragon: {
    name: 'Dragon',
    ground: 'Ð',     // DRAGON_SCALE_FLOOR
    border: 'Æ',     // FORTRESS_WALL
    path: 'P',
    decorative: 'ð', // DRAGON_STATUE
    special: 'Ð',
    substitutions: {
      '.': 'Ð',
      'T': 'Æ',
      'f': 'ð',
      'G': 'Ð',
      '~': 'ð',
      '^': 'Æ',
      ',': 'Ð',
      ';': 'Æ',
    },
  },

  mine: {
    name: 'Mine/Industrial',
    ground: ',',      // CAVE_FLOOR
    border: ';',      // CAVE_WALL
    path: '=',        // MINE_TRACK
    decorative: '|',  // MINE_SUPPORT
    special: 'Ω',     // GEAR
    substitutions: {
      '.': ',',
      'T': ';',
      'P': '=',
      'f': '|',
      'G': ',',
      'W': 'µ',      // MAGMA_CRACK
      '~': ';',
      '^': ';',
    },
  },

  electric: {
    name: 'Electric/Tech',
    ground: '§',      // WIRE_FLOOR
    border: 'Ɯ',     // METAL_WALL
    path: 'Ʃ',       // METAL_FLOOR
    decorative: '¥',  // CONDUIT
    special: '¦',     // ELECTRIC_PANEL
    substitutions: {
      '.': '§',
      'T': 'Ɯ',
      'P': 'Ʃ',
      'f': '¥',
      'G': '§',
      'W': '¥',
      '~': 'π',       // PIPE
      '^': 'Ɯ',
      ',': '§',
      ';': 'Ɯ',
    },
  },

  synthesis: {
    name: 'Synthesis/Aether',
    ground: 'Ŧ',     // SYNTHESIS_FLOOR
    border: 'Ħ',     // SYNTHESIS_WALL
    path: 'P',
    decorative: 'Ɖ', // AETHER_CONDUIT
    special: 'Ŋ',    // CONTAINMENT_POD
    substitutions: {
      '.': 'Ŧ',
      'T': 'Ħ',
      'P': 'Ŧ',
      'f': 'Ɖ',
      'G': 'Ŧ',
      '~': 'ƫ',      // TERMINAL
      '^': 'Ħ',
      ',': 'Ŧ',
      ';': 'Ħ',
    },
  },

  cave: {
    name: 'Cave',
    ground: ',',      // CAVE_FLOOR
    border: ';',      // CAVE_WALL
    path: ',',
    decorative: '~',  // ROCK
    special: 'q',     // BOULDER
    substitutions: {
      '.': ',',
      'T': ';',
      'P': ',',
      'f': '~',
      'G': ',',
      'W': 'W',
      '^': ';',
    },
  },
};

/**
 * Apply biome substitution to a character grid.
 * Characters not in the substitution table pass through unchanged.
 */
export function applyBiome(neutralGrid: string[], biome: string): string[] {
  const theme = BIOME_THEMES[biome];
  if (!theme || Object.keys(theme.substitutions).length === 0) return neutralGrid;

  return neutralGrid.map(row =>
    [...row].map(ch => theme.substitutions[ch] ?? ch).join('')
  );
}

/**
 * Get the default fill and border characters for a biome.
 */
export function getBiomeDefaults(biome: string): { ground: string; border: string; path: string } {
  const theme = BIOME_THEMES[biome] ?? BIOME_THEMES['standard'];
  return { ground: theme.ground, border: theme.border, path: theme.path };
}
