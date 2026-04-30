import Phaser from 'phaser';
import { particleMultiplier, maxParticleMultiplier } from '@utils/perf-profile';
import { isReducedMotion } from '@utils/accessibility';

export type OverworldWeather = 'none' | 'rain' | 'sandstorm' | 'snow' | 'fog' | 'sunshine' | 'ash' | 'drip';

/** Tint overlay colors and alpha per weather type. */
const WEATHER_TINTS: Record<OverworldWeather, { color: number; alpha: number }> = {
  none:      { color: 0x000000, alpha: 0 },
  rain:      { color: 0x334466, alpha: 0.2 },
  sandstorm: { color: 0x665533, alpha: 0.15 },
  snow:      { color: 0x8899bb, alpha: 0.15 },
  fog:       { color: 0x000000, alpha: 0 },       // fog uses its own overlay
  sunshine:  { color: 0xffdd44, alpha: 0.08 },
  ash:       { color: 0x665544, alpha: 0.12 },
  drip:      { color: 0x223344, alpha: 0.10 },
};

/**
 * Renders visual weather effects on the overworld using Phaser particle
 * emitters and camera-fixed overlays.
 *
 * All visual elements use scrollFactor(0) so they stay fixed on screen,
 * and depth(90) so they render above gameplay but below HUD (100).
 */
export class WeatherRenderer {
  private scene: Phaser.Scene;
  private activeWeather: OverworldWeather = 'none';

  // Particle emitters
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Overlays
  private tintOverlay: Phaser.GameObjects.Rectangle | null = null;
  private fogOverlay: Phaser.GameObjects.Rectangle | null = null;

  // Generated texture keys (for cleanup)
  private textureKeys: string[] = [];

  // HIGH-15: Debounce resize to prevent rapid texture re-creation
  private resizeTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // AUDIT-053: Re-apply weather on viewport resize to cover new dimensions
    scene.scale.on('resize', () => {
      if (this.activeWeather !== 'none') {
        const currentWeather = this.activeWeather;
        this.resizeTimer?.destroy();
        this.resizeTimer = this.scene.time.delayedCall(100, () => {
          this.cleanup();
          this.activeWeather = 'none';
          this.setWeather(currentWeather);
        });
      }
    });
  }

  /** Set the active weather. Transitions smoothly. */
  setWeather(weather: OverworldWeather): void {
    if (weather === this.activeWeather) return;
    this.cleanup();
    this.activeWeather = weather;

    if (weather === 'none') return;

    this.createTintOverlay(weather);

    if (isReducedMotion()) return;

    switch (weather) {
      case 'rain':      this.createRain(); break;
      case 'sandstorm': this.createSandstorm(); break;
      case 'snow':      this.createSnow(); break;
      case 'fog':       this.createFog(); break;
      case 'sunshine':  this.createSunshine(); break;
      case 'ash':       this.createAsh(); break;
      case 'drip':      this.createDrip(); break;
    }
  }

  /** Called each frame to update particles and tint. */
  update(): void {
    // Particle emitters auto-update via Phaser; nothing extra needed per frame.
  }

  /** Clean up all emitters and overlays. */
  destroy(): void {
    this.resizeTimer?.destroy();
    this.resizeTimer = undefined;
    this.cleanup();
  }

  getActiveWeather(): OverworldWeather {
    return this.activeWeather;
  }

  // ── Private helpers ───────────────────────────────────────

  private cleanup(): void {
    if (this.emitter) {
      this.emitter.stop();
      this.emitter.destroy();
      this.emitter = null;
    }
    if (this.tintOverlay) {
      this.tintOverlay.destroy();
      this.tintOverlay = null;
    }
    if (this.fogOverlay) {
      this.fogOverlay.destroy();
      this.fogOverlay = null;
    }
    for (const key of this.textureKeys) {
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }
    }
    this.textureKeys = [];
  }

  /** Colour tint overlay at depth 89, below weather particles. */
  private createTintOverlay(weather: OverworldWeather): void {
    const { color, alpha } = WEATHER_TINTS[weather];
    if (alpha <= 0) return;
    const { width: w, height: h } = this.scene.cameras.main;
    this.tintOverlay = this.scene.add.rectangle(
      w / 2, h / 2, w, h, color, alpha,
    );
    this.tintOverlay.setScrollFactor(0);
    this.tintOverlay.setDepth(89);
  }

  /** Generate a tiny texture via graphics → generateTexture. */
  private makeTexture(key: string, draw: (g: Phaser.GameObjects.Graphics) => void): string {
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, 8, 8);
    g.destroy();
    this.textureKeys.push(key);
    return key;
  }

  // ── Rain ──────────────────────────────────────────────────

  private createRain(): void {
    const key = this.makeTexture('weather-rain', (g) => {
      g.fillStyle(0x88aadd, 0.8);
      g.fillRect(3, 0, 2, 8);
    });

    const { width: w, height: h } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: { min: -50, max: w + 50 },
      y: -10,
      lifespan: 600,
      speedY: { min: 400, max: 500 },
      speedX: { min: -80, max: -40 },
      scale: { start: 0.6, end: 0.3 },
      alpha: { start: 0.7, end: 0.2 },
      quantity: Math.max(1, Math.round(2 * particleMultiplier())),
      frequency: 30,
      maxAliveParticles: Math.round(80 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }

  // ── Sandstorm ─────────────────────────────────────────────

  private createSandstorm(): void {
    const key = this.makeTexture('weather-sand', (g) => {
      g.fillStyle(0xccaa66, 0.7);
      g.fillCircle(4, 4, 2);
    });

    const { width: w, height: h } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: -20,
      y: { min: 0, max: h },
      lifespan: 800,
      speedX: { min: 300, max: 450 },
      speedY: { min: -30, max: 30 },
      scale: { start: 0.5, end: 0.8 },
      alpha: { start: 0.6, end: 0.1 },
      quantity: Math.max(1, Math.round(2 * particleMultiplier())),
      frequency: 40,
      maxAliveParticles: Math.round(70 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }

  // ── Snow ──────────────────────────────────────────────────

  private createSnow(): void {
    const key = this.makeTexture('weather-snow', (g) => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(4, 4, 3);
    });

    const { width: w, height: h } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: { min: -20, max: w + 20 },
      y: -10,
      lifespan: 3000,
      speedY: { min: 40, max: 80 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.4, end: 0.2 },
      alpha: { start: 0.8, end: 0.3 },
      quantity: Math.max(1, Math.round(1 * particleMultiplier())),
      frequency: 60,
      maxAliveParticles: Math.round(60 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }

  // ── Fog ───────────────────────────────────────────────────

  private createFog(): void {
    const { width: w, height: h } = this.scene.cameras.main;
    this.fogOverlay = this.scene.add.rectangle(
      w / 2, h / 2, w, h, 0xffffff, 0.35,
    );
    this.fogOverlay.setScrollFactor(0);
    this.fogOverlay.setDepth(90);

    // Gentle pulsing alpha for atmosphere
    this.scene.tweens.add({
      targets: this.fogOverlay,
      alpha: { from: 0.3, to: 0.45 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Sunshine ──────────────────────────────────────────────

  private createSunshine(): void {
    const key = this.makeTexture('weather-flare', (g) => {
      g.fillStyle(0xffee88, 0.5);
      g.fillCircle(4, 4, 4);
    });

    // Occasional lens flare sparkles
    const { width: w, height: h } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: { min: 0, max: w },
      y: { min: 0, max: h * 0.4 },
      lifespan: 1500,
      speedY: { min: 10, max: 30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 0.5, end: 0 },
      quantity: Math.max(1, Math.round(1 * particleMultiplier())),
      frequency: 500,
      maxAliveParticles: Math.round(8 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }

  // ── Ash ────────────────────────────────────────────────────

  private createAsh(): void {
    const key = this.makeTexture('weather-ash', (g) => {
      g.fillStyle(0x888888, 0.7);
      g.fillCircle(4, 4, 2);
    });

    const { width: w, height: h } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: { min: -20, max: w + 20 },
      y: -10,
      lifespan: 4000,
      speedY: { min: 30, max: 60 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.5, end: 0.2 },
      alpha: { start: 0.6, end: 0.1 },
      quantity: Math.max(1, Math.round(1 * particleMultiplier())),
      frequency: 50,
      maxAliveParticles: Math.round(50 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }

  // ── Drip ───────────────────────────────────────────────────

  private createDrip(): void {
    const key = this.makeTexture('weather-drip', (g) => {
      g.fillStyle(0x6688aa, 0.6);
      g.fillRect(3, 0, 2, 6);
    });

    const { width: w } = this.scene.cameras.main;
    this.emitter = this.scene.add.particles(0, 0, key, {
      x: { min: 0, max: w },
      y: -10,
      lifespan: 500,
      speedY: { min: 200, max: 320 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.4, end: 0.2 },
      alpha: { start: 0.5, end: 0.1 },
      quantity: 1,
      frequency: 200,
      maxAliveParticles: Math.round(15 * maxParticleMultiplier()),
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(90);
  }
}
