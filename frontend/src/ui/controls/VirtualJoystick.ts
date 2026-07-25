import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { COLORS, mobileScale, minTouchTarget } from '@ui/theme';
import {
  clampJoystickVector,
  isPointOutsideRect,
  resolveJoystickDirection,
} from '@ui/controls/touch-geometry';

const JOYSTICK_PRESETS: Record<string, { radius: number; thumb: number; deadZone: number }> = {
  small: { radius: 45, thumb: 18, deadZone: 10 },
  medium: { radius: 60, thumb: 24, deadZone: 15 },
  large: { radius: 80, thumb: 32, deadZone: 20 },
};

function getJoystickPreset(): { radius: number; thumb: number; deadZone: number } {
  const scale = mobileScale();
  const target = minTouchTarget();
  const scaledPresets: Record<string, { radius: number; thumb: number; deadZone: number }> = {
    small: {
      radius: Math.max(Math.round(42 * scale), target),
      thumb: Math.max(Math.round(18 * scale), Math.round(target * 0.42)),
      deadZone: Math.max(10, Math.round(9 * scale)),
    },
    medium: {
      radius: Math.max(Math.round(56 * scale), target + 8),
      thumb: Math.max(Math.round(22 * scale), Math.round(target * 0.48)),
      deadZone: Math.max(12, Math.round(12 * scale)),
    },
    large: {
      radius: Math.max(Math.round(72 * scale), target + 24),
      thumb: Math.max(Math.round(28 * scale), Math.round(target * 0.56)),
      deadZone: Math.max(16, Math.round(16 * scale)),
    },
  };
  try {
    const raw = localStorage.getItem('pokemon-web-settings');
    if (raw) {
      const s = JSON.parse(raw);
      const preset =
        s.joystickSize && scaledPresets[s.joystickSize]
          ? { ...scaledPresets[s.joystickSize] }
          : { ...scaledPresets.medium };
      // Override dead zone from slider setting (0.05–0.4 = fraction of radius)
      if (typeof s.deadZone === 'number' && s.deadZone > 0) {
        preset.deadZone = Math.round(preset.radius * s.deadZone);
      }
      return preset;
    }
  } catch {
    /* ignore */
  }
  return scaledPresets.medium;
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
  private thumbRadius: number;
  private deadZone: number;
  private handlersAttached = false;
  private boundHandlers: {
    element: HTMLElement | EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }[] = [];
  private readonly onActivate?: () => void;
  private destroyed = false;

  constructor(scene: Phaser.Scene, onActivate?: () => void) {
    this.scene = scene;
    this.onActivate = onActivate;
    const preset = getJoystickPreset();
    this.joystickRadius = preset.radius;
    this.thumbRadius = preset.thumb;
    this.deadZone = preset.deadZone;

    // High-visibility controls setting
    let highVis = false;
    try {
      const raw = localStorage.getItem('pokemon-web-settings');
      if (raw) {
        highVis = JSON.parse(raw).highVisControls === 'true';
      }
    } catch {
      /* ignore */
    }
    const baseAlpha = highVis ? 0.7 : 0.35;
    const thumbAlpha = highVis ? 0.9 : 0.6;
    const strokeAlpha = highVis ? 0.9 : 0.5;
    const strokeWidth = highVis ? 3 : 2;

    this.container = scene.add.container(0, 0).setDepth(999).setScrollFactor(0).setVisible(false);

    // Outer ring
    this.base = scene.add.circle(0, 0, preset.radius, COLORS.bgInput, baseAlpha);
    this.base.setStrokeStyle(strokeWidth, COLORS.borderLight, strokeAlpha);

    // Inner thumb
    this.thumb = scene.add.circle(0, 0, preset.thumb, COLORS.expBlue, thumbAlpha);

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

    const reset = () => this.resetActivePointer();

    const handleTouchStart = (e: TouchEvent) => {
      if (this.activePointerId !== null) return; // Already tracking a touch
      if (
        !this.container.parentContainer?.visible ||
        !this.scene.scene.manager.getScenes(true).includes(this.scene)
      )
        return;

      this.refreshSettings();
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
        this.onActivate?.();
        break;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (this.activePointerId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== this.activePointerId) continue;

        const { x, y } = getGameCoords(t.clientX, t.clientY);
        const rect = canvas.getBoundingClientRect();
        if (isPointOutsideRect(t.clientX, t.clientY, rect, 24)) {
          reset();
          break;
        }
        const dx = x - this.originX;
        const dy = y - this.originY;
        const vector = clampJoystickVector(dx, dy, this.joystickRadius);
        this.thumb.setPosition(vector.x, vector.y);
        this.activeDirection = resolveJoystickDirection(dx, dy, {
          deadZone: this.deadZone,
          previousDirection: this.activeDirection,
        });
        break;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (this.activePointerId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== this.activePointerId) continue;

        reset();
        break;
      }
    };

    // Mouse support for desktop testing
    let mouseDown = false;
    const handleMouseDown = (e: MouseEvent) => {
      if (this.activePointerId !== null) return;
      this.refreshSettings();
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
      this.onActivate?.();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDown || this.activePointerId !== -1) return;

      const { x, y } = getGameCoords(e.clientX, e.clientY);
      const rect = canvas.getBoundingClientRect();
      if (isPointOutsideRect(e.clientX, e.clientY, rect, 24)) {
        mouseDown = false;
        reset();
        return;
      }
      const dx = x - this.originX;
      const dy = y - this.originY;
      const vector = clampJoystickVector(dx, dy, this.joystickRadius);
      this.thumb.setPosition(vector.x, vector.y);
      this.activeDirection = resolveJoystickDirection(dx, dy, {
        deadZone: this.deadZone,
        previousDirection: this.activeDirection,
      });
    };

    const handleMouseUp = () => {
      if (!mouseDown) return;
      mouseDown = false;
      reset();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', reset);
    window.addEventListener('pagehide', reset);
    document.addEventListener('visibilitychange', reset);

    this.boundHandlers = [
      {
        element: canvas,
        event: 'touchstart',
        handler: handleTouchStart as EventListener,
        options: { passive: true },
      },
      {
        element: canvas,
        event: 'touchmove',
        handler: handleTouchMove as EventListener,
        options: { passive: true },
      },
      {
        element: canvas,
        event: 'touchend',
        handler: handleTouchEnd as EventListener,
        options: { passive: true },
      },
      {
        element: canvas,
        event: 'touchcancel',
        handler: handleTouchEnd as EventListener,
        options: { passive: true },
      },
      { element: canvas, event: 'mousedown', handler: handleMouseDown as EventListener },
      { element: canvas, event: 'mousemove', handler: handleMouseMove as EventListener },
      { element: canvas, event: 'mouseup', handler: handleMouseUp as EventListener },
      { element: window, event: 'blur', handler: reset as EventListener },
      { element: window, event: 'pagehide', handler: reset as EventListener },
      { element: document, event: 'visibilitychange', handler: reset as EventListener },
    ];
  }

  private refreshSettings(): void {
    const preset = getJoystickPreset();
    this.joystickRadius = preset.radius;
    this.thumbRadius = preset.thumb;
    this.deadZone = preset.deadZone;
    this.base.setRadius(this.joystickRadius);
    this.thumb.setRadius(this.thumbRadius);
  }

  private resetActivePointer(): void {
    this.activePointerId = null;
    this.activeDirection = null;
    this.container.setVisible(false);
    this.thumb.setPosition(0, 0);
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
      this.resetActivePointer();
    }
    // When set to visible=true we don't show immediately — it appears on touch
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const { element, event, handler } of this.boundHandlers) {
      element.removeEventListener(event, handler);
    }
    this.boundHandlers = [];
    this.handlersAttached = false;
    if (this.container.active) this.container.destroy(true);
  }
}
