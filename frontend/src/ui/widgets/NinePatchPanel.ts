import Phaser from 'phaser';
import { COLORS, PANEL_PRESETS, readableStroke, type PanelPreset } from '../theme';

export type NinePatchPanelOptions = Partial<PanelPreset>;

/**
 * Nine-patch style panel using Phaser Graphics.
 * Prefer `PANEL_PRESETS` from `theme.ts` for recurring menu, dialogue,
 * speaker, choice, and overlay panels instead of ad-hoc literals.
 */
export class NinePatchPanel {
  private outer: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    options?: NinePatchPanelOptions,
  ) {
    const preset = { ...PANEL_PRESETS.menu, ...options };

    this.outer = scene.add.graphics();

    const { drawY, drawH } = this.resolveDrawBox(scene, y, w, h);
    const borderWidth = readableStroke(preset.borderWidth);
    const shadowOffsetX = preset.shadowOffsetX ?? 2;
    const shadowOffsetY = preset.shadowOffsetY ?? 2;

    this.outer.fillStyle(preset.shadowColor, preset.shadowAlpha);
    this.outer.fillRoundedRect(
      x - w / 2 + shadowOffsetX,
      drawY - drawH / 2 + shadowOffsetY,
      w,
      drawH,
      preset.cornerRadius,
    );

    this.outer.fillStyle(preset.fillColor, preset.fillAlpha);
    this.outer.fillRoundedRect(x - w / 2, drawY - drawH / 2, w, drawH, preset.cornerRadius);

    this.outer.lineStyle(borderWidth, preset.borderColor, 1);
    this.outer.strokeRoundedRect(x - w / 2, drawY - drawH / 2, w, drawH, preset.cornerRadius);

    const innerAlpha = preset.innerStrokeAlpha ?? 0.08;
    if (innerAlpha > 0 && w > borderWidth * 2 && drawH > borderWidth * 2) {
      this.outer.lineStyle(1, preset.innerStrokeColor ?? COLORS.borderSubtle, innerAlpha);
      this.outer.strokeRoundedRect(
        x - w / 2 + borderWidth,
        drawY - drawH / 2 + borderWidth,
        w - borderWidth * 2,
        drawH - borderWidth * 2,
        Math.max(0, preset.cornerRadius - borderWidth),
      );
    }
  }

  private resolveDrawBox(
    scene: Phaser.Scene,
    y: number,
    w: number,
    h: number,
  ): { drawY: number; drawH: number } {
    const viewportW = scene.scale?.width ?? 0;
    const viewportH = scene.scale?.height ?? 0;
    const cssW = typeof window === 'undefined' ? viewportW : window.innerWidth;
    const cssH = typeof window === 'undefined' ? viewportH : window.innerHeight;
    const isShortLandscape = cssW > cssH && cssH > 0 && cssH <= 430;
    const isWideBottomPanel =
      isShortLandscape && w >= viewportW * 0.9 && h >= 96 && y > viewportH * 0.55;
    if (!isWideBottomPanel) return { drawY: y, drawH: h };
    const drawH = Math.max(72, Math.round(viewportH * 0.13));
    return { drawY: y - (h - drawH) / 2, drawH };
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
