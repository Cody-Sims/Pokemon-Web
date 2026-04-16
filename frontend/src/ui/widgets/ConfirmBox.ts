import Phaser from 'phaser';

/** Yes/No confirmation prompt. */
export class ConfirmBox {
  private scene: Phaser.Scene;
  private background: Phaser.GameObjects.Rectangle;
  private yesText: Phaser.GameObjects.Text;
  private noText: Phaser.GameObjects.Text;
  private cursor = 0; // 0 = Yes, 1 = No
  private onResult: (confirmed: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    prompt: string,
    onResult: (confirmed: boolean) => void
  ) {
    this.scene = scene;
    this.onResult = onResult;

    this.background = scene.add.rectangle(x + 60, y + 40, 140, 90, 0x222222, 0.95);
    this.background.setStrokeStyle(2, 0xffffff);

    scene.add.text(x + 10, y + 5, prompt, { fontSize: '14px', color: '#ffffff' });
    this.yesText = scene.add.text(x + 25, y + 30, '▶ YES', { fontSize: '16px', color: '#ffcc00' });
    this.noText = scene.add.text(x + 25, y + 55, '  NO', { fontSize: '16px', color: '#ffffff' });

    scene.input.keyboard!.on('keydown-UP', this.moveUp, this);
    scene.input.keyboard!.on('keydown-DOWN', this.moveDown, this);
    scene.input.keyboard!.on('keydown-ENTER', this.confirm, this);
  }

  private moveUp = (): void => {
    this.cursor = 0;
    this.updateCursor();
  };

  private moveDown = (): void => {
    this.cursor = 1;
    this.updateCursor();
  };

  private confirm = (): void => {
    this.onResult(this.cursor === 0);
    this.destroy();
  };

  private updateCursor(): void {
    this.yesText.setText(this.cursor === 0 ? '▶ YES' : '  YES');
    this.yesText.setColor(this.cursor === 0 ? '#ffcc00' : '#ffffff');
    this.noText.setText(this.cursor === 1 ? '▶ NO' : '  NO');
    this.noText.setColor(this.cursor === 1 ? '#ffcc00' : '#ffffff');
  }

  destroy(): void {
    this.scene.input.keyboard!.off('keydown-UP', this.moveUp, this);
    this.scene.input.keyboard!.off('keydown-DOWN', this.moveDown, this);
    this.scene.input.keyboard!.off('keydown-ENTER', this.confirm, this);
    this.background.destroy();
    this.yesText.destroy();
    this.noText.destroy();
  }
}
