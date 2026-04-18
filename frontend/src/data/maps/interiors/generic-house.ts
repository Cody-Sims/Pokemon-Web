import { MapDefinition, parseMap } from '../shared';

// Generic House Interior — Reusable 8×8 maps for residential buildings.
// Four biome variants provide visual variety across the region.

const standardGround = parseMap([
  '########',
  '#_V__b_#',
  '#______#',
  '#_t__N_#',
  '#_i____#',
  '#____Z_#',
  '#______#',
  '##_v_v##',
]);

const coastalGround = parseMap([
  '########',
  '#wV__bw#',
  '#______#',
  '#__t___#',
  '#__i_N_#',
  '#_Z____#',
  '#______#',
  '##_v_v##',
]);

const industrialGround = parseMap([
  '########',
  '#_V__b_#',
  '#_____N#',
  '#_t____#',
  '#_i__Z_#',
  '#______#',
  '#_N____#',
  '##_v_v##',
]);

const hauntedGround = parseMap([
  '########',
  '#w____w#',
  '#______#',
  '#__t_b_#',
  '#__i___#',
  '#_Z__N_#',
  '#______#',
  '##_v_v##',
]);

/** Builds a house MapDefinition from the given ground layout. */
function buildHouse(cityKey: string, houseIndex: number, npcDialogue: string[], ground: number[][]): MapDefinition {
  const key = `${cityKey}-house-${houseIndex}`;
  return {
    key,
    width: 8,
    height: 8,
    ground,
    encounterTableKey: '',
    isInterior: true,
    displayName: 'House',
    npcs: [
      {
        id: `${key}-resident`,
        tileX: 3,
        tileY: 3,
        textureKey: houseIndex % 2 === 0 ? 'npc-female-1' : 'npc-male-1',
        facing: 'down',
        dialogue: npcDialogue,
      },
    ],
    trainers: [],
    warps: [
      { tileX: 2, tileY: 7, targetMap: cityKey, targetSpawnId: `from-house-${houseIndex}` },
      { tileX: 4, tileY: 7, targetMap: cityKey, targetSpawnId: `from-house-${houseIndex}` },
    ],
    spawnPoints: {
      'default': { x: 3, y: 6, direction: 'up' },
    },
  };
}

/** Standard layout — Pallet, Viridian, Pewter, Verdantia. */
export function createStandardHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  return buildHouse(cityKey, houseIndex, npcDialogue, standardGround);
}

/** Coastal layout — Coral Harbor. Broader windows, open feel. */
export function createCoastalHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  return buildHouse(cityKey, houseIndex, npcDialogue, coastalGround);
}

/** Industrial layout — Ironvale, Voltara, Cinderfall. Metal accents. */
export function createIndustrialHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  return buildHouse(cityKey, houseIndex, npcDialogue, industrialGround);
}

/** Haunted layout — Wraithmoor, Scalecrest. Sparse, eerie. */
export function createHauntedHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  return buildHouse(cityKey, houseIndex, npcDialogue, hauntedGround);
}

/** @deprecated Use variant-specific factories instead. */
export function createGenericHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  return createStandardHouse(cityKey, houseIndex, npcDialogue);
}

// Pre-built generic house interiors for each city that has residential buildings
export const palletHouse1 = createStandardHouse('pallet-town', 1, [
  'This is our home in Littoral Town.',
  'Mom always said this region is special.',
  'Be careful on your journey!',
]);

export const viridianHouse1 = createStandardHouse('viridian-city', 1, [
  'Viridian City used to be so quiet before the Collective showed up.',
  'Now we see strange people in dark uniforms every other day...',
]);

export const pewterHouse1 = createStandardHouse('pewter-city', 1, [
  'Did you visit the museum? They have amazing fossils!',
  'My kid wants to be a rock collector when they grow up.',
]);

export const coralHouse1 = createCoastalHouse('coral-harbor', 1, [
  'The harbor was built by Captain Stern\'s grandfather.',
  'Our fishing waters have been troubled by strange currents lately.',
]);

export const ironvaleHouse1 = createIndustrialHouse('ironvale-city', 1, [
  'Ironvale was a mining town before the steel works were built.',
  'Ferris turned this place into a proper city with our Gym!',
]);

export const verdantiaHouse1 = createStandardHouse('verdantia-village', 1, [
  'The Berry farms here produce the best Berries in all of Aurum!',
  'Try some Sitrus Berries — they heal your Pokémon wonderfully.',
]);

export const voltaraHouse1 = createIndustrialHouse('voltara-city', 1, [
  'Blitz keeps the power running for the whole city.',
  'Without their Electric Pokémon, we\'d be in the dark!',
  'The conduits have been acting up though...',
]);

export const wraithmoorHouse1 = createHauntedHouse('wraithmoor-town', 1, [
  'They say ghosts wander the old cemetery at night...',
  'Morwen keeps them peaceful. She\'s our Ghost Gym Leader.',
  'Don\'t go near the ruins alone.',
]);

export const scalecrestHouse1 = createHauntedHouse('scalecrest-citadel', 1, [
  'The Dragon Keepers have guarded this citadel for centuries.',
  'Drake is the strongest of them all.',
  'Only the bravest challengers make it this far.',
]);

export const cinderfallHouse1 = createIndustrialHouse('cinderfall-town', 1, [
  'The hot springs here are wonderful!',
  'Solara\'s Fire Pokémon draw energy from the volcanic vents.',
  'Just don\'t go near the caldera without protection.',
]);
