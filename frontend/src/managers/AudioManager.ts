import Phaser from 'phaser';
import { CryGenerator } from '@systems/audio/CryGenerator';

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
  private jingleSound?: Phaser.Sound.BaseSound;
  private priorBGMKey = '';
  private lowHpTimer?: Phaser.Time.TimerEvent;
  private lowHpActive = false;
  private previousBGMKey = '';
  private savedBgmKey = '';
  private bgmPaused = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Bind to the active scene's sound manager. Call when entering a new scene. */
  setScene(scene: Phaser.Scene): void {
    // AUDIT-038: Only kill audio-related tweens, not all scene tweens
    if (this.scene && this.scene.tweens && this.currentBGM) {
      try { this.scene.tweens.killTweensOf(this.currentBGM); } catch { /* scene may already be destroyed */ }
    }
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

  /** Check if the bound scene is still usable. */
  private isSceneActive(): boolean {
    return !!this.scene && !!this.scene.sys && this.scene.sys.isActive();
  }

  /** Check if an audio key is loaded in the cache. */
  private hasAudio(key: string): boolean {
    if (!this.scene) return false;
    return this.scene.cache.audio.exists(key);
  }

  /** Play background music with crossfade. Skips if same track is already playing. */
  playBGM(key: string): void {
    if (!this.isSceneActive() || this.muted) return;

    // Already playing this track — ensure volume is correct
    // (a scene transition may have killed the fade-in tween mid-crossfade)
    if (this.currentBGMKey === key && this.currentBGM) {
      if (this.scene && 'volume' in this.currentBGM) {
        const cur = (this.currentBGM as Phaser.Sound.WebAudioSound).volume;
        if (cur < this.bgmVolume - 0.01) {
          this.scene.tweens.add({
            targets: this.currentBGM,
            volume: this.bgmVolume,
            duration: 500,
          });
        }
      }
      return;
    }

    // Audio not unlocked yet — queue it
    if (!this.unlocked) {
      this.pendingBGM = key;
      return;
    }

    if (!this.hasAudio(key)) return;

    if (this.currentBGM) {
      const oldBGM = this.currentBGM;
      this.previousBGMKey = this.currentBGMKey;
      this.currentBGMKey = key;
      // Fade out old track while new track fades in concurrently
      this.scene!.tweens.add({
        targets: oldBGM,
        volume: 0,
        duration: 500,
        onComplete: () => {
          oldBGM.stop();
          oldBGM.destroy();
        },
      });
      this.startBGM(key);  // Start new track immediately for overlapping crossfade
    } else {
      this.previousBGMKey = this.currentBGMKey;
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
    this.bgmPaused = false;
    // Also stop any jingle
    if (this.jingleSound) {
      this.jingleSound.stop();
      this.jingleSound.destroy();
      this.jingleSound = undefined;
      this.priorBGMKey = '';
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

  /** Save the current BGM key so it can be restored later (e.g. after battle). */
  saveBgmState(): void {
    this.savedBgmKey = this.currentBGMKey;
  }

  /** Crossfade back to the BGM that was saved via saveBgmState(). */
  restoreBgmState(): void {
    if (this.savedBgmKey) {
      const key = this.savedBgmKey;
      this.savedBgmKey = '';
      this.playBGM(key);
    }
  }

  /** Get the saved BGM key (empty string if none). */
  getSavedBgmKey(): string { return this.savedBgmKey; }

  /**
   * Fade out the current BGM, play a short stinger SFX, then start the
   * target BGM after the stinger completes.  If the stinger audio doesn't
   * exist in the cache the BGM starts immediately via a normal crossfade.
   */
  playBGMWithStinger(stingerKey: string, bgmKey: string): void {
    if (!this.isSceneActive() || this.muted) return;

    if (!this.unlocked) {
      this.pendingBGM = bgmKey;
      return;
    }

    // If the stinger audio is available, fade out current BGM and play stinger first
    if (this.hasAudio(stingerKey)) {
      // Fade out current BGM quickly
      if (this.currentBGM) {
        const old = this.currentBGM;
        this.previousBGMKey = this.currentBGMKey;
        this.currentBGM = undefined;
        this.currentBGMKey = '';
        this.scene!.tweens.add({
          targets: old,
          volume: 0,
          duration: 300,
          onComplete: () => { old.stop(); old.destroy(); },
        });
      }

      // Play the stinger, then start the BGM when it completes
      const stinger = this.scene!.sound.add(stingerKey, {
        loop: false,
        volume: this.sfxVolume,
      });
      stinger.play();
      stinger.once('complete', () => {
        stinger.destroy();
        this.playBGM(bgmKey);
      });
      // Safety timeout in case the stinger has no duration metadata
      this.scene!.time.delayedCall(3000, () => {
        if (stinger.isPlaying) stinger.stop();
        if (!this.currentBGMKey) this.playBGM(bgmKey);
      });
    } else {
      // No stinger available — fall through to a normal crossfade
      this.playBGM(bgmKey);
    }
  }

  /** Play a one-shot sound effect. Safe to call with missing keys. */
  playSFX(key: string): void {
    if (!this.isSceneActive() || this.muted || !this.unlocked) return;
    if (!this.hasAudio(key)) return;
    this.scene!.sound.play(key, { volume: this.sfxVolume });
  }

  /** Play SFX with a custom playback rate for pitch-shifted variations. */
  playSFXWithRate(key: string, rate: number): void {
    if (!this.isSceneActive() || this.muted || !this.unlocked) return;
    if (!this.hasAudio(key)) return;
    const sfx = this.scene!.sound.add(key, { volume: this.sfxVolume });
    if ('setRate' in sfx) {
      (sfx as Phaser.Sound.WebAudioSound).setRate(rate);
    }
    sfx.play();
    sfx.once('complete', () => sfx.destroy());
  }

  /** Play a Pokémon cry for the given dex number. */
  async playCry(dexNumber: number): Promise<void> {
    if (this.muted) return;
    try {
      return await CryGenerator.getInstance().playCry(dexNumber, this.sfxVolume);
    } catch (err) {
      console.warn('AudioManager: cry playback failed, skipping:', err);
    }
  }

  /** Initialize the cry generator with the current scene. Call once after first setScene. */
  initCryGenerator(): void {
    if (this.scene) {
      CryGenerator.getInstance().init(this.scene);
    }
  }

  /**
   * Play a short jingle that temporarily replaces the BGM.
   * When the jingle ends, the previous BGM resumes automatically.
   * If `resumeAfter` is false, BGM stays stopped after jingle.
   */
  playJingle(key: string, resumeAfter = true): void {
    if (!this.scene || this.muted || !this.unlocked) return;
    if (!this.hasAudio(key)) return;

    // Remember current BGM so we can resume
    this.priorBGMKey = resumeAfter ? this.currentBGMKey : '';

    // Fade out current BGM quickly
    if (this.currentBGM) {
      const old = this.currentBGM;
      this.scene.tweens.add({
        targets: old,
        volume: 0,
        duration: 200,
        onComplete: () => { old.stop(); old.destroy(); },
      });
      this.currentBGM = undefined;
      this.currentBGMKey = '';
    }

    // Play the jingle (non-looping)
    this.jingleSound = this.scene.sound.add(key, { loop: false, volume: this.bgmVolume });
    this.jingleSound.play();
    this.jingleSound.once('complete', () => {
      this.jingleSound?.destroy();
      this.jingleSound = undefined;
      // Resume prior BGM if requested
      if (this.priorBGMKey) {
        this.playBGM(this.priorBGMKey);
        this.priorBGMKey = '';
      }
    });
  }

  /** Fade out current BGM, play a short jingle, then restore previous BGM.
   *  Async version of playJingle — resolves when the fanfare finishes. */
  async playFanfare(key: string, duration = 3000): Promise<void> {
    if (!this.scene || this.muted || !this.unlocked) return;
    if (!this.hasAudio(key)) return;

    const restoreKey = this.currentBGMKey;
    const hadBGM = !!this.currentBGM;

    // Fade out current BGM
    if (this.currentBGM) {
      await new Promise<void>((resolve) => {
        const bgm = this.currentBGM!;
        this.scene!.tweens.add({
          targets: bgm,
          volume: 0,
          duration: 300,
          onComplete: () => {
            bgm.stop();
            bgm.destroy();
            if (this.currentBGM === bgm) {
              this.currentBGM = undefined;
            }
            resolve();
          },
        });
      });
    }

    // Play the fanfare (non-looping)
    await new Promise<void>((resolve) => {
      const fanfare = this.scene!.sound.add(key, {
        loop: false,
        volume: this.bgmVolume,
      });
      fanfare.play();

      const timeout = this.scene!.time.delayedCall(duration, () => {
        if (fanfare.isPlaying) fanfare.stop();
        fanfare.destroy();
        resolve();
      });

      fanfare.once('complete', () => {
        timeout.remove();
        fanfare.destroy();
        resolve();
      });
    });

    // Restore previous BGM
    if (hadBGM && restoreKey) {
      this.currentBGMKey = '';
      this.playBGM(restoreKey);
    }
  }

  /** Start the low-HP warning beep loop. Plays the LOW_HP SFX every 1.5 seconds. */
  playLoHpWarning(): void {
    this.startLowHpWarning();
  }

  /** Stop the low-HP warning beep. */
  stopLoHpWarning(): void {
    this.stopLowHpWarning();
  }

  /** Pause the current BGM without destroying it. */
  pauseBGM(): void {
    if (!this.currentBGM || this.bgmPaused) return;
    if ('pause' in this.currentBGM) {
      (this.currentBGM as Phaser.Sound.WebAudioSound).pause();
    }
    this.bgmPaused = true;
  }

  /** Resume previously paused BGM. */
  resumeBGM(): void {
    if (!this.currentBGM || !this.bgmPaused) return;
    if ('resume' in this.currentBGM) {
      (this.currentBGM as Phaser.Sound.WebAudioSound).resume();
    }
    this.bgmPaused = false;
  }

  /** Start the low-HP warning beep loop. Plays the LOW_HP SFX every 1 second. */
  startLowHpWarning(): void {
    if (this.lowHpActive || this.muted || !this.isSceneActive()) return;
    this.lowHpActive = true;
    // Play immediately, then repeat
    this.playSFX('sfx-low-hp');
    // AUDIT-039: Create timer on current scene to avoid stale reference
    this.lowHpTimer = this.scene!.time.addEvent({
      delay: 1500,
      callback: () => { this.playSFX('sfx-low-hp'); },
      loop: true,
    });
  }

  /** Stop the low-HP warning beep loop. */
  stopLowHpWarning(): void {
    if (!this.lowHpActive) return;
    this.lowHpActive = false;
    this.lowHpTimer?.remove(false);
    this.lowHpTimer = undefined;
  }

  /** Check if low-HP warning is currently active. */
  isLowHpWarningActive(): boolean { return this.lowHpActive; }

  /** Get the key of the currently playing BGM (empty string if none). */
  getCurrentBGMKey(): string { return this.currentBGMKey; }

  /** Get the key of the previously playing BGM. */
  getPreviousBGMKey(): string { return this.previousBGMKey; }

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
    if (muted) {
      this.stopBGM();
      this.stopLowHpWarning();
      this.stopLoHpWarning();
    }
  }
  isMuted(): boolean { return this.muted; }

  /** AUDIT-049: Reset all transient audio state for a new game session. */
  reset(): void {
    this.stopBGM();
    this.stopLowHpWarning();
    this.pendingBGM = undefined;
    this.bgmPaused = false;
    this.previousBGMKey = '';
    this.priorBGMKey = '';
    this.savedBgmKey = '';
  }
}
