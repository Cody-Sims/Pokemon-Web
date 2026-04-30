import Phaser from 'phaser';
import { mobileFontSize } from '@ui/theme';

/** Top-most depth used by ConfirmBox overlays — well above any menu panel. */
const CONFIRM_DEPTH = 1000;

/** Yes/No confirmation prompt. */
export class ConfirmBox {
  private scene: Phaser.Scene;
  private dim: Phaser.GameObjects.Rectangle;
  private background: Phaser.GameObjects.Rectangle;
  private promptText: Phaser.GameObjects.Text;
  private yesText: Phaser.GameObjects.Text;
  private noText: Phaser.GameObjects.Text;
  private cursor = 0; // 0 = Yes, 1 = No
  private onResult: (confirmed: boolean) => void;
  private active = true;

  constructor(
    scene: Phaser.Scene,
    _x: number,
    _y: number,
    prompt: string,
    onResult: (confirmed: boolean) => void
  ) {
    this.scene = scene;
    this.onResult = onResult;

    // Center the prompt on the camera regardless of caller-supplied (x, y);
    // the legacy offset placed prompts inside other UI panels (B2).
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    // Full-screen dim so the underlying scene cannot bleed through and the
    // prompt always reads as a modal layer.
    this.dim = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
      .setDepth(CONFIRM_DEPTH).setInteractive();
    // Swallow taps that hit the dim so they never reach buttons underneath.
    this.dim.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation?.());

    this.background = scene.add.rectangle(cx, cy, 180, 110, 0x222222, 0.98)
      .setDepth(CONFIRM_DEPTH + 1);
    this.background.setStrokeStyle(2, 0xffffff);

    this.promptText = scene.add.text(cx, cy - 32, prompt, {
      fontSize: mobileFontSize(14), color: '#ffffff',
    }).setOrigin(0.5).setDepth(CONFIRM_DEPTH + 2);
    this.yesText = scene.add.text(cx, cy - 4, '▶ YES', {
      fontSize: mobileFontSize(16), color: '#ffcc00',
    }).setOrigin(0.5).setDepth(CONFIRM_DEPTH + 2);
    this.noText = scene.add.text(cx, cy + 24, '  NO', {
      fontSize: mobileFontSize(16), color: '#ffffff',
    }).setOrigin(0.5).setDepth(CONFIRM_DEPTH + 2);

    // Keyboard input (BUG-083: guard with active flag)
    scene.input.keyboard!.on('keydown-UP', this.moveUp, this);
    scene.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    scene.input.keyboard!.on('keydown-ENTER', this.confirm, this);
    scene.input.keyboard!.on('keydown-ESC', this.cancel, this);

    // Touch/pointer support (BUG-067)
    this.yesText.setInteractive({ useHandCursor: true });
    this.noText.setInteractive({ useHandCursor: true });
    this.yesText.on('pointerdown', () => { this.cursor = 0; this.updateCursor(); this.confirm(); });
    this.noText.on('pointerdown', () => { this.cursor = 1; this.updateCursor(); this.confirm(); });
  }

  private moveUp = (): void => {
    if (!this.active) return;
    this.cursor = 0;
    this.updateCursor();
  };

  private moveDown = (): void => {
    if (!this.active) return;
    this.cursor = 1;
    this.updateCursor();
  };

  private confirm = (): void => {
    if (!this.active) return;
    this.active = false;
    const result = this.cursor === 0;
    this.destroyHandlers();
    this.onResult(result);
  };

  private cancel = (): void => {
    if (!this.active) return;
    this.active = false;
    this.destroyHandlers();
    this.onResult(false);
  };

  private updateCursor(): void {
    this.yesText.setText(this.cursor === 0 ? '▶ YES' : '  YES');
    this.yesText.setColor(this.cursor === 0 ? '#ffcc00' : '#ffffff');
    this.noText.setText(this.cursor === 1 ? '▶ NO' : '  NO');
    this.noText.setColor(this.cursor === 1 ? '#ffcc00' : '#ffffff');
  }

  private destroyHandlers(): void {
    this.scene.input.keyboard?.off('keydown-UP', this.moveUp, this);
    this.scene.input.keyboard?.off('keydown-DOWN', this.moveDown, this);
    this.scene.input.keyboard?.off('keydown-ENTER', this.confirm, this);
    this.scene.input.keyboard?.off('keydown-ESC', this.cancel, this);
    this.dim.destroy();
    this.promptText.destroy();
    this.background.destroy();
    this.yesText.destroy();
    this.noText.destroy();
  }

  destroy(): void {
    this.active = false;
    this.destroyHandlers();
  }
}
