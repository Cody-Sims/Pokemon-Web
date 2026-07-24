import Phaser from 'phaser';
import { ProgressBar } from './ProgressBar';

/** Animated HP bar widget backed by the shared ProgressBar and hpColor theme preset. */
export class HealthBar {
  private readonly bar: ProgressBar;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxValue: number) {
    this.bar = new ProgressBar(scene, x, y, width, height, {
      maxValue,
      currentValue: maxValue,
      preset: 'hp',
    });
  }

  setValue(value: number, animate = false): void {
    this.bar.setValue(value, animate);
  }

  setMaxValue(maxValue: number): void {
    this.bar.setMaxValue(maxValue);
  }

  setDepth(depth: number): void {
    this.bar.setDepth(depth);
  }

  destroy(): void {
    this.bar.destroy();
  }
}
