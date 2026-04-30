/**
 * TilemapBuilder — converts a MapDefinition's ground grid into efficient
 * Phaser TilemapLayers, replacing the old per-tile Image approach.
 *
 * Three layers are produced:
 *   ground      (depth 0)   — base terrain tiles
 *   decoration  (depth 0.5) — non-foreground overlays (flowers, signs, doors…)
 *   foreground  (depth 2)   — overlays rendered above the player (trees, tall grass…)
 *
 * Animated tiles (water, lava, tall grass) remain as individual Image sprites
 * so they can be tinted / frame-swapped / tweened per-tile each frame.
 */

import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import {
  Tile,
  OVERLAY_BASE,
  FOREGROUND_TILES,
} from '@data/maps';

// ── Animated tile set ────────────────────────────────────────

/** Tile IDs that require individual sprites (tint / frame cycling / scale tweens). */
export const ANIMATED_TILE_IDS = new Set<number>([
  Tile.WATER,
  Tile.TIDE_POOL,
  Tile.TALL_GRASS,
  Tile.MAGMA_CRACK,
  Tile.EMBER_VENT,
  Tile.LAVA_ROCK,
]);

// ── Result interface ─────────────────────────────────────────

export interface TilemapResult {
  tilemap: Phaser.Tilemaps.Tilemap;
  groundLayer: Phaser.Tilemaps.TilemapLayer;
  decorationLayer: Phaser.Tilemaps.TilemapLayer;
  foregroundLayer: Phaser.Tilemaps.TilemapLayer;
  /** Animated water / tide-pool sprites (tint + frame cycling). */
  waterSprites: Phaser.GameObjects.Image[];
  /** Animated tall-grass sprites (alpha shimmer + rustle tween). */
  grassSprites: Phaser.GameObjects.Image[];
  /** Animated lava / ember / magma sprites (tint + frame cycling). */
  lavaSprites: Phaser.GameObjects.Image[];
  /** O(1) lookup for grass sprites by "x,y" (used for the step-rustle effect). */
  grassByTile: Map<string, Phaser.GameObjects.Image>;
}

// ── Builder ──────────────────────────────────────────────────

/**
 * Build a three-layer Phaser Tilemap from a map's ground grid.
 *
 * @param scene  The OverworldScene (or any Phaser.Scene with 'tileset' loaded).
 * @param ground The map's `ground` 2-D number array.
 * @param mapW   Map width in tiles.
 * @param mapH   Map height in tiles.
 */
export function buildTilemap(
  scene: Phaser.Scene,
  ground: number[][],
  mapW: number,
  mapH: number,
): TilemapResult | null {
  // LOW-13: Bounds validation
  if (ground.length < mapH) {
    console.warn(`TilemapBuilder: ground has ${ground.length} rows, expected ${mapH}`);
  }

  const scale = TILE_SIZE / 16;

  // ── Create the Tilemap object ──
  const tilemapData = new Phaser.Tilemaps.MapData({
    width: mapW,
    height: mapH,
    tileWidth: 16,
    tileHeight: 16,
  });
  const tilemap = new Phaser.Tilemaps.Tilemap(scene, tilemapData);

  // MED-35: Proper null checks instead of non-null assertions
  const tileset = tilemap.addTilesetImage('tileset', 'tileset', 16, 16);
  if (!tileset) {
    console.warn('TilemapBuilder: tileset creation failed');
    return null;
  }

  // ── Create blank layers ──
  const groundLayer = tilemap.createBlankLayer(
    'ground', tileset, 0, 0, mapW, mapH, 16, 16,
  );
  if (!groundLayer) {
    console.warn('TilemapBuilder: ground layer creation failed');
    return null;
  }
  const decorationLayer = tilemap.createBlankLayer(
    'decoration', tileset, 0, 0, mapW, mapH, 16, 16,
  );
  if (!decorationLayer) {
    console.warn('TilemapBuilder: decoration layer creation failed');
    return null;
  }
  const foregroundLayer = tilemap.createBlankLayer(
    'foreground', tileset, 0, 0, mapW, mapH, 16, 16,
  );
  if (!foregroundLayer) {
    console.warn('TilemapBuilder: foreground layer creation failed');
    return null;
  }

  groundLayer.setScale(scale).setDepth(0);
  decorationLayer.setScale(scale).setDepth(0.5);
  foregroundLayer.setScale(scale).setDepth(2);

  // ── Animated sprite collections ──
  const waterSprites: Phaser.GameObjects.Image[] = [];
  const grassSprites: Phaser.GameObjects.Image[] = [];
  const lavaSprites: Phaser.GameObjects.Image[] = [];
  const grassByTile = new Map<string, Phaser.GameObjects.Image>();

  // ── Populate layers + create sprites ──
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const tile = ground[y][x];
      const baseTile = OVERLAY_BASE[tile];
      const isAnimated = ANIMATED_TILE_IDS.has(tile);

      if (isAnimated) {
        // ── Animated tile ──
        // Put the base ground in the ground layer (if this is an overlay);
        // leave blank for non-overlay animated tiles (water, lava_rock, magma_crack).
        if (baseTile !== undefined) {
          groundLayer.putTileAt(baseTile, x, y);
        }
        // The animated sprite is an individual Image so we can tint/frame-swap it.
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        const sprite = scene.add.image(px, py, 'tileset', tile);
        sprite.setScale(scale);

        if (FOREGROUND_TILES.has(tile)) {
          sprite.setDepth(2);
        } else if (baseTile !== undefined) {
          sprite.setDepth(0.5);
        } else {
          sprite.setDepth(0);
        }

        // Collect into the appropriate animation bucket
        if (tile === Tile.WATER || tile === Tile.TIDE_POOL) {
          waterSprites.push(sprite);
        } else if (tile === Tile.TALL_GRASS) {
          grassSprites.push(sprite);
          grassByTile.set(`${x},${y}`, sprite);
        } else if (
          tile === Tile.MAGMA_CRACK ||
          tile === Tile.EMBER_VENT ||
          tile === Tile.LAVA_ROCK
        ) {
          (sprite as Phaser.GameObjects.Image & { _baseTile?: number })._baseTile = tile;
          lavaSprites.push(sprite);
        }
      } else if (baseTile !== undefined) {
        // ── Static overlay tile ──
        // Base goes into the ground layer.
        groundLayer.putTileAt(baseTile, x, y);
        // The overlay goes into decoration or foreground depending on the tile.
        if (FOREGROUND_TILES.has(tile)) {
          foregroundLayer.putTileAt(tile, x, y);
        } else {
          decorationLayer.putTileAt(tile, x, y);
        }
      } else {
        // ── Plain ground tile ──
        groundLayer.putTileAt(tile, x, y);
      }
    }
  }

  return {
    tilemap,
    groundLayer,
    decorationLayer,
    foregroundLayer,
    waterSprites,
    grassSprites,
    lavaSprites,
    grassByTile,
  };
}

// ── Per-tile redraw (for field abilities) ────────────────────

/**
 * Update the three tilemap layers for a single tile position.
 * Call this after mutating `mapDef.ground[ty][tx]`.
 *
 * NOTE: This only handles static (non-animated) tile transitions.
 * Field abilities (Cut, Rock Smash, Strength) always replace tiles with
 * non-animated types (GRASS, STRENGTH_BOULDER) so this is sufficient.
 */
export function redrawTilemapTile(
  result: TilemapResult,
  ground: number[][],
  tx: number,
  ty: number,
): void {
  const tile = ground[ty][tx];
  const baseTile = OVERLAY_BASE[tile];

  // Clear all layers at this position
  result.groundLayer.removeTileAt(tx, ty);
  result.decorationLayer.removeTileAt(tx, ty);
  result.foregroundLayer.removeTileAt(tx, ty);

  if (baseTile !== undefined) {
    result.groundLayer.putTileAt(baseTile, tx, ty);
    if (FOREGROUND_TILES.has(tile)) {
      result.foregroundLayer.putTileAt(tile, tx, ty);
    } else {
      result.decorationLayer.putTileAt(tile, tx, ty);
    }
  } else {
    result.groundLayer.putTileAt(tile, tx, ty);
  }
}
