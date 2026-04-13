import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';

interface ButtonDef {
  cx: number;
  cy: number;
  radius: number;
  direction?: Direction;
  action?: 'confirm' | 'cancel';
  bg: Phaser.GameObjects.Arc;
}

/**
 * Virtual touch controls overlay: D-pad (bottom-left) + A/B buttons (bottom-right).
 * Auto-detected via navigator.maxTouchPoints; hidden on desktop.
 * Created once in OverworldScene and persists across scene overlays.
 *
 * Uses scene-level pointer events with manual hit-testing to avoid
 * Phaser container + scrollFactor hit-testing issues.
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private dpadContainer: Phaser.GameObjects.Container;
  private buttonContainer: Phaser.GameObjects.Container;
  private activeDirection: Direction | null = null;
  private confirmPressed = false;
  private cancelPressed = false;
  private readonly btnSize = 52;
  private readonly dpadSize = 48;
  private readonly padding = 16;
  private buttons: ButtonDef[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.dpadContainer = scene.add.container(0, 0);
    this.buttonContainer = scene.add.container(0, 0);
    this.container.add([this.dpadContainer, this.buttonContainer]);

    this.createDpad();
    this.createButtons();
    this.layout();
    this.bindScenePointer();

    // Re-layout on resize
    scene.scale.on('resize', () => this.layout());
  }

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    // D-pad bottom-left
    this.dpadContainer.setPosition(this.padding + this.dpadSize + 10, height - this.padding - this.dpadSize - 10);
    // A/B buttons bottom-right
    this.buttonContainer.setPosition(width - this.padding - this.btnSize - 10, height - this.padding - this.btnSize - 30);
    // Update button absolute positions for hit testing
    this.recalcButtonPositions();
  }

  private recalcButtonPositions(): void {
    const dpadX = this.dpadContainer.x;
    const dpadY = this.dpadContainer.y;
    const btnX = this.buttonContainer.x;
    const btnY = this.buttonContainer.y;

    for (const btn of this.buttons) {
      if (btn.direction) {
        // D-pad buttons: relative to dpadContainer
        const localX = btn.bg.parentContainer?.x ?? 0;
        const localY = btn.bg.parentContainer?.y ?? 0;
        btn.cx = dpadX + localX;
        btn.cy = dpadY + localY;
      } else {
        // Action buttons: relative to buttonContainer
        const localX = btn.bg.parentContainer?.x ?? 0;
        const localY = btn.bg.parentContainer?.y ?? 0;
        btn.cx = btnX + localX;
        btn.cy = btnY + localY;
      }
    }
  }

  private bindScenePointer(): void {
    const canvas = this.scene.game.canvas;

    // Use native DOM events for reliable touch handling across all devices.
    // Phaser's built-in container+interactive hit testing has issues with
    // setScrollFactor(0) containers on mobile.
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
          if (btn.direction) {
            if (!this.dpadContainer.visible) continue;
            this.activeDirection = btn.direction;
            btn.bg.fillAlpha = 0.8;
          } else if (btn.action === 'confirm') {
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
      this.activeDirection = null;
      for (const btn of this.buttons) {
        btn.bg.fillAlpha = 0.5;
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!this.activeDirection) return; // Only track during D-pad drag
      if (!this.container.visible || !this.dpadContainer.visible) return;
      const { x: px, y: py } = getGameCoords(clientX, clientY);

      let foundDir: Direction | null = null;
      for (const btn of this.buttons) {
        if (!btn.direction) continue;
        const dx = px - btn.cx;
        const dy = py - btn.cy;
        if (dx * dx + dy * dy <= btn.radius * btn.radius) {
          foundDir = btn.direction;
          btn.bg.fillAlpha = 0.8;
        } else {
          btn.bg.fillAlpha = 0.5;
        }
      }
      this.activeDirection = foundDir;
    };

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      if (t) handleDown(t.clientX, t.clientY);
    }, { passive: true });

    canvas.addEventListener('touchend', () => handleUp(), { passive: true });
    canvas.addEventListener('touchcancel', () => handleUp(), { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      if (t) handleMove(t.clientX, t.clientY);
    }, { passive: true });

    // Also handle mouse for desktop testing with touch emulation
    canvas.addEventListener('mousedown', (e) => handleDown(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => handleUp());
    canvas.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) handleMove(e.clientX, e.clientY);
    });
  }

  private createDpad(): void {
    const s = this.dpadSize;

    // Center circle (decorative)
    const center = this.scene.add.circle(0, 0, s * 0.35, 0x222244, 0.3);
    this.dpadContainer.add(center);

    // Up
    const up = this.makeDpadButton(0, -s, '▲', 'up');
    // Down
    const down = this.makeDpadButton(0, s, '▼', 'down');
    // Left
    const left = this.makeDpadButton(-s, 0, '◀', 'left');
    // Right
    const right = this.makeDpadButton(s, 0, '▶', 'right');

    this.dpadContainer.add([up, down, left, right]);
  }

  private makeDpadButton(x: number, y: number, label: string, dir: Direction): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const radius = this.dpadSize * 0.42;
    const bg = this.scene.add.circle(0, 0, radius, 0x334466, 0.5);
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '20px', color: '#aaccee', fontFamily: 'monospace',
    }).setOrigin(0.5);
    c.add([bg, txt]);

    this.buttons.push({ cx: 0, cy: 0, radius, direction: dir, bg });

    return c;
  }

  private createButtons(): void {
    // A button (confirm) — green
    const aBtn = this.makeActionButton(0, -35, 'A', 0x44aa55, 'confirm');
    // B button (cancel) — red
    const bBtn = this.makeActionButton(0, 35, 'B', 0xaa4444, 'cancel');

    this.buttonContainer.add([aBtn, bBtn]);
  }

  private makeActionButton(x: number, y: number, label: string, color: number, action: 'confirm' | 'cancel'): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const radius = this.btnSize * 0.48;
    const bg = this.scene.add.circle(0, 0, radius, color, 0.5);
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([bg, txt]);

    this.buttons.push({ cx: 0, cy: 0, radius, action, bg });

    return c;
  }

  /** Poll touch direction (or null). Called each frame by InputManager. */
  getDirection(): Direction | null {
    return this.activeDirection;
  }

  /** Poll and consume confirm press. */
  consumeConfirm(): boolean {
    if (this.confirmPressed) {
      this.confirmPressed = false;
      return true;
    }
    return false;
  }

  /** Poll and consume cancel press. */
  consumeCancel(): boolean {
    if (this.cancelPressed) {
      this.cancelPressed = false;
      return true;
    }
    return false;
  }

  /** Show/hide the D-pad (hide during menus, show during overworld). */
  setDpadVisible(visible: boolean): void {
    this.dpadContainer.setVisible(visible);
  }

  /** Show/hide entire control overlay. */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /** Check if the device supports touch. */
  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  destroy(): void {
    this.container.destroy(true);
    this.buttons = [];
  }
}
