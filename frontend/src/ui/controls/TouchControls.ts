import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { VirtualJoystick } from '@ui/controls/VirtualJoystick';
import { hapticTap } from '@utils/haptics';

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

  // Track which pointer/touch IDs are pressing which buttons
  private activeButtonTouches = new Map<number, ButtonDef>();
  private baseAlpha = 0.5;

  // Tap tracking
  private trackedTouches = new Map<number, TrackedTouch>();

  // Double-tap run toggle
  private runToggled = false;
  private lastJoystickTapTime = 0;
  private readonly DOUBLE_TAP_THRESHOLD = 400;

  // DOM controls state
  private domActive = false;
  private domDirection: Direction | null = null;
  private domJoystickPointerId: number | null = null;
  private domJoystickOriginX = 0;
  private domJoystickOriginY = 0;
  private updatingLayout = false;
  private boundHandlers: { element: EventTarget; event: string; handler: EventListener }[] = [];

  /** Register and track an event listener for cleanup. */
  private trackListener(element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    element.addEventListener(event, handler, options);
    this.boundHandlers.push({ element, event, handler });
  }

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

    const onTouchStart = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
        this.trackedTouches.set(t.identifier, {
          startTime: performance.now(),
          startX: t.clientX,
          startY: t.clientY,
        });
      }
    };

    const onTouchEnd = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
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
          hapticTap();
        }
      }
    };

    const onTouchCancel = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        this.trackedTouches.delete(te.changedTouches[i].identifier);
      }
    };

    // Mouse tap for desktop testing
    let mouseDownTime = 0;
    let mouseStartX = 0;
    let mouseStartY = 0;
    const onMouseDown = (e: Event) => {
      const me = e as MouseEvent;
      mouseDownTime = performance.now();
      mouseStartX = me.clientX;
      mouseStartY = me.clientY;
    };
    const onMouseUp = (e: Event) => {
      const me = e as MouseEvent;
      const elapsed = performance.now() - mouseDownTime;
      const dx = me.clientX - mouseStartX;
      const dy = me.clientY - mouseStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (elapsed < TAP_TIME_THRESHOLD && dist < TAP_DIST_THRESHOLD) {
        this.confirmPressed = true;
        hapticTap();
      }
    };

    this.trackListener(canvas, 'touchstart', onTouchStart, { passive: true });
    this.trackListener(canvas, 'touchend', onTouchEnd, { passive: true });
    this.trackListener(canvas, 'touchcancel', onTouchCancel, { passive: true });
    this.trackListener(canvas, 'mousedown', onMouseDown);
    this.trackListener(canvas, 'mouseup', onMouseUp);
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

  /** Whether the run toggle is active (double-tap joystick). */
  isRunToggled(): boolean {
    return this.runToggled;
  }

  /** Reset run toggle (e.g., when stopping movement). */
  resetRunToggle(): void {
    this.runToggled = false;
  }

  /** Call on each joystick activation to detect double-tap. */
  notifyJoystickActivated(): void {
    const now = performance.now();
    if (now - this.lastJoystickTapTime < this.DOUBLE_TAP_THRESHOLD) {
      this.runToggled = !this.runToggled;
      hapticTap();
    }
    this.lastJoystickTapTime = now;
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
    const resizeHandler = () => this.updateDOMLayout();
    this.trackListener(window, 'resize', resizeHandler);
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

    const isLandscape = window.innerWidth > window.innerHeight;
    const rect = canvas.getBoundingClientRect();
    const bottomSpace = window.innerHeight - rect.bottom;

    if (isLandscape && window.innerHeight <= 500) {
      // Landscape on phone — use side-panel layout (CSS handles positioning)
      controlsEl.style.top = '';
      controlsEl.style.height = '';
      controlsEl.style.display = 'flex';
      this.domActive = true;
      this.container.setVisible(false);
    } else if (bottomSpace > 100) {
      // Portrait with space below canvas — show DOM controls below
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

    const onStart = (e: Event) => {
      const te = e as TouchEvent;
      if (this.domJoystickPointerId !== null) return;
      const t = te.changedTouches[0];
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
    };

    const onMove = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
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
    };

    const onEnd = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        if (te.changedTouches[i].identifier === this.domJoystickPointerId) {
          this.domJoystickPointerId = null;
          this.domDirection = null;
          base.style.display = 'none';
          thumb.style.display = 'none';
          break;
        }
      }
    };

    this.trackListener(zone, 'touchstart', onStart, { passive: true });
    this.trackListener(zone, 'touchmove', onMove, { passive: true });
    this.trackListener(zone, 'touchend', onEnd, { passive: true });
    this.trackListener(zone, 'touchcancel', onEnd, { passive: true });
  }

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    const oneHanded = this.readSetting('oneHandedMode') ?? 'off';
    if (oneHanded === 'left') {
      // Buttons on the left side for one-handed left grip
      this.buttonContainer.setPosition(this.padding + this.btnSize / 2 + 8, height - this.padding - this.btnSize - 40);
    } else {
      this.buttonContainer.setPosition(width - this.padding - this.btnSize / 2 - 8, height - this.padding - this.btnSize - 40);
    }
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

    const handleDown = (clientX: number, clientY: number, touchId = -1) => {
      if (!this.container.visible) return;
      const { x: px, y: py } = getGameCoords(clientX, clientY);
      for (const btn of this.buttons) {
        const dx = px - btn.cx;
        const dy = py - btn.cy;
        if (dx * dx + dy * dy <= btn.radius * btn.radius) {
          if (btn.action === 'confirm') {
            this.confirmPressed = true;
            hapticTap();
          } else if (btn.action === 'cancel') {
            this.cancelPressed = true;
            hapticTap();
          }
          btn.bg.fillAlpha = 0.9;
          if (touchId >= 0) this.activeButtonTouches.set(touchId, btn);
          return;
        }
      }
    };

    const handleUp = (touchId = -1) => {
      if (touchId >= 0) {
        const btn = this.activeButtonTouches.get(touchId);
        if (btn) {
          btn.bg.fillAlpha = this.baseAlpha;
          this.activeButtonTouches.delete(touchId);
        }
      } else {
        // Mouse: reset all
        for (const btn of this.buttons) {
          btn.bg.fillAlpha = this.baseAlpha;
        }
        this.activeButtonTouches.clear();
      }
    };

    const onActionTouchStart = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
        handleDown(t.clientX, t.clientY, t.identifier);
      }
    };
    const onActionTouchEnd = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        handleUp(te.changedTouches[i].identifier);
      }
    };
    const onActionMouseDown = (e: Event) => { const me = e as MouseEvent; handleDown(me.clientX, me.clientY); };
    const onActionMouseUp = () => handleUp();

    this.trackListener(canvas, 'touchstart', onActionTouchStart, { passive: true });
    this.trackListener(canvas, 'touchend', onActionTouchEnd, { passive: true });
    this.trackListener(canvas, 'touchcancel', onActionTouchEnd, { passive: true });
    this.trackListener(canvas, 'mousedown', onActionMouseDown);
    this.trackListener(canvas, 'mouseup', onActionMouseUp);
  }

  private createButtons(): void {
    const swapped = this.readSetting('swapAB') === 'true';
    const highVis = this.readSetting('highVisControls') === 'true';
    const aAction: 'confirm' | 'cancel' = swapped ? 'cancel' : 'confirm';
    const bAction: 'confirm' | 'cancel' = swapped ? 'confirm' : 'cancel';
    this.baseAlpha = highVis ? 0.85 : 0.5;
    const stroke = highVis ? 3 : 0;
    const aBtn = this.makeActionButton(0, -48, swapped ? 'B' : 'A', 0x44aa55, aAction, this.baseAlpha, stroke);
    const bBtn = this.makeActionButton(0, 48, swapped ? 'A' : 'B', 0xaa4444, bAction, this.baseAlpha, stroke);
    this.buttonContainer.add([aBtn, bBtn]);
  }

  private makeActionButton(x: number, y: number, label: string, color: number, action: 'confirm' | 'cancel', alpha = 0.5, strokeWidth = 0): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const radius = this.btnSize * 0.48;
    const bg = this.scene.add.circle(0, 0, radius, color, alpha);
    if (strokeWidth > 0) bg.setStrokeStyle(strokeWidth, 0xffffff, 0.9);
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([bg, txt]);
    this.buttons.push({ cx: 0, cy: 0, radius, action, bg });
    return c;
  }

  /** Read a setting from localStorage (same key GameManager uses). */
  private readSetting(key: string): string | undefined {
    try {
      const raw = localStorage.getItem('pokemon-web-settings');
      if (raw) {
        const s = JSON.parse(raw);
        return s[key] != null ? String(s[key]) : undefined;
      }
    } catch { /* ignore */ }
    return undefined;
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
    const swapped = this.readSetting('swapAB') === 'true';

    if (btnA) {
      const aAction = swapped ? 'cancel' : 'confirm';
      const aStart = () => {
        if (aAction === 'confirm') this.confirmPressed = true;
        else this.cancelPressed = true;
        btnA.classList.add('pressed');
      };
      const aEnd = () => btnA.classList.remove('pressed');
      this.trackListener(btnA, 'touchstart', aStart, { passive: true });
      this.trackListener(btnA, 'touchend', aEnd, { passive: true });
      this.trackListener(btnA, 'touchcancel', aEnd, { passive: true });
    }

    if (btnB) {
      const bAction = swapped ? 'confirm' : 'cancel';
      const bStart = () => {
        if (bAction === 'confirm') this.confirmPressed = true;
        else this.cancelPressed = true;
        btnB.classList.add('pressed');
      };
      const bEnd = () => btnB.classList.remove('pressed');
      this.trackListener(btnB, 'touchstart', bStart, { passive: true });
      this.trackListener(btnB, 'touchend', bEnd, { passive: true });
      this.trackListener(btnB, 'touchcancel', bEnd, { passive: true });
    }

    const menuEl = document.getElementById('mobile-menu-btn');
    if (menuEl) {
      const menuStart = (e: Event) => { e.preventDefault(); this.cancelPressed = true; };
      this.trackListener(menuEl, 'touchstart', menuStart);
    }
  }

  destroy(): void {
    for (const { element, event, handler } of this.boundHandlers) {
      element.removeEventListener(event, handler);
    }
    this.boundHandlers = [];
    this.container.destroy(true);
    this.joystick.destroy();
    this.buttons = [];
    if (TouchControls.activeInstance === this) {
      TouchControls.activeInstance = undefined;
    }
  }
}
