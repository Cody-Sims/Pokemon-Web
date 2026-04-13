import Phaser from 'phaser';
import { SaveManager } from '@managers/SaveManager';
import { AudioManager } from '@managers/AudioManager';
import { COLORS, FONTS } from '@ui/theme';
import { TouchControls } from '@ui/TouchControls';
import { BGM, SFX } from '@utils/audio-keys';
import { ConfirmBox } from '@ui/ConfirmBox';
import { GameManager } from '@managers/GameManager';
import { DifficultyMode, DIFFICULTY_CONFIGS } from '@data/difficulty';

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
        this.showDifficultySelect();
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

  private showDifficultySelect(): void {
    const { width, height } = this.cameras.main;
    const modes: DifficultyMode[] = ['classic', 'hard', 'nuzlocke'];

    // Dim background
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(50);

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'SELECT DIFFICULTY', {
      ...FONTS.heading, fontSize: '24px',
    }).setOrigin(0.5).setDepth(51);

    // Difficulty options
    let diffCursor = 0;
    const diffItems = modes.map((mode, i) => {
      const cfg = DIFFICULTY_CONFIGS[mode];
      const label = this.add.text(width / 2, height * 0.38 + i * 60, cfg.name, {
        ...FONTS.menuItem, fontSize: '20px',
      }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

      label.on('pointerover', () => { diffCursor = i; updateDiff(); });
      label.on('pointerdown', () => { diffCursor = i; confirmDiff(); });
      return label;
    });

    const desc = this.add.text(width / 2, height * 0.75, DIFFICULTY_CONFIGS[modes[0]].description, {
      ...FONTS.caption, fontSize: '14px', color: COLORS.textDim, wordWrap: { width: 400 },
    }).setOrigin(0.5).setDepth(51);

    const diffArrow = this.add.text(0, 0, '▸', {
      ...FONTS.menuItem, fontSize: '20px', color: COLORS.textHighlight,
    }).setDepth(51);

    const updateDiff = () => {
      diffItems.forEach((item, i) => {
        item.setColor(i === diffCursor ? COLORS.textHighlight : COLORS.textWhite);
      });
      const sel = diffItems[diffCursor];
      diffArrow.setPosition(sel.x - sel.width / 2 - 20, sel.y - 10);
      desc.setText(DIFFICULTY_CONFIGS[modes[diffCursor]].description);
    };
    updateDiff();

    const confirmDiff = () => {
      const gm = GameManager.getInstance();
      gm.setDifficulty(modes[diffCursor]);
      cleanup();
      this.scene.start('OverworldScene');
    };

    const cancelDiff = () => {
      cleanup();
    };

    const cleanup = () => {
      this.input.keyboard!.off('keydown-UP', onUp);
      this.input.keyboard!.off('keydown-DOWN', onDown);
      this.input.keyboard!.off('keydown-ENTER', onEnter);
      this.input.keyboard!.off('keydown-ESC', onEsc);
      overlay.destroy();
      title.destroy();
      diffItems.forEach(i => i.destroy());
      desc.destroy();
      diffArrow.destroy();
    };

    const onUp = () => {
      diffCursor = (diffCursor - 1 + modes.length) % modes.length;
      updateDiff();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const onDown = () => {
      diffCursor = (diffCursor + 1) % modes.length;
      updateDiff();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const onEnter = () => {
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
      confirmDiff();
    };
    const onEsc = () => {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      cancelDiff();
    };

    this.input.keyboard!.on('keydown-UP', onUp);
    this.input.keyboard!.on('keydown-DOWN', onDown);
    this.input.keyboard!.on('keydown-ENTER', onEnter);
    this.input.keyboard!.on('keydown-ESC', onEsc);
  }
}
