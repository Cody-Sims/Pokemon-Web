import Phaser from 'phaser';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import type { PokemonInstance } from '@data/interfaces';
import { NICKNAME_CHAR_REGEX, NICKNAME_STRIP_REGEX, NICKNAME_MAX_LENGTH } from '@utils/nickname-validation';
import { DomTextInputAdapter } from '@ui/dom/DomTextInputAdapter';
import { SceneKey } from '@scenes/scene-keys';

export class NicknameScene extends Phaser.Scene {
  private pokemon!: PokemonInstance;
  private speciesName = '';
  private nameInput = '';
  private nameDisplay!: Phaser.GameObjects.Text;
  private nameCursor!: Phaser.GameObjects.Rectangle;
  private hiddenInput?: DomTextInputAdapter;

  private readonly inputRegistry = new SceneInputRegistry(this);

  constructor() {
    super({ key: SceneKey.Nickname });
  }

  init(data: { pokemon: PokemonInstance; speciesName: string }): void {
    this.pokemon = data.pokemon;
    this.speciesName = data.speciesName;
    this.nameInput = '';
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.add.text(width / 2, height * 0.15, `Give a nickname to ${this.speciesName}?`, {
      ...FONTS.heading,
      fontSize: mobileFontSize(20),
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, height * 0.38, 260, 48, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.borderHighlight);

    this.nameDisplay = this.add.text(width / 2, height * 0.38, '_', {
      ...FONTS.body,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    this.nameCursor = this.add.rectangle(width / 2 + 4, height * 0.38 + 12, 12, 2, 0xffcc00);
    this.tweens.add({ targets: this.nameCursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    const nicknameHint = isMobile()
      ? 'Type a name, then tap DONE (or SKIP)'
      : 'Type a nickname and press Enter (ESC to skip)';
    this.add.text(width / 2, height * 0.52, nicknameHint, {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5);

    const doneBtn = this.add.text(width / 2 - 60, height * 0.65, '[ DONE ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.inputRegistry.bindPointer(doneBtn, 'pointerdown', () => this.confirmNickname());

    const skipBtn = this.add.text(width / 2 + 60, height * 0.65, '[ SKIP ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textGray,
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.inputRegistry.bindPointer(skipBtn, 'pointerdown', () => this.scene.stop());

    this.createMobileInput(width, height);
    this.bindKeyboardInput();
    this.events.once('shutdown', this.destroyHiddenInput, this);
  }

  private createMobileInput(width: number, height: number): void {
    if (!isMobile()) return;
    this.hiddenInput = new DomTextInputAdapter({
      maxLength: NICKNAME_MAX_LENGTH,
      name: 'nickname-disabled',
      top: '35%',
      sanitize: value => value.replace(NICKNAME_STRIP_REGEX, ''),
      onInput: value => {
        this.nameInput = value;
        this.updateNameDisplay();
      },
      onSubmit: () => this.confirmNickname(),
      onCancel: () => {
        AudioManager.getInstance().playSFX(SFX.CANCEL);
        this.scene.stop();
      },
    });
    this.hiddenInput.mount();

    const inputZone = this.add.rectangle(width / 2, height * 0.38, width * 0.7, 50, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.inputRegistry.bindPointer(inputZone, 'pointerdown', () => this.hiddenInput?.focusTemporarily());
  }

  private bindKeyboardInput(): void {
    this.inputRegistry.bindKey('keydown', (event: KeyboardEvent) => {
      if (this.hiddenInput?.isFocused()) return;
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
      if (this.nameInput.length < NICKNAME_MAX_LENGTH && NICKNAME_CHAR_REGEX.test(event.key)) {
        this.nameInput += event.key;
        this.updateNameDisplay();
      }
    });
  }

  private updateNameDisplay(): void {
    this.nameDisplay.setText(this.nameInput || '_');
    this.nameCursor.setPosition(this.nameDisplay.x + this.nameDisplay.width / 2 + 4, this.nameDisplay.y + 12);
  }

  private confirmNickname(): void {
    const name = this.nameInput.trim();
    if (name && name !== this.speciesName) this.pokemon.nickname = name;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.scene.stop();
  }

  private destroyHiddenInput(): void {
    this.hiddenInput?.destroy();
    this.hiddenInput = undefined;
  }
}
