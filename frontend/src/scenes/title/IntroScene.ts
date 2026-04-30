import Phaser from 'phaser';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile } from '@ui/theme';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { BGM, SFX } from '@utils/audio-keys';
import { TouchControls } from '@ui/controls/TouchControls';
import { hintText } from '@utils/hint-text';

/**
 * IntroScene — "Welcome to the world of Pokémon!" professor intro,
 * player naming, and character appearance selection.
 * Launched from TitleScene when starting a new game.
 */
export class IntroScene extends Phaser.Scene {
  private currentSlide = 0;
  private textObject!: Phaser.GameObjects.Text;
  private professorSprite!: Phaser.GameObjects.Image;
  private pokemonSprite!: Phaser.GameObjects.Image | null;
  private slideContainer!: Phaser.GameObjects.Container;
  private isAnimating = false;
  private nameInput = '';
  private nameCursor!: Phaser.GameObjects.Rectangle;
  private nameDisplay!: Phaser.GameObjects.Text;
  private phase: 'intro' | 'naming' | 'appearance' | 'confirm' = 'intro';
  private selectedAppearance = 0; // 0 = boy, 1 = girl
  private difficultyMode: import('@data/difficulty').DifficultyMode = 'classic';
  private challengeModes: import('@data/challenge-modes').ChallengeMode[] = [];
  private hiddenInput?: HTMLInputElement;

  // Pre-built intro slides
  private readonly slides = [
    {
      text: "Hello there! Welcome to the\nworld of POKéMON!",
      showProfessor: true,
      showPokemon: false,
    },
    {
      text: "My name is WILLOW. People call\nme the POKéMON PROFESSOR!",
      showProfessor: true,
      showPokemon: false,
    },
    {
      text: "This world is inhabited by\ncreatures called POKéMON!",
      showProfessor: false,
      showPokemon: true,
    },
    {
      text: "For some people, POKéMON are\npets. Others use them for\nfights.",
      showProfessor: false,
      showPokemon: true,
    },
    {
      text: "Myself... I study POKéMON as\na profession.",
      showProfessor: true,
      showPokemon: false,
    },
    {
      text: "The Aurum Region is home to\nPokémon found nowhere else.\nAether energy flows beneath\nour very feet.",
      showProfessor: true,
      showPokemon: false,
    },
    {
      text: "But first, tell me a little\nabout yourself.",
      showProfessor: true,
      showPokemon: false,
    },
  ];

  constructor() {
    super({ key: 'IntroScene' });
  }

  init(data?: Record<string, unknown>): void {
    if (data?.difficulty) {
      this.difficultyMode = data.difficulty as import('@data/difficulty').DifficultyMode;
    }
    if (Array.isArray(data?.challengeModes)) {
      this.challengeModes = data.challengeModes as import('@data/challenge-modes').ChallengeMode[];
    }
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const portrait = height > width;

    // Black background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    // Container for slide content
    this.slideContainer = this.add.container(0, 0);

    // Professor sprite — kept in the upper third so it never overlaps text
    // even when slide copy spans 4+ lines on portrait phones.
    const professorY = portrait ? height * 0.28 : height * 0.35;
    this.professorSprite = this.add.image(width / 2, professorY, 'npc-oak', 0)
      .setScale(portrait ? 5 : 6)
      .setAlpha(0);
    this.slideContainer.add(this.professorSprite);

    // Pokemon display sprite (Pikachu/Nidoran as intro pokemon)
    this.pokemonSprite = null;

    // Text display — bottom-anchored in portrait so multi-line slides
    // never get clipped by the iOS Safari toolbar overlapping the canvas.
    const textY = portrait ? height - 80 : height * 0.72;
    const textOriginY = portrait ? 1 : 0;
    this.textObject = this.add.text(width / 2, textY, '', {
      ...FONTS.body,
      fontSize: mobileFontSize(portrait ? 16 : 18),
      color: COLORS.textWhite,
      align: 'center',
      wordWrap: { width: width * 0.86 },
      lineSpacing: 6,
    }).setOrigin(0.5, textOriginY).setAlpha(0);

    // Hint text — keep clear of the bottom safe-area inset.
    this.add.text(width / 2, height - 24, hintText('advance'), {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5, 1);

    // Start first slide
    this.showSlide(0);

    // Input handlers
    this.input.keyboard!.on('keydown-ENTER', () => this.advance());
    this.input.keyboard!.on('keydown-SPACE', () => this.advance());
    this.input.on('pointerdown', () => this.advance());

    // BUG-043: Register shutdown explicitly so the hidden DOM input is
    // detached even when Phaser restarts the scene unexpectedly.
    this.events.once('shutdown', this.shutdown, this);
  }

  private advance(): void {
    if (this.isAnimating) return;

    if (this.phase === 'intro') {
      this.currentSlide++;
      if (this.currentSlide >= this.slides.length) {
        this.phase = 'naming';
        this.showNamingScreen();
      } else {
        this.showSlide(this.currentSlide);
      }
    } else if (this.phase === 'confirm') {
      this.finishIntro();
    }
  }

  private showSlide(index: number): void {
    this.isAnimating = true;
    const slide = this.slides[index];
    const { width, height } = this.cameras.main;
    const portrait = height > width;
    const spriteY = portrait ? height * 0.28 : height * 0.35;

    // Fade out current content
    this.tweens.add({
      targets: [this.textObject, this.professorSprite, this.pokemonSprite].filter(Boolean),
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Update text
        this.textObject.setText(slide.text);

        // Update professor visibility
        if (slide.showProfessor) {
          this.professorSprite.setPosition(width / 2, spriteY);
          this.tweens.add({ targets: this.professorSprite, alpha: 1, duration: 300 });
        }

        // Update pokemon visibility
        if (slide.showPokemon) {
          if (!this.pokemonSprite) {
            // Show Pikachu as the intro pokemon (preloaded in PreloadScene)
            const spriteKey = this.textures.exists('pikachu-front') ? 'pikachu-front' : 'pikachu-icon';
            this.pokemonSprite = this.add.image(width / 2, spriteY, spriteKey)
              .setScale(this.textures.exists('pikachu-front') ? 3 : 6)
              .setAlpha(0);
            this.slideContainer.add(this.pokemonSprite);
          }
          this.pokemonSprite.setPosition(width / 2, spriteY);
          this.tweens.add({ targets: this.pokemonSprite, alpha: 1, duration: 300 });
        }

        // Fade in text
        this.tweens.add({
          targets: this.textObject,
          alpha: 1,
          duration: 300,
          onComplete: () => { this.isAnimating = false; },
        });
      },
    });

    AudioManager.getInstance().playSFX(SFX.CONFIRM);
  }

  private showNamingScreen(): void {
    this.isAnimating = true;
    const { width, height } = this.cameras.main;

    // Clear intro elements
    this.tweens.add({
      targets: [this.textObject, this.professorSprite, this.pokemonSprite].filter(Boolean),
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Remove all existing listeners for intro advancement
        this.input.keyboard!.removeAllListeners();
        this.input.removeAllListeners();

        this.buildNamingUI();
        this.isAnimating = false;
      },
    });
  }

  private buildNamingUI(): void {
    const { width, height } = this.cameras.main;
    const fontSize = mobileFontSize(18);

    // "What is your name?" prompt
    this.add.text(width / 2, height * 0.15, "What is your name?", {
      ...FONTS.heading,
      fontSize: mobileFontSize(22),
    }).setOrigin(0.5);

    // Professor mini sprite
    this.professorSprite.setPosition(width / 2, height * 0.32).setScale(4).setAlpha(1);

    // Name display box
    const boxWidth = 260;
    const boxHeight = 48;
    this.add.rectangle(width / 2, height * 0.52, boxWidth, boxHeight, COLORS.bgInput)
      .setStrokeStyle(2, COLORS.borderHighlight);

    this.nameDisplay = this.add.text(width / 2, height * 0.52, '_', {
      ...FONTS.body,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Blinking cursor
    this.nameCursor = this.add.rectangle(
      width / 2 + 4, height * 0.52 + 12,
      12, 2, 0xffcc00
    );
    this.tweens.add({
      targets: this.nameCursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Preset name buttons
    const presets = ['Red', 'Ash', 'Gold', 'Ethan'];
    const presetY = height * 0.63;
    presets.forEach((name, i) => {
      const bx = width * 0.2 + i * (width * 0.2);
      const btn = this.add.text(bx, presetY, name, {
        ...FONTS.menuItem,
        fontSize: mobileFontSize(16),
        color: COLORS.textGray,
        backgroundColor: '#252545',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor(COLORS.textHighlight));
      btn.on('pointerout', () => btn.setColor(COLORS.textGray));
      btn.on('pointerdown', () => {
        this.nameInput = name;
        this.updateNameDisplay();
        AudioManager.getInstance().playSFX(SFX.CONFIRM);
      });
    });

    // Hint
    const nameHint = isMobile()
      ? 'Type a name or tap a preset, then tap DONE'
      : 'Type your name and press Enter';
    this.add.text(width / 2, height * 0.73, nameHint, {
      ...FONTS.caption,
      color: COLORS.textDim,
    }).setOrigin(0.5);

    // DONE button
    // BUG-044: Reserve a 150 px bottom safe-area on portrait mobile so the
    // DOM touch controls / iOS home indicator don't sit on top of DONE/SKIP.
    const portraitBuild = height > width;
    const safeBottom = isMobile() && portraitBuild ? 150 : 0;
    const doneY = portraitBuild ? height - safeBottom - 60 : height * 0.82;
    const skipY = portraitBuild ? height - safeBottom - 22 : height * 0.92;
    const doneBtn = this.add.text(width / 2, doneY, '[ DONE ]', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    doneBtn.on('pointerdown', () => this.confirmName());

    // SKIP button
    const skipBtn = this.add.text(width / 2, skipY, '[ SKIP ]', {
      ...FONTS.caption,
      fontSize: mobileFontSize(14),
      color: COLORS.textDim,
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => {
      this.nameInput = 'Red';
      this.confirmName();
    });

    // ── Mobile: hidden DOM input to trigger soft keyboard ──
    if (isMobile()) {
      this.hiddenInput = document.createElement('input');
      this.hiddenInput.type = 'text';
      this.hiddenInput.maxLength = 10;
      this.hiddenInput.autocomplete = 'off';
      this.hiddenInput.autocapitalize = 'words';
      Object.assign(this.hiddenInput.style, {
        position: 'fixed', left: '50%', top: '40%', transform: 'translate(-50%, -50%)',
        width: '200px', fontSize: '16px', // 16px prevents iOS auto-zoom
        opacity: '0', zIndex: '9999', pointerEvents: 'none',
      });
      document.body.appendChild(this.hiddenInput);

      // Tap on the name display area or text input box → focus the hidden input
      const inputZone = this.add.rectangle(width / 2, height * 0.48, width * 0.7, 50, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      inputZone.on('pointerdown', () => {
        this.hiddenInput!.style.pointerEvents = 'auto';
        this.hiddenInput!.focus();
        // Re-hide pointer events after keyboard opens
        setTimeout(() => { if (this.hiddenInput) this.hiddenInput.style.pointerEvents = 'none'; }, 500);
      });

      // Sync hidden input value → game
      this.hiddenInput.addEventListener('input', () => {
        const val = this.hiddenInput!.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        this.hiddenInput!.value = val;
        this.nameInput = val;
        this.updateNameDisplay();
      });
    }

    // Keyboard input for typing (desktop / hardware keyboard)
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.confirmName();
        return;
      }
      if (event.key === 'Backspace') {
        this.nameInput = this.nameInput.slice(0, -1);
        this.updateNameDisplay();
        return;
      }
      // Allow letters and numbers, max 10 chars
      if (this.nameInput.length < 10 && /^[a-zA-Z0-9]$/.test(event.key)) {
        this.nameInput += event.key;
        this.updateNameDisplay();
      }
    });
  }

  private updateNameDisplay(): void {
    const display = this.nameInput || '_';
    this.nameDisplay.setText(display);

    // Reposition cursor
    const textWidth = this.nameDisplay.width;
    this.nameCursor.setPosition(
      this.nameDisplay.x + textWidth / 2 + 4,
      this.nameDisplay.y + 12,
    );
  }

  private confirmName(): void {
    // Remove hidden mobile input
    if (this.hiddenInput) {
      this.hiddenInput.blur();
      this.hiddenInput.remove();
      this.hiddenInput = undefined;
    }

    const name = this.nameInput.trim() || 'Red';
    this.nameInput = name;

    const gm = GameManager.getInstance();
    gm.setPlayerName(name);
    gm.setDifficulty(this.difficultyMode);
    gm.setChallengeModes(this.challengeModes);

    AudioManager.getInstance().playSFX(SFX.CONFIRM);

    // Move to appearance selection
    this.phase = 'appearance';
    this.showAppearanceScreen();
  }

  private showAppearanceScreen(): void {
    this.isAnimating = true;

    // Clear all listeners and fade out
    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners();

    // Fade everything out
    const allVisible = this.children.list.filter(c => (c as any).alpha > 0) as Phaser.GameObjects.GameObject[];
    this.tweens.add({
      targets: allVisible,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.buildAppearanceUI();
        this.isAnimating = false;
      },
    });
  }

  private buildAppearanceUI(): void {
    const { width, height } = this.cameras.main;

    // Black background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    // Title
    this.add.text(width / 2, height * 0.12, 'Choose your look!', {
      ...FONTS.heading,
      fontSize: mobileFontSize(22),
    }).setOrigin(0.5);

    // Boy option
    const boyX = width * 0.3;
    const girlX = width * 0.7;
    const optionY = height * 0.42;

    // Character preview backgrounds
    const boyPreviewBg = this.add.rectangle(boyX, optionY, 80, 80, 0x333366).setStrokeStyle(3, 0xffcc00);
    const girlPreviewBg = this.add.rectangle(girlX, optionY, 80, 80, 0x333366).setStrokeStyle(3, 0x666688);

    // Actual player sprite previews
    const boySprite = this.add.image(boyX, optionY, 'player-walk', 'walk-down-0').setScale(4);
    const girlSprite = this.add.image(girlX, optionY, 'player-walk-female', 'walk-down-0').setScale(4);

    const boyText = this.add.text(boyX, optionY + 60, 'Boy', {
      ...FONTS.menuItem, fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);
    const girlText = this.add.text(girlX, optionY + 60, 'Girl', {
      ...FONTS.menuItem, fontSize: mobileFontSize(18),
      color: COLORS.textGray,
    }).setOrigin(0.5);

    const updateSelection = () => {
      const isBoy = this.selectedAppearance === 0;
      boyPreviewBg.setStrokeStyle(3, isBoy ? 0xffcc00 : 0x666688);
      girlPreviewBg.setStrokeStyle(3, isBoy ? 0x666688 : 0xffcc00);
      boyText.setColor(isBoy ? COLORS.textHighlight : COLORS.textGray);
      girlText.setColor(isBoy ? COLORS.textGray : COLORS.textHighlight);
      boySprite.setAlpha(isBoy ? 1 : 0.5);
      girlSprite.setAlpha(isBoy ? 0.5 : 1);
    };
    updateSelection();

    // Click handlers
    boyPreviewBg.setInteractive({ useHandCursor: true });
    girlPreviewBg.setInteractive({ useHandCursor: true });
    boySprite.setInteractive({ useHandCursor: true });
    girlSprite.setInteractive({ useHandCursor: true });
    boyPreviewBg.on('pointerdown', () => { this.selectedAppearance = 0; updateSelection(); AudioManager.getInstance().playSFX(SFX.CURSOR); });
    boySprite.on('pointerdown', () => { this.selectedAppearance = 0; updateSelection(); AudioManager.getInstance().playSFX(SFX.CURSOR); });
    girlPreviewBg.on('pointerdown', () => { this.selectedAppearance = 1; updateSelection(); AudioManager.getInstance().playSFX(SFX.CURSOR); });
    girlSprite.on('pointerdown', () => { this.selectedAppearance = 1; updateSelection(); AudioManager.getInstance().playSFX(SFX.CURSOR); });

    // DONE button
    const doneBtn = this.add.text(width / 2, height * 0.78, '[ DONE ]', {
      ...FONTS.menuItem, fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    doneBtn.on('pointerdown', () => this.confirmAppearance());

    // Keyboard
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.selectedAppearance = 0;
      updateSelection();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.selectedAppearance = 1;
      updateSelection();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.confirmAppearance());

    // Hint
    const appearanceHint = isMobile() ? 'Tap to select, then DONE' : 'Use ← → and Enter';
    this.add.text(width / 2, height * 0.88, appearanceHint, {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5);
  }

  private confirmAppearance(): void {
    const gm = GameManager.getInstance();
    gm.setPlayerGender(this.selectedAppearance === 0 ? 'boy' : 'girl');
    AudioManager.getInstance().playSFX(SFX.CONFIRM);

    this.phase = 'confirm';
    this.showConfirmation(this.nameInput);
  }

  private showConfirmation(name: string): void {
    const { width, height } = this.cameras.main;
    const portrait = height > width;

    // Clear naming UI — fade out everything and rebuild
    this.isAnimating = true;

    // Fade all children
    const allChildren = this.children.list.filter(
      c => c !== this.professorSprite
    ) as Phaser.GameObjects.GameObject[];

    this.tweens.add({
      targets: allChildren,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Black bg
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        // Professor
        const profY = portrait ? height * 0.28 : height * 0.35;
        this.professorSprite.setPosition(width / 2, profY).setScale(portrait ? 5 : 6).setAlpha(1);

        // Confirmation text — bottom-anchored in portrait so the multi-line
        // copy never falls below the visible viewport on iOS.
        const confirmY = portrait ? height - 56 : height * 0.68;
        const confirmOriginY = portrait ? 1 : 0;
        const confirmText = this.add.text(width / 2, confirmY, `Right! So your name is ${name}!\n\nYour very own POKéMON legend\nis about to unfold!\n\nA world of dreams and\nadventures with POKéMON\nawaits! Let's go!`, {
          ...FONTS.body,
          fontSize: mobileFontSize(portrait ? 14 : 16),
          color: COLORS.textWhite,
          align: 'center',
          wordWrap: { width: width * 0.86 },
          lineSpacing: 5,
        }).setOrigin(0.5, confirmOriginY).setAlpha(0);

        this.tweens.add({
          targets: confirmText,
          alpha: 1,
          duration: 400,
          onComplete: () => { this.isAnimating = false; },
        });

        // Re-add input handlers
        this.input.keyboard!.removeAllListeners();
        this.input.removeAllListeners();
        this.input.keyboard!.on('keydown-ENTER', () => this.advance());
        this.input.keyboard!.on('keydown-SPACE', () => this.advance());
        this.input.on('pointerdown', () => this.advance());
      },
    });
  }

  private finishIntro(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // White flash transition
    this.cameras.main.flash(500, 255, 255, 255);
    this.cameras.main.fadeOut(800, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('OverworldScene');
    });
  }

  /**
   * BUG-043: Remove the hidden mobile-keyboard `<input>` if it survives a
   * scene restart / unexpected shutdown. confirmName() removes it under
   * normal flow; this is the safety net.
   */
  shutdown(): void {
    if (this.hiddenInput) {
      try {
        this.hiddenInput.blur();
        this.hiddenInput.remove();
      } catch {
        // ignore detach errors
      }
      this.hiddenInput = undefined;
    }
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();
  }
}
