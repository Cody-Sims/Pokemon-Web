import Phaser from 'phaser';
import { PROGRESS_BAR_PRESETS, type ProgressBarPreset } from '@ui/theme';

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
  private readonly width: number;
  private readonly height: number;
  private maxValue: number;
  private currentValue: number;
  private readonly fillColor: number | ((pct: number) => number);
  private activeTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, config: ProgressBarConfig) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    const preset: ProgressBarPreset = PROGRESS_BAR_PRESETS[config.preset ?? 'neutral'];
    this.maxValue = Math.max(0, config.maxValue);
    this.currentValue = this.clampValue(config.currentValue ?? this.maxValue);
    this.fillColor = config.fillColor ?? preset.fillColor;

    this.track = scene.add
      .rectangle(x, y, width, height, config.trackColor ?? preset.trackColor, config.trackAlpha ?? preset.trackAlpha)
      .setOrigin(0, 0);
    this.track.setStrokeStyle(config.borderWidth ?? preset.borderWidth, config.borderColor ?? preset.borderColor);
    this.fill = scene.add.rectangle(x, y, 0, height, this.resolveFillColor()).setOrigin(0, 0);
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
  }

  setVisible(visible: boolean): void {
    this.track.setVisible(visible);
    this.fill.setVisible(visible);
  }

  setPosition(x: number, y: number): void {
    this.track.setPosition(x, y);
    this.fill.setPosition(x, y);
  }

  destroy(): void {
    this.activeTween?.destroy();
    this.track.destroy();
    this.fill.destroy();
  }

  private updateFill(animate: boolean, durationMs = 180): void {
    const targetWidth = this.width * this.getPercent();
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

  private resolveFillColor(): number {
    const pct = this.getPercent();
    return typeof this.fillColor === 'function' ? this.fillColor(pct) : this.fillColor;
  }

  private clampValue(value: number): number {
    return Math.max(0, Math.min(value, this.maxValue));
  }
}
