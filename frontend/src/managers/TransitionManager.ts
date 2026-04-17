import Phaser from 'phaser';

/** Helper for screen wipe/fade transitions between scenes. */
export class TransitionManager {
  private static instance: TransitionManager;

  private constructor() {}

  static getInstance(): TransitionManager {
    if (!TransitionManager.instance) {
      TransitionManager.instance = new TransitionManager();
    }
    return TransitionManager.instance;
  }

  /** Fade the camera to black, run callback, then fade back in. */
  fadeTransition(scene: Phaser.Scene, callback: () => void, duration = 500): void {
    scene.cameras.main.fadeOut(duration / 2, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      callback();
      // NEW-001: Check scene is still alive before fade-in
      if (scene.scene.isActive()) {
        scene.cameras.main.fadeIn(duration / 2, 0, 0, 0);
      }
    });
  }
}
