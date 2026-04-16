import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import { TouchControls } from '@ui/controls/TouchControls';
import type { PokemonInstance } from '@data/interfaces';

/**
 * NicknameScene — Overlay scene for entering a Pokémon nickname.
 * Reuses the naming UI pattern from IntroScene.
 *
 * Init data: { pokemon: PokemonInstance, speciesName: string }
 * On confirm, sets pokemon.nickname (or clears it if empty/same as species).
 */
export class NicknameScene extends Phaser.Scene {
  private pokemon!: PokemonInstance;
  private speciesName = '';
  private nameInput = '';
  private nameDisplay!: Phaser.GameObjects.Text;
  private nameCursor!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'NicknameScene' });
  }

  init(data: { pokemon: PokemonInstance; speciesName: string }): void {
    this.pokemon = data.pokemon;
    this.speciesName = data.speciesName;
    this.nameInput = '';
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Semi-transparent backdrop
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title
    this.add.text(width / 2, height * 0.15, `Give a nickname to ${this.speciesName}?`, {
      ...FONTS.heading,
      fontSize: mobileFontSize(20),
    }).setOrigin(0.5);

    // Name display box
    const boxWidth = 260;
    const boxHeight = 48;
    this.add.rectangle(width / 2, height * 0.38, boxWidth, boxHeight, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.borderHighlight);

    this.nameDisplay = this.add.text(width / 2, height * 0.38, '_', {
      ...FONTS.body,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Blinking cursor
    this.nameCursor = this.add.rectangle(
      width / 2 + 4, height * 0.38 + 12,
      12, 2, 0xffcc00,
    );
    this.tweens.add({
      targets: this.nameCursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Hint
    const hintText = TouchControls.isTouchDevice()
      ? 'Type a name, then tap DONE (or SKIP)'
      : 'Type a nickname and press Enter (ESC to skip)';
    this.add.text(width / 2, height * 0.52, hintText, {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5);

    // DONE button
    const doneBtn = this.add.text(width / 2 - 60, height * 0.65, '[ DONE ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    doneBtn.on('pointerdown', () => this.confirmNickname());

    // SKIP button
    const skipBtn = this.add.text(width / 2 + 60, height * 0.65, '[ SKIP ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textGray,
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.scene.stop());

    // Keyboard input
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.confirmNickname();
        return;
      }
      if (event.key === 'Escape') {
        this.scene.stop();
        return;
      }
      if (event.key === 'Backspace') {
        this.nameInput = this.nameInput.slice(0, -1);
        this.updateNameDisplay();
        return;
      }
      // Allow letters, numbers, spaces, hyphens — max 12 chars
      if (this.nameInput.length < 12 && /^[a-zA-Z0-9 \-]$/.test(event.key)) {
        this.nameInput += event.key;
        this.updateNameDisplay();
      }
    });
  }

  private updateNameDisplay(): void {
    const display = this.nameInput || '_';
    this.nameDisplay.setText(display);

    const textWidth = this.nameDisplay.width;
    this.nameCursor.setPosition(
      this.nameDisplay.x + textWidth / 2 + 4,
      this.nameDisplay.y + 12,
    );
  }

  private confirmNickname(): void {
    const name = this.nameInput.trim();
    if (name && name !== this.speciesName) {
      this.pokemon.nickname = name;
    }
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.scene.stop();
  }
}
