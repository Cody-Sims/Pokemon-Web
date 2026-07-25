import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, SPACING, mobileFontSize } from '@ui/theme';
import { ScrollContainer } from './ScrollContainer';
import type { InventoryEntry } from '@systems/inventory';

export interface InventoryItemListConfig {
  maxVisible: number;
  onHover: (index: number) => void;
  onClick: (index: number) => void;
  onScrollWindow: (windowStart: number) => void;
}

export interface InventoryItemListRenderState {
  items: readonly InventoryEntry[];
  selectedIndex: number;
  scrollOffset: number;
}

export class InventoryItemList {
  private readonly group: Phaser.GameObjects.Group;
  private scrollContainer?: ScrollContainer;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: InventoryItemListConfig,
  ) {
    this.group = scene.add.group();
  }

  render(state: InventoryItemListRenderState): void {
    this.scrollContainer?.destroy();
    this.group.clear(true, true);

    if (state.items.length === 0) {
      const layout = ui(this.scene);
      const empty = this.scene.add
        .text(layout.cx, layout.cy, 'No items', {
          ...FONTS.bodySmall,
          color: COLORS.textDim,
        })
        .setOrigin(0.5);
      this.group.add(empty);
      return;
    }

    const layout = ui(this.scene);
    const isPortrait = layout.h > layout.w;
    const startY = 92;
    const itemH = Math.max(34, SPACING.lineHeight + SPACING.xs);
    const endIndex = Math.min(state.scrollOffset + this.config.maxVisible, state.items.length);
    const qtyX = isPortrait ? layout.w - 40 : 260;
    const qtyOrigin = isPortrait ? 1 : 0;

    for (let index = state.scrollOffset; index < endIndex; index++) {
      const entry = state.items[index];
      const y = startY + (index - state.scrollOffset) * itemH;
      const text = this.scene.add
        .text(SPACING.xl, y, entry.item.name, {
          ...FONTS.body,
          fontSize: mobileFontSize(15),
          color: index === state.selectedIndex ? COLORS.textHighlight : COLORS.textWhite,
          wordWrap: { width: isPortrait ? layout.w - 110 : 190 },
          maxLines: 1,
        })
        .setInteractive({ useHandCursor: true });
      const qty = this.scene.add
        .text(qtyX, y, `x${entry.qty}`, FONTS.bodySmall)
        .setOrigin(qtyOrigin, 0);
      text.on('pointerover', () => this.config.onHover(index));
      text.on('pointerdown', () => this.config.onClick(index));
      this.group.add(text);
      this.group.add(qty);
    }

    if (state.scrollOffset > 0) {
      this.group.add(
        this.scene.add
          .text(150, startY - 16, '▲', {
            ...FONTS.caption,
            color: COLORS.textHighlight,
          })
          .setOrigin(0.5),
      );
    }
    if (endIndex < state.items.length) {
      this.group.add(
        this.scene.add
          .text(150, startY + this.config.maxVisible * itemH, '▼', {
            ...FONTS.caption,
            color: COLORS.textHighlight,
          })
          .setOrigin(0.5),
      );
    }

    this.scrollContainer = new ScrollContainer(this.scene, {
      x: SPACING.sm,
      y: 88,
      width: isPortrait ? layout.w - SPACING.lg : 280,
      height: this.config.maxVisible * itemH,
      contentHeight: state.items.length * itemH,
      onScroll: (offset) => this.config.onScrollWindow(Math.round(offset / itemH)),
    });
    this.scrollContainer.scrollTo(state.scrollOffset * itemH);
  }

  destroy(): void {
    this.scrollContainer?.destroy();
    this.group.destroy(true, true);
  }
}
