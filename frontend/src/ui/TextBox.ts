import Phaser from 'phaser';

/** Typewriter text display widget. */
export class TextBox {
  private scene: Phaser.Scene;
  private background: Phaser.GameObjects.Rectangle;
  private textObject: Phaser.GameObjects.Text;
  private fullText = '';
  private isTyping = false;
  private typeTimer?: Phaser.Time.TimerEvent;
  private onComplete?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.background = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0.85);
    this.background.setStrokeStyle(2, 0xffffff);
    this.textObject = scene.add.text(x + 12, y + 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: width - 24 },
    });
  }

  /** Display text with typewriter effect. */
  showText(text: string, onComplete?: () => void): void {
    this.fullText = text;
    this.textObject.setText('');
    this.isTyping = true;
    this.onComplete = onComplete;
    let charIndex = 0;

    this.typeTimer = this.scene.time.addEvent({
      delay: 33,
      repeat: text.length - 1,
      callback: () => {
        charIndex++;
        this.textObject.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) {
          this.isTyping = false;
          this.onComplete?.();
        }
      },
    });
  }

  /** Skip to full text immediately. */
  skipToEnd(): void {
    if (!this.isTyping) return;
    this.typeTimer?.destroy();
    this.textObject.setText(this.fullText);
    this.isTyping = false;
    this.onComplete?.();
  }

  getIsTyping(): boolean { return this.isTyping; }

  setVisible(visible: boolean): void {
    this.background.setVisible(visible);
    this.textObject.setVisible(visible);
  }

  setDepth(depth: number): void {
    this.background.setDepth(depth);
    this.textObject.setDepth(depth);
  }

  destroy(): void {
    this.typeTimer?.destroy();
    this.background.destroy();
    this.textObject.destroy();
  }
}
