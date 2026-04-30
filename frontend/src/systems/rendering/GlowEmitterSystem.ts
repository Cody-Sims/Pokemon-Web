/**
 * GlowEmitterSystem — adds soft additive-blend glow overlays for tile types
 * that benefit from a pulse animation but don't need full sprite-based tile
 * replacement (which `TilemapBuilder` reserves for water / grass / lava).
 *
 * Three glow categories:
 *   - **Aether crystal pulse**: AETHER_CRYSTAL, AETHER_CONDUIT — slow cyan pulse.
 *   - **Voltara neon glow**:    CONDUIT, ELECTRIC_PANEL, WIRE_FLOOR — fast amber pulse.
 *   - **Window light shafts**:  WINDOW, HOUSE_WINDOW, LAB_WINDOW, CENTER_WINDOW —
 *                               warm amber glow that brightens at night.
 *
 * Glow sprites are a single shared 16×16 white circle texture, reused across
 * every emitter to keep memory and draw-call overhead minimal.
 */

import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import { Tile } from '@data/maps';
import type { GameClock, TimePeriod } from '@systems/engine/GameClock';

const GLOW_TEXTURE_KEY = '__glow-circle';
const GLOW_TEXTURE_SIZE = 32;

interface Emitter {
  sprite: Phaser.GameObjects.Image;
  category: 'crystal' | 'neon' | 'window';
  /** Phase offset so emitters don't pulse in lock-step. */
  phase: number;
}

const NEON_TILES = new Set<number>([Tile.CONDUIT, Tile.ELECTRIC_PANEL, Tile.WIRE_FLOOR]);
const CRYSTAL_TILES = new Set<number>([Tile.AETHER_CRYSTAL, Tile.AETHER_CONDUIT]);
const WINDOW_TILES = new Set<number>([
  Tile.WINDOW, Tile.HOUSE_WINDOW, Tile.LAB_WINDOW, Tile.CENTER_WINDOW,
]);

const COLOR_CRYSTAL = 0x60e0d0;
const COLOR_NEON = 0xffd060;
const COLOR_WINDOW_DAY = 0xfff0c0;
const COLOR_WINDOW_NIGHT = 0xffd070;

/** Maximum emitters spawned per category per map (prevents pathological cases). */
const MAX_EMITTERS_PER_CATEGORY = 64;

export class GlowEmitterSystem {
  private scene: Phaser.Scene;
  private emitters: Emitter[] = [];
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureGlowTexture();
    // HIGH-17: Auto-cleanup emitters on scene shutdown
    this.scene.events.once('shutdown', () => this.destroy());
  }

  private ensureGlowTexture(): void {
    if (this.scene.textures.exists(GLOW_TEXTURE_KEY)) return;

    const gfx = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const half = GLOW_TEXTURE_SIZE / 2;
    const steps = 8;
    for (let i = steps; i >= 0; i--) {
      const ratio = i / steps;
      const alpha = 1 - ratio;
      const r = half * ratio;
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillCircle(half, half, Math.max(r, 1));
    }
    gfx.generateTexture(GLOW_TEXTURE_KEY, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);
    gfx.destroy();
  }

  /**
   * Scan the map's ground grid and create glow emitters at qualifying tiles.
   * Safe to call once per map load. The system can be `destroy()`-ed and
   * rebuilt cheaply; emitter sprites all share a single texture.
   */
  scanMap(ground: number[][], mapW: number, mapH: number): void {
    let crystalCount = 0;
    let neonCount = 0;
    let windowCount = 0;

    for (let y = 0; y < mapH; y++) {
      const row = ground[y];
      if (!row) continue;
      for (let x = 0; x < mapW; x++) {
        const t = row[x];
        if (CRYSTAL_TILES.has(t) && crystalCount < MAX_EMITTERS_PER_CATEGORY) {
          this.addEmitter(x, y, 'crystal', COLOR_CRYSTAL, 1.4, 0.85);
          crystalCount++;
        } else if (NEON_TILES.has(t) && neonCount < MAX_EMITTERS_PER_CATEGORY) {
          this.addEmitter(x, y, 'neon', COLOR_NEON, 1.0, 0.55);
          neonCount++;
        } else if (WINDOW_TILES.has(t) && windowCount < MAX_EMITTERS_PER_CATEGORY) {
          this.addEmitter(x, y, 'window', COLOR_WINDOW_DAY, 1.6, 0.55);
          windowCount++;
        }
      }
    }
  }

  private addEmitter(
    tx: number,
    ty: number,
    category: Emitter['category'],
    color: number,
    scale: number,
    baseAlpha: number,
  ): void {
    const px = tx * TILE_SIZE + TILE_SIZE / 2;
    const py = ty * TILE_SIZE + TILE_SIZE / 2;
    const sprite = this.scene.add.image(px, py, GLOW_TEXTURE_KEY);
    sprite.setBlendMode(Phaser.BlendModes.ADD);
    sprite.setScale((TILE_SIZE / GLOW_TEXTURE_SIZE) * scale);
    sprite.setTint(color);
    sprite.setAlpha(baseAlpha);
    // Glow draws above the tilemap decoration layer but below the player so
    // it never occludes character sprites.
    sprite.setDepth(0.75);
    this.emitters.push({
      sprite,
      category,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /**
   * Per-frame pulse update. Cheap: a single sin() per emitter, cap on
   * `MAX_EMITTERS_PER_CATEGORY` keeps the worst case at ~192 emitters.
   *
   * @param deltaMs    Frame delta in milliseconds.
   * @param gameClock  Used to brighten window glow at night.
   */
  update(deltaMs: number, gameClock?: GameClock): void {
    if (this.emitters.length === 0) return;
    this.elapsedMs += deltaMs;

    const period: TimePeriod = gameClock?.getTimePeriod() ?? 'day';
    const isNight = period === 'night' || period === 'evening';
    const windowAlpha = isNight ? 0.95 : 0.55;
    const windowColor = isNight ? COLOR_WINDOW_NIGHT : COLOR_WINDOW_DAY;

    for (const e of this.emitters) {
      let baseAlpha: number;
      let amplitude: number;
      let speedHz: number;

      switch (e.category) {
        case 'crystal':
          baseAlpha = 0.7;
          amplitude = 0.25;
          speedHz = 0.45;
          break;
        case 'neon':
          baseAlpha = 0.5;
          amplitude = 0.35;
          speedHz = 1.4;
          break;
        case 'window':
          baseAlpha = windowAlpha;
          amplitude = 0.08;
          speedHz = 0.2;
          e.sprite.setTint(windowColor);
          break;
      }

      const t = (this.elapsedMs / 1000) * speedHz * Math.PI * 2 + e.phase;
      const a = baseAlpha + Math.sin(t) * amplitude;
      e.sprite.setAlpha(Math.max(0.05, Math.min(1, a)));
    }
  }

  /** Hide all emitters without destroying them (useful for debug toggling). */
  setVisible(visible: boolean): void {
    for (const e of this.emitters) e.sprite.setVisible(visible);
  }

  /** Number of active emitters — exposed for tests and debugging. */
  get emitterCount(): number {
    return this.emitters.length;
  }

  destroy(): void {
    for (const e of this.emitters) e.sprite.destroy();
    this.emitters.length = 0;
  }
}
