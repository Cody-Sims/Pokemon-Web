import Phaser from 'phaser';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color?: number;
  intensity?: number;
}

const DEFAULT_PLAYER_RADIUS = 96;
const DARKNESS_ALPHA = 0.85;
const DARKNESS_DEPTH = 85;
const LIGHT_TEXTURE_KEY = '__light-circle';
const LIGHT_TEXTURE_SIZE = 128;

export class LightingSystem {
  private scene: Phaser.Scene;
  private rt!: Phaser.GameObjects.RenderTexture;
  private lightImage!: Phaser.GameObjects.Image;
  private enabled = false;
  private playerLightRadius = DEFAULT_PLAYER_RADIUS;
  private staticLights: LightSource[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createLightTexture();
    // Create a persistent reusable image for drawing lights (avoids per-frame alloc)
    this.lightImage = scene.make.image({ x: 0, y: 0, key: LIGHT_TEXTURE_KEY }, false);
    this.lightImage.setOrigin(0.5, 0.5);
  }

  /** Generate a radial gradient circle texture used to erase darkness. */
  private createLightTexture(): void {
    if (this.scene.textures.exists(LIGHT_TEXTURE_KEY)) return;

    const gfx = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const half = LIGHT_TEXTURE_SIZE / 2;
    const steps = 16;

    for (let i = steps; i >= 0; i--) {
      const ratio = i / steps;
      const alpha = 1 - ratio; // solid center, transparent edge
      const r = half * ratio;
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillCircle(half, half, Math.max(r, 1));
    }

    gfx.generateTexture(LIGHT_TEXTURE_KEY, LIGHT_TEXTURE_SIZE, LIGHT_TEXTURE_SIZE);
    gfx.destroy();
  }

  enableDarkness(playerLightRadius?: number): void {
    if (playerLightRadius !== undefined) {
      this.playerLightRadius = playerLightRadius;
    }

    if (!this.rt) {
      const cam = this.scene.cameras.main;
      this.rt = this.scene.add.renderTexture(0, 0, cam.width, cam.height);
      this.rt.setOrigin(0, 0);
      this.rt.setScrollFactor(0);
      this.rt.setDepth(DARKNESS_DEPTH);

      // NEW-007: Recreate RT on window resize
      this.scene.scale.on('resize', () => {
        if (this.rt && this.enabled) {
          const c = this.scene.cameras.main;
          this.rt.destroy();
          this.rt = this.scene.add.renderTexture(0, 0, c.width, c.height);
          this.rt.setOrigin(0, 0);
          this.rt.setScrollFactor(0);
          this.rt.setDepth(DARKNESS_DEPTH);
        }
      });
    }

    this.enabled = true;
    this.rt.setVisible(true);
  }

  disableDarkness(): void {
    this.enabled = false;
    if (this.rt) {
      this.rt.setVisible(false);
    }
  }

  addLightSource(source: LightSource): void {
    this.staticLights.push(source);
  }

  clearLights(): void {
    this.staticLights.length = 0;
  }

  update(playerX: number, playerY: number): void {
    if (!this.enabled || !this.rt) return;

    const cam = this.scene.cameras.main;

    // Fill the RT with darkness
    this.rt.fill(0x000000, DARKNESS_ALPHA);

    // Erase a circle for the player light
    const playerScreenX = playerX - cam.scrollX;
    const playerScreenY = playerY - cam.scrollY;
    this.drawLight(playerScreenX, playerScreenY, this.playerLightRadius);

    // Erase circles for static light sources (world → screen coords)
    for (const light of this.staticLights) {
      const sx = light.x - cam.scrollX;
      const sy = light.y - cam.scrollY;
      const radius = light.radius;

      // Skip lights far off-screen
      if (sx < -radius || sy < -radius || sx > cam.width + radius || sy > cam.height + radius) {
        continue;
      }

      this.drawLight(sx, sy, radius, light.intensity);
    }
  }

  private drawLight(screenX: number, screenY: number, radius: number, intensity?: number): void {
    const scale = (radius * 2) / LIGHT_TEXTURE_SIZE;
    this.lightImage.setPosition(screenX, screenY);
    this.lightImage.setScale(scale);
    if (intensity !== undefined && intensity < 1) {
      this.lightImage.setAlpha(intensity);
    } else {
      this.lightImage.setAlpha(1);
    }
    this.rt.erase(this.lightImage, screenX, screenY);
  }

  setPlayerLightRadius(radius: number): void {
    this.playerLightRadius = radius;
  }

  destroy(): void {
    this.staticLights.length = 0;
    this.enabled = false;
    if (this.lightImage) {
      this.lightImage.destroy();
    }
    if (this.rt) {
      this.rt.destroy();
    }
  }
}
