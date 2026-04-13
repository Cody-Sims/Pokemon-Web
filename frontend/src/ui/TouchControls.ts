import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';

/**
 * Virtual touch controls overlay: D-pad (bottom-left) + A/B buttons (bottom-right).
 * Auto-detected via navigator.maxTouchPoints; hidden on desktop.
 * Created once in OverworldScene and persists across scene overlays.
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.dpadContainer = scene.add.container(0, 0);
    this.buttonContainer = scene.add.container(0, 0);
    this.container.add([this.dpadContainer, this.buttonContainer]);

    this.createDpad();
    this.createButtons();
    this.layout();

    // Re-layout on resize
    scene.scale.on('resize', () => this.layout());
  }

  private layout(): void {
    const { width, height } = this.scene.cameras.main;
    // D-pad bottom-left
    this.dpadContainer.setPosition(this.padding + this.dpadSize + 10, height - this.padding - this.dpadSize - 10);
    // A/B buttons bottom-right
    this.buttonContainer.setPosition(width - this.padding - this.btnSize - 10, height - this.padding - this.btnSize - 30);
  }

  private createDpad(): void {
    const s = this.dpadSize;
    const alpha = 0.35;

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
    const bg = this.scene.add.circle(0, 0, this.dpadSize * 0.42, 0x334466, 0.5)
      .setInteractive({ useHandCursor: false })
      .setName(dir);
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '20px', color: '#aaccee', fontFamily: 'monospace',
    }).setOrigin(0.5);
    c.add([bg, txt]);

    bg.on('pointerdown', () => { this.activeDirection = dir; bg.fillAlpha = 0.8; });
    bg.on('pointerup', () => { this.activeDirection = null; bg.fillAlpha = 0.5; });
    bg.on('pointerout', () => { this.activeDirection = null; bg.fillAlpha = 0.5; });

    return c;
  }

  private createButtons(): void {
    // A button (confirm) — green
    const aBtn = this.makeActionButton(0, -35, 'A', 0x44aa55, () => {
      this.confirmPressed = true;
    });
    // B button (cancel) — red
    const bBtn = this.makeActionButton(0, 35, 'B', 0xaa4444, () => {
      this.cancelPressed = true;
    });

    this.buttonContainer.add([aBtn, bBtn]);
  }

  private makeActionButton(x: number, y: number, label: string, color: number, onPress: () => void): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const bg = this.scene.add.circle(0, 0, this.btnSize * 0.48, color, 0.5)
      .setInteractive({ useHandCursor: false });
    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([bg, txt]);

    bg.on('pointerdown', () => { onPress(); bg.fillAlpha = 0.9; });
    bg.on('pointerup', () => { bg.fillAlpha = 0.5; });
    bg.on('pointerout', () => { bg.fillAlpha = 0.5; });

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
  }
}
