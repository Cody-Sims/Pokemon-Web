import Phaser from 'phaser';

/** Singleton that wraps Phaser SoundManager for BGM crossfade and SFX. */
export class AudioManager {
  private static instance: AudioManager;
  private scene?: Phaser.Scene;
  private currentBGM?: Phaser.Sound.BaseSound;
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Must be called once a scene is active to bind the sound manager. */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playBGM(key: string): void {
    if (!this.scene) return;

    if (this.currentBGM) {
      // Crossfade: fade out old, start new
      this.scene.tweens.add({
        targets: this.currentBGM,
        volume: 0,
        duration: 500,
        onComplete: () => {
          this.currentBGM?.stop();
          this.currentBGM?.destroy();
          this.startBGM(key);
        },
      });
    } else {
      this.startBGM(key);
    }
  }

  private startBGM(key: string): void {
    if (!this.scene) return;
    this.currentBGM = this.scene.sound.add(key, { loop: true, volume: 0 });
    this.currentBGM.play();
    this.scene.tweens.add({
      targets: this.currentBGM,
      volume: this.bgmVolume,
      duration: 500,
    });
  }

  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.destroy();
      this.currentBGM = undefined;
    }
  }

  playSFX(key: string): void {
    if (!this.scene) return;
    this.scene.sound.play(key, { volume: this.sfxVolume });
  }

  setBGMVolume(vol: number): void { this.bgmVolume = vol; }
  setSFXVolume(vol: number): void { this.sfxVolume = vol; }
}
