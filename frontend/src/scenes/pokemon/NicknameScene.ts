import Phaser from 'phaser';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import { TouchControls } from '@ui/controls/TouchControls';
import type { PokemonInstance } from '@data/interfaces';
import { NICKNAME_CHAR_REGEX, NICKNAME_STRIP_REGEX, NICKNAME_MAX_LENGTH } from '@utils/nickname-validation';

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
  private hiddenInput?: HTMLInputElement;

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
    const nicknameHint = isMobile()
      ? 'Type a name, then tap DONE (or SKIP)'
      : 'Type a nickname and press Enter (ESC to skip)';
    this.add.text(width / 2, height * 0.52, nicknameHint, {
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

    // ── Mobile: hidden DOM input to trigger soft keyboard ──
    if (isMobile()) {
      this.hiddenInput = document.createElement('input');
      this.hiddenInput.type = 'text';
      this.hiddenInput.maxLength = NICKNAME_MAX_LENGTH;
      this.hiddenInput.autocomplete = 'off';
      this.hiddenInput.autocapitalize = 'words';
      this.hiddenInput.setAttribute('autocorrect', 'off');
      this.hiddenInput.setAttribute('spellcheck', 'false');
      this.hiddenInput.setAttribute('inputmode', 'text');
      this.hiddenInput.name = 'nickname-disabled';
      Object.assign(this.hiddenInput.style, {
        position: 'fixed', left: '50%', top: '35%', transform: 'translate(-50%, -50%)',
        width: '200px', fontSize: '16px',
        opacity: '0', zIndex: '9999', pointerEvents: 'none',
      });
      document.body.appendChild(this.hiddenInput);

      // Tap on the name display area → focus the hidden input
      const inputZone = this.add.rectangle(width / 2, height * 0.38, width * 0.7, 50, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      inputZone.on('pointerdown', () => {
        this.hiddenInput!.style.pointerEvents = 'auto';
        this.hiddenInput!.focus();
        setTimeout(() => { if (this.hiddenInput) this.hiddenInput.style.pointerEvents = 'none'; }, 500);
      });

      this.hiddenInput.addEventListener('input', () => {
        const val = this.hiddenInput!.value.replace(NICKNAME_STRIP_REGEX, '').slice(0, NICKNAME_MAX_LENGTH);
        this.hiddenInput!.value = val;
        this.nameInput = val;
        this.updateNameDisplay();
      });

      // Clean up on scene shutdown
      this.events.once('shutdown', () => {
        this.hiddenInput?.remove();
        this.hiddenInput = undefined;
      });
    }

    // Keyboard input — suppress when the hidden DOM input is focused to
    // avoid double-firing on Bluetooth keyboards paired to mobile devices.
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this.hiddenInput && document.activeElement === this.hiddenInput) return;
      if (event.key === 'Enter') {
        this.confirmNickname();
        return;
      }
      if (event.key === 'Escape') {
        AudioManager.getInstance().playSFX(SFX.CANCEL);
        this.scene.stop();
        return;
      }
      if (event.key === 'Backspace') {
        this.nameInput = this.nameInput.slice(0, -1);
        this.updateNameDisplay();
        return;
      }
      // Allow letters, numbers, spaces, hyphens — shared max-length constant
      if (this.nameInput.length < NICKNAME_MAX_LENGTH && NICKNAME_CHAR_REGEX.test(event.key)) {
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
