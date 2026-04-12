import Phaser from 'phaser';

/** Singleton that wraps Phaser SoundManager for BGM crossfade and SFX.
 *  Handles browser autoplay policies gracefully. */
export class AudioManager {
  private static instance: AudioManager;
  private scene?: Phaser.Scene;
  private currentBGM?: Phaser.Sound.BaseSound;
  private currentBGMKey = '';
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;
  private muted = false;
  private unlocked = false;
  private pendingBGM?: string;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Bind to the active scene's sound manager. Call when entering a new scene. */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
    this.handleAutoplayPolicy();
  }

  /** Handle browser autoplay restrictions — music starts after first user input. */
  private handleAutoplayPolicy(): void {
    if (!this.scene || this.unlocked) return;

    if (this.scene.sound.locked) {
      this.scene.sound.once('unlocked', () => {
        this.unlocked = true;
        if (this.pendingBGM) {
          this.playBGM(this.pendingBGM);
          this.pendingBGM = undefined;
        }
      });
    } else {
      this.unlocked = true;
    }
  }

  /** Check if an audio key is loaded in the cache. */
  private hasAudio(key: string): boolean {
    if (!this.scene) return false;
    return this.scene.cache.audio.exists(key);
  }

  /** Play background music with crossfade. Skips if same track is already playing. */
  playBGM(key: string): void {
    if (!this.scene || this.muted) return;

    // Already playing this track
    if (this.currentBGMKey === key && this.currentBGM) return;

    // Audio not unlocked yet — queue it
    if (!this.unlocked) {
      this.pendingBGM = key;
      return;
    }

    if (!this.hasAudio(key)) return;

    if (this.currentBGM) {
      const oldBGM = this.currentBGM;
      this.currentBGMKey = key;
      this.scene.tweens.add({
        targets: oldBGM,
        volume: 0,
        duration: 500,
        onComplete: () => {
          oldBGM.stop();
          oldBGM.destroy();
          this.startBGM(key);
        },
      });
    } else {
      this.currentBGMKey = key;
      this.startBGM(key);
    }
  }

  private startBGM(key: string): void {
    if (!this.scene || !this.hasAudio(key)) return;
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
      this.currentBGMKey = '';
    }
  }

  /** Fade out BGM over duration, then stop. */
  fadeOutBGM(duration = 500): void {
    if (!this.scene || !this.currentBGM) return;
    const bgm = this.currentBGM;
    this.scene.tweens.add({
      targets: bgm,
      volume: 0,
      duration,
      onComplete: () => {
        bgm.stop();
        bgm.destroy();
        if (this.currentBGM === bgm) {
          this.currentBGM = undefined;
          this.currentBGMKey = '';
        }
      },
    });
  }

  /** Play a one-shot sound effect. Safe to call with missing keys. */
  playSFX(key: string): void {
    if (!this.scene || this.muted || !this.unlocked) return;
    if (!this.hasAudio(key)) return;
    this.scene.sound.play(key, { volume: this.sfxVolume });
  }

  /** Get the key of the currently playing BGM (empty string if none). */
  getCurrentBGMKey(): string { return this.currentBGMKey; }

  setBGMVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBGM && 'volume' in this.currentBGM) {
      (this.currentBGM as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
    }
  }
  setSFXVolume(vol: number): void { this.sfxVolume = Math.max(0, Math.min(1, vol)); }
  getBGMVolume(): number { return this.bgmVolume; }
  getSFXVolume(): number { return this.sfxVolume; }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stopBGM();
  }
  isMuted(): boolean { return this.muted; }
}
