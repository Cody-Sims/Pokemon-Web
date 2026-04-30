import Phaser from 'phaser';
import { isReducedMotion } from '@utils/accessibility';
import { SaveManager } from './SaveManager';

/** Helper for screen wipe/fade transitions between scenes. */
export class TransitionManager {
  private static instance: TransitionManager;
  /** MED-36: Prevent overlapping transitions. */
  private transitioning = false;

  private constructor() {}

  static getInstance(): TransitionManager {
    if (!TransitionManager.instance) {
      TransitionManager.instance = new TransitionManager();
    }
    return TransitionManager.instance;
  }

  /** Fade the camera to black, run callback, then fade back in. */
  fadeTransition(scene: Phaser.Scene, callback: () => void, duration = 500): void {
    if (this.transitioning) return;
    this.transitioning = true;
    SaveManager.blockSaves();
    if (isReducedMotion()) {
      try { callback(); } finally {
        this.transitioning = false;
        SaveManager.unblockSaves();
      }
      return;
    }
    try {
      scene.cameras.main.fadeOut(duration / 2, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', () => {
        try {
          callback();
        } catch (err) {
          console.warn('TransitionManager: transition callback failed:', err);
        }
        // NEW-001: Check scene is still alive before fade-in
        if (scene.scene.isActive()) {
          scene.cameras.main.fadeIn(duration / 2, 0, 0, 0);
          scene.cameras.main.once('camerafadeincomplete', () => {
            this.transitioning = false;
            SaveManager.unblockSaves();
          });
        } else {
          this.transitioning = false;
          SaveManager.unblockSaves();
        }
      });
    } catch (err) {
      console.warn('TransitionManager: fade transition failed, invoking callback directly:', err);
      try {
        callback();
      } catch { /* callback itself failed — nothing more we can do */ }
      this.transitioning = false;
      SaveManager.unblockSaves();
    }
  }
}
