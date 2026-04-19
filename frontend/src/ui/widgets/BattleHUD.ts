import Phaser from 'phaser';
import { HealthBar } from './HealthBar';
import { mobileFontSize } from '@ui/theme';

/** Composite widget: name, level, HP bar, EXP bar. */
export class BattleHUD {
  private nameText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private hpBar: HealthBar;
  private hpText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    level: number,
    currentHp: number,
    maxHp: number
  ) {
    this.nameText = scene.add.text(x, y, name, { fontSize: mobileFontSize(16), color: '#ffffff', fontStyle: 'bold' });
    this.levelText = scene.add.text(x + 140, y, `Lv${level}`, { fontSize: mobileFontSize(14), color: '#ffffff' });
    this.hpBar = new HealthBar(scene, x, y + 22, 180, 10, maxHp);
    this.hpBar.setValue(currentHp);
    this.hpText = scene.add.text(x + 90, y + 34, `${currentHp}/${maxHp}`, { fontSize: mobileFontSize(12), color: '#ffffff' }).setOrigin(0.5, 0);
  }

  updateHp(currentHp: number, maxHp: number): void {
    this.hpBar.setValue(currentHp);
    this.hpBar.setMaxValue(maxHp);
    this.hpText.setText(`${currentHp}/${maxHp}`);
  }

  updateLevel(level: number): void {
    this.levelText.setText(`Lv${level}`);
  }

  setDepth(depth: number): void {
    this.nameText.setDepth(depth);
    this.levelText.setDepth(depth);
    this.hpBar.setDepth(depth);
    this.hpText.setDepth(depth);
  }

  destroy(): void {
    this.nameText.destroy();
    this.levelText.destroy();
    this.hpBar.destroy();
    this.hpText.destroy();
  }
}
