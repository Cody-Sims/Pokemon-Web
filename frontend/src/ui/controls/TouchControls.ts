import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { VirtualJoystick } from '@ui/controls/VirtualJoystick';
import { hapticTap as vibrateTap } from '@utils/haptics';
import { isReducedMotion } from '@utils/accessibility';
import { getGameSafeAreaInsets, resetSafeAreaCache } from '@utils/safe-area';
import { COLORS, FONTS, mobileFontPx, mobileScale, minTouchTarget, SPACING } from '@ui/theme';
import {
  clampJoystickVector,
  computeTouchControlLayout,
  computeTouchMetrics,
  isPointOutsideRect,
  resolveJoystickDirection,
  type OneHandedMode,
} from '@ui/controls/touch-geometry';

/** Max time (ms) between touchstart and touchend to count as a tap. */
const TAP_TIME_THRESHOLD = 300;
/** Max movement (px) during a touch to count as a tap. */
const TAP_DIST_THRESHOLD = 15;
/** Min vertical distance (px) for a touch to count as a swipe. */
const SWIPE_DIST_THRESHOLD = 30;
/** Max time (ms) for a touch to count as a swipe. */
const SWIPE_TIME_THRESHOLD = 400;

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
  label: Phaser.GameObjects.Text;
  container: Phaser.GameObjects.Container;
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
  private swipeUpPressed = false;
  private swipeDownPressed = false;
  private menuBtn!: Phaser.GameObjects.Container;
  /** Background circle of the menu button so we can adjust press feedback. */
  private menuBtnBg!: Phaser.GameObjects.Arc;
  private menuBtnSize: number = 48;
  private btnSize: number = 72;
  private padding: number = SPACING.md;
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
  private domDirection: Direction | null = null;
  private domJoystickPointerId: number | null = null;
  private domJoystickOriginX = 0;
  private domJoystickOriginY = 0;
  private domJoystickRadius = 60;
  private domJoystickDeadZone = 15;
  private overlayVisible = true;
  private updatingLayout = false;
  private layoutPending = false;
  private boundHandlers: { element: EventTarget; event: string; handler: EventListener }[] = [];
  private readonly scaleResizeHandler: () => void;
  private readonly sceneShutdownHandler: () => void;
  private readonly sceneHiddenHandler: () => void;
  private readonly sceneShownHandler: () => void;
  private destroyed = false;
  private sceneLifecycleHidden = false;
  private lifecycleInterval?: ReturnType<typeof window.setInterval>;

  /** Register and track an event listener for cleanup. */
  private trackListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    element.addEventListener(event, handler, options);
    this.boundHandlers.push({ element, event, handler });
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    TouchControls.activeInstance?.destroy();
    TouchControls.activeInstance = this;
    this.scaleResizeHandler = () => {
      resetSafeAreaCache();
      this.layout();
      this.layoutMenuButton();
      this.updateDOMLayout();
    };
    this.sceneShutdownHandler = () => this.destroy();
    this.sceneHiddenHandler = () => {
      this.sceneLifecycleHidden = true;
      this.applyOverlayVisibility();
    };
    this.sceneShownHandler = () => {
      this.sceneLifecycleHidden = false;
      this.applyOverlayVisibility();
    };
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.buttonContainer = scene.add.container(0, 0);
    this.container.add([this.buttonContainer]);

    // A/B buttons (bottom-right)
    this.createButtons();
    this.layout();
    this.bindActionPointer();

    // Create joystick (activates on left 60% of screen)
    this.joystick = new VirtualJoystick(scene, () => this.notifyJoystickActivated());

    // Small menu button (top-right)
    this.createMenuButton();
    this.layoutMenuButton();

    // Bind tap detection on canvas for confirm
    this.bindTapDetection();

    // Re-layout on resize
    scene.scale.on('resize', this.scaleResizeHandler);
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.sceneHiddenHandler);
    scene.events.on(Phaser.Scenes.Events.SLEEP, this.sceneHiddenHandler);
    scene.events.on(Phaser.Scenes.Events.RESUME, this.sceneShownHandler);
    scene.events.on(Phaser.Scenes.Events.WAKE, this.sceneShownHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.sceneShutdownHandler);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.sceneShutdownHandler);
    this.lifecycleInterval = window.setInterval(() => {
      const hidden = !this.scene.scene.manager.getScenes(true).includes(this.scene);
      if (hidden !== this.sceneLifecycleHidden) {
        this.sceneLifecycleHidden = hidden;
        this.applyOverlayVisibility();
      }
    }, 250);

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
          this.hapticTap();
        } else if (
          Math.abs(dy) > SWIPE_DIST_THRESHOLD &&
          Math.abs(dy) > Math.abs(dx) &&
          elapsed < SWIPE_TIME_THRESHOLD
        ) {
          if (dy < 0) this.swipeUpPressed = true;
          else this.swipeDownPressed = true;
          this.hapticTap();
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
        this.hapticTap();
      } else if (
        Math.abs(dy) > SWIPE_DIST_THRESHOLD &&
        Math.abs(dy) > Math.abs(dx) &&
        elapsed < SWIPE_TIME_THRESHOLD
      ) {
        if (dy < 0) this.swipeUpPressed = true;
        else this.swipeDownPressed = true;
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

  /** Poll and consume swipe-up gesture (finger moved upward). */
  consumeSwipeUp(): boolean {
    if (this.swipeUpPressed) {
      this.swipeUpPressed = false;
      return true;
    }
    return false;
  }

  /** Poll and consume swipe-down gesture (finger moved downward). */
  consumeSwipeDown(): boolean {
    if (this.swipeDownPressed) {
      this.swipeDownPressed = false;
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
      this.hapticTap();
    }
    this.lastJoystickTapTime = now;
  }

  /** Show/hide the joystick (hide during menus, show during overworld). */
  setDpadVisible(visible: boolean): void {
    this.joystickEnabled = visible;
    if (!visible) {
      this.joystick.setVisible(false);
      this.domDirection = null;
      this.releaseAllControls();
    }
  }

  /** Show/hide entire control overlay. */
  setVisible(visible: boolean): void {
    this.overlayVisible = visible;
    this.applyOverlayVisibility();
  }

  private applyOverlayVisibility(): void {
    const visible = this.overlayVisible && !this.sceneLifecycleHidden;
    this.container.setVisible(visible);
    if (!visible) {
      this.joystick.setVisible(false);
      this.releaseAllControls();
    }
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

  /** Drain any pending confirm/cancel/swipe without returning them. */
  drain(): void {
    this.confirmPressed = false;
    this.cancelPressed = false;
    this.swipeUpPressed = false;
    this.swipeDownPressed = false;
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
    if (this.updatingLayout) {
      this.layoutPending = true;
      return;
    }
    this.updatingLayout = true;

    const canvas = this.scene.game.canvas;
    const controlsEl = document.getElementById('mobile-controls');
    if (!canvas || !controlsEl) {
      this.updatingLayout = false;
      if (this.layoutPending) {
        this.layoutPending = false;
        this.updateDOMLayout();
      }
      return;
    }
    if (!this.overlayVisible || this.sceneLifecycleHidden) {
      controlsEl.style.display = 'none';
      this.container.setVisible(false);
      this.updatingLayout = false;
      return;
    }

    const isLandscape = window.innerWidth > window.innerHeight;
    const rect = canvas.getBoundingClientRect();
    const bottomSpace = window.innerHeight - rect.bottom;
    this.applyDOMControlStyles(isLandscape);

    if (isLandscape && window.innerHeight <= 500) {
      // Landscape on phone — use side-panel layout (CSS handles positioning)
      controlsEl.style.top = '';
      controlsEl.style.height = '';
      controlsEl.style.display = 'flex';
      this.container.setVisible(false);
    } else if (bottomSpace > 100) {
      // Portrait with space below canvas — show DOM controls below
      controlsEl.style.top = rect.bottom + 'px';
      controlsEl.style.height = bottomSpace + 'px';
      controlsEl.style.display = 'flex';
      this.container.setVisible(false);
    } else {
      // Not enough space — hide DOM controls, show in-canvas
      controlsEl.style.display = 'none';
      this.container.setVisible(true);
    }

    this.updatingLayout = false;
    if (this.layoutPending) {
      this.layoutPending = false;
      this.updateDOMLayout();
    }
  }

  private applyDOMControlStyles(isLandscape: boolean): void {
    const controlsEl = document.getElementById('mobile-controls');
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    const actionButtons = document.getElementById('action-buttons');
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    const menuEl = document.getElementById('mobile-menu-btn');
    if (!controlsEl || !zone || !base || !thumb || !actionButtons || !btnA || !btnB || !menuEl)
      return;

    const metrics = computeTouchMetrics(minTouchTarget(), mobileScale());
    const buttonSize = metrics.actionButtonSize;
    const highVis = this.readSetting('highVisControls') === 'true';
    const idleAlpha = highVis ? 0.92 : 0.72;
    const panelAlpha = highVis ? 0.24 : 0.12;
    const oneHanded = this.getOneHandedMode() === 'left';
    this.domJoystickRadius = Math.max(metrics.joystickZoneWidth * 0.36, buttonSize * 0.72);
    this.domJoystickDeadZone = Math.max(12, Math.round(this.domJoystickRadius * 0.22));

    controlsEl.style.pointerEvents = 'none';
    controlsEl.style.touchAction = 'none';
    controlsEl.style.flexDirection = oneHanded ? 'row-reverse' : 'row';
    controlsEl.style.padding = isLandscape
      ? 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)'
      : `${SPACING.sm}px ${SPACING.md}px calc(${SPACING.sm}px + env(safe-area-inset-bottom, 0px))`;

    zone.style.width = isLandscape ? `${metrics.joystickZoneWidth}px` : '';
    zone.style.minWidth = isLandscape ? `${metrics.joystickZoneWidth}px` : '';
    zone.style.background = isLandscape
      ? `linear-gradient(${oneHanded ? '270deg' : '90deg'}, rgba(10,10,24,${panelAlpha}), rgba(10,10,24,0))`
      : 'transparent';
    zone.style.borderRight =
      !oneHanded && isLandscape ? `1px solid rgba(255,255,255,${panelAlpha})` : 'none';
    zone.style.borderLeft =
      oneHanded && isLandscape ? `1px solid rgba(255,255,255,${panelAlpha})` : 'none';

    base.style.width = `${Math.round(this.domJoystickRadius * 2)}px`;
    base.style.height = `${Math.round(this.domJoystickRadius * 2)}px`;
    base.style.background = `radial-gradient(circle, rgba(85,153,204,${highVis ? 0.24 : 0.14}) 0%, rgba(51,68,102,${highVis ? 0.62 : 0.42}) 70%)`;
    base.style.border = `${highVis ? 3 : 2}px solid rgba(255,204,0,${highVis ? 0.72 : 0.42})`;
    base.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
    thumb.style.width = `${Math.round(buttonSize * 0.58)}px`;
    thumb.style.height = `${Math.round(buttonSize * 0.58)}px`;
    thumb.style.background = `radial-gradient(circle, rgba(255,255,255,0.78), rgba(85,153,204,${highVis ? 0.95 : 0.72}))`;
    thumb.style.boxShadow = '0 3px 10px rgba(0,0,0,0.35)';

    actionButtons.style.width = isLandscape ? `${metrics.panelWidth}px` : '';
    actionButtons.style.minWidth = isLandscape ? `${metrics.panelWidth}px` : '';
    actionButtons.style.gap = `${metrics.actionGap}px`;
    actionButtons.style.padding = `0 ${metrics.edgePadding}px`;
    actionButtons.style.background = isLandscape
      ? `linear-gradient(${oneHanded ? '90deg' : '270deg'}, rgba(10,10,24,${panelAlpha}), rgba(10,10,24,0))`
      : 'transparent';
    actionButtons.style.borderLeft =
      !oneHanded && isLandscape ? `1px solid rgba(255,255,255,${panelAlpha})` : 'none';
    actionButtons.style.borderRight =
      oneHanded && isLandscape ? `1px solid rgba(255,255,255,${panelAlpha})` : 'none';
    actionButtons.style.marginLeft = oneHanded ? '' : 'auto';
    actionButtons.style.marginRight = oneHanded ? 'auto' : '';

    this.styleDOMActionButton(btnA, buttonSize, COLORS.hpGreen, idleAlpha);
    this.styleDOMActionButton(btnB, buttonSize, COLORS.hpRed, idleAlpha);

    const menuSize = metrics.menuButtonSize;
    menuEl.style.width = `${menuSize}px`;
    menuEl.style.height = `${menuSize}px`;
    menuEl.style.lineHeight = `${menuSize}px`;
    menuEl.style.fontSize = `${mobileFontPx(18)}px`;
    menuEl.style.borderRadius = `${Math.round(menuSize * 0.22)}px`;
    menuEl.style.background = `linear-gradient(145deg, rgba(15,15,26,0.94), rgba(37,37,69,${idleAlpha}))`;
    menuEl.style.border = `2px solid #${COLORS.borderHighlight.toString(16).padStart(6, '0')}`;
    menuEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.45)';
    if (isLandscape) {
      menuEl.style.position = 'absolute';
      menuEl.style.top = `calc(${metrics.edgePadding}px + env(safe-area-inset-top, 0px))`;
      const sideOffset = Math.round((metrics.panelWidth - menuSize) / 2);
      menuEl.style.right = oneHanded
        ? ''
        : `calc(${sideOffset}px + env(safe-area-inset-right, 0px))`;
      menuEl.style.left = oneHanded ? `calc(${sideOffset}px + env(safe-area-inset-left, 0px))` : '';
    }
  }

  private styleDOMActionButton(
    button: HTMLElement,
    size: number,
    color: number,
    alpha: number,
  ): void {
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
    button.style.fontSize = `${mobileFontPx(20)}px`;
    button.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32), rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${alpha}) 62%, rgba(10,10,24,0.42))`;
    button.style.border = `2px solid rgba(255,255,255,${alpha})`;
    button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.38)';
    button.style.opacity = `${alpha}`;
  }

  private setupDOMJoystick(): void {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!zone || !base || !thumb) return;

    const onStart = (e: Event) => {
      const te = e as TouchEvent;
      if (this.domJoystickPointerId !== null) return;
      const t = te.changedTouches[0];
      this.domJoystickPointerId = t.identifier;
      const zoneRect = zone.getBoundingClientRect();
      this.domJoystickOriginX = t.clientX;
      this.domJoystickOriginY = t.clientY;

      base.style.left = t.clientX - zoneRect.left + 'px';
      base.style.top = t.clientY - zoneRect.top + 'px';
      thumb.style.left = base.style.left;
      thumb.style.top = base.style.top;
      base.style.display = 'block';
      thumb.style.display = 'block';
      this.domDirection = null;
      this.notifyJoystickActivated();
    };

    const onMove = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
        if (t.identifier !== this.domJoystickPointerId) continue;

        const dx = t.clientX - this.domJoystickOriginX;
        const dy = t.clientY - this.domJoystickOriginY;
        const viewportRect = {
          left: 0,
          right: window.innerWidth,
          top: 0,
          bottom: window.innerHeight,
        };
        if (isPointOutsideRect(t.clientX, t.clientY, viewportRect, 24)) {
          this.resetDOMJoystick(base, thumb);
          break;
        }
        const vector = clampJoystickVector(dx, dy, this.domJoystickRadius);

        const zoneRect = zone.getBoundingClientRect();
        thumb.style.left = this.domJoystickOriginX - zoneRect.left + vector.x + 'px';
        thumb.style.top = this.domJoystickOriginY - zoneRect.top + vector.y + 'px';
        this.domDirection = resolveJoystickDirection(dx, dy, {
          deadZone: this.domJoystickDeadZone,
          previousDirection: this.domDirection,
        });
        break;
      }
    };

    const onEnd = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        if (te.changedTouches[i].identifier === this.domJoystickPointerId) {
          this.resetDOMJoystick(base, thumb);
          break;
        }
      }
    };

    this.trackListener(zone, 'touchstart', onStart, { passive: true });
    this.trackListener(zone, 'touchmove', onMove, { passive: true });
    this.trackListener(zone, 'touchend', onEnd, { passive: true });
    this.trackListener(zone, 'touchcancel', onEnd, { passive: true });
    this.trackListener(window, 'blur', () => this.resetDOMJoystick(base, thumb));
    this.trackListener(window, 'pagehide', () => this.resetDOMJoystick(base, thumb));
    this.trackListener(document, 'visibilitychange', () => {
      if (document.hidden) this.resetDOMJoystick(base, thumb);
    });
  }

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    const layout = computeTouchControlLayout({
      width,
      height,
      insets: getGameSafeAreaInsets(this.scene.cameras.main),
      minTouchTarget: this.getGameTouchTarget(),
      mobileScale: mobileScale(),
      oneHandedMode: this.getOneHandedMode(),
    });
    this.btnSize = layout.metrics.actionButtonSize;
    this.padding = layout.metrics.edgePadding;
    this.buttonContainer.setPosition(layout.buttonContainerX, layout.buttonContainerY);
    this.positionActionButtons(layout.confirmOffsetY, layout.cancelOffsetY);
    this.resizeActionButtons();
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
            this.hapticTap();
          } else if (btn.action === 'cancel') {
            this.cancelPressed = true;
            this.hapticTap();
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
    const onActionTouchMove = (e: Event) => {
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const touch = te.changedTouches[i];
        const btn = this.activeButtonTouches.get(touch.identifier);
        if (!btn) continue;
        const { x: px, y: py } = getGameCoords(touch.clientX, touch.clientY);
        const dx = px - btn.cx;
        const dy = py - btn.cy;
        if (dx * dx + dy * dy > (btn.radius + this.getGameTouchTarget() * 0.35) ** 2) {
          handleUp(touch.identifier);
        }
      }
    };
    const onActionMouseDown = (e: Event) => {
      const me = e as MouseEvent;
      handleDown(me.clientX, me.clientY);
    };
    const onActionMouseUp = () => handleUp();

    this.trackListener(canvas, 'touchstart', onActionTouchStart, { passive: true });
    this.trackListener(canvas, 'touchmove', onActionTouchMove, { passive: true });
    this.trackListener(canvas, 'touchend', onActionTouchEnd, { passive: true });
    this.trackListener(canvas, 'touchcancel', onActionTouchEnd, { passive: true });
    this.trackListener(canvas, 'mousedown', onActionMouseDown);
    this.trackListener(canvas, 'mouseup', onActionMouseUp);
    this.trackListener(window, 'blur', () => handleUp());
    this.trackListener(window, 'pagehide', () => handleUp());
  }

  private createButtons(): void {
    const swapped = this.readSetting('swapAB') === 'true';
    const highVis = this.readSetting('highVisControls') === 'true';
    const aAction: 'confirm' | 'cancel' = swapped ? 'cancel' : 'confirm';
    const bAction: 'confirm' | 'cancel' = swapped ? 'confirm' : 'cancel';
    this.baseAlpha = highVis ? 0.86 : 0.58;
    const stroke = highVis ? 3 : 2;
    const gap = Math.round((this.btnSize + SPACING.md) / 2);
    const aBtn = this.makeActionButton(
      0,
      -gap,
      swapped ? 'B' : 'A',
      COLORS.hpGreen,
      aAction,
      this.baseAlpha,
      stroke,
    );
    const bBtn = this.makeActionButton(
      0,
      gap,
      swapped ? 'A' : 'B',
      COLORS.hpRed,
      bAction,
      this.baseAlpha,
      stroke,
    );
    this.buttonContainer.add([aBtn, bBtn]);
  }

  private makeActionButton(
    x: number,
    y: number,
    label: string,
    color: number,
    action: 'confirm' | 'cancel',
    alpha = 0.5,
    strokeWidth = 0,
  ): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const radius = this.btnSize * 0.48;
    const bg = this.scene.add.circle(0, 0, radius, color, alpha);
    if (strokeWidth > 0) bg.setStrokeStyle(strokeWidth, COLORS.white, 0.9);
    const txt = this.scene.add
      .text(0, 0, label, {
        ...FONTS.heading,
        fontSize: `${mobileFontPx(20)}px`,
      })
      .setOrigin(0.5);
    c.add([bg, txt]);
    this.buttons.push({ cx: 0, cy: 0, radius, action, bg, label: txt, container: c });
    return c;
  }

  private positionActionButtons(confirmOffsetY: number, cancelOffsetY: number): void {
    for (const btn of this.buttons) {
      btn.container.setPosition(0, btn.action === 'confirm' ? confirmOffsetY : cancelOffsetY);
    }
  }

  private resizeActionButtons(): void {
    const highVis = this.readSetting('highVisControls') === 'true';
    this.baseAlpha = highVis ? 0.86 : 0.58;
    const stroke = highVis ? 3 : 2;
    for (const btn of this.buttons) {
      btn.radius = Math.max(this.btnSize * 0.5, this.getGameTouchTarget() / 2);
      btn.bg.setRadius(btn.radius);
      btn.bg.setStrokeStyle(stroke, COLORS.white, highVis ? 0.95 : 0.7);
      btn.bg.setAlpha(this.baseAlpha);
      btn.label.setFontSize(mobileFontPx(20));
    }
  }

  private getGameTouchTarget(): number {
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this.scene.cameras.main;
    if (rect.width <= 0 || rect.height <= 0) return minTouchTarget();
    return Math.ceil(minTouchTarget() * Math.max(width / rect.width, height / rect.height));
  }

  private getOneHandedMode(): OneHandedMode {
    return this.readSetting('oneHandedMode') === 'left' ? 'left' : 'off';
  }

  private hapticTap(): void {
    if (!isReducedMotion()) vibrateTap();
  }

  private resetDOMJoystick(base?: HTMLElement, thumb?: HTMLElement): void {
    const baseEl = base ?? document.getElementById('joystick-base');
    const thumbEl = thumb ?? document.getElementById('joystick-thumb');
    this.domJoystickPointerId = null;
    this.domDirection = null;
    if (baseEl) baseEl.style.display = 'none';
    if (thumbEl) thumbEl.style.display = 'none';
  }

  private releaseAllControls(): void {
    this.domDirection = null;
    this.domJoystickPointerId = null;
    this.activeButtonTouches.clear();
    for (const btn of this.buttons) {
      btn.bg.fillAlpha = this.baseAlpha;
    }
    document.getElementById('btn-a')?.classList.remove('pressed');
    document.getElementById('btn-b')?.classList.remove('pressed');
    this.resetDOMJoystick();
  }

  /** Read a setting from localStorage (same key GameManager uses). */
  private readSetting(key: string): string | undefined {
    try {
      const raw = localStorage.getItem('pokemon-web-settings');
      if (raw) {
        const s = JSON.parse(raw);
        return s[key] != null ? String(s[key]) : undefined;
      }
    } catch {
      /* ignore */
    }
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
    const r = this.menuBtnSize / 2 + 16; // generous hit margin
    return dx * dx + dy * dy <= r * r;
  }

  private createMenuButton(): void {
    const r = this.menuBtnSize / 2;
    // Higher-opacity dark plate gives the white hamburger icon usable contrast
    // against bright overworld backgrounds.
    const bg = this.scene.add.circle(0, 0, r, COLORS.bgDark, 0.88);
    bg.setStrokeStyle(2, COLORS.borderHighlight, 0.95);
    this.menuBtnBg = bg;

    // Draw three horizontal bars (hamburger icon) — fully opaque white for contrast
    const barW = r * 0.9;
    const barH = 3;
    const gap = 6;
    const bars = this.scene.add.graphics();
    bars.fillStyle(0xffffff, 1);
    for (let i = -1; i <= 1; i++) {
      bars.fillRect(-barW, i * gap - barH / 2, barW * 2, barH);
    }

    this.menuBtn = this.scene.add
      .container(0, 0, [bg, bars])
      .setSize(this.menuBtnSize, this.menuBtnSize);
    this.container.add(this.menuBtn);

    // Direct touch handling (more reliable than setInteractive on shapes
    // nested in containers — see bindActionPointer for the same pattern).
    this.bindMenuButtonPointer();
  }

  /**
   * Hit-test taps against the menu button area directly on canvas events.
   * This is more reliable than Phaser's setInteractive on a circle nested
   * inside multiple containers, and matches how the A/B buttons are wired.
   */
  private bindMenuButtonPointer(): void {
    const canvas = this.scene.game.canvas;

    const press = () => {
      this.cancelPressed = true;
      this.menuBtnBg.fillAlpha = 1;
      this.hapticTap();
    };
    const release = () => {
      this.menuBtnBg.fillAlpha = 0.92;
    };

    const onTouchStart = (e: Event) => {
      if (!this.container.visible) return;
      const te = e as TouchEvent;
      for (let i = 0; i < te.changedTouches.length; i++) {
        const t = te.changedTouches[i];
        if (this.isMenuButtonHit(t.clientX, t.clientY)) {
          press();
          return;
        }
      }
    };
    const onTouchEnd = () => release();
    const onMouseDown = (e: Event) => {
      if (!this.container.visible) return;
      const me = e as MouseEvent;
      if (this.isMenuButtonHit(me.clientX, me.clientY)) press();
    };
    const onMouseUp = () => release();

    this.trackListener(canvas, 'touchstart', onTouchStart, { passive: true });
    this.trackListener(canvas, 'touchend', onTouchEnd, { passive: true });
    this.trackListener(canvas, 'touchcancel', onTouchEnd, { passive: true });
    this.trackListener(canvas, 'mousedown', onMouseDown);
    this.trackListener(canvas, 'mouseup', onMouseUp);
  }

  private layoutMenuButton(): void {
    const { width, height } = this.scene.cameras.main;
    const layout = computeTouchControlLayout({
      width,
      height,
      insets: getGameSafeAreaInsets(this.scene.cameras.main),
      minTouchTarget: this.getGameTouchTarget(),
      mobileScale: mobileScale(),
      oneHandedMode: this.getOneHandedMode(),
    });
    this.menuBtnSize = layout.metrics.menuButtonSize;
    this.menuBtnBg.setRadius(this.menuBtnSize / 2);
    this.menuBtn.setSize(this.menuBtnSize, this.menuBtnSize);
    this.menuBtn.setPosition(layout.menuX, layout.menuY);
  }

  private setupDOMButtons(): void {
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');

    if (btnA) {
      const aStart = () => {
        // Re-read swapAB each press so toggling the setting takes
        // immediate effect without a scene reboot.
        const swapped = this.readSetting('swapAB') === 'true';
        const aAction = swapped ? 'cancel' : 'confirm';
        if (aAction === 'confirm') this.confirmPressed = true;
        else this.cancelPressed = true;
        this.hapticTap();
        btnA.classList.add('pressed');
        btnA.style.opacity = '1';
      };
      const aEnd = () => {
        btnA.classList.remove('pressed');
        btnA.style.opacity = '';
      };
      const aPointerStart = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') aStart();
      };
      const aPointerEnd = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') aEnd();
      };
      this.trackListener(btnA, 'touchstart', aStart, { passive: true });
      this.trackListener(btnA, 'touchend', aEnd, { passive: true });
      this.trackListener(btnA, 'touchcancel', aEnd, { passive: true });
      this.trackListener(btnA, 'pointerdown', aPointerStart);
      this.trackListener(btnA, 'pointerup', aPointerEnd);
      this.trackListener(btnA, 'pointercancel', aPointerEnd);
    }

    if (btnB) {
      const bStart = () => {
        const swapped = this.readSetting('swapAB') === 'true';
        const bAction = swapped ? 'confirm' : 'cancel';
        if (bAction === 'confirm') this.confirmPressed = true;
        else this.cancelPressed = true;
        this.hapticTap();
        btnB.classList.add('pressed');
        btnB.style.opacity = '1';
      };
      const bEnd = () => {
        btnB.classList.remove('pressed');
        btnB.style.opacity = '';
      };
      const bPointerStart = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') bStart();
      };
      const bPointerEnd = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') bEnd();
      };
      this.trackListener(btnB, 'touchstart', bStart, { passive: true });
      this.trackListener(btnB, 'touchend', bEnd, { passive: true });
      this.trackListener(btnB, 'touchcancel', bEnd, { passive: true });
      this.trackListener(btnB, 'pointerdown', bPointerStart);
      this.trackListener(btnB, 'pointerup', bPointerEnd);
      this.trackListener(btnB, 'pointercancel', bPointerEnd);
    }

    const menuEl = document.getElementById('mobile-menu-btn');
    if (menuEl) {
      const menuStart = (e: Event) => {
        e.preventDefault();
        this.cancelPressed = true;
        this.hapticTap();
        (menuEl as HTMLElement).style.filter = 'brightness(1.35)';
      };
      const menuEnd = () => {
        (menuEl as HTMLElement).style.filter = '';
      };
      const menuPointerStart = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') menuStart(e);
      };
      const menuPointerEnd = (e: Event) => {
        if ((e as PointerEvent).pointerType === 'mouse') menuEnd();
      };
      this.trackListener(menuEl, 'touchstart', menuStart);
      this.trackListener(menuEl, 'touchend', menuEnd);
      this.trackListener(menuEl, 'touchcancel', menuEnd);
      this.trackListener(menuEl, 'pointerdown', menuPointerStart);
      this.trackListener(menuEl, 'pointerup', menuPointerEnd);
      this.trackListener(menuEl, 'pointercancel', menuPointerEnd);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.lifecycleInterval !== undefined) {
      window.clearInterval(this.lifecycleInterval);
      this.lifecycleInterval = undefined;
    }
    this.scene.scale.off('resize', this.scaleResizeHandler);
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.sceneHiddenHandler);
    this.scene.events.off(Phaser.Scenes.Events.SLEEP, this.sceneHiddenHandler);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.sceneShownHandler);
    this.scene.events.off(Phaser.Scenes.Events.WAKE, this.sceneShownHandler);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.sceneShutdownHandler);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.sceneShutdownHandler);
    for (const { element, event, handler } of this.boundHandlers) {
      element.removeEventListener(event, handler);
    }
    this.boundHandlers = [];
    this.releaseAllControls();
    if (this.container.active) this.container.destroy(true);
    this.joystick.destroy();
    this.buttons = [];
    if (TouchControls.activeInstance === this) {
      TouchControls.activeInstance = undefined;
    }
  }
}
