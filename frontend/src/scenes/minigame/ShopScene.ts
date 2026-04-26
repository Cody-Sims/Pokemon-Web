import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { itemData } from '@data/item-data';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { COLORS, FONTS, SPACING, mobileFontSize, isMobile, MIN_TOUCH_TARGET, MOBILE_SCALE } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import type { ItemData } from '@data/interfaces';

type ShopTab = 'buy' | 'sell';

export class ShopScene extends Phaser.Scene {
  private tab: ShopTab = 'buy';
  private shopItems: string[] = [];
  private shopId = 'viridian-city';
  private filteredItems: { item: ItemData; qty: number }[] = [];
  private scrollOffset = 0;
  private readonly maxVisible = 7;
  private mode: 'browse' | 'quantity' | 'confirm' = 'browse';
  private quantityValue = 1;

  // UI elements
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private itemPriceTexts: Phaser.GameObjects.Text[] = [];
  private cursorIcon!: Phaser.GameObjects.Text;
  private detailName?: Phaser.GameObjects.Text;
  private detailDesc?: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private quantityText?: Phaser.GameObjects.Text;
  private quantityPanel?: NinePatchPanel;
  private totalText?: Phaser.GameObjects.Text;
  private scrollUpIndicator?: Phaser.GameObjects.Text;
  private scrollDownIndicator?: Phaser.GameObjects.Text;
  private listController?: MenuController;
  private itemListGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data: { shopId?: string }): void {
    this.shopId = data?.shopId ?? 'viridian-city';
    const shopId = this.shopId;
    // Dynamically import shop data
    import('@data/shop-data').then(mod => {
      this.shopItems = mod.shopInventories[shopId] ?? mod.shopInventories['viridian-city'] ?? [];
      this.buildUI();
    });
  }

  private buildUI(): void {
    const layout = ui(this);
    this.itemListGroup = this.add.group();

    // Full background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.add.text(layout.cx, 28, 'POKÉ MART', { ...FONTS.heading, fontSize: mobileFontSize(24) }).setOrigin(0.5);
    this.add.rectangle(layout.cx, 46, 180, 2, COLORS.borderHighlight, 0.4);

    // Money display (top right)
    const gm = GameManager.getInstance();
    this.moneyText = this.add.text(layout.w - 30, 28, `₽ ${gm.getMoney()}`, {
      ...FONTS.body, color: COLORS.textHighlight,
    }).setOrigin(1, 0.5);

    // Tabs
    const tabLabels: { key: ShopTab; label: string }[] = [
      { key: 'buy', label: 'BUY' },
      { key: 'sell', label: 'SELL' },
    ];
    this.tabTexts = tabLabels.map((t, i) => {
      const tx = this.add.text(Math.round(layout.cx - 100 + i * (layout.w * 0.15)), 58, t.label, {
        ...FONTS.body, fontSize: mobileFontSize(16),
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      tx.on('pointerdown', () => {
        if (this.mode !== 'browse') return;
        this.tab = t.key;
        this.scrollOffset = 0;
        this.switchTab();
      });
      return tx;
    });
    this.add.rectangle(layout.cx, 74, layout.w - 40, 1, COLORS.border, 0.4);

    // Detail panel (right side)
    new NinePatchPanel(this, layout.w - 140, layout.cy + 20, 240, layout.h - 140, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.7,
      borderColor: COLORS.border,
      cornerRadius: 6,
    });
    this.detailName = this.add.text(layout.w - 250, 100, '', { ...FONTS.body, fontStyle: 'bold' });
    this.detailDesc = this.add.text(layout.w - 250, 130, '', { ...FONTS.bodySmall, wordWrap: { width: 220 } });

    // Cursor icon
    this.cursorIcon = this.add.text(0, 0, '▸', { ...FONTS.menuItem, color: COLORS.textHighlight });

    // Scroll indicators
    this.scrollUpIndicator = this.add.text(250, 80, '▲', { ...FONTS.body, color: COLORS.textDim }).setOrigin(0.5).setVisible(false);
    this.scrollDownIndicator = this.add.text(250, layout.h - 50, '▼', { ...FONTS.body, color: COLORS.textDim }).setOrigin(0.5).setVisible(false);

    // Close hint / tappable close button
    if (isMobile()) {
      const closeBtn = this.add.text(layout.cx, layout.h - 18, '✕  LEAVE', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', () => this.close());
    } else {
      this.add.text(layout.cx, layout.h - 18, 'ESC to leave  |  ◀/▶ or Q/E switch tabs', FONTS.caption).setOrigin(0.5);
    }

    // Tab switching keys
    const switchTab = () => {
      if (this.mode !== 'browse') return;
      this.tab = this.tab === 'buy' ? 'sell' : 'buy';
      this.scrollOffset = 0;
      this.switchTab();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const switchToBuy = () => {
      if (this.mode !== 'browse' || this.tab === 'buy') return;
      this.tab = 'buy';
      this.scrollOffset = 0;
      this.switchTab();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const switchToSell = () => {
      if (this.mode !== 'browse' || this.tab === 'sell') return;
      this.tab = 'sell';
      this.scrollOffset = 0;
      this.switchTab();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    this.input.keyboard!.on('keydown-Q', switchTab);
    this.input.keyboard!.on('keydown-E', switchTab);
    this.input.keyboard!.on('keydown-LEFT', switchToBuy);
    this.input.keyboard!.on('keydown-RIGHT', switchToSell);

    this.switchTab();

    // Re-layout on resize / orientation change
    let resizeInit = false;
    layoutOn(this, () => {
      if (!resizeInit) { resizeInit = true; return; }
      this.listController?.destroy();
      this.scene.restart({ shopId: this.shopId });
    });
  }

  private switchTab(): void {
    // Highlight active tab
    this.tabTexts.forEach((t, i) => {
      const isActive = (i === 0 && this.tab === 'buy') || (i === 1 && this.tab === 'sell');
      t.setColor(isActive ? COLORS.textHighlight : COLORS.textGray);
    });

    this.mode = 'browse';
    this.destroyQuantityUI();
    this.refreshList();
  }

  private refreshList(): void {
    const layout = ui(this);
    // Clear old
    this.itemListGroup.clear(true, true);
    this.itemTexts = [];
    this.itemPriceTexts = [];
    this.listController?.destroy();

    if (this.tab === 'buy') {
      this.filteredItems = this.shopItems
        .map(id => ({ item: itemData[id], qty: 0 }))
        .filter(e => e.item);
    } else {
      const gm = GameManager.getInstance();
      this.filteredItems = gm.getBag()
        .map(e => ({ item: itemData[e.itemId], qty: e.quantity }))
        .filter(e => e.item && e.item.category !== 'key');
    }

    if (this.filteredItems.length === 0) {
      const emptyText = this.add.text(250, layout.cy, this.tab === 'buy' ? 'Nothing for sale!' : 'Nothing to sell!', {
        ...FONTS.body, color: COLORS.textDim,
      }).setOrigin(0.5);
      this.itemListGroup.add(emptyText);
      this.cursorIcon.setVisible(false);
      this.detailName?.setText('');
      this.detailDesc?.setText('');
      return;
    }

    this.cursorIcon.setVisible(true);

    // Clamp scroll offset
    const maxScroll = Math.max(0, this.filteredItems.length - this.maxVisible);
    this.scrollOffset = Math.min(this.scrollOffset, maxScroll);

    const visible = this.filteredItems.slice(this.scrollOffset, this.scrollOffset + this.maxVisible);
    const startY = 90;
    const lineH = isMobile() ? Math.max(MIN_TOUCH_TARGET, 36 * MOBILE_SCALE) : 36;

    visible.forEach((entry, i) => {
      const y = startY + i * lineH;
      const nameLabel = this.tab === 'sell'
        ? `${entry.item.name} ×${entry.qty}`
        : entry.item.name;
      const name = this.add.text(40, y, nameLabel, { ...FONTS.body, fontSize: mobileFontSize(16) })
        .setInteractive({ useHandCursor: true });
      name.on('pointerover', () => this.listController?.hoverIndex(i));
      name.on('pointerdown', () => this.listController?.clickIndex(i));
      this.itemListGroup.add(name);
      this.itemTexts.push(name);

      const price = this.tab === 'buy'
        ? (entry.item.buyPrice ?? 0)
        : Math.floor((entry.item.buyPrice ?? 0) / 2);
      const priceText = this.add.text(Math.round(layout.w * 0.55), y, `₽${price}`, {
        ...FONTS.bodySmall, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      });
      this.itemListGroup.add(priceText);
      this.itemPriceTexts.push(priceText);
    });

    // Scroll indicators
    this.scrollUpIndicator?.setVisible(this.scrollOffset > 0);
    this.scrollDownIndicator?.setVisible(this.scrollOffset + this.maxVisible < this.filteredItems.length);

    this.listController = new MenuController(this, {
      itemCount: visible.length,
      onMove: (idx) => this.onItemMove(idx),
      onConfirm: (idx) => this.onItemSelect(idx),
      onCancel: () => this.close(),
    });

    this.onItemMove(0);
  }

  private onItemMove(idx: number): void {
    // Scroll handling
    const absoluteIdx = this.scrollOffset + idx;

    // Scroll down
    if (idx === this.maxVisible - 1 && absoluteIdx < this.filteredItems.length - 1) {
      this.scrollOffset++;
      this.refreshList();
      this.listController?.setCursor(this.maxVisible - 2);
      return;
    }
    // Scroll up
    if (idx === 0 && this.scrollOffset > 0) {
      this.scrollOffset--;
      this.refreshList();
      this.listController?.setCursor(1);
      return;
    }

    // Highlight
    this.itemTexts.forEach((t, i) => {
      t.setColor(i === idx ? COLORS.textHighlight : COLORS.textWhite);
    });
    // Position cursor
    const sel = this.itemTexts[idx];
    if (sel) {
      this.cursorIcon.setPosition(sel.x - 20, sel.y);
    }
    // Detail
    const entry = this.filteredItems[absoluteIdx];
    if (entry) {
      this.detailName?.setText(entry.item.name);
      this.detailDesc?.setText(entry.item.description);
    }
  }

  private onItemSelect(idx: number): void {
    const absoluteIdx = this.scrollOffset + idx;
    const entry = this.filteredItems[absoluteIdx];
    if (!entry) return;

    this.mode = 'quantity';
    this.quantityValue = 1;
    this.listController?.setDisabled(true);
    this.showQuantityUI(entry);
  }

  private showQuantityUI(entry: { item: ItemData; qty: number }): void {
    const layout = ui(this);
    this.destroyQuantityUI();

    const isBuy = this.tab === 'buy';
    const unitPrice = isBuy
      ? (entry.item.buyPrice ?? 0)
      : Math.floor((entry.item.buyPrice ?? 0) / 2);
    const gm = GameManager.getInstance();
    const maxQty = isBuy
      ? (unitPrice > 0 ? Math.floor(gm.getMoney() / unitPrice) : 0)
      : entry.qty;

    if (maxQty <= 0) {
      // Can't afford / nothing to sell
      AudioManager.getInstance().playSFX(SFX.ERROR);
      this.mode = 'browse';
      this.listController?.setDisabled(false);
      return;
    }

    this.quantityValue = 1;

    // Quantity panel
    const panelX = layout.cx;
    const panelY = layout.cy;
    this.quantityPanel = new NinePatchPanel(this, panelX, panelY, 280, 140, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.borderHighlight,
      cornerRadius: 8,
    }).setDepth(10);

    const title = isBuy ? `Buy ${entry.item.name}` : `Sell ${entry.item.name}`;
    const titleText = this.add.text(panelX, panelY - 50, title, {
      ...FONTS.body, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.itemListGroup.add(titleText);

    this.add.text(panelX - 80, panelY - 10, '◀', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.adjustQuantity(-1));
    this.itemListGroup.add(this.children.list[this.children.list.length - 1]);

    this.quantityText = this.add.text(panelX, panelY - 10, `× ${this.quantityValue}`, {
      ...FONTS.heading,
    }).setOrigin(0.5).setDepth(11);
    this.itemListGroup.add(this.quantityText);

    this.add.text(panelX + 80, panelY - 10, '▶', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.adjustQuantity(1));
    this.itemListGroup.add(this.children.list[this.children.list.length - 1]);

    this.totalText = this.add.text(panelX, panelY + 30, `Total: ₽${unitPrice * this.quantityValue}`, {
      ...FONTS.body, color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(11);
    this.itemListGroup.add(this.totalText);

    // Keyboard: LEFT/RIGHT to adjust, ENTER to confirm, ESC to cancel
    const kb = this.input.keyboard!;
    const leftFn = () => this.adjustQuantity(-1);
    const rightFn = () => this.adjustQuantity(1);
    const upFn = () => this.adjustQuantity(10);
    const downFn = () => this.adjustQuantity(-10);
    const confirmFn = () => {
      kb.off('keydown-LEFT', leftFn);
      kb.off('keydown-RIGHT', rightFn);
      kb.off('keydown-UP', upFn);
      kb.off('keydown-DOWN', downFn);
      kb.off('keydown-ENTER', confirmFn);
      kb.off('keydown-ESC', cancelFn);
      this.executeTransaction(entry, unitPrice);
    };
    const cancelFn = () => {
      kb.off('keydown-LEFT', leftFn);
      kb.off('keydown-RIGHT', rightFn);
      kb.off('keydown-UP', upFn);
      kb.off('keydown-DOWN', downFn);
      kb.off('keydown-ENTER', confirmFn);
      kb.off('keydown-ESC', cancelFn);
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.destroyQuantityUI();
      this.mode = 'browse';
      this.listController?.setDisabled(false);
    };

    kb.on('keydown-LEFT', leftFn);
    kb.on('keydown-RIGHT', rightFn);
    kb.on('keydown-UP', upFn);
    kb.on('keydown-DOWN', downFn);
    kb.on('keydown-ENTER', confirmFn);
    kb.on('keydown-ESC', cancelFn);

    // Store unit price and maxQty for adjustQuantity
    (this as Record<string, unknown>)._unitPrice = unitPrice;
    (this as Record<string, unknown>)._maxQty = maxQty;
  }

  private adjustQuantity(delta: number): void {
    const maxQty = (this as Record<string, unknown>)._maxQty as number;
    const unitPrice = (this as Record<string, unknown>)._unitPrice as number;
    this.quantityValue = Math.max(1, Math.min(maxQty, this.quantityValue + delta));
    this.quantityText?.setText(`× ${this.quantityValue}`);
    this.totalText?.setText(`Total: ₽${unitPrice * this.quantityValue}`);
  }

  private executeTransaction(entry: { item: ItemData; qty: number }, unitPrice: number): void {
    const layout = ui(this);
    const gm = GameManager.getInstance();
    const total = unitPrice * this.quantityValue;

    if (this.tab === 'buy') {
      if (!gm.spendMoney(total)) {
        AudioManager.getInstance().playSFX(SFX.ERROR);
        this.destroyQuantityUI();
        this.mode = 'browse';
        this.listController?.setDisabled(false);
        return;
      }
      gm.addItem(entry.item.id, this.quantityValue);
    } else {
      if (!gm.removeItem(entry.item.id, this.quantityValue)) {
        AudioManager.getInstance().playSFX(SFX.ERROR);
        this.destroyQuantityUI();
        this.mode = 'browse';
        this.listController?.setDisabled(false);
        return;
      }
      gm.addMoney(total);
    }

    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.moneyText.setText(`₽ ${gm.getMoney()}`);

    // Show confirmation flash
    const msg = this.tab === 'buy'
      ? `Bought ${this.quantityValue}× ${entry.item.name}!`
      : `Sold ${this.quantityValue}× ${entry.item.name}!`;
    const flash = this.add.text(layout.cx, layout.h - 50, msg, {
      ...FONTS.body, color: COLORS.textSuccess,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      delay: 1000,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    this.destroyQuantityUI();
    this.mode = 'browse';
    this.scrollOffset = 0;
    this.refreshList();
    this.listController?.setDisabled(false);
  }

  private destroyQuantityUI(): void {
    this.quantityPanel?.destroy();
    this.quantityPanel = undefined;
    this.quantityText = undefined;
    this.totalText = undefined;
  }

  private close(): void {
    this.listController?.destroy();
    this.scene.stop();
  }

  shutdown(): void {
    this.input.keyboard?.removeAllListeners();
    this.tweens.killAll();
  }
}
