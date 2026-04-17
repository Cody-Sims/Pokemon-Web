import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { itemData } from '@data/item-data';
import { pokemonData } from '@data/pokemon';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { COLORS, FONTS, SPACING, mobileFontSize, isMobile } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import { tmData } from '@data/tm-data';
import type { ItemData } from '@data/interfaces';

type ItemCategory = 'medicine' | 'pokeball' | 'battle' | 'key' | 'tm';

const CATEGORY_LABELS: { key: ItemCategory; label: string }[] = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'pokeball', label: 'Poké Balls' },
  { key: 'battle', label: 'Battle' },
  { key: 'key', label: 'Key Items' },
  { key: 'tm', label: 'TMs' },
];

export class InventoryScene extends Phaser.Scene {
  private currentCategory: ItemCategory = 'medicine';
  private categoryIndex = 0;
  private filteredItems: { item: ItemData; qty: number }[] = [];
  private itemController?: MenuController;
  private actionController?: MenuController;
  private quantityValue = 1;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private detailGroup!: Phaser.GameObjects.Group;
  private itemListGroup!: Phaser.GameObjects.Group;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private scrollOffset = 0;
  private readonly maxVisible = 6;
  private mode: 'browse' | 'action' | 'quantity' | 'target' = 'browse';
  private actionTexts: Phaser.GameObjects.Text[] = [];
  private actionPanel?: NinePatchPanel;
  private quantityText?: Phaser.GameObjects.Text;
  private quantityPanel?: NinePatchPanel;
  private targetCursor = 0;
  private targetTexts: Phaser.GameObjects.Text[] = [];
  private targetPanel?: NinePatchPanel;
  private battleMode = false;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  create(data?: { battleMode?: boolean }): void {
    this.battleMode = data?.battleMode ?? false;
    this.detailGroup = this.add.group();
    this.itemListGroup = this.add.group();
    const layout = ui(this);

    // Full background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.add.text(layout.cx, 28, 'BAG', { ...FONTS.heading, fontSize: '24px' }).setOrigin(0.5);
    this.add.rectangle(layout.cx, 46, 160, 2, COLORS.borderHighlight, 0.4);

    // Category tabs
    this.tabTexts = CATEGORY_LABELS.map((cat, i) => {
      const t = this.add.text(20 + i * 155, 58, cat.label, {
        ...FONTS.bodySmall, fontSize: '13px',
      }).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.categoryIndex = i; this.switchCategory(); });
      return t;
    });
    this.add.rectangle(layout.cx, 78, layout.w - 40, 1, COLORS.border, 0.4);

    // Detail panel (right side)
    new NinePatchPanel(this, layout.w - 160, layout.cy + 30, 280, layout.h - 160, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.7,
      borderColor: COLORS.border,
      cornerRadius: 6,
    });

    // Money display
    const gm = GameManager.getInstance();
    this.add.text(layout.w - 280, layout.h - 50, `₽ ${gm.getMoney()}`, {
      ...FONTS.body, color: COLORS.textHighlight,
    });

    // Close hint / tappable close button
    if (isMobile()) {
      const closeBtn = this.add.text(layout.cx, layout.h - 22, '✕  CLOSE', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', () => this.handleEsc());
    } else {
      this.add.text(layout.cx, layout.h - 22, 'ESC to close', FONTS.caption).setOrigin(0.5);
    }

    this.switchCategory();

    // Category tab navigation with L/R
    this.input.keyboard!.on('keydown-Q', () => {
      if (this.mode !== 'browse') return;
      this.categoryIndex = (this.categoryIndex - 1 + CATEGORY_LABELS.length) % CATEGORY_LABELS.length;
      this.switchCategory();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-E', () => {
      if (this.mode !== 'browse') return;
      this.categoryIndex = (this.categoryIndex + 1) % CATEGORY_LABELS.length;
      this.switchCategory();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ESC', () => this.handleEsc());
  }

  private handleEsc(): void {
    if (this.mode === 'action') { this.closeActionMenu(); return; }
    if (this.mode === 'quantity') { this.mode = 'browse'; this.itemController?.setDisabled(false); return; }
    if (this.mode === 'target') { this.closeTargetPicker(); return; }
    this.scene.stop();
  }

  private switchCategory(): void {
    this.currentCategory = CATEGORY_LABELS[this.categoryIndex].key;
    this.tabTexts.forEach((t, i) => {
      t.setColor(i === this.categoryIndex ? COLORS.textHighlight : COLORS.textGray);
      t.setFontStyle(i === this.categoryIndex ? 'bold' : '');
    });
    this.scrollOffset = 0;
    this.refreshItemList();
  }

  private refreshItemList(): void {
    // Clean up
    this.itemController?.destroy();
    this.itemListGroup.clear(true, true);
    this.itemTexts = [];

    const gm = GameManager.getInstance();
    const bag = gm.getBag();

    this.filteredItems = bag
      .map(entry => {
        const iData = itemData[entry.itemId];
        return iData && iData.category === this.currentCategory ? { item: iData, qty: entry.quantity } : null;
      })
      .filter((e): e is { item: ItemData; qty: number } => e !== null && e.qty > 0);

    if (this.filteredItems.length === 0) {
      const layout = ui(this);
      const empty = this.add.text(200, layout.cy, 'No items', {
        ...FONTS.bodySmall, color: COLORS.textDim,
      }).setOrigin(0.5);
      this.itemListGroup.add(empty);
      this.detailGroup.clear(true, true);
      return;
    }

    this.renderVisibleItems();
    this.itemController = new MenuController(this, {
      columns: 1,
      itemCount: this.filteredItems.length,
      wrap: true,
      onMove: (idx) => { this.ensureVisible(idx); this.highlightItem(idx); this.showItemDetail(idx); },
      onConfirm: (idx) => this.openActionMenu(idx),
      onCancel: () => this.scene.stop(),
    });
    this.highlightItem(0);
    this.showItemDetail(0);
  }

  private renderVisibleItems(): void {
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts = [];
    this.itemListGroup.clear(true, true);

    const startY = 92;
    const itemH = 36;
    const endIdx = Math.min(this.scrollOffset + this.maxVisible, this.filteredItems.length);

    for (let vi = this.scrollOffset; vi < endIdx; vi++) {
      const entry = this.filteredItems[vi];
      const y = startY + (vi - this.scrollOffset) * itemH;
      const t = this.add.text(30, y, `${entry.item.name}`, { ...FONTS.body, fontSize: '15px' })
        .setInteractive({ useHandCursor: true });
      const qty = this.add.text(260, y, `x${entry.qty}`, { ...FONTS.bodySmall });
      t.on('pointerover', () => this.itemController?.hoverIndex(vi));
      t.on('pointerdown', () => this.itemController?.clickIndex(vi));
      this.itemTexts.push(t);
      this.itemListGroup.add(t);
      this.itemListGroup.add(qty);
    }

    // Scroll indicators
    if (this.scrollOffset > 0) {
      const upArr = this.add.text(150, startY - 16, '▲', { ...FONTS.caption, color: COLORS.textHighlight }).setOrigin(0.5);
      this.itemListGroup.add(upArr);
    }
    if (endIdx < this.filteredItems.length) {
      const downArr = this.add.text(150, startY + this.maxVisible * itemH, '▼', { ...FONTS.caption, color: COLORS.textHighlight }).setOrigin(0.5);
      this.itemListGroup.add(downArr);
    }
  }

  private ensureVisible(idx: number): void {
    if (idx < this.scrollOffset) {
      this.scrollOffset = idx;
      this.renderVisibleItems();
    } else if (idx >= this.scrollOffset + this.maxVisible) {
      this.scrollOffset = idx - this.maxVisible + 1;
      this.renderVisibleItems();
    }
  }

  private highlightItem(idx: number): void {
    const viewIdx = idx - this.scrollOffset;
    this.itemTexts.forEach((t, i) => {
      t.setColor(i === viewIdx ? COLORS.textHighlight : COLORS.textWhite);
    });
  }

  private showItemDetail(idx: number): void {
    this.detailGroup.clear(true, true);
    if (idx < 0 || idx >= this.filteredItems.length) return;

    const entry = this.filteredItems[idx];
    const layout = ui(this);
    const x = layout.w - 280;
    let y = 110;

    const name = this.add.text(x, y, entry.item.name, { ...FONTS.body, fontStyle: 'bold', fontSize: '17px' });
    this.detailGroup.add(name);
    y += 28;

    const desc = this.add.text(x, y, entry.item.description, {
      ...FONTS.bodySmall, wordWrap: { width: 240 },
    });
    this.detailGroup.add(desc);
    y += desc.height + 16;

    const qty = this.add.text(x, y, `Quantity: ${entry.qty}`, FONTS.bodySmall);
    this.detailGroup.add(qty);
    y += 28;

    // Effect info
    const eff = entry.item.effect;
    let effectStr = '';
    if (eff.type === 'heal-hp') effectStr = eff.amount === -1 ? 'Revives to half HP' : `Heals ${eff.amount} HP`;
    else if (eff.type === 'heal-status') effectStr = `Cures: ${eff.status}`;
    else if (eff.type === 'capture') effectStr = `Catch rate: x${eff.catchRateMultiplier}`;
    else if (eff.type === 'key') effectStr = 'Key item';
    if (effectStr) {
      const effText = this.add.text(x, y, effectStr, { ...FONTS.caption, color: COLORS.textBlue });
      this.detailGroup.add(effText);
    }
  }

  // ─── Action Menu (USE / GIVE / TOSS) ───
  private openActionMenu(idx: number): void {
    if (idx < 0 || idx >= this.filteredItems.length) return;
    this.mode = 'action';
    this.itemController?.setDisabled(true);

    const entry = this.filteredItems[idx];
    const isKey = entry.item.category === 'key';
    const isTm = entry.item.category === 'tm';
    const actions = isKey ? ['Cancel'] : isTm ? ['USE', 'Cancel'] : ['USE', 'TOSS', 'Cancel'];
    const layout = ui(this);

    this.actionPanel = new NinePatchPanel(this, 200, layout.cy, 140, actions.length * 34 + 16, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });

    this.actionTexts = actions.map((label, i) => {
      return this.add.text(200, layout.cy - ((actions.length - 1) * 17) + i * 34, label, {
        ...FONTS.body, fontSize: '16px',
      }).setOrigin(0.5);
    });

    this.actionController = new MenuController(this, {
      columns: 1,
      itemCount: actions.length,
      wrap: true,
      onMove: (ci) => {
        this.actionTexts.forEach((t, i) => t.setColor(i === ci ? COLORS.textHighlight : COLORS.textWhite));
      },
      onConfirm: (ci) => {
        const action = actions[ci];
        this.closeActionMenu();
        if (action === 'USE') this.useItem(idx);
        else if (action === 'TOSS') this.tossItem(idx);
      },
      onCancel: () => this.closeActionMenu(),
      audioFeedback: true,
    });
    // Initial highlight
    this.actionTexts[0]?.setColor(COLORS.textHighlight);
  }

  private closeActionMenu(): void {
    this.actionController?.destroy();
    this.actionPanel?.destroy();
    this.actionTexts.forEach(t => t.destroy());
    this.actionTexts = [];
    this.mode = 'browse';
    this.itemController?.setDisabled(false);
  }

  // ─── USE item ───
  private useItem(idx: number): void {
    const entry = this.filteredItems[idx];
    const eff = entry.item.effect;

    // TM items — launch MoveTutorScene in TM mode
    if (eff.type === 'teach-move' && eff.moveId) {
      this.scene.pause();
      this.scene.launch('MoveTutorScene', { tmMode: true, tmMoveId: eff.moveId });
      this.scene.get('MoveTutorScene').events.once('shutdown', () => {
        this.scene.resume();
      });
      return;
    }

    // Also support TM items by category check (fallback for items using tmData)
    if (entry.item.category === 'tm') {
      const tm = tmData[entry.item.id];
      if (tm) {
        this.scene.pause();
        this.scene.launch('MoveTutorScene', { tmMode: true, tmMoveId: tm.moveId });
        this.scene.get('MoveTutorScene').events.once('shutdown', () => {
          this.scene.resume();
        });
        return;
      }
    }

    if (eff.type === 'heal-hp' || eff.type === 'heal-status') {
      this.openTargetPicker(idx);
    } else if (eff.type === 'capture') {
      if (this.battleMode) {
        // In battle: consume ball and signal BattleUIScene
        const gm = GameManager.getInstance();
        gm.removeItem(entry.item.id, 1);
        this.events.emit('use-pokeball', entry.item.id);
        this.scene.stop();
        return;
      }
      this.showMessage('Can only be used in battle!');
    } else {
      this.showMessage("Can't use that here.");
    }
  }

  // ─── Target picker (party Pokémon) ───
  private openTargetPicker(itemIdx: number): void {
    this.mode = 'target';
    this.itemController?.setDisabled(true);
    const party = GameManager.getInstance().getParty();
    if (party.length === 0) { this.showMessage('No Pokémon!'); this.mode = 'browse'; this.itemController?.setDisabled(false); return; }

    const layout = ui(this);
    this.targetPanel = new NinePatchPanel(this, layout.cx, layout.cy, 320, party.length * 40 + 32, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });

    this.targetTexts = party.map((p, i) => {
      const pData = pokemonData[p.dataId];
      const name = p.nickname ?? pData?.name ?? '???';
      const label = `${name}  Lv.${p.level}  HP:${p.currentHp}/${p.stats.hp}`;
      return this.add.text(layout.cx, layout.cy - ((party.length - 1) * 20) + i * 40, label, {
        ...FONTS.body, fontSize: '14px',
      }).setOrigin(0.5);
    });

    this.targetCursor = 0;
    this.targetTexts[0]?.setColor(COLORS.textHighlight);

    // Reuse keyboard for target selection
    const upHandler = () => {
      if (this.mode !== 'target') return;
      this.targetCursor = (this.targetCursor - 1 + party.length) % party.length;
      this.targetTexts.forEach((t, i) => t.setColor(i === this.targetCursor ? COLORS.textHighlight : COLORS.textWhite));
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const downHandler = () => {
      if (this.mode !== 'target') return;
      this.targetCursor = (this.targetCursor + 1) % party.length;
      this.targetTexts.forEach((t, i) => t.setColor(i === this.targetCursor ? COLORS.textHighlight : COLORS.textWhite));
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    };
    const confirmHandler = () => {
      if (this.mode !== 'target') return;
      this.applyItemToTarget(itemIdx, this.targetCursor);
      kb.off('keydown-UP', upHandler);
      kb.off('keydown-DOWN', downHandler);
      kb.off('keydown-ENTER', confirmHandler);
      kb.off('keydown-SPACE', confirmHandler);
    };

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', upHandler);
    kb.on('keydown-DOWN', downHandler);
    kb.on('keydown-ENTER', confirmHandler);
    kb.on('keydown-SPACE', confirmHandler);
  }

  private closeTargetPicker(): void {
    this.targetPanel?.destroy();
    this.targetTexts.forEach(t => t.destroy());
    this.targetTexts = [];
    this.mode = 'browse';
    this.itemController?.setDisabled(false);
  }

  private applyItemToTarget(itemIdx: number, targetIdx: number): void {
    const entry = this.filteredItems[itemIdx];
    const gm = GameManager.getInstance();
    const party = gm.getParty();
    const target = party[targetIdx];
    if (!target) { this.closeTargetPicker(); return; }

    const eff = entry.item.effect;
    let used = false;
    let message = '';

    if (eff.type === 'heal-hp') {
      if (entry.item.id === 'revive') {
        // Revive: only works on fainted Pokémon
        if (target.currentHp > 0) {
          message = `${target.nickname ?? pokemonData[target.dataId]?.name} isn't fainted!`;
        } else {
          target.currentHp = Math.floor(target.stats.hp / 2);
          used = true;
          message = `${target.nickname ?? pokemonData[target.dataId]?.name} was revived!`;
        }
      } else {
        if (target.currentHp >= target.stats.hp) {
          message = `${target.nickname ?? pokemonData[target.dataId]?.name} is already at full HP!`;
        } else {
          let heal = eff.amount ?? 20;
          // Negative amount = percentage of max HP (e.g. -25 = 25%)
          if (heal < 0) {
            heal = Math.max(1, Math.floor(target.stats.hp * Math.abs(heal) / 100));
          }
          target.currentHp = Math.min(target.stats.hp, target.currentHp + heal);
          used = true;
          message = `${target.nickname ?? pokemonData[target.dataId]?.name} recovered ${heal} HP!`;
        }
      }
    } else if (eff.type === 'heal-status') {
      if (!target.status) {
        message = `${target.nickname ?? pokemonData[target.dataId]?.name} has no status problem!`;
      } else if (eff.status === 'all' || target.status === eff.status || target.status === 'bad-poison' && eff.status === 'poison') {
        target.status = null;
        target.statusTurns = undefined;
        used = true;
        message = `${target.nickname ?? pokemonData[target.dataId]?.name} was cured!`;
      } else {
        message = "It won't have any effect.";
      }
    }

    if (used) {
      gm.removeItem(entry.item.id, 1);
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
    } else {
      AudioManager.getInstance().playSFX(SFX.ERROR);
    }

    this.closeTargetPicker();
    this.showMessage(message);
    this.refreshItemList();
  }

  // ─── TOSS item ───
  private tossItem(idx: number): void {
    const entry = this.filteredItems[idx];
    if (entry.item.category === 'key') {
      this.showMessage("Can't toss Key Items!");
      return;
    }

    // For simplicity, toss 1
    const gm = GameManager.getInstance();
    gm.removeItem(entry.item.id, 1);
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.showMessage(`Tossed 1 ${entry.item.name}.`);
    this.refreshItemList();
  }

  private showMessage(text: string): void {
    const layout = ui(this);
    const msg = this.add.text(layout.cx, layout.h - 55, text, {
      ...FONTS.body, color: COLORS.textSuccess, fontSize: '15px',
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 1500,
      duration: 400,
      onComplete: () => msg.destroy(),
    });
  }
}
