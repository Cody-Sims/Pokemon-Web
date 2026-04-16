import { Tile } from '@data/maps';
import { SFX } from '@utils/audio-keys';

/** Get the appropriate footstep SFX key for a given tile type. */
export function getFootstepSFX(tile: number): string | null {
  switch (tile) {
    case Tile.GRASS:
    case Tile.TALL_GRASS:
    case Tile.DARK_GRASS:
    case Tile.LIGHT_GRASS:
    case Tile.FLOWER:
      return SFX.FOOTSTEP_GRASS;
    case Tile.SAND:
    case Tile.WET_SAND:
    case Tile.ASH_GROUND:
      return SFX.FOOTSTEP_SAND;
    case Tile.WATER:
    case Tile.TIDE_POOL:
      return SFX.WATER_SPLASH;
    case Tile.DOCK_PLANK:
    case Tile.MINE_TRACK:
      return SFX.FOOTSTEP_WOOD;
    case Tile.METAL_FLOOR:
    case Tile.WIRE_FLOOR:
      return SFX.FOOTSTEP_METAL;
    case Tile.PATH:
    case Tile.CAVE_FLOOR:
    case Tile.ROCK_FLOOR:
    case Tile.LAVA_ROCK:
      return SFX.FOOTSTEP_STONE;
    default:
      return null;
  }
}
