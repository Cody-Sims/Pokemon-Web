import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { COLORS, FONTS, mobileFontSize, isMobile, MIN_TOUCH_TARGET } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import { TouchControls } from '@ui/controls/TouchControls';
import { MobileTapMenu } from '@ui/controls/MobileTapMenu';

/** Text speed options: delay (ms) per character. 0 = instant. */
const TEXT_SPEEDS: Record<string, number> = {
  slow: 55,
  medium: 33,
  fast: 16,
  instant: 0,
};

export interface DialogueData {
  dialogue: string[];
  speaker?: string;
  /** Phaser texture key for a portrait sprite shown inside the dialog box. */
  portraitKey?: string;
  choices?: { text: string; value: string }[];
  onChoice?: (value: string) => void;
  callingScene?: string;
}

/** Base depth for all dialogue UI elements — high enough to overlay everything. */
const DIALOGUE_DEPTH = 1000;

export class DialogueScene extends Phaser.Scene {
  private dialogueText!: Phaser.GameObjects.Text;
  private speakerText?: Phaser.GameObjects.Text;
  private speakerPanel?: NinePatchPanel;
  private queue: string[] = [];
  private currentIndex = 0;
  private isTyping = false;
  private fullText = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private charDelay = 33;
  private advanceIndicator!: Phaser.GameObjects.Text;
  private indicatorTween?: Phaser.Tweens.Tween;
  private panel!: NinePatchPanel;
  private speaker?: string;
  private portraitKey?: string;
  private portrait?: Phaser.GameObjects.Sprite;
  private portraitBg?: NinePatchPanel;
  private choices?: { text: string; value: string }[];
  private onChoice?: (value: string) => void;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choiceCursor = 0;
  private inChoiceMode = false;
  private choicePanel?: NinePatchPanel;
  private mobileTapMenu?: MobileTapMenu;
  private lastChoiceMoveTick = 0;
  private callingScene = 'OverworldScene';

  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: DialogueData): void {
    this.queue = data.dialogue || ['...'];
    this.currentIndex = 0;
    this.speaker = data.speaker;
    this.portraitKey = data.portraitKey;
    this.choices = data.choices;
    this.onChoice = data.onChoice;
    this.callingScene = data.callingScene ?? 'OverworldScene';
    this.inChoiceMode = false;
    this.choiceTexts = [];

    // Clear stale UI references from previous scene runs to prevent
    // speaker/portrait elements leaking into system dialogues.
    this.portrait = undefined;
    this.portraitBg = undefined;
    this.speakerPanel = undefined;
    this.speakerText = undefined;
  }

  create(): void {
    const gm = GameManager.getInstance();
    const settings = gm.getSettings?.() ?? {};
    const speedPref = (settings.textSpeed as string) || 'medium';
    this.charDelay = TEXT_SPEEDS[speedPref] ?? TEXT_SPEEDS.medium;

    const layout = ui(this);

    // Hide desktop keyboard hints so they don't overlap the dialogue box
    const hintsEl = document.getElementById('desktop-hints');
    if (hintsEl) hintsEl.style.display = 'none';

    // Hide HUD overlays (minimap, quest tracker, party quick-view) so they
    // don't render on top of the dialogue box. Each scene is registered
    // after DialogueScene in game-config so it draws above by default.
    this.hideHudOverlays();

    // ── Determine portrait dimensions ─────────────────────────
    const hasPortrait = !!this.portraitKey && this.textures.exists(this.portraitKey);
    const portraitSize = 48;
    const portraitPad = hasPortrait ? portraitSize + 20 : 0;

    // ── Nine-patch dialogue box ───────────────────────────────
    const isPortraitOrientation = layout.h > layout.w;
    // Portrait viewports use a much narrower line width which means more
    // wraps per dialogue, so the box needs to be taller or the text gets
    // visually clipped at the bottom edge.
    const boxW = layout.w - 20;
    const boxH = isPortraitOrientation ? 130 : 100;
    const boxX = layout.cx;
    const boxY = isPortraitOrientation ? layout.h - 180 : layout.h - 80;
    this.panel = new NinePatchPanel(this, boxX, boxY, boxW, boxH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.98,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 8,
    });
    this.panel.setDepth(DIALOGUE_DEPTH);

    // ── Portrait (optional) ───────────────────────────────────
    if (hasPortrait) {
      const pX = boxX - boxW / 2 + 12 + portraitSize / 2;
      const pY = boxY;
      this.portraitBg = new NinePatchPanel(this, pX, pY, portraitSize + 8, portraitSize + 8, {
        fillColor: 0x181830,
        fillAlpha: 0.95,
        borderColor: COLORS.borderHighlight,
        borderWidth: 1,
        cornerRadius: 4,
      });
      this.portraitBg.setDepth(DIALOGUE_DEPTH + 1);
      this.portrait = this.add.sprite(pX, pY, this.portraitKey!, 'walk-down-0')
        .setDisplaySize(portraitSize, portraitSize)
        .setDepth(DIALOGUE_DEPTH + 2);
    }

    // ── Speaker name panel ────────────────────────────────────
    if (this.speaker) {
      const speakerW = Math.max(100, this.speaker.length * 10 + 24);
      const speakerX = 20 + speakerW / 2;
      const speakerY = boxY - boxH / 2 - 16;
      this.speakerPanel = new NinePatchPanel(this, speakerX, speakerY, speakerW, 26, {
        fillColor: COLORS.bgCard,
        fillAlpha: 0.95,
        borderColor: COLORS.borderHighlight,
        borderWidth: 1,
        cornerRadius: 4,
      });
      this.speakerPanel.setDepth(DIALOGUE_DEPTH + 1);
      this.speakerText = this.add.text(speakerX, speakerY, this.speaker, {
        ...FONTS.caption, color: COLORS.textHighlight, fontStyle: 'bold', fontSize: mobileFontSize(13),
      }).setOrigin(0.5).setDepth(DIALOGUE_DEPTH + 2);
    }

    // ── Text display ──────────────────────────────────────────
    const baseFontPx = isPortraitOrientation ? 14 : (layout.w < 900 ? 15 : layout.w > 1200 ? 19 : 17);
    const textX = 30 + portraitPad;
    this.dialogueText = this.add.text(textX, boxY - boxH / 2 + 10, '', {
      ...FONTS.body,
      color: '#ffffff',
      fontSize: mobileFontSize(baseFontPx),
      wordWrap: { width: layout.w - 60 - portraitPad },
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
    }).setDepth(DIALOGUE_DEPTH + 2);

    // ── Advance indicator ─────────────────────────────────────
    this.advanceIndicator = this.add.text(layout.w - 40, boxY + boxH / 2 + 12, '▼', {
      fontSize: mobileFontSize(14), color: COLORS.textHighlight,
    }).setOrigin(0.5).setAlpha(0).setDepth(DIALOGUE_DEPTH + 2);
    this.indicatorTween = this.tweens.add({
      targets: this.advanceIndicator,
      y: boxY + boxH / 2 + 18,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Fade-in animation ──────────────────────────────────────
    const fadeTargets: Phaser.GameObjects.GameObject[] = [
      this.panel.getGraphics(),
      this.dialogueText,
      this.advanceIndicator,
    ];
    if (this.speakerPanel) fadeTargets.push(this.speakerPanel.getGraphics());
    if (this.speakerText) fadeTargets.push(this.speakerText);
    if (this.portraitBg) fadeTargets.push(this.portraitBg.getGraphics());
    if (this.portrait) fadeTargets.push(this.portrait);

    // Start invisible, fade in
    for (const obj of fadeTargets) {
      (obj as unknown as { alpha: number }).alpha = 0;
    }
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.tweens.add({
      targets: fadeTargets,
      alpha: 1,
      duration: 180,
      ease: 'Sine.easeOut',
    });

    // ── Re-layout on resize / orientation change ──────────────
    layoutOn(this, () => {
      const l = ui(this);
      const rIsPortrait = l.h > l.w;
      const rBoxH = rIsPortrait ? 130 : 100;
      const rBoxY = rIsPortrait ? l.h - 180 : l.h - 80;
      this.panel.destroy();
      this.panel = new NinePatchPanel(this, l.cx, rBoxY, l.w - 20, rBoxH, {
        fillColor: 0x0a0a18, fillAlpha: 0.98, borderColor: COLORS.borderLight, borderWidth: 2, cornerRadius: 8,
      });
      this.panel.setDepth(DIALOGUE_DEPTH);
      this.dialogueText.setPosition(30 + portraitPad, rBoxY - rBoxH / 2 + 10);
      this.dialogueText.setWordWrapWidth(l.w - 60 - portraitPad);
      this.advanceIndicator.setPosition(l.w - 40, rBoxY + rBoxH / 2 + 12);
      if (this.portrait) {
        const pX = l.cx - (l.w - 20) / 2 + 12 + portraitSize / 2;
        this.portrait.setPosition(pX, rBoxY);
        if (this.portraitBg) {
          this.portraitBg.destroy();
          this.portraitBg = new NinePatchPanel(this, pX, rBoxY, portraitSize + 8, portraitSize + 8, {
            fillColor: 0x181830, fillAlpha: 0.95, borderColor: COLORS.borderHighlight, borderWidth: 1, cornerRadius: 4,
          });
          this.portraitBg.setDepth(DIALOGUE_DEPTH + 1);
        }
      }
      if (this.speakerText) {
        const sw = Math.max(100, (this.speaker?.length ?? 0) * 10 + 24);
        const sx = 20 + sw / 2;
        const sy = rBoxY - rBoxH / 2 - 16;
        this.speakerText.setPosition(sx, sy);
      }
      if (this.speakerPanel) {
        this.speakerPanel.destroy();
        const sw = Math.max(100, (this.speaker?.length ?? 0) * 10 + 24);
        const sx = 20 + sw / 2;
        const sy = rBoxY - rBoxH / 2 - 16;
        this.speakerPanel = new NinePatchPanel(this, sx, sy, sw, 26, {
          fillColor: COLORS.bgCard, fillAlpha: 0.95, borderColor: COLORS.borderHighlight, borderWidth: 1, cornerRadius: 4,
        });
        this.speakerPanel.setDepth(DIALOGUE_DEPTH + 1);
      }
    });

    // Register shutdown handler so cleanup runs when the scene stops.
    // Phaser does not auto-bind shutdown() like init/create/update.
    this.events.once('shutdown', this.shutdown, this);

    this.showLine(this.queue[this.currentIndex]);

    // Input — keyboard
    this.input.keyboard!.on('keydown-ENTER', () => this.handleInput());
    this.input.keyboard!.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard!.on('keydown-Z', () => this.handleInput());
    this.input.keyboard!.on('keydown-ESC', () => {
      if (!this.inChoiceMode) this.closeDialogue();
    });
    this.input.keyboard!.on('keydown-UP', () => {
      if (this.inChoiceMode) this.moveChoice(-1);
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      if (this.inChoiceMode) this.moveChoice(1);
    });

    // Input — tap to advance on touch devices
    // Skip when in choice mode — per-item handlers on choice texts handle taps directly.
    this.input.on('pointerdown', () => {
      if (!this.inChoiceMode) this.handleInput();
    });
  }

  /** Poll touch A button each frame (raw DOM events bypass Phaser scenes). */
  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeConfirm()) {
      this.handleInput();
    }
    if (tc?.consumeCancel()) {
      if (!this.inChoiceMode) this.closeDialogue();
    }
    if (this.inChoiceMode && tc) {
      const dir = tc.getDirection();
      const now = this.time.now;
      if ((dir === 'up' || dir === 'down') && now - this.lastChoiceMoveTick > 200) {
        this.lastChoiceMoveTick = now;
        this.moveChoice(dir === 'up' ? -1 : 1);
      }
    }
  }

  private handleInput(): void {
    if (this.inChoiceMode) {
      this.selectChoice();
      return;
    }
    this.advance();
  }

  private showLine(text: string): void {
    this.fullText = text;
    this.dialogueText.setText('');
    this.advanceIndicator.setAlpha(0);

    if (this.charDelay === 0) {
      this.dialogueText.setText(text);
      this.isTyping = false;
      this.advanceIndicator.setAlpha(1);
      return;
    }

    this.isTyping = true;
    let charIndex = 0;
    const audio = AudioManager.getInstance();

    this.typeTimer = this.time.addEvent({
      delay: this.charDelay,
      repeat: text.length - 1,
      callback: () => {
        charIndex++;
        this.dialogueText.setText(text.substring(0, charIndex));
        // Per-character blip SFX (every 2 chars to avoid spam)
        if (charIndex % 2 === 0) {
          audio.playSFX(SFX.CURSOR);
        }
        if (charIndex >= text.length) {
          this.isTyping = false;
          this.advanceIndicator.setAlpha(1);
        }
      },
    });
  }

  private advance(): void {
    if (this.isTyping) {
      this.typeTimer?.destroy();
      this.dialogueText.setText(this.fullText);
      this.isTyping = false;
      this.advanceIndicator.setAlpha(1);
      return;
    }

    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this.showLine(this.queue[this.currentIndex]);
    } else if (this.choices && this.choices.length > 0 && !this.inChoiceMode) {
      this.showChoices();
    } else {
      this.closeDialogue();
    }
  }

  private showChoices(): void {
    if (!this.choices) return;
    const layout = ui(this);
    this.inChoiceMode = true;
    this.choiceCursor = 0;
    this.advanceIndicator.setAlpha(0);

    const choiceRowH = isMobile() ? Math.max(MIN_TOUCH_TARGET, 30) : 30;
    const choiceW = isMobile() ? 180 : 150;
    const choiceH = this.choices.length * choiceRowH + 16;
    const choiceX = layout.w - 100;
    const isChoicePortrait = layout.h > layout.w;
    const choiceY = (isChoicePortrait ? layout.h - 200 : layout.h - 140) - choiceH / 2;

    this.choicePanel = new NinePatchPanel(this, choiceX, choiceY, choiceW, choiceH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
    });
    this.choicePanel.setDepth(DIALOGUE_DEPTH + 3);

    this.choiceTexts = this.choices.map((choice, i) => {
      const t = this.add.text(
        choiceX, choiceY - choiceH / 2 + 16 + i * choiceRowH,
        choice.text,
        { ...FONTS.body, fontSize: mobileFontSize(16) },
      ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DIALOGUE_DEPTH + 4);
      t.setPadding(8, Math.max(0, (choiceRowH - 16) / 2), 8, Math.max(0, (choiceRowH - 16) / 2));
      t.on('pointerover', () => { this.choiceCursor = i; this.updateChoiceCursor(); });
      t.on('pointerdown', () => { this.choiceCursor = i; this.selectChoice(); });
      return t;
    });
    this.updateChoiceCursor();

    if (isMobile()) {
      this.mobileTapMenu = new MobileTapMenu(this, this.choiceTexts, (index: number) => {
        this.choiceCursor = index;
        this.selectChoice();
      });
    }
  }

  private moveChoice(dir: number): void {
    if (!this.choices) return;
    this.choiceCursor = (this.choiceCursor + dir + this.choices.length) % this.choices.length;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.updateChoiceCursor();
  }

  private updateChoiceCursor(): void {
    this.choiceTexts.forEach((t, i) => {
      t.setColor(i === this.choiceCursor ? COLORS.textHighlight : COLORS.textWhite);
      const base = t.text.replace(/^▶ /, '');
      t.setText(i === this.choiceCursor ? `▶ ${base}` : base);
    });
  }

  private selectChoice(): void {
    if (!this.choices) return;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const value = this.choices[this.choiceCursor].value;
    this.onChoice?.(value);
    this.cleanupChoices();
    this.closeDialogue();
  }

  private cleanupChoices(): void {
    this.mobileTapMenu?.destroy();
    this.mobileTapMenu = undefined;
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.choicePanel?.destroy();
    this.choicePanel = undefined;
    this.inChoiceMode = false;
  }

  private closeDialogue(): void {
    this.typeTimer?.destroy();
    this.indicatorTween?.destroy();
    this.cleanupChoices();

    // Fade-out animation before stopping the scene
    const fadeTargets: Phaser.GameObjects.GameObject[] = [
      this.panel.getGraphics(),
      this.dialogueText,
      this.advanceIndicator,
    ];
    if (this.speakerPanel) fadeTargets.push(this.speakerPanel.getGraphics());
    if (this.speakerText) fadeTargets.push(this.speakerText);
    if (this.portraitBg) fadeTargets.push(this.portraitBg.getGraphics());
    if (this.portrait) fadeTargets.push(this.portrait);

    // Disable input during exit animation
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();

    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.tweens.add({
      targets: fadeTargets,
      alpha: 0,
      duration: 120,
      ease: 'Sine.easeIn',
      onComplete: () => {
        const hintsEl = document.getElementById('desktop-hints');
        if (hintsEl) hintsEl.style.display = '';
        this.scene.stop();
        this.scene.resume(this.callingScene);
      },
    });
  }

  shutdown(): void {
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();
    this.typeTimer?.destroy();
    this.indicatorTween?.destroy();
    this.portrait?.destroy();
    this.portrait = undefined;
    this.portraitBg?.destroy();
    this.portraitBg = undefined;
    this.speakerPanel?.destroy();
    this.speakerPanel = undefined;
    this.speakerText?.destroy();
    this.speakerText = undefined;
    // Ensure hints are restored if scene is stopped externally
    const hintsEl = document.getElementById('desktop-hints');
    if (hintsEl) hintsEl.style.display = '';
    // Restore HUD overlays that were hidden while the dialogue was open.
    this.showHudOverlays();
  }

  /**
   * HUD overlay scenes (Minimap, QuestTracker, PartyQuickView) are launched
   * alongside the OverworldScene and render above DialogueScene because they
   * are registered later in game-config. Sleep them so the dialogue panel
   * (and the minimap-overlapping speaker name / portrait) are not occluded.
   */
  private readonly hudOverlayKeys = [
    'MinimapScene',
    'QuestTrackerScene',
    'PartyQuickViewScene',
  ];

  private hideHudOverlays(): void {
    for (const key of this.hudOverlayKeys) {
      if (this.scene.isActive(key)) {
        this.scene.sleep(key);
      }
    }
  }

  private showHudOverlays(): void {
    for (const key of this.hudOverlayKeys) {
      if (this.scene.isSleeping(key)) {
        this.scene.wake(key);
      }
    }
  }
}
