import { Tile, SOLID_TILES, OVERLAY_BASE } from '@data/maps';
import { TILE_SIZE } from '@utils/constants';
import { mobileFontSize } from '@ui/theme';
import type { Direction } from '@utils/type-helpers';
import { redrawTilemapTile, type TilemapResult } from '@systems/rendering/TilemapBuilder';

/**
 * Redraw a single tile after a field ability changes it.
 *
 * When a `TilemapResult` is provided, the three tilemap layers are updated
 * in-place (O(1) — no children scan).  Without one, falls back to the legacy
 * approach that searches `scene.children.list`.
 */
export function redrawTile(
  scene: Phaser.Scene,
  mapDef: { ground: number[][] },
  tx: number,
  ty: number,
  tilemapResult?: TilemapResult,
): void {
  if (tilemapResult) {
    redrawTilemapTile(tilemapResult, mapDef.ground, tx, ty);
    return;
  }

  // Legacy fallback: individual-sprite redraw via children scan
  const px = tx * TILE_SIZE + TILE_SIZE / 2;
  const py = ty * TILE_SIZE + TILE_SIZE / 2;
  const scale = TILE_SIZE / 16;
  const newTile = mapDef.ground[ty][tx];

  scene.children.list
    .filter(obj => {
      if (!(obj instanceof Phaser.GameObjects.Image)) return false;
      return Math.abs(obj.x - px) < 1 && Math.abs(obj.y - py) < 1 && obj.depth <= 2;
    })
    .forEach(obj => obj.destroy());

  const baseTile = OVERLAY_BASE[newTile];
  if (baseTile !== undefined) {
    const base = scene.add.image(px, py, 'tileset', baseTile);
    base.setScale(scale);
    base.setDepth(0);
  }
  const sprite = scene.add.image(px, py, 'tileset', newTile);
  sprite.setScale(scale);
  sprite.setDepth(baseTile !== undefined ? 0.5 : 0);
}

/** Show a brief text popup for a field ability use. */
export function showFieldAbilityPopup(scene: Phaser.Scene, text: string): void {
  const { width } = scene.cameras.main;
  const popup = scene.add.text(width / 2, 80, text, {
    fontSize: mobileFontSize(18),
    fontStyle: 'bold',
    color: '#ffffff',
    backgroundColor: '#00000088',
    padding: { x: 16, y: 8 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

  scene.tweens.add({
    targets: popup,
    alpha: { from: 0, to: 1 },
    duration: 200,
    yoyo: true,
    hold: 800,
    onComplete: () => popup.destroy(),
  });
}

/**
 * Push a Strength boulder one tile in the given direction.
 *
 * When `tilemapResult` is provided, the boulder is extracted from the
 * decoration tilemap layer, animated as a temporary sprite, and then
 * the layers are updated via `redrawTilemapTile`.
 */
export function pushBoulder(
  scene: Phaser.Scene,
  mapDef: { ground: number[][]; width: number; height: number },
  bx: number,
  by: number,
  dir: Direction,
  tilemapResult?: TilemapResult,
): boolean {
  let destX = bx;
  let destY = by;
  switch (dir) {
    case 'up':    destY--; break;
    case 'down':  destY++; break;
    case 'left':  destX--; break;
    case 'right': destX++; break;
  }

  if (destX < 0 || destY < 0 || destX >= mapDef.width || destY >= mapDef.height) return false;
  if (SOLID_TILES.has(mapDef.ground[destY][destX])) return false;

  // ── Mutate the map data ──
  mapDef.ground[by][bx] = Tile.GRASS;
  mapDef.ground[destY][destX] = Tile.STRENGTH_BOULDER;

  const srcPx = bx * TILE_SIZE + TILE_SIZE / 2;
  const srcPy = by * TILE_SIZE + TILE_SIZE / 2;
  const destPx = destX * TILE_SIZE + TILE_SIZE / 2;
  const destPy = destY * TILE_SIZE + TILE_SIZE / 2;
  const scale = TILE_SIZE / 16;

  if (tilemapResult) {
    // ── Tilemap path: extract tile, animate temp sprite, update layers ──
    // Remove the boulder from the decoration layer immediately
    tilemapResult.decorationLayer.removeTileAt(bx, by);

    // Create a temporary sprite for the slide animation
    const tempSprite = scene.add.image(srcPx, srcPy, 'tileset', Tile.STRENGTH_BOULDER);
    tempSprite.setScale(scale).setDepth(0.5);

    scene.tweens.add({
      targets: tempSprite,
      x: destPx,
      y: destPy,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        tempSprite.destroy();
        redrawTile(scene, mapDef, bx, by, tilemapResult);
        redrawTile(scene, mapDef, destX, destY, tilemapResult);
      },
    });
  } else {
    // ── Legacy path: find sprite in children list ──
    const boulderSprite = scene.children.list.find(obj =>
      obj instanceof Phaser.GameObjects.Image &&
      Math.abs(obj.x - srcPx) < 1 && Math.abs(obj.y - srcPy) < 1 &&
      obj.depth <= 2,
    ) as Phaser.GameObjects.Image | undefined;

    if (boulderSprite) {
      scene.tweens.add({
        targets: boulderSprite,
        x: destPx,
        y: destPy,
        duration: 200,
        ease: 'Linear',
        onComplete: () => {
          redrawTile(scene, mapDef, bx, by);
          redrawTile(scene, mapDef, destX, destY);
        },
      });
    } else {
      redrawTile(scene, mapDef, bx, by);
      redrawTile(scene, mapDef, destX, destY);
    }
  }

  return true;
}
