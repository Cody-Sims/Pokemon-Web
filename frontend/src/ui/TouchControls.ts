import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { VirtualJoystick } from '@ui/VirtualJoystick';

interface ButtonDef {
  cx: number;
  cy: number;
  radius: number;
  action: 'confirm' | 'cancel';
  bg: Phaser.GameObjects.Arc;
}

/**
 * Virtual touch controls overlay: floating joystick + A/B buttons.
 * Auto-detected via navigator.maxTouchPoints; hidden on desktop.
 *
 * The virtual joystick appears at the user's touch location in the overworld.
 * A/B action buttons are always visible in the bottom-right corner.
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private buttonContainer: Phaser.GameObjects.Container;
  private joystick: VirtualJoystick;
  private joystickEnabled = true;
  private confirmPressed = false;
  private cancelPressed = false;
  private readonly btnSize = 72;
  private readonly padding = 16;
  private buttons: ButtonDef[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.buttonContainer = scene.add.container(0, 0);
    this.container.add([this.buttonContainer]);

    this.createButtons();
    this.layout();
    this.bindActionPointer();

    // Create joystick with hit-test exclusion for action buttons
    this.joystick = new VirtualJoystick(scene, (x, y) => this.isActionButtonHit(x, y));

    // Re-layout on resize
    scene.scale.on('resize', () => this.layout());
  }

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    // A/B buttons bottom-right — increased spacing for larger buttons
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

  /** Check if a point hits one of the action buttons (used by joystick to exclude). */
  private isActionButtonHit(x: number, y: number): boolean {
    for (const btn of this.buttons) {
      const dx = x - btn.cx;
      const dy = y - btn.cy;
      // Use slightly larger hit radius for exclusion
      const r = btn.radius + 10;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
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

    // Mouse for desktop testing
    canvas.addEventListener('mousedown', (e) => handleDown(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => handleUp());
  }

  private createButtons(): void {
    // A button (confirm) — green — larger for mobile
    const aBtn = this.makeActionButton(0, -48, 'A', 0x44aa55, 'confirm');
    // B button (cancel) — red
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

  /** Poll touch direction from the virtual joystick (or null). */
  getDirection(): Direction | null {
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

  /** Poll and consume cancel press. */
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
    if (!visible) this.joystick.setVisible(false);
  }

  /** Show/hide entire control overlay. */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    if (!visible) this.joystick.setVisible(false);
  }

  /** Check if the device supports touch. */
  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  destroy(): void {
    this.container.destroy(true);
    this.joystick.destroy();
    this.buttons = [];
  }
}
