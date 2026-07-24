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

  /** Force-reset transition state. Call from scene create() to clear stale
   *  flags that survive scene.restart() (e.g. camerafadeincomplete never fired
   *  because the camera was destroyed during a prior restart). */
  forceReset(): void {
    this.transitioning = false;
    SaveManager.unblockSaves();
  }

  /** Fade the camera to black, run callback, then fade back in. */
  fadeTransition(scene: Phaser.Scene, callback: () => void, duration = 500): void {
    if (this.transitioning) {
      // Safety: if a prior transition is stuck, force-reset and proceed
      // rather than silently dropping the warp (which causes a softlock).
      console.warn('TransitionManager: prior transition was stuck — forcing reset');
      this.transitioning = false;
      SaveManager.unblockSaves();
    }
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

      // Safety timeout: if fadeOut never completes (camera destroyed, scene
      // paused, etc.), fire the callback directly after 2× the expected
      // duration so the player is never permanently softlocked.
      let fadeOutFired = false;
      const safetyTimer = scene.time.delayedCall(duration * 2, () => {
        if (!fadeOutFired) {
          console.warn('TransitionManager: fadeOut timed out — forcing callback');
          fadeOutFired = true;
          try { callback(); } catch { /* best effort */ }
          this.transitioning = false;
          SaveManager.unblockSaves();
        }
      });

      scene.cameras.main.once('camerafadeoutcomplete', () => {
        fadeOutFired = true;
        if (safetyTimer) safetyTimer.remove();
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
          // Safety: if fadeIn never completes, reset after timeout
          scene.time.delayedCall(duration * 2, () => {
            if (this.transitioning) {
              this.transitioning = false;
              SaveManager.unblockSaves();
            }
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
