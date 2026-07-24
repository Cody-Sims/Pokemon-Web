import Phaser from 'phaser';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';

export interface NameEntryPanelOptions {
  onPreset: (name: string) => void;
  onDone: () => void;
  onSkip: () => void;
  onFocusInput: () => void;
}

export class NameEntryPanel {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly nameDisplay: Phaser.GameObjects.Text;
  private readonly nameCursor: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene, private readonly options: NameEntryPanelOptions) {
    const { width, height } = scene.cameras.main;
    const background = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    this.objects.push(background);

    this.objects.push(scene.add.text(width / 2, height * 0.15, 'What is your name?', {
      ...FONTS.heading,
      fontSize: mobileFontSize(22),
    }).setOrigin(0.5));

    this.objects.push(scene.add.image(width / 2, height * 0.32, 'npc-oak', 0).setScale(4).setAlpha(1));

    const box = scene.add.rectangle(width / 2, height * 0.52, 260, 48, COLORS.bgInput)
      .setStrokeStyle(2, COLORS.borderHighlight);
    this.objects.push(box);

    this.nameDisplay = scene.add.text(width / 2, height * 0.52, '_', {
      ...FONTS.body,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);
    this.objects.push(this.nameDisplay);

    this.nameCursor = scene.add.rectangle(width / 2 + 4, height * 0.52 + 12, 12, 2, 0xffcc00);
    this.objects.push(this.nameCursor);
    scene.tweens.add({ targets: this.nameCursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    this.addPresets();
    this.addHintAndButtons();
    const inputZone = scene.add.rectangle(width / 2, height * 0.48, width * 0.7, 50, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    inputZone.on('pointerdown', () => this.options.onFocusInput());
    this.objects.push(inputZone);
  }

  setName(value: string): void {
    this.nameDisplay.setText(value || '_');
    this.nameCursor.setPosition(this.nameDisplay.x + this.nameDisplay.width / 2 + 4, this.nameDisplay.y + 12);
  }

  fadeOut(onComplete: () => void): void {
    this.scene.tweens.add({ targets: this.objects, alpha: 0, duration: 300, onComplete });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.objects);
    this.objects.forEach(object => object.destroy());
    this.objects.length = 0;
  }

  private addPresets(): void {
    const { width, height } = this.scene.cameras.main;
    const presets = ['Red', 'Ash', 'Gold', 'Ethan'];
    presets.forEach((name, index) => {
      const x = width * 0.2 + index * (width * 0.2);
      const presetBackground = `#${COLORS.bgCard.toString(16).padStart(6, '0')}`;
      const button = this.scene.add.text(x, height * 0.63, name, {
        ...FONTS.menuItem,
        fontSize: mobileFontSize(16),
        color: COLORS.textGray,
        backgroundColor: presetBackground,
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setColor(COLORS.textHighlight));
      button.on('pointerout', () => button.setColor(COLORS.textGray));
      button.on('pointerdown', () => this.options.onPreset(name));
      this.objects.push(button);
    });
  }

  private addHintAndButtons(): void {
    const { width, height } = this.scene.cameras.main;
    const portrait = height > width;
    const safeBottom = isMobile() && portrait ? 150 : 0;
    const doneY = portrait ? height - safeBottom - 60 : height * 0.82;
    const skipY = portrait ? height - safeBottom - 22 : height * 0.92;
    const nameHint = isMobile() ? 'Type a name or tap a preset, then tap DONE' : 'Type your name and press Enter';
    this.objects.push(this.scene.add.text(width / 2, height * 0.73, nameHint, {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5));

    const done = this.scene.add.text(width / 2, doneY, '[ DONE ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    done.on('pointerdown', () => this.options.onDone());
    this.objects.push(done);

    const skip = this.scene.add.text(width / 2, skipY, '[ SKIP ]', {
      ...FONTS.caption,
      fontSize: mobileFontSize(14),
      color: COLORS.textDim,
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.options.onSkip());
    this.objects.push(skip);
  }
}
