import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { formatMoney } from '@utils/format';
import { COLORS, FONTS, mobileFontSize, isMobile, PANEL_PRESETS } from '@ui/theme';
import { NinePatchPanel } from './NinePatchPanel';
import type { InventoryCategory, InventoryCategoryLabel } from '@systems/inventory';

const PORTRAIT_TAB_LABELS: Record<InventoryCategory, string> = {
  medicine: 'Med',
  pokeball: 'Balls',
  battle: 'Btl',
  key: 'Key',
  tm: 'TMs',
};

export interface InventoryPanelConfig {
  categories: readonly InventoryCategoryLabel[];
  categoryIndex: number;
  money: number;
  onCategorySelect: (index: number) => void;
  onClose: () => void;
}

export class InventoryPanel {
  private readonly panels: NinePatchPanel[] = [];
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly tabTexts: Phaser.GameObjects.Text[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly config: InventoryPanelConfig) {
    this.render();
  }

  setCategoryIndex(index: number): void {
    this.tabTexts.forEach((text, textIndex) => {
      text.setColor(textIndex === index ? COLORS.textHighlight : COLORS.textGray);
      text.setFontStyle(textIndex === index ? 'bold' : '');
    });
  }

  destroy(): void {
    this.panels.forEach(panel => panel.destroy());
    this.objects.forEach(object => object.destroy());
    this.panels.length = 0;
    this.objects.length = 0;
    this.tabTexts.length = 0;
  }

  private render(): void {
    const layout = ui(this.scene);
    const isPortrait = layout.h > layout.w;

    this.objects.push(this.scene.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark));
    this.panels.push(new NinePatchPanel(this.scene, layout.cx, layout.cy, layout.w - 20, layout.h - 20, PANEL_PRESETS.menu));

    this.objects.push(this.scene.add.text(layout.cx, 28, 'BAG', {
      ...FONTS.heading,
      fontSize: mobileFontSize(24),
    }).setOrigin(0.5));
    this.objects.push(this.scene.add.rectangle(layout.cx, 46, 160, 2, COLORS.borderHighlight, 0.4));

    const topCloseBtn = this.scene.add.text(layout.w - 16, 16, '✕', {
      ...FONTS.heading,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);
    topCloseBtn.setPadding(10, 6, 10, 6);
    topCloseBtn.on('pointerdown', this.config.onClose);
    this.objects.push(topCloseBtn);

    this.renderTabs(isPortrait, layout.w);
    this.objects.push(this.scene.add.rectangle(layout.cx, 78, layout.w - 40, 1, COLORS.border, 0.4));
    this.renderDetailBacking(isPortrait, layout);
    this.renderFooter(isPortrait, layout);
    this.setCategoryIndex(this.config.categoryIndex);
  }

  private renderTabs(isPortrait: boolean, width: number): void {
    const tabPad = 12;
    const tabAreaW = width - tabPad * 2;
    const tabSlotW = tabAreaW / this.config.categories.length;

    this.config.categories.forEach((cat, index) => {
      const label = isPortrait ? PORTRAIT_TAB_LABELS[cat.key] : cat.label;
      const text = this.scene.add.text(tabPad + tabSlotW * index + tabSlotW / 2, 58, label, {
        ...FONTS.bodySmall,
        fontSize: mobileFontSize(isPortrait ? 11 : 13),
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => this.config.onCategorySelect(index));
      this.tabTexts.push(text);
      this.objects.push(text);
    });
  }

  private renderDetailBacking(isPortrait: boolean, layout: ReturnType<typeof ui>): void {
    const bottomReserve = isPortrait ? 60 : 0;
    if (isPortrait) {
      const usableH = layout.h - 90 - bottomReserve;
      const listH = Math.floor(usableH * 0.55);
      const detailH = usableH - listH - 16;
      this.panels.push(new NinePatchPanel(this.scene, layout.cx, 90 + listH + 8 + detailH / 2, layout.w - 30, detailH, {
        fillColor: COLORS.bgCard,
        fillAlpha: 0.7,
        borderColor: COLORS.border,
        cornerRadius: 6,
      }));
      return;
    }

    this.panels.push(new NinePatchPanel(this.scene, layout.w - 160, layout.cy + 30, 280, layout.h - 160, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.7,
      borderColor: COLORS.border,
      cornerRadius: 6,
    }));
  }

  private renderFooter(isPortrait: boolean, layout: ReturnType<typeof ui>): void {
    const bottomReserve = isPortrait ? 60 : 0;
    const moneyY = isPortrait ? layout.h - bottomReserve + 8 : layout.h - 50;
    this.objects.push(this.scene.add.text(isPortrait ? 16 : layout.w - 280, moneyY, formatMoney(this.config.money, { useGrouping: false }), {
      ...FONTS.body,
      color: COLORS.textHighlight,
    }));

    const closeY = isPortrait ? layout.h - bottomReserve + 32 : layout.h - 22;
    if (isMobile()) {
      const closeBtn = this.scene.add.text(layout.cx, closeY, '✕  CLOSE', {
        ...FONTS.body,
        fontSize: mobileFontSize(14),
        color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', this.config.onClose);
      this.objects.push(closeBtn);
    } else {
      this.objects.push(this.scene.add.text(layout.cx, closeY, 'ESC to close', FONTS.caption).setOrigin(0.5));
    }
  }
}
