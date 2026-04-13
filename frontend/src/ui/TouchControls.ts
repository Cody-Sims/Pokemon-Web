import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { VirtualJoystick } from '@ui/VirtualJoystick';

/** Max time (ms) between touchstart and touchend to count as a tap. */
const TAP_TIME_THRESHOLD = 300;
/** Max movement (px) during a touch to count as a tap. */
const TAP_DIST_THRESHOLD = 15;

interface TrackedTouch {
  startTime: number;
  startX: number;
  startY: number;
}

/**
 * Virtual touch controls overlay: floating joystick + screen-tap confirm.
 * Auto-detected via navigator.maxTouchPoints; hidden on desktop.
 *
 * The virtual joystick appears at the user's touch location (left 60% of screen).
 * Tapping anywhere on screen acts as spacebar / confirm for interactions and dialog.
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private joystick: VirtualJoystick;
  private joystickEnabled = true;
  private confirmPressed = false;

  // Tap tracking
  private trackedTouches = new Map<number, TrackedTouch>();

  // DOM controls state
  private domActive = false;
  private domDirection: Direction | null = null;
  private domJoystickPointerId: number | null = null;
  private domJoystickOriginX = 0;
  private domJoystickOriginY = 0;
  private updatingLayout = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);

    // Create joystick (activates on left 60% of screen)
    this.joystick = new VirtualJoystick(scene);

    // Bind tap detection on canvas for confirm
    this.bindTapDetection();

    // Re-layout on resize
    scene.scale.on('resize', () => {
      this.updateDOMLayout();
    });

    // Initialize DOM controls for the area below the canvas
    this.initDOMControls();
  }

  /** Detect screen taps (quick touch+release) as confirm input. */
  private bindTapDetection(): void {
    const canvas = this.scene.game.canvas;

    canvas.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.trackedTouches.set(t.identifier, {
          startTime: performance.now(),
          startX: t.clientX,
          startY: t.clientY,
        });
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tracked = this.trackedTouches.get(t.identifier);
        this.trackedTouches.delete(t.identifier);
        if (!tracked) continue;

        // Don't count as tap if joystick was tracking this touch
        if (this.joystick.isTrackingPointer(t.identifier)) continue;

        const elapsed = performance.now() - tracked.startTime;
        const dx = t.clientX - tracked.startX;
        const dy = t.clientY - tracked.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (elapsed < TAP_TIME_THRESHOLD && dist < TAP_DIST_THRESHOLD) {
          this.confirmPressed = true;
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.trackedTouches.delete(e.changedTouches[i].identifier);
      }
    }, { passive: true });

    // Mouse tap for desktop testing
    let mouseDownTime = 0;
    let mouseStartX = 0;
    let mouseStartY = 0;
    canvas.addEventListener('mousedown', (e) => {
      mouseDownTime = performance.now();
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    });
    canvas.addEventListener('mouseup', (e) => {
      const elapsed = performance.now() - mouseDownTime;
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (elapsed < TAP_TIME_THRESHOLD && dist < TAP_DIST_THRESHOLD) {
        this.confirmPressed = true;
      }
    });
  }

  /** Poll touch direction from the virtual joystick (or null). */
  getDirection(): Direction | null {
    // DOM joystick takes priority when active
    if (this.domDirection !== null) return this.domDirection;
    if (!this.joystickEnabled) return null;
    return this.joystick.getDirection();
  }

  /** Poll and consume confirm press. */
  consumeConfirm(): boolean {
    if (this.confirmPressed) {
      this.confirmPressed = false;
      return true;
    }
    return false;
  }

  /** Poll and consume cancel press (no longer provided via touch). */
  consumeCancel(): boolean {
    return false;
  }

  /** Show/hide the joystick (hide during menus, show during overworld). */
  setDpadVisible(visible: boolean): void {
    this.joystickEnabled = visible;
    if (!visible) {
      this.joystick.setVisible(false);
      this.domDirection = null;
    }
  }

  /** Show/hide entire control overlay. */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    if (!visible) this.joystick.setVisible(false);
    // Toggle DOM controls visibility alongside in-canvas
    const controlsEl = document.getElementById('mobile-controls');
    if (controlsEl) {
      if (!visible) {
        controlsEl.style.display = 'none';
      } else {
        this.updateDOMLayout();
      }
    }
  }

  /** Check if the device supports touch. */
  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  // ── DOM Controls (below-canvas control bar) ──────────────────────

  private initDOMControls(): void {
    const controlsEl = document.getElementById('mobile-controls');
    if (!controlsEl) return;

    this.setupDOMJoystick();

    // Initial layout + listen for orientation/resize changes
    requestAnimationFrame(() => this.updateDOMLayout());
    window.addEventListener('resize', () => this.updateDOMLayout());
  }

  private updateDOMLayout(): void {
    if (this.updatingLayout) return;
    this.updatingLayout = true;

    const canvas = this.scene.game.canvas;
    const controlsEl = document.getElementById('mobile-controls');
    if (!canvas || !controlsEl) {
      this.updatingLayout = false;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const bottomSpace = window.innerHeight - rect.bottom;

    if (bottomSpace > 100) {
      // Enough space below canvas — show DOM controls, hide in-canvas
      controlsEl.style.top = rect.bottom + 'px';
      controlsEl.style.height = bottomSpace + 'px';
      controlsEl.style.display = 'flex';
      this.domActive = true;
      this.container.setVisible(false);
    } else {
      // Not enough space — hide DOM controls, show in-canvas
      controlsEl.style.display = 'none';
      this.domActive = false;
      this.container.setVisible(true);
    }

    this.updatingLayout = false;
  }

  private setupDOMJoystick(): void {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!zone || !base || !thumb) return;

    const DEAD_ZONE = 15;
    const RADIUS = 60;

    zone.addEventListener('touchstart', (e) => {
      if (this.domJoystickPointerId !== null) return;
      const t = e.changedTouches[0];
      this.domJoystickPointerId = t.identifier;
      const zoneRect = zone.getBoundingClientRect();
      this.domJoystickOriginX = t.clientX;
      this.domJoystickOriginY = t.clientY;

      base.style.left = (t.clientX - zoneRect.left) + 'px';
      base.style.top = (t.clientY - zoneRect.top) + 'px';
      thumb.style.left = base.style.left;
      thumb.style.top = base.style.top;
      base.style.display = 'block';
      thumb.style.display = 'block';
      this.domDirection = null;
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== this.domJoystickPointerId) continue;

        const dx = t.clientX - this.domJoystickOriginX;
        const dy = t.clientY - this.domJoystickOriginY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, RADIUS);
        const angle = Math.atan2(dy, dx);

        const zoneRect = zone.getBoundingClientRect();
        thumb.style.left = (this.domJoystickOriginX - zoneRect.left + Math.cos(angle) * clampedDist) + 'px';
        thumb.style.top = (this.domJoystickOriginY - zoneRect.top + Math.sin(angle) * clampedDist) + 'px';

        if (dist < DEAD_ZONE) {
          this.domDirection = null;
        } else {
          const deg = angle * (180 / Math.PI);
          if (deg > -45 && deg <= 45) this.domDirection = 'right';
          else if (deg > 45 && deg <= 135) this.domDirection = 'down';
          else if (deg > -135 && deg <= -45) this.domDirection = 'up';
          else this.domDirection = 'left';
        }
        break;
      }
    }, { passive: true });

    const endHandler = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.domJoystickPointerId) {
          this.domJoystickPointerId = null;
          this.domDirection = null;
          base.style.display = 'none';
          thumb.style.display = 'none';
          break;
        }
      }
    };

    zone.addEventListener('touchend', endHandler, { passive: true });
    zone.addEventListener('touchcancel', endHandler, { passive: true });
  }

  destroy(): void {
    this.container.destroy(true);
    this.joystick.destroy();
  }
}
