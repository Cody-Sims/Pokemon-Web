import Phaser from 'phaser';
import type { AmbientType } from '@data/maps';

/**
 * Manages ambient environmental sound effects based on the current map's biome.
 * Tracks the active ambient type so a future audio loop system can crossfade
 * biome-specific ambience.
 */
export class AmbientSFX {
  private currentAmbient: AmbientType = 'none';

  constructor(scene: Phaser.Scene) {
    void scene;
  }

  /** Set the ambient sound type for the current map. */
  setAmbient(type: AmbientType): void {
    if (type === this.currentAmbient) return;
    this.currentAmbient = type;
    // Future: trigger ambient loop start/crossfade here.
  }

  /** Get the current ambient type. */
  getAmbient(): AmbientType {
    return this.currentAmbient;
  }

  /** Called each frame — reserved for future volume ducking or crossfade logic. */
  update(): void {
    // Future: fade volume based on distance to biome edges, weather intensity, etc.
  }

  destroy(): void {
    this.currentAmbient = 'none';
    // Future: stop any playing ambient loops here
  }
}
