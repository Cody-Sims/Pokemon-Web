import Phaser from 'phaser';

/** Animated HP bar widget using Rectangle objects for efficient updates.
 *  Only updates width on value change instead of full graphics redraw. */
export class HealthBar {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private width: number;
  private height: number;
  private maxValue: number;
  private currentValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxValue: number) {
    this.width = width;
    this.height = height;
    this.maxValue = maxValue;
    this.currentValue = maxValue;

    this.bg = scene.add.rectangle(x, y, width, height, 0x333333).setOrigin(0, 0);
    this.fill = scene.add.rectangle(x, y, width, height, 0x4caf50).setOrigin(0, 0);
  }

  setValue(value: number): void {
    this.currentValue = Math.max(0, Math.min(value, this.maxValue));
    this.updateFill();
  }

  setMaxValue(maxValue: number): void {
    this.maxValue = maxValue;
    this.updateFill();
  }

  private updateFill(): void {
    if (this.maxValue <= 0) {
      this.fill.width = 0;
      return;
    }
    const pct = this.currentValue / this.maxValue;
    let color = 0x4caf50; // green
    if (pct <= 0.2) color = 0xf44336; // red
    else if (pct <= 0.5) color = 0xffeb3b; // yellow

    this.fill.fillColor = color;
    this.fill.width = this.width * pct;
  }

  setDepth(depth: number): void {
    this.bg.setDepth(depth);
    this.fill.setDepth(depth);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
  }
}
