import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';

/** Invisible zone that marks encounter areas (e.g., tall grass). */
export class WildEncounterZone {
  private zone: Phaser.GameObjects.Zone;
  public mapKey: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    mapKey: string
  ) {
    this.zone = scene.add.zone(x, y, width, height);
    this.mapKey = mapKey;
  }

  /** Check if a tile position is inside this encounter zone. */
  containsTile(tileX: number, tileY: number): boolean {
    const px = tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = tileY * TILE_SIZE + TILE_SIZE / 2;
    return this.zone.getBounds().contains(px, py);
  }

  getZone(): Phaser.GameObjects.Zone {
    return this.zone;
  }
}
