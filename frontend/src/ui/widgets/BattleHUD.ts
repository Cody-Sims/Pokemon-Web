import Phaser from 'phaser';
import { HealthBar } from './HealthBar';
import { COLORS, FONTS, SPACING, fitTextPx, mobileFontPx, mobileFontSize } from '@ui/theme';

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
    maxHp: number,
  ) {
    const nameMaxWidth = 132;
    const nameFontPx = fitTextPx(name, {
      maxWidth: nameMaxWidth,
      baseFontPx: mobileFontPx(16),
      minFontPx: 12,
    });
    this.nameText = scene.add.text(x, y, name, {
      ...FONTS.body,
      fontSize: `${nameFontPx}px`,
      color: COLORS.textWhite,
      fontStyle: 'bold',
      fixedWidth: nameMaxWidth,
      maxLines: 1,
    });
    this.levelText = scene.add.text(x + nameMaxWidth + SPACING.sm, y + 1, `Lv${level}`, {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(13),
      color: COLORS.textGray,
    });
    this.hpBar = new HealthBar(scene, x, y + 24, 180, 12, maxHp);
    this.hpBar.setValue(currentHp);
    this.hpText = scene.add
      .text(x + 90, y + 39, `${currentHp}/${maxHp}`, {
        ...FONTS.caption,
        fontSize: mobileFontSize(11),
        color: COLORS.textWhite,
      })
      .setOrigin(0.5, 0);
  }

  updateHp(currentHp: number, maxHp: number): void {
    this.hpBar.setMaxValue(maxHp);
    this.hpBar.setValue(currentHp);
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
