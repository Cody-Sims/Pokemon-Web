// Backwards-compatible re-exports — see tiles.ts, tile-metadata.ts,
// map-interfaces.ts, and map-parser.ts for the actual definitions.
export { Tile, LEDGE_TILES } from './tiles';
export { OVERLAY_BASE, FOREGROUND_TILES, TILE_COLORS, SOLID_TILES } from './tile-metadata';
export type { NpcSpawn, TrainerSpawn, WarpDefinition, SpawnPoint, MapDefinition } from './map-interfaces';
export { parseMap } from './map-parser';
