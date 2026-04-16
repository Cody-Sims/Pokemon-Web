import Phaser from 'phaser';

export type EmoteType = 'exclamation' | 'question' | 'heart' | 'sweat' | 'music' | 'zzz';

interface EmoteStyle {
  text: string;
  color: string;
  fontSize: string;
}

const EMOTE_STYLES: Record<EmoteType, EmoteStyle> = {
  exclamation: { text: '!', color: '#ff0000', fontSize: '20px' },
  question:    { text: '?', color: '#0066ff', fontSize: '20px' },
  heart:       { text: '\u2665', color: '#ff0000', fontSize: '18px' },
  sweat:       { text: '~', color: '#0088ff', fontSize: '16px' },
  music:       { text: '\u266a', color: '#00cc00', fontSize: '18px' },
  zzz:         { text: 'Z z z', color: '#888888', fontSize: '14px' },
};

export class EmoteBubble {
  /** Show an emote above a sprite, auto-destroy after duration */
  static show(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite,
    emote: EmoteType,
    duration = 1500,
  ): void {
    const style = EMOTE_STYLES[emote];

    const text = scene.add.text(target.x, target.y - 24, style.text, {
      fontSize: style.fontSize,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: style.color,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(10);
    text.setScale(0);

    // Pop-in
    scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then fade out
        scene.time.delayedCall(duration - 350, () => {
          scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              text.destroy();
            },
          });
        });
      },
    });
  }
}
