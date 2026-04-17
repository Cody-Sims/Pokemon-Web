import { MapDefinition, parseMap } from '../shared';

// Generic House Interior — Reusable 8×8 map for residential buildings.
// Used across multiple cities for house interiors.
const houseGround = parseMap([
  '########',
  '#_V__b_#',
  '#______#',
  '#_t__N_#',
  '#_i____#',
  '#____Z_#',
  '#______#',
  '##_v_v##',
]);

/** Factory that creates a generic house interior for a given city. */
export function createGenericHouse(cityKey: string, houseIndex: number, npcDialogue: string[]): MapDefinition {
  const key = `${cityKey}-house-${houseIndex}`;
  return {
    key,
    width: 8,
    height: 8,
    ground: houseGround,
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

// Pre-built generic house interiors for each city that has residential buildings
export const palletHouse1 = createGenericHouse('pallet-town', 1, [
  'This is our home in Littoral Town.',
  'Mom always said this region is special.',
  'Be careful on your journey!',
]);

export const viridianHouse1 = createGenericHouse('viridian-city', 1, [
  'Viridian City used to be so quiet before the Collective showed up.',
  'Now we see strange people in dark uniforms every other day...',
]);

export const pewterHouse1 = createGenericHouse('pewter-city', 1, [
  'Did you visit the museum? They have amazing fossils!',
  'My kid wants to be a rock collector when they grow up.',
]);

export const coralHouse1 = createGenericHouse('coral-harbor', 1, [
  'The harbor was built by Captain Stern\'s grandfather.',
  'Our fishing waters have been troubled by strange currents lately.',
]);

export const ironvaleHouse1 = createGenericHouse('ironvale-city', 1, [
  'Ironvale was a mining town before the steel works were built.',
  'Ferris turned this place into a proper city with our Gym!',
]);

export const verdantiaHouse1 = createGenericHouse('verdantia-village', 1, [
  'The Berry farms here produce the best Berries in all of Aurum!',
  'Try some Sitrus Berries — they heal your Pokémon wonderfully.',
]);

export const voltaraHouse1 = createGenericHouse('voltara-city', 1, [
  'Blitz keeps the power running for the whole city.',
  'Without their Electric Pokémon, we\'d be in the dark!',
  'The conduits have been acting up though...',
]);

export const wraithmoorHouse1 = createGenericHouse('wraithmoor-town', 1, [
  'They say ghosts wander the old cemetery at night...',
  'Morwen keeps them peaceful. She\'s our Ghost Gym Leader.',
  'Don\'t go near the ruins alone.',
]);

export const scalecrestHouse1 = createGenericHouse('scalecrest-citadel', 1, [
  'The Dragon Keepers have guarded this citadel for centuries.',
  'Drake is the strongest of them all.',
  'Only the bravest challengers make it this far.',
]);

export const cinderfallHouse1 = createGenericHouse('cinderfall-town', 1, [
  'The hot springs here are wonderful!',
  'Solara\'s Fire Pokémon draw energy from the volcanic vents.',
  'Just don\'t go near the caldera without protection.',
]);
