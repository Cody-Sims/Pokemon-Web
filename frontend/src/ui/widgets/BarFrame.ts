import Phaser from 'phaser';

/**
 * BarFrame — draws a thin bordered "rail" around an HP/EXP/etc. bar so the
 * bar reads as a recessed sprite frame instead of a flat rectangle.
 *
 * The rail is a single Graphics object positioned so the inner rectangle
 * matches the underlying bar exactly.
 *
 * Usage:
 * ```ts
 * this.add.rectangle(x, y, 180, 10, 0x333333).setOrigin(0, 0.5);  // bar bg
 * this.add.rectangle(x, y, 180, 10, 0x4caf50).setOrigin(0, 0.5);  // bar fill
 * new BarFrame(scene, x, y, 180, 10);                              // frame
 * ```
 */
export class BarFrame {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    /** Left edge of the bar (origin 0, 0.5). */
    x: number,
    /** Vertical centre of the bar. */
    y: number,
    /** Width of the bar in pixels. */
    w: number,
    /** Height of the bar in pixels. */
    h: number,
    options?: {
      borderColor?: number;
      shadowColor?: number;
      shadowAlpha?: number;
      /** Adds an accent stripe at the top of the rail — type-colored bar header. */
      accentColor?: number;
    },
  ) {
    const borderColor = options?.borderColor ?? 0x000000;
    const shadowColor = options?.shadowColor ?? 0x000000;
    const shadowAlpha = options?.shadowAlpha ?? 0.55;

    this.gfx = scene.add.graphics();

    // Drop shadow under the bar — positioned 1px down/right.
    this.gfx.fillStyle(shadowColor, shadowAlpha);
    this.gfx.fillRect(x - 2, y - h / 2 + 1, w + 4, h + 2);

    // Rail border (1px outer ring).
    this.gfx.lineStyle(1, borderColor, 1);
    this.gfx.strokeRect(x - 1.5, y - h / 2 - 1.5, w + 3, h + 3);

    if (options?.accentColor !== undefined) {
      this.gfx.fillStyle(options.accentColor, 1);
      this.gfx.fillRect(x - 1, y - h / 2 - 3, w + 2, 1);
    }
  }

  setDepth(depth: number): this {
    this.gfx.setDepth(depth);
    return this;
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
