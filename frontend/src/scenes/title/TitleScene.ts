import Phaser from 'phaser';
import { SaveManager } from '@managers/SaveManager';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { BGM, SFX } from '@utils/audio-keys';
import { ConfirmBox } from '@ui/widgets/ConfirmBox';
import { MobileTapMenu } from '@ui/controls/MobileTapMenu';
import { DifficultyMode, DIFFICULTY_CONFIGS } from '@data/difficulty';
import { CHALLENGE_CONFIGS, ChallengeMode } from '@data/challenge-modes';
import { layoutOn } from '@utils/layout-on';

export class TitleScene extends Phaser.Scene {
  private cursor!: number;
  private menuItems!: Phaser.GameObjects.Text[];
  private cursorIcon!: Phaser.GameObjects.Text;
  private mobileTap?: MobileTapMenu;

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

    // ── Floating silhouettes ──
    // BUG-061: The previous decorative glyphs '◆', '●', '▲' were rendered
    // with the system font and fell back to "tofu" boxes on Windows builds
    // missing those code points. Use procedural shapes (graphics.fillCircle
    // + fillTriangle) so the decoration is glyph-free.
    const silhouetteShapes: Array<'diamond' | 'circle' | 'triangle'> = [
      'diamond', 'circle', 'triangle', 'diamond', 'circle',
    ];
    silhouetteShapes.forEach((shape) => {
      const sx = Phaser.Math.Between(50, width - 50);
      const sy = Phaser.Math.Between(height * 0.1, height * 0.9);
      const size = Phaser.Math.Between(20, 40);
      const sil = this.add.graphics().setAlpha(0.06);
      sil.fillStyle(0xffffff, 1);
      const half = size / 2;
      if (shape === 'circle') {
        sil.fillCircle(0, 0, half);
      } else if (shape === 'diamond') {
        sil.fillTriangle(0, -half, half, 0, 0, half);
        sil.fillTriangle(0, -half, -half, 0, 0, half);
      } else {
        sil.fillTriangle(0, -half, half, half, -half, half);
      }
      sil.setPosition(sx, sy);

      this.tweens.add({
        targets: sil,
        x: sx + Phaser.Math.Between(-100, 100),
        y: sy + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(6000, 12000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Decorative band — single soft rule (BUG-068: the previous five 2-px
    // rectangles offset by 4 px stacked into a 10-px-tall fuzzy smudge).
    this.add.rectangle(width / 2, height * 0.18, width * 0.6, 2, COLORS.borderHighlight, 0.45);

    // Title
    this.add.text(width / 2, height * 0.28, 'POKEMON', {
      ...FONTS.title, fontSize: mobileFontSize(52),
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.38, 'W  E  B', {
      ...FONTS.title, fontSize: mobileFontSize(28), color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Decorative divider
    this.add.rectangle(width / 2, height * 0.44, 200, 2, COLORS.borderHighlight, 0.5);

    // Menu options
    const options = ['New Game'];
    if (SaveManager.getInstance().hasSave()) {
      options.unshift('Continue');
      options.push('Delete Save');
    }
    // Show Hall of Fame if save data has entries (NEW-010: check saved data, not stale GM)
    const gm = GameManager.getInstance();
    const sm = SaveManager.getInstance();
    const savedHoF = sm.hasSave() ? gm.getHallOfFame().length > 0 : false;
    if (savedHoF) {
      options.push('Hall of Fame');
    }
    options.push('Options');

    this.cursor = 0;
    const menuStartY = height * 0.54;
    const menuSpacing = Math.round(44 * MOBILE_SCALE);
    const menuFontSize = mobileFontSize(22);
    this.menuItems = options.map((label, i) => {
      const item = this.add.text(width / 2 + 16, menuStartY + i * menuSpacing, label, {
        ...FONTS.menuItem, fontSize: menuFontSize,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Ensure minimum touch target height
      item.setPadding(8, 6, 8, 6);
      item.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      return item;
    });

    // Cursor arrow
    this.cursorIcon = this.add.text(0, 0, '▸', { ...FONTS.menuItem, fontSize: menuFontSize, color: COLORS.textHighlight });

    // Version
    this.add.text(width / 2, height - 20, 'v1.0', {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5);

    this.updateCursor();

    // Initially hide menu — reveal on "Press Start" dismissal
    this.menuItems.forEach(item => { item.setAlpha(0); item.disableInteractive(); });
    this.cursorIcon.setAlpha(0);

    // ── "Press Start" prompt (shown before menu) ──
    const pressStart = this.add.text(width / 2, height * 0.58, 'PRESS START', {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: pressStart,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const revealMenu = () => {
      // Remove press-start listeners
      this.input.keyboard!.off('keydown-ENTER', revealMenu);
      this.input.keyboard!.off('keydown-SPACE', revealMenu);
      this.input.off('pointerdown', revealMenu);

      // Fade out press start
      this.tweens.add({ targets: pressStart, alpha: 0, duration: 200, onComplete: () => pressStart.destroy() });

      // Show menu items immediately and enable interaction — no fade delay
      // that could cause touch taps to be ignored during the transition.
      this.menuItems.forEach(item => {
        item.setAlpha(1);
        item.setInteractive({ useHandCursor: true });
      });
      this.cursorIcon.setAlpha(1);

      // Bind menu navigation (keyboard)
      this.bindMenuKeys();

      // ── Scene-level tap handler for menu items ──
      // Register after a frame delay so the tap that dismissed "Press Start"
      // does not immediately select a menu item on mobile.
      this.mobileTap = new MobileTapMenu(this, this.menuItems, (idx) => {
        this.cursor = idx;
        this.updateCursor();
        this.selectOption();
      });

      AudioManager.getInstance().playSFX(SFX.CONFIRM);
    };

    this.input.keyboard!.on('keydown-ENTER', revealMenu);
    this.input.keyboard!.on('keydown-SPACE', revealMenu);
    this.input.on('pointerdown', revealMenu);
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
        // Route through loadAndApply() so the flat save format from
        // gm.serialize() is deserialized correctly AND achievements
        // are restored. Passing the raw save into OverworldScene.init
        // used to crash in loadFromSave (expects nested player.party
        // shape that has not been written since the v1→v2 migration).
        // The `resume: true` flag tells OverworldScene to spawn the
        // player at the saved position instead of the map default.
        if (SaveManager.getInstance().loadAndApply()) {
          this.scene.start('OverworldScene', { resume: true });
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
      case 'Hall of Fame':
        this.scene.sleep();
        this.scene.launch('HallOfFameScene');
        this.scene.get('HallOfFameScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
    }
  }

  private bindMenuKeys(): void {
    const audio = AudioManager.getInstance();
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
    this.input.keyboard!.on('keydown-ENTER', () => { this.selectOption(); });
    this.input.keyboard!.on('keydown-SPACE', () => { this.selectOption(); });
  }

  private rebindTitleKeys(): void {
    this.bindMenuKeys();
  }

  private showDifficultySelect(): void {
    const { width, height } = this.cameras.main;
    const modes: DifficultyMode[] = ['classic', 'hard', 'nuzlocke'];

    // Disable title menu interaction
    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners(); // Remove title menu tap handler
    this.mobileTap?.destroy();
    this.menuItems.forEach(item => item.disableInteractive());
    this.cursorIcon.setVisible(false);

    // Opaque background to cover title screen
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, COLORS.bgDark).setDepth(50);

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'SELECT DIFFICULTY', {
      ...FONTS.heading, fontSize: mobileFontSize(24),
    }).setOrigin(0.5).setDepth(51);

    // Difficulty options
    let diffCursor = 0;
    const diffItems = modes.map((mode, i) => {
      const cfg = DIFFICULTY_CONFIGS[mode];
      const label = this.add.text(width / 2, height * 0.38 + i * 60, cfg.name, {
        ...FONTS.menuItem, fontSize: mobileFontSize(20),
      }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

      label.on('pointerover', () => { diffCursor = i; updateDiff(); });
      return label;
    });

    const desc = this.add.text(width / 2, height * 0.75, DIFFICULTY_CONFIGS[modes[0]].description, {
      ...FONTS.caption, fontSize: mobileFontSize(14), color: COLORS.textDim, wordWrap: { width: 400 },
    }).setOrigin(0.5).setDepth(51);

    const diffArrow = this.add.text(0, 0, '▸', {
      ...FONTS.menuItem, fontSize: mobileFontSize(20), color: COLORS.textHighlight,
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
      cleanup();
      this.showChallengeSelect(modes[diffCursor]);
    };

    const cancelDiff = () => {
      restoreTitle();
    };

    // ── Mobile-friendly: scene-level tap for difficulty items ──
    // Register after a frame delay so the tap that selected "New Game"
    // does not immediately select a difficulty on mobile.
    const diffTap = new MobileTapMenu(this, diffItems, (idx) => {
      diffCursor = idx;
      updateDiff();
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
      confirmDiff();
    }, 60, 0);

    const cleanup = () => {
      diffTap.destroy();
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

    const restoreTitle = () => {
      cleanup();
      this.menuItems.forEach(item => item.setInteractive({ useHandCursor: true }));
      this.cursorIcon.setVisible(true);
      this.rebindTitleKeys();
      this.mobileTap?.reattach();
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

  /**
   * Optional challenge-mode multi-select shown after difficulty selection.
   * Players toggle any combination of monotype / soloRun / noItems /
   * minimalCatches with SPACE (or tap), then press ENTER to begin.
   */
  private showChallengeSelect(difficulty: DifficultyMode): void {
    const modes: ChallengeMode[] = ['monotype', 'soloRun', 'noItems', 'minimalCatches'];
    const enabled = new Set<ChallengeMode>();
    let cursor = 0;

    // Initial dimensions; relayout() recomputes everything on rotation.
    let { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, COLORS.bgDark).setDepth(50);
    const title = this.add.text(0, 0, 'CHALLENGE MODES', {
      ...FONTS.heading, fontSize: mobileFontSize(22),
    }).setOrigin(0.5).setDepth(51);
    // Hint string is long; let it wrap (and shrink to two lines on very
    // narrow portrait viewports) instead of clipping at both ends.
    const hint = this.add.text(0, 0, 'Optional. Toggle with SPACE / tap. ENTER to begin.', {
      ...FONTS.caption, fontSize: mobileFontSize(11), color: COLORS.textDim, align: 'center',
    }).setOrigin(0.5).setDepth(51);

    const items = modes.map((mode, i) => {
      const cfg = CHALLENGE_CONFIGS[mode];
      const label = this.add.text(0, 0, `[ ] ${cfg.name}`, {
        ...FONTS.menuItem, fontSize: mobileFontSize(18),
      }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
      label.on('pointerover', () => { cursor = i; updateUI(); });
      label.setData('index', i);
      return label;
    });

    const desc = this.add.text(0, 0, CHALLENGE_CONFIGS[modes[0]].description, {
      ...FONTS.caption, fontSize: mobileFontSize(13), color: COLORS.textDim, align: 'center',
    }).setOrigin(0.5).setDepth(51);

    const beginBtn = this.add.text(0, 0, '▶ BEGIN', {
      ...FONTS.menuItem, fontSize: mobileFontSize(18), color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    const arrow = this.add.text(0, 0, '▸', {
      ...FONTS.menuItem, fontSize: mobileFontSize(18), color: COLORS.textHighlight,
    }).setDepth(51);

    const updateUI = () => {
      items.forEach((item, i) => {
        const mark = enabled.has(modes[i]) ? '[X]' : '[ ]';
        item.setText(`${mark} ${CHALLENGE_CONFIGS[modes[i]].name}`);
        item.setColor(i === cursor ? COLORS.textHighlight : COLORS.textWhite);
      });
      const sel = items[cursor];
      arrow.setPosition(sel.x - sel.width / 2 - 22, sel.y - 10);
      desc.setText(CHALLENGE_CONFIGS[modes[cursor]].description);
    };

    const relayout = () => {
      const cam = this.cameras.main;
      width = cam.width;
      height = cam.height;
      const isPortrait = height > width;
      // Wrap widths sized to the viewport so text never spills past the
      // canvas edge. Cap at 480 px for ultra-wide desktop monitors.
      const wrapW = Math.min(480, width - 32);

      overlay.setPosition(width / 2, height / 2).setSize(width, height);

      title.setPosition(width / 2, height * (isPortrait ? 0.12 : 0.16));

      hint.setPosition(width / 2, height * (isPortrait ? 0.20 : 0.24));
      hint.setStyle({ wordWrap: { width: wrapW } });

      // Items: stack vertically, but in landscape pull them tighter so
      // the description + begin button stay visible without overlap.
      const itemTop = height * (isPortrait ? 0.32 : 0.36);
      const itemSpacing = isPortrait ? Math.min(40, (height * 0.32) / modes.length) : 36;
      items.forEach((item, i) => {
        item.setPosition(width / 2, itemTop + i * itemSpacing);
      });

      // Description sits above the BEGIN button; both are pulled in from the
      // bottom edge so the button is never clipped by the device safe-area
      // (B1).
      desc.setPosition(width / 2, height * (isPortrait ? 0.72 : 0.80));
      desc.setStyle({ wordWrap: { width: wrapW } });

      beginBtn.setPosition(width / 2, height * (isPortrait ? 0.84 : 0.90));

      updateUI();
    };
    layoutOn(this, relayout);

    const toggle = () => {
      const m = modes[cursor];
      if (enabled.has(m)) enabled.delete(m); else enabled.add(m);
      AudioManager.getInstance().playSFX(SFX.CURSOR);
      updateUI();
    };

    items.forEach((item, i) => item.on('pointerdown', () => { cursor = i; toggle(); }));

    const cleanup = () => {
      this.input.keyboard!.off('keydown-UP', onUp);
      this.input.keyboard!.off('keydown-DOWN', onDown);
      this.input.keyboard!.off('keydown-SPACE', toggle);
      this.input.keyboard!.off('keydown-ENTER', onEnter);
      this.input.keyboard!.off('keydown-ESC', onEsc);
      overlay.destroy(); title.destroy(); hint.destroy(); desc.destroy();
      arrow.destroy(); beginBtn.destroy();
      items.forEach(i => i.destroy());
    };

    const begin = () => {
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
      cleanup();
      this.scene.start('IntroScene', { difficulty, challengeModes: Array.from(enabled) });
    };
    beginBtn.on('pointerdown', begin);

    const onUp = () => { cursor = (cursor - 1 + modes.length) % modes.length; AudioManager.getInstance().playSFX(SFX.CURSOR); updateUI(); };
    const onDown = () => { cursor = (cursor + 1) % modes.length; AudioManager.getInstance().playSFX(SFX.CURSOR); updateUI(); };
    const onEnter = () => begin();
    const onEsc = () => { AudioManager.getInstance().playSFX(SFX.CANCEL); cleanup(); this.scene.start('IntroScene', { difficulty, challengeModes: [] }); };

    this.input.keyboard!.on('keydown-UP', onUp);
    this.input.keyboard!.on('keydown-DOWN', onDown);
    this.input.keyboard!.on('keydown-SPACE', toggle);
    this.input.keyboard!.on('keydown-ENTER', onEnter);
    this.input.keyboard!.on('keydown-ESC', onEsc);
  }
}
