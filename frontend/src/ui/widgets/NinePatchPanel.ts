import Phaser from 'phaser';
import { COLORS } from '../theme';

/**
 * Nine-patch style panel using Phaser Graphics.
 * Renders a bordered panel with rounded corners, inner shadow, and configurable styling.
 * No external spritesheet needed — drawn procedurally for pixel-art consistency.
 */
export class NinePatchPanel {
  private outer: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private w: number;
  private h: number;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    options?: {
      fillColor?: number;
      fillAlpha?: number;
      borderColor?: number;
      borderWidth?: number;
      cornerRadius?: number;
      shadowColor?: number;
      shadowAlpha?: number;
    },
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    const fillColor = options?.fillColor ?? COLORS.bgPanel;
    const fillAlpha = options?.fillAlpha ?? 0.95;
    const borderColor = options?.borderColor ?? COLORS.border;
    const borderWidth = options?.borderWidth ?? 2;
    const cornerRadius = options?.cornerRadius ?? 6;
    const shadowColor = options?.shadowColor ?? 0x000000;
    const shadowAlpha = options?.shadowAlpha ?? 0.3;

    this.outer = scene.add.graphics();

    // Outer shadow (offset down-right)
    this.outer.fillStyle(shadowColor, shadowAlpha);
    this.outer.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 2, w, h, cornerRadius);

    // Main panel fill
    this.outer.fillStyle(fillColor, fillAlpha);
    this.outer.fillRoundedRect(x - w / 2, y - h / 2, w, h, cornerRadius);

    // Border
    this.outer.lineStyle(borderWidth, borderColor, 1);
    this.outer.strokeRoundedRect(x - w / 2, y - h / 2, w, h, cornerRadius);

    // Inner highlight (top edge — subtle)
    this.outer.lineStyle(1, 0xffffff, 0.08);
    this.outer.strokeRoundedRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, cornerRadius);
  }

  setDepth(depth: number): this {
    this.outer.setDepth(depth);
    return this;
  }

  setVisible(visible: boolean): this {
    this.outer.setVisible(visible);
    return this;
  }

  setAlpha(alpha: number): this {
    this.outer.setAlpha(alpha);
    return this;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.outer;
  }

  destroy(): void {
    this.outer.destroy();
  }
}
