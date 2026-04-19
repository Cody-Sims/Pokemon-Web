import Phaser from 'phaser';
import { mobileFontSize } from '@ui/theme';

export type EmoteType = 'exclamation' | 'question' | 'heart' | 'sweat' | 'music' | 'zzz';

interface EmoteStyle {
  text: string;
  color: string;
  fontSize: string;
}

const EMOTE_STYLES: Record<EmoteType, EmoteStyle> = {
  exclamation: { text: '!', color: '#ff0000', fontSize: mobileFontSize(20) },
  question:    { text: '?', color: '#0066ff', fontSize: mobileFontSize(20) },
  heart:       { text: '\u2665', color: '#ff0000', fontSize: mobileFontSize(18) },
  sweat:       { text: '~', color: '#0088ff', fontSize: mobileFontSize(16) },
  music:       { text: '\u266a', color: '#00cc00', fontSize: mobileFontSize(18) },
  zzz:         { text: 'Z z z', color: '#888888', fontSize: mobileFontSize(14) },
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
