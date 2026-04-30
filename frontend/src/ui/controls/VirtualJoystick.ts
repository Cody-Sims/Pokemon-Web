import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';

const JOYSTICK_PRESETS: Record<string, { radius: number; thumb: number; deadZone: number }> = {
  small:  { radius: 45, thumb: 18, deadZone: 10 },
  medium: { radius: 60, thumb: 24, deadZone: 15 },
  large:  { radius: 80, thumb: 32, deadZone: 20 },
};

function getJoystickPreset(): { radius: number; thumb: number; deadZone: number } {
  try {
    const raw = localStorage.getItem('pokemon-web-settings');
    if (raw) {
      const s = JSON.parse(raw);
      const preset = (s.joystickSize && JOYSTICK_PRESETS[s.joystickSize])
        ? { ...JOYSTICK_PRESETS[s.joystickSize] }
        : { ...JOYSTICK_PRESETS.medium };
      // Override dead zone from slider setting (0.05–0.4 = fraction of radius)
      if (typeof s.deadZone === 'number' && s.deadZone > 0) {
        preset.deadZone = Math.round(preset.radius * s.deadZone);
      }
      return preset;
    }
  } catch { /* ignore */ }
  return JOYSTICK_PRESETS.medium;
}

/**
 * Virtual joystick that appears at the user's touch location.
 * Tap anywhere on the left 60% of the screen to summon the joystick base;
 * drag to move in one of 4 cardinal directions. Releasing hides the joystick.
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private container: Phaser.GameObjects.Container;
  private activeDirection: Direction | null = null;
  private originX = 0;
  private originY = 0;
  private activePointerId: number | null = null;
  /** Fraction of screen width (from left) where joystick can activate. */
  private activationZone = 0.6;
  private joystickRadius: number;
  private deadZone: number;
  private handlersAttached = false;
  private boundHandlers: { element: HTMLElement | EventTarget; event: string; handler: EventListener; options?: AddEventListenerOptions }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const preset = getJoystickPreset();
    this.joystickRadius = preset.radius;
    this.deadZone = preset.deadZone;

    // High-visibility controls setting
    let highVis = false;
    try {
      const raw = localStorage.getItem('pokemon-web-settings');
      if (raw) { highVis = JSON.parse(raw).highVisControls === 'true'; }
    } catch { /* ignore */ }
    const baseAlpha = highVis ? 0.7 : 0.35;
    const thumbAlpha = highVis ? 0.9 : 0.6;
    const strokeAlpha = highVis ? 0.9 : 0.5;
    const strokeWidth = highVis ? 3 : 2;

    this.container = scene.add.container(0, 0).setDepth(999).setScrollFactor(0).setVisible(false);

    // Outer ring
    this.base = scene.add.circle(0, 0, preset.radius, 0x334466, baseAlpha);
    this.base.setStrokeStyle(strokeWidth, 0x5577aa, strokeAlpha);

    // Inner thumb
    this.thumb = scene.add.circle(0, 0, preset.thumb, 0x5599cc, thumbAlpha);

    this.container.add([this.base, this.thumb]);

    if (!this.handlersAttached) {
      this.bindPointerEvents();
      this.handlersAttached = true;
    }
  }

  private bindPointerEvents(): void {
    const canvas = this.scene.game.canvas;

    const getGameCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = this.scene.cameras.main.width / rect.width;
      const scaleY = this.scene.cameras.main.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (this.activePointerId !== null) return; // Already tracking a touch
      if (!this.container.parentContainer?.visible && !this.scene.scene.isActive()) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const { x, y } = getGameCoords(t.clientX, t.clientY);

        // Only activate in the left portion of the screen
        const screenWidth = this.scene.cameras.main.width;
        if (x > screenWidth * this.activationZone) continue;

        this.activePointerId = t.identifier;
        this.originX = x;
        this.originY = y;
        this.container.setPosition(x, y);
        this.thumb.setPosition(0, 0);
        this.container.setVisible(true);
        this.activeDirection = null;
        break;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (this.activePointerId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== this.activePointerId) continue;

        const { x, y } = getGameCoords(t.clientX, t.clientY);
        const dx = x - this.originX;
        const dy = y - this.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Clamp thumb inside the base
        const clampedDist = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);
        this.thumb.setPosition(
          Math.cos(angle) * clampedDist,
          Math.sin(angle) * clampedDist,
        );

        // Calculate 4-way direction if past dead zone
        if (dist < this.deadZone) {
          this.activeDirection = null;
        } else {
          // Convert angle to 4-way direction
          // angle: -PI to PI, 0 = right
          const deg = angle * (180 / Math.PI);
          if (deg > -45 && deg <= 45) {
            this.activeDirection = 'right';
          } else if (deg > 45 && deg <= 135) {
            this.activeDirection = 'down';
          } else if (deg > -135 && deg <= -45) {
            this.activeDirection = 'up';
          } else {
            this.activeDirection = 'left';
          }
        }
        break;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (this.activePointerId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== this.activePointerId) continue;

        this.activePointerId = null;
        this.activeDirection = null;
        this.container.setVisible(false);
        this.thumb.setPosition(0, 0);
        break;
      }
    };

    // Mouse support for desktop testing
    let mouseDown = false;
    const handleMouseDown = (e: MouseEvent) => {
      if (this.activePointerId !== null) return;
      const { x, y } = getGameCoords(e.clientX, e.clientY);
      // Only activate in the left portion of the screen
      const screenWidth = this.scene.cameras.main.width;
      if (x > screenWidth * this.activationZone) return;

      mouseDown = true;
      this.activePointerId = -1; // sentinel for mouse
      this.originX = x;
      this.originY = y;
      this.container.setPosition(x, y);
      this.thumb.setPosition(0, 0);
      this.container.setVisible(true);
      this.activeDirection = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDown || this.activePointerId !== -1) return;

      const { x, y } = getGameCoords(e.clientX, e.clientY);
      const dx = x - this.originX;
      const dy = y - this.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clampedDist = Math.min(dist, this.joystickRadius);
      const angle = Math.atan2(dy, dx);

      this.thumb.setPosition(
        Math.cos(angle) * clampedDist,
        Math.sin(angle) * clampedDist,
      );

      if (dist < this.deadZone) {
        this.activeDirection = null;
      } else {
        const deg = angle * (180 / Math.PI);
        if (deg > -45 && deg <= 45) this.activeDirection = 'right';
        else if (deg > 45 && deg <= 135) this.activeDirection = 'down';
        else if (deg > -135 && deg <= -45) this.activeDirection = 'up';
        else this.activeDirection = 'left';
      }
    };

    const handleMouseUp = () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.activePointerId = null;
      this.activeDirection = null;
      this.container.setVisible(false);
      this.thumb.setPosition(0, 0);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    this.boundHandlers = [
      { element: canvas, event: 'touchstart', handler: handleTouchStart as EventListener, options: { passive: true } },
      { element: canvas, event: 'touchmove', handler: handleTouchMove as EventListener, options: { passive: true } },
      { element: canvas, event: 'touchend', handler: handleTouchEnd as EventListener, options: { passive: true } },
      { element: canvas, event: 'touchcancel', handler: handleTouchEnd as EventListener, options: { passive: true } },
      { element: canvas, event: 'mousedown', handler: handleMouseDown as EventListener },
      { element: canvas, event: 'mousemove', handler: handleMouseMove as EventListener },
      { element: canvas, event: 'mouseup', handler: handleMouseUp as EventListener },
    ];
  }

  getDirection(): Direction | null {
    return this.activeDirection;
  }

  isActive(): boolean {
    return this.activePointerId !== null;
  }

  /** Check if the joystick is tracking a specific pointer/touch ID. */
  isTrackingPointer(id: number): boolean {
    return this.activePointerId === id;
  }

  setVisible(visible: boolean): void {
    if (!visible) {
      this.container.setVisible(false);
      this.activeDirection = null;
      this.activePointerId = null;
    }
    // When set to visible=true we don't show immediately — it appears on touch
  }

  destroy(): void {
    for (const { element, event, handler } of this.boundHandlers) {
      element.removeEventListener(event, handler);
    }
    this.boundHandlers = [];
    this.handlersAttached = false;
    this.container.destroy(true);
  }
}
