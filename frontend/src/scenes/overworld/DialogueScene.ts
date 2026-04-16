import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import { TouchControls } from '@ui/controls/TouchControls';

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
  choices?: { text: string; value: string }[];
  onChoice?: (value: string) => void;
}

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
  private choices?: { text: string; value: string }[];
  private onChoice?: (value: string) => void;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choiceCursor = 0;
  private inChoiceMode = false;
  private choicePanel?: NinePatchPanel;

  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: DialogueData): void {
    this.queue = data.dialogue || ['...'];
    this.currentIndex = 0;
    this.speaker = data.speaker;
    this.choices = data.choices;
    this.onChoice = data.onChoice;
    this.inChoiceMode = false;
    this.choiceTexts = [];
  }

  create(): void {
    const gm = GameManager.getInstance();
    const settings = gm.getSettings?.() ?? {};
    const speedPref = (settings.textSpeed as string) || 'medium';
    this.charDelay = TEXT_SPEEDS[speedPref] ?? TEXT_SPEEDS.medium;

    // Nine-patch dialogue box
    const boxW = GAME_WIDTH - 20;
    const boxH = 100;
    const boxX = GAME_WIDTH / 2;
    const boxY = GAME_HEIGHT - 60;
    this.panel = new NinePatchPanel(this, boxX, boxY, boxW, boxH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.92,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 8,
    });

    // Speaker name panel (if provided)
    if (this.speaker) {
      const speakerW = Math.max(100, this.speaker.length * 10 + 24);
      this.speakerPanel = new NinePatchPanel(this, 70, GAME_HEIGHT - 118, speakerW, 26, {
        fillColor: COLORS.bgCard,
        fillAlpha: 0.95,
        borderColor: COLORS.borderHighlight,
        borderWidth: 1,
        cornerRadius: 4,
      });
      this.speakerText = this.add.text(70, GAME_HEIGHT - 118, this.speaker, {
        ...FONTS.caption, color: COLORS.textHighlight, fontStyle: 'bold', fontSize: '13px',
      }).setOrigin(0.5);
    }

    // Text display
    this.dialogueText = this.add.text(30, GAME_HEIGHT - 100, '', {
      ...FONTS.body,
      fontSize: mobileFontSize(17),
      wordWrap: { width: GAME_WIDTH - 60 },
    });

    // Animated advance indicator (bouncing arrow)
    this.advanceIndicator = this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 22, '▼', {
      fontSize: '14px', color: COLORS.textHighlight,
    }).setOrigin(0.5).setAlpha(0);
    this.indicatorTween = this.tweens.add({
      targets: this.advanceIndicator,
      y: GAME_HEIGHT - 16,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

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
    this.input.on('pointerdown', () => this.handleInput());
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
    this.inChoiceMode = true;
    this.choiceCursor = 0;
    this.advanceIndicator.setAlpha(0);

    const choiceW = 150;
    const choiceH = this.choices.length * 30 + 16;
    const choiceX = GAME_WIDTH - 100;
    const choiceY = GAME_HEIGHT - 120 - choiceH / 2;

    this.choicePanel = new NinePatchPanel(this, choiceX, choiceY, choiceW, choiceH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
    });

    this.choiceTexts = this.choices.map((choice, i) => {
      const t = this.add.text(
        choiceX, choiceY - choiceH / 2 + 16 + i * 30,
        choice.text,
        { ...FONTS.body, fontSize: '16px' },
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.choiceCursor = i; this.updateChoiceCursor(); });
      t.on('pointerdown', () => { this.choiceCursor = i; this.selectChoice(); });
      return t;
    });
    this.updateChoiceCursor();
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
    this.scene.stop();
    this.scene.resume('OverworldScene');
  }
}
