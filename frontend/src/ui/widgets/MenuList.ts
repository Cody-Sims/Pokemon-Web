import Phaser from 'phaser';
import { SelectableController } from '@ui/controls/SelectableController';
import { COLORS, FONTS, SPACING, mobileFontSize } from '@ui/theme';

/** Selectable vertical menu view backed by SelectableController. */
export class MenuList {
  private readonly items: Phaser.GameObjects.Text[] = [];
  private readonly controller: SelectableController;
  private readonly onSelect: (index: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    labels: string[],
    onSelect: (index: number) => void,
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    this.onSelect = onSelect;
    const textStyle = style ?? {
      ...FONTS.menuItem,
      fontSize: mobileFontSize(17),
      color: COLORS.textWhite,
      lineSpacing: 4,
    };

    this.controller = new SelectableController({
      itemCount: labels.length,
      columns: 1,
      wrap: true,
      onMove: () => this.updateCursor(),
      onConfirm: (index) => this.onSelect(index),
    });

    labels.forEach((label, index) => {
      const text = scene.add.text(
        x,
        y + index * Math.max(30, SPACING.lineHeight),
        label,
        textStyle,
      );
      this.items.push(text);
    });
    this.controller.bindInteractive(this.items);
    this.updateCursor();
  }

  moveUp(): void {
    this.controller.navigate('up');
  }

  moveDown(): void {
    this.controller.navigate('down');
  }

  select(): void {
    this.controller.confirm();
  }

  getCursor(): number {
    return this.controller.getCursor();
  }

  private updateCursor(): void {
    const cursor = this.controller.getCursor();
    this.items.forEach((item, index) => {
      item.setColor(index === cursor ? COLORS.textHighlight : COLORS.textWhite);
      const base = item.text.replace(/^▶ /, '');
      item.setText(index === cursor ? `▶ ${base}` : base);
    });
  }

  destroy(): void {
    this.controller.destroy();
    this.items.forEach((item) => item.destroy());
  }
}
