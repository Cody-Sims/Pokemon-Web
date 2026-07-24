import { MapDefinition, parseMap } from '../shared';

// Generic House Interior — reusable 8×8 residential interiors.

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

export const palletHouse1: MapDefinition = {
  key: 'pallet-town-house-1',
  width: 8,
  height: 8,
  ground: standardGround,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'House',
  npcs: [{
    id: 'pallet-town-house-1-resident', name: 'Resident', tileX: 3, tileY: 3,
    textureKey: 'npc-male-1', facing: 'down',
    dialogue: ['This is our home in Littoral Town.', 'Mom always said this region is special.', 'Be careful on your journey!'],
    behavior: { type: 'look-around' },
  }],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 2, tileY: 7, targetMap: 'pallet-town', targetSpawnId: 'from-player-house' },
    { tileX: 4, tileY: 7, targetMap: 'pallet-town', targetSpawnId: 'from-player-house' },
  ],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const viridianHouse1: MapDefinition = {
  key: 'viridian-city-house-1', width: 8, height: 8, ground: standardGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'viridian-city-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['Viridian City used to be so quiet before the Collective showed up.', 'Now we see strange people in dark uniforms every other day...'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'viridian-city', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'viridian-city', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const viridianHouse2: MapDefinition = {
  key: 'viridian-city-house-2', width: 8, height: 8, ground: standardGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'viridian-city-house-2-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-female-1', facing: 'down', dialogue: ['I heard someone spotted a strange Pokémon near the pond.', 'It only comes out at night... maybe you could find it?'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'viridian-city', targetSpawnId: 'from-house-2' }, { tileX: 4, tileY: 7, targetMap: 'viridian-city', targetSpawnId: 'from-house-2' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const pewterHouse1: MapDefinition = {
  key: 'pewter-city-house-1', width: 8, height: 8, ground: standardGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'pewter-city-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['Did you visit the museum? They have amazing fossils!', 'My kid wants to be a rock collector when they grow up.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const pewterHouse2: MapDefinition = {
  key: 'pewter-city-house-2', width: 8, height: 8, ground: standardGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'pewter-city-house-2-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-female-1', facing: 'down', dialogue: ['Pewter is so peaceful... except when trainers stomp through at all hours.', 'My neighbor works at the museum. She says they found something incredible!'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-house-2' }, { tileX: 4, tileY: 7, targetMap: 'pewter-city', targetSpawnId: 'from-house-2' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const coralHouse1: MapDefinition = {
  key: 'coral-harbor-house-1', width: 8, height: 8, ground: coastalGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'coral-harbor-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['The harbor was built by Captain Stern\'s grandfather.', 'Our fishing waters have been troubled by strange currents lately.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'coral-harbor', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const ironvaleHouse1: MapDefinition = {
  key: 'ironvale-city-house-1', width: 8, height: 8, ground: industrialGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'ironvale-city-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['Ironvale was a mining town before the steel works were built.', 'Ferris turned this place into a proper city with our Gym!'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'ironvale-city', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const verdantiaHouse1: MapDefinition = {
  key: 'verdantia-village-house-1', width: 8, height: 8, ground: standardGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'verdantia-village-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['The Berry farms here produce the best Berries in all of Aurum!', 'Try some Sitrus Berries — they heal your Pokémon wonderfully.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'verdantia-village', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const voltaraHouse1: MapDefinition = {
  key: 'voltara-city-house-1', width: 8, height: 8, ground: industrialGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'voltara-city-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['Blitz keeps the power running for the whole city.', 'Without their Electric Pokémon, we\'d be in the dark!', 'The conduits have been acting up though...'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'voltara-city', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const wraithmoorHouse1: MapDefinition = {
  key: 'wraithmoor-town-house-1', width: 8, height: 8, ground: hauntedGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'wraithmoor-town-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['They say ghosts wander the old cemetery at night...', 'Morwen keeps them peaceful. She\'s our Ghost Gym Leader.', 'Don\'t go near the ruins alone.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'wraithmoor-town', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const scalecrestHouse1: MapDefinition = {
  key: 'scalecrest-citadel-house-1', width: 8, height: 8, ground: hauntedGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'scalecrest-citadel-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['The Dragon Keepers have guarded this citadel for centuries.', 'Drake is the strongest of them all.', 'Only the bravest challengers make it this far.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};

export const cinderfallHouse1: MapDefinition = {
  key: 'cinderfall-town-house-1', width: 8, height: 8, ground: industrialGround, encounterTableKey: '', isInterior: true, displayName: 'House',
  npcs: [{ id: 'cinderfall-town-house-1-resident', name: 'Resident', tileX: 3, tileY: 3, textureKey: 'npc-male-1', facing: 'down', dialogue: ['The hot springs here are wonderful!', 'Solara\'s Fire Pokémon draw energy from the volcanic vents.', 'Just don\'t go near the caldera without protection.'], behavior: { type: 'look-around' } }],
  trainers: [], objects: [],
  warps: [{ tileX: 2, tileY: 7, targetMap: 'cinderfall-town', targetSpawnId: 'from-house-1' }, { tileX: 4, tileY: 7, targetMap: 'cinderfall-town', targetSpawnId: 'from-house-1' }],
  spawnPoints: { 'default': { x: 3, y: 6, direction: 'up' } },
};
