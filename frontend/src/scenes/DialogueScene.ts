import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';

/** Text speed options: delay (ms) per character. 0 = instant. */
const TEXT_SPEEDS: Record<string, number> = {
  slow: 55,
  medium: 33,
  fast: 16,
  instant: 0,
};

export class DialogueScene extends Phaser.Scene {
  private dialogueText!: Phaser.GameObjects.Text;
  private queue: string[] = [];
  private currentIndex = 0;
  private isTyping = false;
  private fullText = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private charDelay = 33;

  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: { dialogue: string[] }): void {
    this.queue = data.dialogue || ['...'];
    this.currentIndex = 0;
  }

  create(): void {
    // Get text speed preference
    const gm = GameManager.getInstance();
    const speedPref = (gm.getFlag('textSpeed') as unknown as string) || 'medium';
    this.charDelay = TEXT_SPEEDS[speedPref] ?? TEXT_SPEEDS.medium;

    // Dialogue box background
    const boxBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x000000, 0.85);
    boxBg.setStrokeStyle(2, 0xffffff);

    // Text display
    this.dialogueText = this.add.text(30, GAME_HEIGHT - 100, '', {
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: GAME_WIDTH - 60 },
    });

    // Advance indicator
    this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 25, '▼', {
      fontSize: '14px',
      color: '#ffffff',
    });

    // Show first line
    this.showLine(this.queue[this.currentIndex]);

    // Advance on input
    this.input.keyboard!.on('keydown-ENTER', () => this.advance());
    this.input.keyboard!.on('keydown-SPACE', () => this.advance());
    this.input.keyboard!.on('keydown-ESC', () => this.closeDialogue());
  }

  private showLine(text: string): void {
    this.fullText = text;
    this.dialogueText.setText('');

    // Instant mode — no typing animation
    if (this.charDelay === 0) {
      this.dialogueText.setText(text);
      this.isTyping = false;
      return;
    }

    this.isTyping = true;
    let charIndex = 0;

    this.typeTimer = this.time.addEvent({
      delay: this.charDelay,
      repeat: text.length - 1,
      callback: () => {
        charIndex++;
        this.dialogueText.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) {
          this.isTyping = false;
        }
      },
    });
  }

  private advance(): void {
    if (this.isTyping) {
      // Skip to full text
      this.typeTimer?.destroy();
      this.dialogueText.setText(this.fullText);
      this.isTyping = false;
      return;
    }

    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this.showLine(this.queue[this.currentIndex]);
    } else {
      this.closeDialogue();
    }
  }

  private closeDialogue(): void {
    if (this.typeTimer) this.typeTimer.destroy();
    this.scene.stop();
    this.scene.resume('OverworldScene');
  }
}
