import Phaser from 'phaser';
import { AudioManager } from '@managers/AudioManager';
import { showMessageQueue as showMsgQueue } from './BattleMessageQueue';
import { showDamagePopup as showDmgPopup } from './BattleDamageNumbers';
import type { BattleUIScene } from './BattleUIScene';

/**
 * Handles message display, message queuing, damage popups,
 * weather display, low-HP warnings, and confirm-to-continue flow.
 */
export class BattleMessageHandler {
  private scene: BattleUIScene;

  messageText!: Phaser.GameObjects.Text;
  weatherText?: Phaser.GameObjects.Text;
  pendingWaitConfirm?: () => void;

  constructor(scene: BattleUIScene) {
    this.scene = scene;
  }

  /** Set the message bar text. */
  msg(text: string): void {
    this.messageText.setText(text);
  }

  /** Show a queue of messages sequentially with a delay, then run callback. */
  showMessageQueue(messages: string[], idx: number, callback: () => void): void {
    showMsgQueue(this.scene, messages, idx, (text) => this.msg(text), callback);
  }

  /** Show a floating damage number that rises and fades. */
  showDamagePopup(damage: number, isPlayer: boolean, effectiveness: number): void {
    const b = this.scene.battle();
    const sprite = isPlayer ? b.playerSprite : b.enemySprite;
    showDmgPopup(this.scene, sprite, damage, effectiveness);
  }

  /** Update the weather indicator text. */
  updateWeatherDisplay(): void {
    const w = this.scene.weatherManager.getWeather();
    if (!w || !this.weatherText) {
      this.weatherText?.setText('');
      return;
    }
    const icons: Record<string, string> = { sun: '\u2600 Sun', rain: '\ud83c\udf27 Rain', sandstorm: '\ud83c\udf2a Sandstorm', hail: '\u2744 Hail' };
    this.weatherText?.setText(`${icons[w] ?? w} (${this.scene.weatherManager.getTurnsRemaining()})`);
  }

  /** Check if player's Pokemon HP is critically low and toggle the warning beep. */
  checkLowHpWarning(): void {
    const b = this.scene.battle();
    const pct = b.playerPokemon.currentHp / b.playerPokemon.stats.hp;
    const audio = AudioManager.getInstance();
    if (pct > 0 && pct <= 0.2) {
      audio.startLowHpWarning();
    } else {
      audio.stopLowHpWarning();
    }
  }

  /** Wait for a single Enter/Space press or tap then run callback. */
  waitForConfirmThen(callback: () => void): void {
    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      this.pendingWaitConfirm = undefined;
      this.scene.input.keyboard!.off('keydown-ENTER', handler);
      this.scene.input.keyboard!.off('keydown-SPACE', handler);
      this.scene.input.off('pointerdown', handler);
      callback();
    };
    this.pendingWaitConfirm = handler;
    this.scene.input.keyboard!.on('keydown-ENTER', handler);
    this.scene.input.keyboard!.on('keydown-SPACE', handler);
    this.scene.input.on('pointerdown', handler);
  }
}
