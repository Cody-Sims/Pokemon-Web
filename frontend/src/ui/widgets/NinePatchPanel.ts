import Phaser from 'phaser';
import { COLORS, PANEL_PRESETS, type PanelPreset } from '../theme';

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

    this.outer.fillStyle(preset.shadowColor, preset.shadowAlpha);
    this.outer.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 2, w, h, preset.cornerRadius);

    this.outer.fillStyle(preset.fillColor, preset.fillAlpha);
    this.outer.fillRoundedRect(x - w / 2, y - h / 2, w, h, preset.cornerRadius);

    this.outer.lineStyle(preset.borderWidth, preset.borderColor, 1);
    this.outer.strokeRoundedRect(x - w / 2, y - h / 2, w, h, preset.cornerRadius);

    this.outer.lineStyle(1, COLORS.borderSubtle, 0.08);
    this.outer.strokeRoundedRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, preset.cornerRadius);
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
