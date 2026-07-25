import Phaser from 'phaser';
import { COLORS, FONTS, PANEL_PRESETS, SPACING, minTouchTarget, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from './NinePatchPanel';

/** Top-most depth used by ConfirmBox overlays — well above any menu panel. */
const CONFIRM_DEPTH = 1000;

/** Yes/No confirmation prompt. */
export class ConfirmBox {
  private scene: Phaser.Scene;
  private dim: Phaser.GameObjects.Rectangle;
  private background: NinePatchPanel;
  private promptText: Phaser.GameObjects.Text;
  private yesText: Phaser.GameObjects.Text;
  private noText: Phaser.GameObjects.Text;
  private cursor = 0; // 0 = Yes, 1 = No
  private onResult: (confirmed: boolean) => void;
  private active = true;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    _x: number,
    _y: number,
    prompt: string,
    onResult: (confirmed: boolean) => void,
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
    this.dim = scene.add
      .rectangle(cx, cy, cam.width, cam.height, COLORS.bgOverlay, 0.62)
      .setDepth(CONFIRM_DEPTH)
      .setInteractive({ useHandCursor: false });
    // Swallow taps on the dim so they never reach buttons underneath.
    // Setting the dim as interactive with a no-op handler ensures Phaser's
    // input depth ordering prevents underlying game objects from receiving
    // the pointer event.
    this.dim.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    const boxW = Math.min(
      Math.max(220, prompt.length * 8 + SPACING.xl * 2),
      cam.width - SPACING.xl * 2,
    );
    const rowH = Math.max(30, minTouchTarget());
    const boxH = 72 + rowH * 2;
    this.background = new NinePatchPanel(scene, cx, cy, boxW, boxH, PANEL_PRESETS.choice).setDepth(
      CONFIRM_DEPTH + 1,
    );

    this.promptText = scene.add
      .text(cx, cy - boxH / 2 + SPACING.lg, prompt, {
        ...FONTS.bodySmall,
        fontSize: mobileFontSize(14),
        color: COLORS.textWhite,
        wordWrap: { width: boxW - SPACING.xl * 2 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(CONFIRM_DEPTH + 2);
    this.yesText = scene.add
      .text(cx, cy + 2, '▶ YES', {
        ...FONTS.body,
        fontSize: mobileFontSize(16),
        color: COLORS.textHighlight,
      })
      .setOrigin(0.5)
      .setDepth(CONFIRM_DEPTH + 2)
      .setPadding(
        SPACING.lg,
        Math.max(4, (rowH - 20) / 2),
        SPACING.lg,
        Math.max(4, (rowH - 20) / 2),
      );
    this.noText = scene.add
      .text(cx, cy + rowH, '  NO', {
        ...FONTS.body,
        fontSize: mobileFontSize(16),
        color: COLORS.textWhite,
      })
      .setOrigin(0.5)
      .setDepth(CONFIRM_DEPTH + 2)
      .setPadding(
        SPACING.lg,
        Math.max(4, (rowH - 20) / 2),
        SPACING.lg,
        Math.max(4, (rowH - 20) / 2),
      );

    // Keyboard input (BUG-083: guard with active flag)
    scene.input.keyboard!.on('keydown-UP', this.moveUp, this);
    scene.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    scene.input.keyboard!.on('keydown-ENTER', this.confirm, this);
    scene.input.keyboard!.on('keydown-ESC', this.cancel, this);

    // Touch/pointer support (BUG-067)
    this.yesText.setInteractive({ useHandCursor: true });
    this.noText.setInteractive({ useHandCursor: true });
    this.yesText.on('pointerdown', () => {
      this.cursor = 0;
      this.updateCursor();
      this.confirm();
    });
    this.noText.on('pointerdown', () => {
      this.cursor = 1;
      this.updateCursor();
      this.confirm();
    });
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
    this.yesText.setColor(this.cursor === 0 ? COLORS.textHighlight : COLORS.textWhite);
    this.noText.setText(this.cursor === 1 ? '▶ NO' : '  NO');
    this.noText.setColor(this.cursor === 1 ? COLORS.textHighlight : COLORS.textWhite);
  }

  private destroyHandlers(): void {
    if (this.destroyed) return;
    this.destroyed = true;
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
