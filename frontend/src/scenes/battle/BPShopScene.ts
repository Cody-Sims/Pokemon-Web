import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import { itemData } from '@data/item-data';
import { battlePointShopCatalog, type BattlePointShopEntry } from '@data/bp-shop-data';

/**
 * A.1 Battle Tower — BP Shop.
 *
 * Standalone purchase scene that spends `BattlePoints` (NOT Pokédollars) for
 * competitive held items, berries, and rare candies. Reachable from the
 * Battle Tower lobby and intentionally separate from the regular `ShopScene`
 * to keep the currency logic isolated. No sell tab — BP-purchased items are
 * one-way.
 *
 * Layout (single column for simplicity):
 *   - Top:    BP balance.
 *   - Middle: scrollable item list (8 visible at a time).
 *   - Bottom: detail panel for the highlighted item.
 *   - Footer: Buy / Close hints.
 */
export class BPShopScene extends Phaser.Scene {
  private cursor = 0;
  private scroll = 0;
  private readonly visibleCount = 8;
  private rebuildLayer?: Phaser.GameObjects.Container;
  private statusMsg?: Phaser.GameObjects.Text;
  private initData?: Record<string, unknown>;

  constructor() {
    super({ key: 'BPShopScene' });
  }

  init(data?: Record<string, unknown>): void {
    this.initData = data;
  }

  create(): void {
    this.cursor = 0;
    this.scroll = 0;
    this.buildLayout();
    layoutOn(this, () => this.buildLayout());
  }

  private buildLayout(): void {
    if (this.rebuildLayer) {
      this.rebuildLayer.destroy(true);
    }
    const layer = this.add.container(0, 0);
    this.rebuildLayer = layer;
    const layout = ui(this);
    const gm = GameManager.getInstance();

    layer.add(this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark));
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    layer.add(this.add.text(layout.cx, 24, 'BP SHOP', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5));
    layer.add(this.add.text(layout.cx, 46, 'Spend Battle Points on competitive gear.', {
      ...FONTS.caption, color: COLORS.textGray,
    }).setOrigin(0.5));

    layer.add(this.add.text(layout.w - 30, 24, `${gm.getBattlePoints()} BP`, {
      ...FONTS.body, color: '#ffd86b', fontStyle: 'bold',
    }).setOrigin(1, 0.5));

    // ── Item list ──
    const listTop = 78;
    const rowH = Math.round(28 * MOBILE_SCALE);
    const fontSize = mobileFontSize(14);
    const visible = battlePointShopCatalog.slice(this.scroll, this.scroll + this.visibleCount);

    visible.forEach((entry, i) => {
      const idx = this.scroll + i;
      const item = itemData[entry.itemId];
      const y = listTop + i * rowH;
      const isCursor = idx === this.cursor;
      const affordable = gm.getBattlePoints() >= entry.cost;
      const color = isCursor ? '#ffd86b' : affordable ? '#ffffff' : '#666666';

      if (isCursor) {
        layer.add(this.add.rectangle(layout.cx, y, layout.w - 60, rowH, COLORS.bgCard, 0.45));
      }
      layer.add(this.add.text(40, y, isCursor ? '▸' : ' ', {
        fontSize, color: COLORS.textHighlight,
      }).setOrigin(0, 0.5));
      layer.add(this.add.text(60, y, item?.name ?? entry.itemId, {
        fontSize, color, fontStyle: 'bold',
      }).setOrigin(0, 0.5));
      layer.add(this.add.text(layout.w - 40, y, `${entry.cost} BP`, {
        fontSize, color: affordable ? '#ffd86b' : '#ff8080',
      }).setOrigin(1, 0.5));
    });

    // Scroll indicators
    if (this.scroll > 0) {
      layer.add(this.add.text(layout.cx, listTop - 14, '▲', { fontSize, color: COLORS.textDim }).setOrigin(0.5));
    }
    if (this.scroll + this.visibleCount < battlePointShopCatalog.length) {
      layer.add(this.add.text(layout.cx, listTop + this.visibleCount * rowH + 4, '▼', { fontSize, color: COLORS.textDim }).setOrigin(0.5));
    }

    // ── Detail panel ──
    const detailTop = listTop + this.visibleCount * rowH + 24;
    const cur = battlePointShopCatalog[this.cursor];
    const curItem = itemData[cur.itemId];
    if (curItem) {
      layer.add(this.add.text(layout.cx, detailTop, curItem.name, {
        ...FONTS.body, color: COLORS.textHighlight, fontStyle: 'bold',
      }).setOrigin(0.5));
      layer.add(this.add.text(layout.cx, detailTop + 18, `Owned: ${gm.getItemCount(cur.itemId)}`, {
        fontSize: mobileFontSize(11), color: '#a0a0a0',
      }).setOrigin(0.5));
      layer.add(this.add.text(layout.cx, detailTop + 36, curItem.description, {
        fontSize: mobileFontSize(11), color: '#cccccc',
        wordWrap: { width: layout.w - 80 }, align: 'center',
      }).setOrigin(0.5, 0));
    }

    // Status (post-purchase or insufficient-funds toast)
    if (this.statusMsg) {
      this.statusMsg.setPosition(layout.cx, layout.h - 56);
      layer.add(this.statusMsg);
    }

    // Footer hints
    layer.add(this.add.text(layout.cx, layout.h - 24,
      '↑/↓ select   ENTER buy   ESC close',
      { ...FONTS.caption, color: COLORS.textDim },
    ).setOrigin(0.5));

    this.bindInput();
  }

  private bindInput(): void {
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard!.on('keydown-UP', () => this.move(-1));
    this.input.keyboard!.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard!.on('keydown-ENTER', () => this.buy());
    this.input.keyboard!.on('keydown-SPACE', () => this.buy());
    this.input.keyboard!.on('keydown-ESC', () => this.close());
  }

  private move(delta: number): void {
    const total = battlePointShopCatalog.length;
    this.cursor = (this.cursor + delta + total) % total;
    if (this.cursor < this.scroll) this.scroll = this.cursor;
    else if (this.cursor >= this.scroll + this.visibleCount) {
      this.scroll = this.cursor - this.visibleCount + 1;
    }
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.statusMsg?.destroy();
    this.statusMsg = undefined;
    this.buildLayout();
  }

  private buy(): void {
    const entry: BattlePointShopEntry = battlePointShopCatalog[this.cursor];
    const gm = GameManager.getInstance();
    if (!gm.spendBattlePoints(entry.cost)) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.statusMsg = this.add.text(0, 0, `Not enough BP — need ${entry.cost} BP.`, {
        ...FONTS.caption, color: '#ff8080',
      }).setOrigin(0.5);
      this.buildLayout();
      return;
    }
    gm.addItem(entry.itemId, 1);
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const itemName = itemData[entry.itemId]?.name ?? entry.itemId;
    this.statusMsg = this.add.text(0, 0, `Bought ${itemName} for ${entry.cost} BP!`, {
      ...FONTS.caption, color: '#ffd86b',
    }).setOrigin(0.5);
    this.buildLayout();
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    const exit = (this.initData?.exitScene as string) ?? 'BattleTowerScene';
    this.scene.start(exit);
  }
}
