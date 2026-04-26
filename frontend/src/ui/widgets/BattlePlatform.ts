import Phaser from 'phaser';

/**
 * BattlePlatform — draws a layered ring-shaped pixel-art platform under a
 * battle Pokémon sprite. Replaces the previous stack of 4 separate `add.ellipse()`
 * calls with a single Graphics object (one draw call), produces a cleaner
 * pixel-art look (concentric bands + crisp highlight rim), and ships a
 * sprite-attached drop shadow that grounds the Pokémon visually.
 *
 * Two variants keep the player and enemy platforms visually distinct:
 *   - 'player': larger, slightly more saturated for the foreground role.
 *   - 'enemy':  smaller, slightly desaturated for the background role.
 */
export class BattlePlatform {
  private gfx: Phaser.GameObjects.Graphics;
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    /** Center X of the platform. */
    x: number,
    /** Center Y of the platform (top of the platform's vertical span). */
    y: number,
    /** Half-width of the outermost ellipse. */
    width: number,
    /** Half-height of the outermost ellipse. */
    height: number,
    options?: {
      variant?: 'player' | 'enemy';
      /** Overrides the default biome palette. Length 4 [shadow, base, mid, top]. */
      palette?: [number, number, number, number];
      /** Sprite shadow follows this Y offset under the sprite center. */
      spriteShadowY?: number;
      /** Soft drop shadow drawn under the Pokémon sprite (skip with 0 width). */
      spriteShadowWidth?: number;
    },
  ) {
    const variant = options?.variant ?? 'player';
    const palette = options?.palette ?? DEFAULT_PALETTE;
    const [shadow, base, mid, top] = palette;

    // Sprite drop shadow — separate ellipse so it can be tweened with the sprite.
    const sShadowW = options?.spriteShadowWidth ?? Math.round(width * 0.7);
    const sShadowY = options?.spriteShadowY ?? y - Math.round(height * 0.05);
    this.shadow = scene.add.ellipse(x, sShadowY, sShadowW, Math.round(sShadowW * 0.22), 0x000000, 0.35);

    // Layered platform: drop shadow + 3 concentric bands + crisp highlight rim.
    this.gfx = scene.add.graphics();

    const widthScale = variant === 'player' ? 1.0 : 0.85;
    const heightScale = variant === 'player' ? 1.0 : 0.85;
    const w = width * widthScale;
    const h = height * heightScale;

    // Drop shadow (offset down)
    this.gfx.fillStyle(shadow, 0.55);
    this.gfx.fillEllipse(x, y + 4, w, h);

    // Base ring
    this.gfx.fillStyle(base, 1);
    this.gfx.fillEllipse(x, y, w, h);

    // Mid ring
    this.gfx.fillStyle(mid, 1);
    this.gfx.fillEllipse(x, y - 2, w * 0.88, h * 0.78);

    // Top highlight band
    this.gfx.fillStyle(top, 0.75);
    this.gfx.fillEllipse(x, y - 5, w * 0.65, h * 0.45);

    // Thin highlight rim along the top edge for that classic pixel sheen.
    this.gfx.lineStyle(1, 0xffffff, 0.25);
    this.gfx.strokeEllipse(x, y - 1, w * 0.94, h * 0.86);
  }

  /** Move the sprite drop shadow (call after slide-in tweens to keep it under the sprite). */
  setShadowPosition(x: number, y: number): void {
    this.shadow.setPosition(x, y);
  }

  /** Hide the sprite drop shadow (used during faint or fly-out animations). */
  setShadowAlpha(alpha: number): void {
    this.shadow.setAlpha(alpha);
  }

  setDepth(depth: number): this {
    this.gfx.setDepth(depth);
    this.shadow.setDepth(depth + 0.1);
    return this;
  }

  destroy(): void {
    this.gfx.destroy();
    this.shadow.destroy();
  }
}

/** Default grass-tinted palette (matches the existing battle scene look). */
const DEFAULT_PALETTE: [number, number, number, number] = [
  0x1a2e14,   // shadow
  0x2d4a22,   // base
  0x3a6030,   // mid
  0x4a7a3e,   // top highlight
];

/** Cave / dungeon palette (cool gray-blue). */
export const PLATFORM_PALETTE_CAVE: [number, number, number, number] = [
  0x14171c, 0x2a2f3a, 0x3a414f, 0x52596b,
];

/** Sand / beach palette. */
export const PLATFORM_PALETTE_SAND: [number, number, number, number] = [
  0x2e2614, 0x6b5530, 0x8a7148, 0xa68d63,
];

/** Volcanic / fire palette. */
export const PLATFORM_PALETTE_VOLCANIC: [number, number, number, number] = [
  0x2a0a08, 0x5a1f1a, 0x82342a, 0xa8503e,
];

/** Tech / lab palette. */
export const PLATFORM_PALETTE_TECH: [number, number, number, number] = [
  0x0a1a24, 0x1f3a4f, 0x2f5575, 0x4d7896,
];
