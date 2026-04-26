import Phaser from 'phaser';

/**
 * PixelText — thin wrapper around `Phaser.GameObjects.BitmapText` that
 * standardises usage of the `aurum-pixel` BMFont generated from
 * `frontend/scripts/generate-pixel-font.js`.
 *
 * The font is white-on-transparent in its source PNG; recolor with `setTint()`
 * to produce any palette colour. Use `mobileFontSize()` from `@ui/theme` for
 * size selection so mobile scaling stays consistent.
 *
 * Usage:
 * ```ts
 * import { PixelText } from '@ui/widgets/PixelText';
 * const label = new PixelText(scene, 8, 8, 'Voltara City', 14, 0xffd060);
 * ```
 */
export const PIXEL_FONT_KEY = 'aurum-pixel';

export class PixelText {
  /** Underlying BitmapText — exposed so callers can chain Phaser methods. */
  readonly text: Phaser.GameObjects.BitmapText;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialText: string,
    /** Pixel size — the BMFont was authored at 14px; smaller values look crisp. */
    size: number = 14,
    /** Tint colour applied to the white glyph atlas. */
    color: number = 0xffffff,
  ) {
    this.text = scene.add.bitmapText(x, y, PIXEL_FONT_KEY, initialText, size);
    this.text.setTint(color);
  }

  setText(value: string): this {
    this.text.setText(value);
    return this;
  }

  setPosition(x: number, y: number): this {
    this.text.setPosition(x, y);
    return this;
  }

  setColor(color: number): this {
    this.text.setTint(color);
    return this;
  }

  setOrigin(x: number, y?: number): this {
    this.text.setOrigin(x, y);
    return this;
  }

  setDepth(depth: number): this {
    this.text.setDepth(depth);
    return this;
  }

  setVisible(visible: boolean): this {
    this.text.setVisible(visible);
    return this;
  }

  destroy(): void {
    this.text.destroy();
  }
}
