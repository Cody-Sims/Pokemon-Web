import Phaser from 'phaser';

export type AmbientType = 'ocean' | 'forest' | 'cave' | 'city' | 'wind' | 'rain' | 'none';

/**
 * Manages ambient environmental sound effects based on the current map's biome.
 * Tracks the active ambient type and provides hooks for ProceduralAudio
 * to generate looping ambient sounds in the future.
 */
export class AmbientSFX {
  private scene: Phaser.Scene;
  private currentAmbient: AmbientType = 'none';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Set the ambient sound type for the current map. */
  setAmbient(type: AmbientType): void {
    if (type === this.currentAmbient) return;
    this.currentAmbient = type;
    // Future: trigger ProceduralAudio ambient loop start/crossfade here
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
