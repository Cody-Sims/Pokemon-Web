import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { VirtualJoystick } from '@ui/controls/VirtualJoystick';

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
interface ButtonDef {
  cx: number;
  cy: number;
  radius: number;
  action: 'confirm' | 'cancel';
  bg: Phaser.GameObjects.Arc;
}

export class TouchControls {
  private static activeInstance?: TouchControls;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private buttonContainer!: Phaser.GameObjects.Container;
  private joystick: VirtualJoystick;
  private joystickEnabled = true;
  private confirmPressed = false;
  private cancelPressed = false;
  private menuBtn!: Phaser.GameObjects.Container;
  private readonly menuBtnSize = 36;
  private readonly btnSize = 72;
  private readonly padding = 16;
  private buttons: ButtonDef[] = [];

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
    TouchControls.activeInstance = this;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.buttonContainer = scene.add.container(0, 0);
    this.container.add([this.buttonContainer]);

    // A/B buttons (bottom-right)
    this.createButtons();
    this.layout();
    this.bindActionPointer();

    // Create joystick (activates on left 60% of screen)
    this.joystick = new VirtualJoystick(scene);

    // Small menu button (top-right)
    this.createMenuButton();
    this.layoutMenuButton();

    // Bind tap detection on canvas for confirm
    this.bindTapDetection();

    // Re-layout on resize
    scene.scale.on('resize', () => {
      this.layout();
      this.layoutMenuButton();
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

        // Don't count as tap if it hit the menu button or A/B buttons
        if (this.isMenuButtonHit(tracked.startX, tracked.startY)) continue;
        if (this.isActionButtonHit(tracked.startX, tracked.startY)) continue;

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

  /** Poll and consume cancel/menu press. */
  consumeCancel(): boolean {
    if (this.cancelPressed) {
      this.cancelPressed = false;
      return true;
    }
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

  /** Get the active TouchControls instance (if any). */
  static getInstance(): TouchControls | undefined {
    return TouchControls.activeInstance;
  }

  /** Drain any pending confirm/cancel without returning them. */
  drain(): void {
    this.confirmPressed = false;
    this.cancelPressed = false;
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
    this.setupDOMButtons();

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

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    this.buttonContainer.setPosition(width - this.padding - this.btnSize / 2 - 8, height - this.padding - this.btnSize - 40);
    this.recalcButtonPositions();
  }

  private recalcButtonPositions(): void {
    const btnX = this.buttonContainer.x;
    const btnY = this.buttonContainer.y;
    for (const btn of this.buttons) {
      const localX = btn.bg.parentContainer?.x ?? 0;
      const localY = btn.bg.parentContainer?.y ?? 0;
      btn.cx = btnX + localX;
      btn.cy = btnY + localY;
    }
  }

  /** Check if a game-coord point hits one of the action buttons. */
  private isActionButtonHitGame(gx: number, gy: number): boolean {
    for (const btn of this.buttons) {
      const dx = gx - btn.cx;
      const dy = gy - btn.cy;
      const r = btn.radius + 10;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  }

  /** Check if a client-coord tap hit an action button. */
  private isActionButtonHit(clientX: number, clientY: number): boolean {
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = this.scene.cameras.main.width / rect.width;
    const scaleY = this.scene.cameras.main.height / rect.height;
    const gx = (clientX - rect.left) * scaleX;
    const gy = (clientY - rect.top) * scaleY;
    return this.isActionButtonHitGame(gx, gy);
  }

  private bindActionPointer(): void {
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

    const handleDown = (clientX: number, clientY: number) => {
      if (!this.container.visible) return;
      const { x: px, y: py } = getGameCoords(clientX, clientY);
      for (const btn of this.buttons) {
        const dx = px - btn.cx;
        const dy = py - btn.cy;
        if (dx * dx + dy * dy <= btn.radius * btn.radius) {
          if (btn.action === 'confirm') {
            this.confirmPressed = true;
            btn.bg.fillAlpha = 0.9;
          } else if (btn.action === 'cancel') {
            this.cancelPressed = true;
            btn.bg.fillAlpha = 0.9;
          }
          return;
        }
      }
    };

    const handleUp = () => {
      for (const btn of this.buttons) {
        btn.bg.fillAlpha = 0.5;
      }
    };

    canvas.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        handleDown(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => handleUp(), { passive: true });
    canvas.addEventListener('touchcancel', () => handleUp(), { passive: true });
    canvas.addEventListener('mousedown', (e) => handleDown(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => handleUp());
  }

  private createButtons(): void {
    const aBtn = this.makeActionButton(0, -48, 'A', 0x44aa55, 'confirm');
    const bBtn = this.makeActionButton(0, 48, 'B', 0xaa4444, 'cancel');
    this.buttonContainer.add([aBtn, bBtn]);
  }

  private makeActionButton(x: number, y: number, label: string, color: number, action: 'confirm' | 'cancel'): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const radius = this.btnSize * 0.48;
    const bg = this.scene.add.circle(0, 0, radius, color, 0.5);
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([bg, txt]);
    this.buttons.push({ cx: 0, cy: 0, radius, action, bg });
    return c;
  }

  /** Check if a client-coordinate point hits the menu button area. */
  private isMenuButtonHit(clientX: number, clientY: number): boolean {
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = this.scene.cameras.main.width / rect.width;
    const scaleY = this.scene.cameras.main.height / rect.height;
    const gx = (clientX - rect.left) * scaleX;
    const gy = (clientY - rect.top) * scaleY;
    const dx = gx - this.menuBtn.x;
    const dy = gy - this.menuBtn.y;
    const r = this.menuBtnSize / 2 + 10; // generous hit margin
    return dx * dx + dy * dy <= r * r;
  }

  private createMenuButton(): void {
    const r = this.menuBtnSize / 2;
    const bg = this.scene.add.circle(0, 0, r, 0x334466, 0.55);
    bg.setStrokeStyle(1.5, 0x5577aa, 0.6);

    // Draw three horizontal bars (hamburger icon)
    const barW = r * 0.9;
    const barH = 2;
    const gap = 5;
    const bars = this.scene.add.graphics();
    bars.fillStyle(0xffffff, 0.9);
    for (let i = -1; i <= 1; i++) {
      bars.fillRect(-barW, i * gap - barH / 2, barW * 2, barH);
    }

    this.menuBtn = this.scene.add.container(0, 0, [bg, bars])
      .setSize(this.menuBtnSize, this.menuBtnSize);
    this.container.add(this.menuBtn);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.cancelPressed = true;
      bg.fillAlpha = 0.85;
    });
    bg.on('pointerup', () => { bg.fillAlpha = 0.55; });
    bg.on('pointerout', () => { bg.fillAlpha = 0.55; });
  }

  private layoutMenuButton(): void {
    const { width } = this.scene.cameras.main;
    this.menuBtn.setPosition(width - this.menuBtnSize / 2 - 12, this.menuBtnSize / 2 + 12);
  }

  private setupDOMButtons(): void {
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');

    if (btnA) {
      btnA.addEventListener('touchstart', () => {
        this.confirmPressed = true;
        btnA.classList.add('pressed');
      }, { passive: true });
      btnA.addEventListener('touchend', () => btnA.classList.remove('pressed'), { passive: true });
      btnA.addEventListener('touchcancel', () => btnA.classList.remove('pressed'), { passive: true });
    }

    if (btnB) {
      btnB.addEventListener('touchstart', () => {
        this.cancelPressed = true;
        btnB.classList.add('pressed');
      }, { passive: true });
      btnB.addEventListener('touchend', () => btnB.classList.remove('pressed'), { passive: true });
      btnB.addEventListener('touchcancel', () => btnB.classList.remove('pressed'), { passive: true });
    }
  }

  destroy(): void {
    this.container.destroy(true);
    this.joystick.destroy();
    this.buttons = [];
  }
}
