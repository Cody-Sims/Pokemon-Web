import Phaser from 'phaser';

/** Animated HP bar widget that changes color based on health percentage. */
export class HealthBar {
  private bar: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private maxValue: number;
  private currentValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxValue: number) {
    this.bar = scene.add.graphics();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxValue = maxValue;
    this.currentValue = maxValue;
    this.draw();
  }

  setValue(value: number): void {
    this.currentValue = Math.max(0, Math.min(value, this.maxValue));
    this.draw();
  }

  setMaxValue(maxValue: number): void {
    this.maxValue = maxValue;
    this.draw();
  }

  private draw(): void {
    this.bar.clear();

    // Background
    this.bar.fillStyle(0x333333);
    this.bar.fillRect(this.x, this.y, this.width, this.height);

    // Health fill
    const pct = this.currentValue / this.maxValue;
    let color = 0x4caf50; // green
    if (pct <= 0.2) color = 0xf44336; // red
    else if (pct <= 0.5) color = 0xffeb3b; // yellow

    this.bar.fillStyle(color);
    this.bar.fillRect(this.x, this.y, this.width * pct, this.height);
  }

  setDepth(depth: number): void {
    this.bar.setDepth(depth);
  }

  destroy(): void {
    this.bar.destroy();
  }
}
