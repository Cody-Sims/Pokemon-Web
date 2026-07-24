import Phaser from 'phaser';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';

export type AppearanceIndex = 0 | 1;

export interface AppearancePickerOptions {
  initialSelection: AppearanceIndex;
  onSelect: (selection: AppearanceIndex) => void;
  onDone: () => void;
}

export class AppearancePicker {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private selected: AppearanceIndex;
  private boyPreviewBg!: Phaser.GameObjects.Rectangle;
  private girlPreviewBg!: Phaser.GameObjects.Rectangle;
  private boySprite!: Phaser.GameObjects.Image;
  private girlSprite!: Phaser.GameObjects.Image;
  private boyText!: Phaser.GameObjects.Text;
  private girlText!: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, private readonly options: AppearancePickerOptions) {
    this.selected = options.initialSelection;
    this.build();
    this.updateSelection();
  }

  select(selection: AppearanceIndex): void {
    this.selected = selection;
    this.updateSelection();
    this.options.onSelect(selection);
  }

  fadeOut(onComplete: () => void): void {
    this.scene.tweens.add({ targets: this.objects, alpha: 0, duration: 300, onComplete });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.objects);
    this.objects.forEach(object => object.destroy());
    this.objects.length = 0;
  }

  private build(): void {
    const { width, height } = this.scene.cameras.main;
    this.objects.push(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000));
    this.objects.push(this.scene.add.text(width / 2, height * 0.12, 'Choose your look!', {
      ...FONTS.heading,
      fontSize: mobileFontSize(22),
    }).setOrigin(0.5));

    const portrait = height > width;
    const safeBottom = isMobile() && portrait ? 150 : 0;
    const boyX = portrait ? width / 2 : width * 0.3;
    const girlX = portrait ? width / 2 : width * 0.7;
    const verticalSpan = Math.max(160, height - safeBottom - height * 0.20 - 100);
    const boyY = portrait ? height * 0.20 + verticalSpan * 0.20 : height * 0.42;
    const girlY = portrait ? height * 0.20 + verticalSpan * 0.62 : height * 0.42;

    this.boyPreviewBg = this.scene.add.rectangle(boyX, boyY, 80, 80, 0x333366).setInteractive({ useHandCursor: true });
    this.girlPreviewBg = this.scene.add.rectangle(girlX, girlY, 80, 80, 0x333366).setInteractive({ useHandCursor: true });
    this.boySprite = this.scene.add.image(boyX, boyY, 'player-walk', 'walk-down-0').setScale(4).setInteractive({ useHandCursor: true });
    this.girlSprite = this.scene.add.image(girlX, girlY, 'player-walk-female', 'walk-down-0').setScale(4).setInteractive({ useHandCursor: true });
    this.boyText = this.scene.add.text(boyX, boyY + 60, 'Boy', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);
    this.girlText = this.scene.add.text(girlX, girlY + 60, 'Girl', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textGray,
    }).setOrigin(0.5);
    this.objects.push(this.boyPreviewBg, this.girlPreviewBg, this.boySprite, this.girlSprite, this.boyText, this.girlText);

    this.boyPreviewBg.on('pointerdown', () => this.select(0));
    this.boySprite.on('pointerdown', () => this.select(0));
    this.girlPreviewBg.on('pointerdown', () => this.select(1));
    this.girlSprite.on('pointerdown', () => this.select(1));

    const doneY = portrait ? height - safeBottom - 60 : height * 0.78;
    const hintY = portrait ? height - safeBottom - 22 : height * 0.88;
    const done = this.scene.add.text(width / 2, doneY, '[ DONE ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    done.on('pointerdown', () => this.options.onDone());
    this.objects.push(done);

    const appearanceHint = isMobile() ? 'Tap to select, then DONE' : (portrait ? 'Use ↑ ↓ and Enter' : 'Use ← → and Enter');
    this.objects.push(this.scene.add.text(width / 2, hintY, appearanceHint, {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5));
  }

  private updateSelection(): void {
    const isBoy = this.selected === 0;
    this.boyPreviewBg.setStrokeStyle(3, isBoy ? 0xffcc00 : 0x666688);
    this.girlPreviewBg.setStrokeStyle(3, isBoy ? 0x666688 : 0xffcc00);
    this.boyText.setColor(isBoy ? COLORS.textHighlight : COLORS.textGray);
    this.girlText.setColor(isBoy ? COLORS.textGray : COLORS.textHighlight);
    this.boySprite.setAlpha(isBoy ? 1 : 0.5);
    this.girlSprite.setAlpha(isBoy ? 0.5 : 1);
  }
}
