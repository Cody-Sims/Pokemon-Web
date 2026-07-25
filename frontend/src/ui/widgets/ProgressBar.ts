import Phaser from 'phaser';
import {
  COLORS,
  PROGRESS_BAR_PRESETS,
  RADII,
  readableStroke,
  type ProgressBarPreset,
} from '@ui/theme';

export type ProgressBarPresetName = keyof typeof PROGRESS_BAR_PRESETS;

export interface ProgressBarConfig {
  currentValue?: number;
  maxValue: number;
  preset?: ProgressBarPresetName;
  fillColor?: number | ((pct: number) => number);
  trackColor?: number;
  trackAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
}

/** Reusable rectangular bar for HP, EXP, timers, and other scene progress. */
export class ProgressBar {
  private readonly scene: Phaser.Scene;
  private readonly track: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly borderWidth: number;
  private readonly width: number;
  private readonly height: number;
  private maxValue: number;
  private currentValue: number;
  private readonly fillColor: number | ((pct: number) => number);
  private activeTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    config: ProgressBarConfig,
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    const preset: ProgressBarPreset = PROGRESS_BAR_PRESETS[config.preset ?? 'neutral'];
    this.maxValue = Math.max(0, config.maxValue);
    this.currentValue = this.clampValue(config.currentValue ?? this.maxValue);
    this.fillColor = config.fillColor ?? preset.fillColor;
    this.borderWidth = readableStroke(config.borderWidth ?? preset.borderWidth);

    this.frame = scene.add.graphics();
    this.track = scene.add
      .rectangle(
        x,
        y,
        width,
        height,
        config.trackColor ?? preset.trackColor,
        config.trackAlpha ?? preset.trackAlpha,
      )
      .setOrigin(0, 0);
    this.fill = scene.add
      .rectangle(
        x + this.borderWidth,
        y + this.borderWidth,
        0,
        Math.max(1, height - this.borderWidth * 2),
        this.resolveFillColor(),
      )
      .setOrigin(0, 0);
    this.drawFrame(x, y, config.borderColor ?? preset.borderColor);
    this.updateFill(false);
  }

  setValue(value: number, animate = false, durationMs = 180): void {
    this.currentValue = this.clampValue(value);
    this.updateFill(animate, durationMs);
  }

  setMaxValue(maxValue: number): void {
    this.maxValue = Math.max(0, maxValue);
    this.currentValue = this.clampValue(this.currentValue);
    this.updateFill(false);
  }

  getValue(): number {
    return this.currentValue;
  }

  getMaxValue(): number {
    return this.maxValue;
  }

  getPercent(): number {
    return this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
  }

  setDepth(depth: number): void {
    this.track.setDepth(depth);
    this.fill.setDepth(depth + 1);
    this.frame.setDepth(depth + 2);
  }

  setVisible(visible: boolean): void {
    this.track.setVisible(visible);
    this.fill.setVisible(visible);
    this.frame.setVisible(visible);
  }

  setPosition(x: number, y: number): void {
    this.track.setPosition(x, y);
    this.fill.setPosition(x + this.borderWidth, y + this.borderWidth);
    this.drawFrame(x, y);
  }

  destroy(): void {
    this.activeTween?.destroy();
    this.frame.destroy();
    this.track.destroy();
    this.fill.destroy();
  }

  private updateFill(animate: boolean, durationMs = 180): void {
    const targetWidth = Math.max(0, (this.width - this.borderWidth * 2) * this.getPercent());
    this.fill.fillColor = this.resolveFillColor();
    this.activeTween?.destroy();
    if (animate) {
      this.activeTween = this.scene.tweens.add({
        targets: this.fill,
        width: targetWidth,
        duration: durationMs,
        ease: 'Sine.easeOut',
      });
      return;
    }
    this.fill.width = targetWidth;
  }

  private drawFrame(
    x: number,
    y: number,
    borderColor: number = PROGRESS_BAR_PRESETS.neutral.borderColor,
  ): void {
    this.frame.clear();
    this.frame.fillStyle(COLORS.shadow, 0.35);
    this.frame.fillRoundedRect(x + 1, y + 1, this.width, this.height, RADII.xs);
    this.frame.lineStyle(this.borderWidth, borderColor, 1);
    this.frame.strokeRoundedRect(x, y, this.width, this.height, RADII.xs);
    this.frame.lineStyle(1, COLORS.white, 0.12);
    this.frame.strokeRoundedRect(
      x + this.borderWidth,
      y + this.borderWidth,
      this.width - this.borderWidth * 2,
      this.height - this.borderWidth * 2,
      RADII.xs,
    );
  }

  private resolveFillColor(): number {
    const pct = this.getPercent();
    return typeof this.fillColor === 'function' ? this.fillColor(pct) : this.fillColor;
  }

  private clampValue(value: number): number {
    return Math.max(0, Math.min(value, this.maxValue));
  }
}
