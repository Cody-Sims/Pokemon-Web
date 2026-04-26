import Phaser from 'phaser';
import { MoveData } from '@data/interfaces';
import { moveData } from '@data/moves';
import { GameObjectPool } from './GameObjectPool';

/** Animation style for a battle move — determines the visual effect used. */
export type MoveAnimStyle =
  | 'projectile'   // Flies from attacker to defender
  | 'contact'      // Attacker lunges into defender
  | 'beam'         // Continuous line from attacker to defender
  | 'area'         // Effect fills center of screen / both sides
  | 'self'         // Buff/heal glow on the user
  | 'shake'        // Screen shake (e.g. Earthquake)
  | 'none';        // No animation (fallback)

/** Particle color palette for a move animation. */
interface ParticleConfig {
  colors: number[];        // Fill colors for particles
  count: number;           // Number of particles
  lifespan: number;        // MS each particle lives
  speed: number;           // Pixel/s base speed
  scale: { start: number; end: number };
  alpha: { start: number; end: number };
}

/** Data-driven definition for a single move's visual animation. */
export interface MoveAnimationDef {
  style: MoveAnimStyle;
  particles: ParticleConfig;
  screenFlash?: { color: number; duration: number; intensity: number };
  screenShake?: { intensity: number; duration: number };
  tint?: number;           // Tint applied to defender briefly on hit
  sfxKey?: string;         // Optional specific SFX override
}

/** Default particle configs per type. Covers all 18 types. */
const TYPE_PARTICLE_DEFAULTS: Record<string, ParticleConfig> = {
  normal:   { colors: [0xffffff, 0xdddddd, 0xbbbbbb], count: 8, lifespan: 400, speed: 120, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 } },
  fire:     { colors: [0xff6600, 0xff3300, 0xffaa00, 0xff0000], count: 14, lifespan: 500, speed: 150, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 } },
  water:    { colors: [0x3399ff, 0x0066cc, 0x88ccff], count: 12, lifespan: 500, speed: 140, scale: { start: 1, end: 0.3 }, alpha: { start: 1, end: 0 } },
  electric: { colors: [0xffdd00, 0xffff66, 0xffffff], count: 10, lifespan: 300, speed: 200, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 } },
  grass:    { colors: [0x44bb44, 0x88dd44, 0x228800], count: 10, lifespan: 600, speed: 100, scale: { start: 1, end: 0.2 }, alpha: { start: 0.9, end: 0 } },
  ice:      { colors: [0x88ddff, 0xccffff, 0xffffff], count: 12, lifespan: 500, speed: 130, scale: { start: 1, end: 0.4 }, alpha: { start: 1, end: 0.2 } },
  fighting: { colors: [0xcc3300, 0xff6644, 0xffaa66], count: 10, lifespan: 300, speed: 180, scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 } },
  poison:   { colors: [0xaa44aa, 0x882288, 0xcc66cc], count: 10, lifespan: 600, speed: 80, scale: { start: 0.8, end: 1.2 }, alpha: { start: 0.8, end: 0 } },
  ground:   { colors: [0xbb8844, 0xddaa55, 0x886633], count: 12, lifespan: 500, speed: 110, scale: { start: 1.2, end: 0.3 }, alpha: { start: 1, end: 0 } },
  flying:   { colors: [0xaaaaff, 0xccccff, 0xffffff], count: 8, lifespan: 400, speed: 160, scale: { start: 0.8, end: 0 }, alpha: { start: 0.8, end: 0 } },
  psychic:  { colors: [0xff66aa, 0xcc44aa, 0xff88cc], count: 10, lifespan: 500, speed: 100, scale: { start: 1, end: 1.5 }, alpha: { start: 0.7, end: 0 } },
  bug:      { colors: [0x88aa22, 0xaacc44, 0x668800], count: 8, lifespan: 400, speed: 110, scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 } },
  rock:     { colors: [0xaa8833, 0x887733, 0xccaa44], count: 8, lifespan: 400, speed: 90, scale: { start: 1.4, end: 0.5 }, alpha: { start: 1, end: 0 } },
  ghost:    { colors: [0x664488, 0x443366, 0x8866aa], count: 10, lifespan: 700, speed: 70, scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.6, end: 0 } },
  dragon:   { colors: [0x7733ff, 0x5500cc, 0xaa66ff], count: 12, lifespan: 500, speed: 160, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 } },
  dark:     { colors: [0x443322, 0x221100, 0x665544], count: 10, lifespan: 500, speed: 120, scale: { start: 1, end: 0.3 }, alpha: { start: 0.8, end: 0 } },
  steel:    { colors: [0xbbbbcc, 0x999999, 0xddddee], count: 8, lifespan: 350, speed: 140, scale: { start: 1, end: 0.5 }, alpha: { start: 1, end: 0 } },
  fairy:    { colors: [0xff88bb, 0xffaacc, 0xffccdd], count: 10, lifespan: 500, speed: 90, scale: { start: 0.8, end: 0.3 }, alpha: { start: 0.9, end: 0 } },
};

/** Category-based default animation style. */
function defaultStyleForCategory(category: string): MoveAnimStyle {
  switch (category) {
    case 'physical': return 'contact';
    case 'special':  return 'projectile';
    case 'status':   return 'self';
    default:         return 'none';
  }
}

/** Override definitions for specific high-impact moves. */
const MOVE_OVERRIDES: Record<string, Partial<MoveAnimationDef>> = {
  earthquake: {
    style: 'shake',
    screenShake: { intensity: 6, duration: 800 },
    particles: { colors: [0xbb8844, 0xddaa55], count: 16, lifespan: 600, speed: 60, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'hyper-beam': {
    style: 'beam',
    screenFlash: { color: 0xffff88, duration: 200, intensity: 0.6 },
    particles: { colors: [0xffff00, 0xffffff, 0xff8800], count: 20, lifespan: 400, speed: 200, scale: { start: 2, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'solar-beam': {
    style: 'beam',
    screenFlash: { color: 0xffffcc, duration: 150, intensity: 0.4 },
    particles: { colors: [0xffff00, 0x88ff00, 0xffffff], count: 16, lifespan: 500, speed: 180, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  thunder: {
    style: 'area',
    screenFlash: { color: 0xffff00, duration: 100, intensity: 0.8 },
    screenShake: { intensity: 4, duration: 300 },
    particles: { colors: [0xffdd00, 0xffffff], count: 16, lifespan: 300, speed: 250, scale: { start: 2, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  thunderbolt: {
    style: 'projectile',
    screenFlash: { color: 0xffff00, duration: 80, intensity: 0.5 },
    particles: { colors: [0xffdd00, 0xffffff, 0xffff66], count: 12, lifespan: 300, speed: 200, scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  flamethrower: {
    style: 'beam',
    particles: { colors: [0xff6600, 0xff3300, 0xffaa00], count: 18, lifespan: 500, speed: 180, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'fire-blast': {
    style: 'projectile',
    screenFlash: { color: 0xff4400, duration: 150, intensity: 0.5 },
    particles: { colors: [0xff0000, 0xff6600, 0xffcc00], count: 20, lifespan: 600, speed: 100, scale: { start: 2, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'ice-beam': {
    style: 'beam',
    particles: { colors: [0x88ddff, 0xccffff, 0xffffff], count: 14, lifespan: 400, speed: 180, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  blizzard: {
    style: 'area',
    screenFlash: { color: 0xccffff, duration: 200, intensity: 0.4 },
    particles: { colors: [0xffffff, 0xccffff, 0x88ddff], count: 24, lifespan: 700, speed: 80, scale: { start: 0.8, end: 0.2 }, alpha: { start: 0.9, end: 0 } },
  },
  'hydro-pump': {
    style: 'beam',
    particles: { colors: [0x3399ff, 0x0066cc, 0x88ccff], count: 18, lifespan: 400, speed: 200, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  surf: {
    style: 'area',
    particles: { colors: [0x3399ff, 0x88ccff, 0xffffff], count: 20, lifespan: 600, speed: 120, scale: { start: 1.5, end: 0.3 }, alpha: { start: 0.9, end: 0 } },
  },
  psychic: {
    style: 'area',
    screenFlash: { color: 0xff66aa, duration: 200, intensity: 0.4 },
    particles: { colors: [0xff66aa, 0xff88cc, 0xcc44aa], count: 14, lifespan: 600, speed: 80, scale: { start: 0.5, end: 2 }, alpha: { start: 0.7, end: 0 } },
  },
  'shadow-ball': {
    style: 'projectile',
    particles: { colors: [0x664488, 0x443366, 0x000000], count: 12, lifespan: 400, speed: 160, scale: { start: 1.5, end: 0 }, alpha: { start: 0.8, end: 0 } },
  },
  'sludge-bomb': {
    style: 'projectile',
    particles: { colors: [0xaa44aa, 0x882288, 0x664466], count: 12, lifespan: 500, speed: 140, scale: { start: 1.2, end: 0.5 }, alpha: { start: 0.9, end: 0 } },
  },
  explosion: {
    style: 'area',
    screenFlash: { color: 0xffffff, duration: 300, intensity: 1 },
    screenShake: { intensity: 8, duration: 600 },
    particles: { colors: [0xff6600, 0xff0000, 0xffcc00, 0xffffff], count: 30, lifespan: 600, speed: 200, scale: { start: 2, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'self-destruct': {
    style: 'area',
    screenFlash: { color: 0xffffff, duration: 250, intensity: 0.9 },
    screenShake: { intensity: 7, duration: 500 },
    particles: { colors: [0xff6600, 0xff0000, 0xffcc00], count: 24, lifespan: 500, speed: 180, scale: { start: 1.8, end: 0 }, alpha: { start: 1, end: 0 } },
  },
  'dream-eater': {
    style: 'self',
    particles: { colors: [0x664488, 0xff66aa, 0x000000], count: 10, lifespan: 700, speed: 50, scale: { start: 0.5, end: 1.5 }, alpha: { start: 0.6, end: 0 } },
  },
};

/**
 * Resolves the animation definition for a given move ID.
 * Falls back to type + category defaults if no override is defined.
 */
export function getMoveAnimation(moveId: string): MoveAnimationDef {
  const move = moveData[moveId];
  if (!move) {
    return { style: 'none', particles: TYPE_PARTICLE_DEFAULTS.normal };
  }

  const override = MOVE_OVERRIDES[moveId];
  const typeDefaults = TYPE_PARTICLE_DEFAULTS[move.type] ?? TYPE_PARTICLE_DEFAULTS.normal;
  const style = override?.style ?? defaultStyleForCategory(move.category);

  return {
    style,
    particles: override?.particles ?? typeDefaults,
    screenFlash: override?.screenFlash,
    screenShake: override?.screenShake,
    tint: override?.tint,
    sfxKey: override?.sfxKey,
  };
}

/**
 * Plays a move animation in a BattleScene.
 * Returns a Promise that resolves when the animation completes.
 */
export function playMoveAnimation(
  scene: Phaser.Scene,
  moveId: string,
  attackerSprite: Phaser.GameObjects.Image,
  defenderSprite: Phaser.GameObjects.Image,
  isPlayerAttacking: boolean,
): Promise<void> {
  const anim = getMoveAnimation(moveId);

  if (anim.style === 'none') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeline: Phaser.Tweens.Tween[] = [];
    const particles: Phaser.GameObjects.Arc[] = [];

    // ── Screen flash ──
    if (anim.screenFlash) {
      const flash = anim.screenFlash;
      const { width, height } = scene.cameras.main;
      const flashRect = scene.add.rectangle(width / 2, height / 2, width, height, flash.color, 0)
        .setDepth(100);
      scene.tweens.add({
        targets: flashRect,
        alpha: { from: flash.intensity, to: 0 },
        duration: flash.duration,
        onComplete: () => flashRect.destroy(),
      });
    }

    // ── Screen shake ──
    if (anim.screenShake) {
      scene.cameras.main.shake(anim.screenShake.duration, anim.screenShake.intensity / 1000);
    }

    switch (anim.style) {
      case 'contact': {
        // Attacker lunges toward defender then snaps back
        const origX = attackerSprite.x;
        const origY = attackerSprite.y;
        const dx = (defenderSprite.x - attackerSprite.x) * 0.6;
        const dy = (defenderSprite.y - attackerSprite.y) * 0.6;

        scene.tweens.add({
          targets: attackerSprite,
          x: origX + dx,
          y: origY + dy,
          duration: 150,
          ease: 'Power2',
          yoyo: true,
          onYoyo: () => {
            // Spawn impact particles at defender
            spawnParticles(scene, defenderSprite.x, defenderSprite.y, anim.particles, particles);
            // Flash defender
            flashTarget(scene, defenderSprite);
          },
          onComplete: () => {
            attackerSprite.setPosition(origX, origY);
            cleanupAfterDelay(scene, particles, resolve);
          },
        });
        break;
      }

      case 'projectile': {
        // Spawn particle cluster that moves from attacker to defender
        const startX = attackerSprite.x;
        const startY = attackerSprite.y;
        const endX = defenderSprite.x;
        const endY = defenderSprite.y;

        // Create a "projectile" cluster using pooled particle images
        const pool = ensurePool(scene);
        const projCount = Math.min(anim.particles.count, 6);
        const projParticles: Phaser.GameObjects.Arc[] = [];
        for (let i = 0; i < projCount; i++) {
          const color = anim.particles.colors[i % anim.particles.colors.length];
          const p = pool.acquire(
            startX + Phaser.Math.Between(-10, 10),
            startY + Phaser.Math.Between(-10, 10),
          ).setDepth(90).setTint(color).setAlpha(0.9)
           .setScale(Phaser.Math.FloatBetween(0.4, 0.7));
          projParticles.push(p as unknown as Phaser.GameObjects.Arc);
          particles.push(p as unknown as Phaser.GameObjects.Arc);
        }

        // Tween cluster to defender
        scene.tweens.add({
          targets: projParticles,
          x: endX,
          y: endY,
          duration: 350,
          ease: 'Power1',
          onComplete: () => {
            projParticles.forEach(p => pool.release(p as unknown as Phaser.GameObjects.Image));
            // Burst at defender
            spawnParticles(scene, endX, endY, anim.particles, particles);
            flashTarget(scene, defenderSprite);
            cleanupAfterDelay(scene, particles, resolve);
          },
        });
        break;
      }

      case 'beam': {
        // Draw a series of texture-based particles in a line from attacker to defender
        const pool = ensurePool(scene);
        const sx = attackerSprite.x;
        const sy = attackerSprite.y;
        const ex = defenderSprite.x;
        const ey = defenderSprite.y;
        const steps = 12;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const bx = sx + (ex - sx) * t;
          const by = sy + (ey - sy) * t;

          scene.time.delayedCall(i * 30, () => {
            const color = anim.particles.colors[i % anim.particles.colors.length];
            const p = pool.acquire(
              bx + Phaser.Math.Between(-6, 6),
              by + Phaser.Math.Between(-6, 6),
            ).setDepth(90).setTint(color).setAlpha(0.9)
             .setScale(Phaser.Math.FloatBetween(0.4, 0.8));
            particles.push(p as unknown as Phaser.GameObjects.Arc);

            scene.tweens.add({
              targets: p,
              alpha: 0,
              scaleX: 0,
              scaleY: 0,
              duration: 300,
              delay: 100,
              onComplete: () => pool.release(p),
            });
          });
        }

        scene.time.delayedCall(steps * 30 + 100, () => {
          spawnParticles(scene, ex, ey, anim.particles, particles);
          flashTarget(scene, defenderSprite);
          cleanupAfterDelay(scene, particles, resolve);
        });
        break;
      }

      case 'area': {
        // Particles fill the defender's area broadly
        const pool = ensurePool(scene);
        const cx = defenderSprite.x;
        const cy = defenderSprite.y;
        const count = anim.particles.count;
        for (let i = 0; i < count; i++) {
          scene.time.delayedCall(i * 40, () => {
            const color = anim.particles.colors[i % anim.particles.colors.length];
            const px = cx + Phaser.Math.Between(-60, 60);
            const py = cy + Phaser.Math.Between(-50, 50);
            const p = pool.acquire(px, py)
              .setDepth(90).setTint(color).setAlpha(0.8)
              .setScale(Phaser.Math.FloatBetween(0.3, 0.8));
            particles.push(p as unknown as Phaser.GameObjects.Arc);

            scene.tweens.add({
              targets: p,
              y: py + Phaser.Math.Between(-30, 30),
              alpha: 0,
              scaleX: anim.particles.scale.end,
              scaleY: anim.particles.scale.end,
              duration: anim.particles.lifespan,
              onComplete: () => pool.release(p),
            });
          });
        }

        scene.time.delayedCall(count * 40 + 200, () => {
          flashTarget(scene, defenderSprite);
          cleanupAfterDelay(scene, particles, resolve);
        });
        break;
      }

      case 'self': {
        // Particles glow around the attacker (buffs/heals)
        const pool = ensurePool(scene);
        const cx = attackerSprite.x;
        const cy = attackerSprite.y;
        for (let i = 0; i < anim.particles.count; i++) {
          const angle = (i / anim.particles.count) * Math.PI * 2;
          const dist = 20;
          const color = anim.particles.colors[i % anim.particles.colors.length];
          const p = pool.acquire(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
          ).setDepth(90).setTint(color).setAlpha(anim.particles.alpha.start)
           .setScale(0.5);
          particles.push(p as unknown as Phaser.GameObjects.Arc);

          scene.tweens.add({
            targets: p,
            x: cx + Math.cos(angle) * (dist + 25),
            y: cy + Math.sin(angle) * (dist + 25),
            alpha: 0,
            duration: anim.particles.lifespan,
            delay: i * 50,
            onComplete: () => pool.release(p),
          });
        }

        cleanupAfterDelay(scene, particles, resolve, anim.particles.lifespan + anim.particles.count * 50);
        break;
      }

      case 'shake': {
        // Screen shake + ground particles rising
        const cx = defenderSprite.x;
        const cy = defenderSprite.y;
        for (let i = 0; i < anim.particles.count; i++) {
          scene.time.delayedCall(i * 50, () => {
            const color = anim.particles.colors[i % anim.particles.colors.length];
            const px = cx + Phaser.Math.Between(-80, 80);
            const p = scene.add.circle(px, cy + 20, Phaser.Math.Between(4, 9), color, 1).setDepth(90);
            particles.push(p);

            scene.tweens.add({
              targets: p,
              y: cy - Phaser.Math.Between(30, 80),
              alpha: 0,
              duration: anim.particles.lifespan,
              onComplete: () => p.destroy(),
            });
          });
        }

        flashTarget(scene, defenderSprite);
        cleanupAfterDelay(scene, particles, resolve, anim.particles.count * 50 + anim.particles.lifespan);
        break;
      }

      default:
        resolve();
    }
  });
}

const PARTICLE_TEXTURE_KEY = '__move-particle';
const PARTICLE_TEXTURE_SIZE = 12;

/** Ensure a reusable circle texture exists for particle effects. */
function ensureParticleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PARTICLE_TEXTURE_KEY)) return;
  const gfx = scene.make.graphics({ x: 0, y: 0 }, false);
  const half = PARTICLE_TEXTURE_SIZE / 2;
  gfx.fillStyle(0xffffff, 1);
  gfx.fillCircle(half, half, half);
  gfx.generateTexture(PARTICLE_TEXTURE_KEY, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE);
  gfx.destroy();
}

/** Module-level singleton pool for move-particle images. */
let _pool: GameObjectPool | null = null;

/** Ensure the particle texture exists and return the shared pool. */
function ensurePool(scene: Phaser.Scene): GameObjectPool {
  ensureParticleTexture(scene);
  if (!_pool) {
    _pool = new GameObjectPool(scene, PARTICLE_TEXTURE_KEY);
  }
  return _pool;
}

/** Destroy the shared particle pool (call on scene shutdown). */
export function destroyPool(): void {
  if (_pool) {
    _pool.destroy();
    _pool = null;
  }
}

/** Spawn burst particles at a given point using a pre-generated texture. */
function spawnParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: ParticleConfig,
  tracker: Phaser.GameObjects.Arc[],
): void {
  const pool = ensurePool(scene);
  const burstCount = Math.min(config.count, 12);
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
    const speed = config.speed * (0.5 + Math.random() * 0.5);
    const color = config.colors[i % config.colors.length];

    const p = pool.acquire(x, y).setDepth(90)
      .setTint(color)
      .setAlpha(config.alpha.start)
      .setScale(Phaser.Math.FloatBetween(0.3, 0.8));
    // Store in tracker as any since cleanup uses destroy() which exists on Image too
    tracker.push(p as unknown as Phaser.GameObjects.Arc);

    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * speed * 0.4,
      y: y + Math.sin(angle) * speed * 0.4,
      scaleX: config.scale.end * 0.5,
      scaleY: config.scale.end * 0.5,
      alpha: config.alpha.end,
      duration: config.lifespan,
      onComplete: () => pool.release(p),
    });
  }
}

/** Brief flash on the defender sprite to indicate a hit. */
function flashTarget(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image): void {
  scene.tweens.add({
    targets: sprite,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
    repeat: 2,
  });
}

/** Wait for particles to expire then resolve. */
function cleanupAfterDelay(
  scene: Phaser.Scene,
  _particles: Phaser.GameObjects.Arc[],
  resolve: () => void,
  delay = 600,
): void {
  scene.time.delayedCall(delay, () => {
    resolve();
  });
}
