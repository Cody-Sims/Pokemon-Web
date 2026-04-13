import Phaser from 'phaser';
import { SaveManager } from '@managers/SaveManager';
import { AudioManager } from '@managers/AudioManager';
import { COLORS, FONTS } from '@ui/theme';
import { TouchControls } from '@ui/TouchControls';
import { BGM, SFX } from '@utils/audio-keys';
import { ConfirmBox } from '@ui/ConfirmBox';

export class TitleScene extends Phaser.Scene {
  private cursor!: number;
  private menuItems!: Phaser.GameObjects.Text[];
  private cursorIcon!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    audio.playBGM(BGM.TITLE);

    const { width, height } = this.cameras.main;

    // Background gradient
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.bgDark);
    // Decorative lines
    for (let i = 0; i < 5; i++) {
      this.add.rectangle(width / 2, height * 0.15 + i * 4, width * 0.6, 2, COLORS.border, 0.3);
    }

    // Title
    this.add.text(width / 2, height * 0.28, 'POKEMON', {
      ...FONTS.title, fontSize: '52px',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.38, 'W  E  B', {
      ...FONTS.title, fontSize: '28px', color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Decorative divider
    this.add.rectangle(width / 2, height * 0.44, 200, 2, COLORS.borderHighlight, 0.5);

    // Menu options
    const options = ['New Game'];
    if (SaveManager.getInstance().hasSave()) {
      options.unshift('Continue');
      options.push('Delete Save');
    }
    options.push('Options');

    this.cursor = 0;
    const menuStartY = height * 0.54;
    this.menuItems = options.map((label, i) => {
      const item = this.add.text(width / 2 + 16, menuStartY + i * 44, label, {
        ...FONTS.menuItem, fontSize: '22px',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      item.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      item.on('pointerdown', () => { this.cursor = i; this.selectOption(); });
      return item;
    });

    // Cursor arrow
    this.cursorIcon = this.add.text(0, 0, '▸', { ...FONTS.menuItem, fontSize: '22px', color: COLORS.textHighlight });

    // Version / hint
    const hintText = TouchControls.isTouchDevice() ? 'Tap to select' : 'Press Enter to select';
    this.add.text(width / 2, height - 30, hintText, {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5);

    this.updateCursor();

    // Keyboard input
    this.input.keyboard!.on('keydown-UP', () => {
      this.cursor = (this.cursor - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateCursor();
      audio.playSFX(SFX.CURSOR);
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      this.cursor = (this.cursor + 1) % this.menuItems.length;
      this.updateCursor();
      audio.playSFX(SFX.CURSOR);
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      this.selectOption();
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.selectOption();
    });
  }

  private updateCursor(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite);
    });
    const selected = this.menuItems[this.cursor];
    this.cursorIcon.setPosition(selected.x - selected.width / 2 - 24, selected.y - 12);
  }

  private selectOption(): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const label = this.menuItems[this.cursor].text;
    switch (label) {
      case 'New Game':
        this.scene.start('OverworldScene');
        break;
      case 'Continue': {
        const saveData = SaveManager.getInstance().load();
        if (saveData) {
          this.scene.start('OverworldScene', { saveData });
        }
        break;
      }
      case 'Options':
        this.scene.sleep();
        this.scene.launch('SettingsScene', { returnScene: 'TitleScene' });
        this.scene.get('SettingsScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'Delete Save':
        new ConfirmBox(
          this,
          this.cameras.main.width / 2 - 70,
          this.cameras.main.height / 2 - 45,
          'Delete save data?',
          (confirmed) => {
            if (confirmed) {
              SaveManager.getInstance().deleteSave();
              this.scene.restart(); // Refresh title screen without Continue option
            }
          },
        );
        break;
    }
  }
}
