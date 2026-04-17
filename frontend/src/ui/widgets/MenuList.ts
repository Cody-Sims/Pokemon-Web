import Phaser from 'phaser';

/** Selectable vertical menu (cursor-driven). */
export class MenuList {
  private scene: Phaser.Scene;
  private items: Phaser.GameObjects.Text[] = [];
  private cursor = 0;
  private onSelect: (index: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    labels: string[],
    onSelect: (index: number) => void,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) {
    this.scene = scene;
    this.onSelect = onSelect;

    const textStyle = style ?? { fontSize: '18px', color: '#ffffff' };

    labels.forEach((label, i) => {
      const text = scene.add.text(x, y + i * 32, label, textStyle);
      // Touch/pointer support (BUG-068)
      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        this.cursor = i;
        this.updateCursor();
        this.onSelect(i);
      });
      this.items.push(text);
    });

    this.updateCursor();
  }

  moveUp(): void {
    this.cursor = (this.cursor - 1 + this.items.length) % this.items.length;
    this.updateCursor();
  }

  moveDown(): void {
    this.cursor = (this.cursor + 1) % this.items.length;
    this.updateCursor();
  }

  select(): void {
    this.onSelect(this.cursor);
  }

  getCursor(): number { return this.cursor; }

  private updateCursor(): void {
    this.items.forEach((item, i) => {
      item.setColor(i === this.cursor ? '#ffcc00' : '#ffffff');
      item.setText(i === this.cursor ? `▶ ${item.text.replace(/^▶ /, '')}` : item.text.replace(/^▶ /, ''));
    });
  }

  destroy(): void {
    this.items.forEach(i => i.destroy());
  }
}
