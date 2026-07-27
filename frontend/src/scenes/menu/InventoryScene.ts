import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { AudioManager, EventManager, GameManager } from '@managers/index';
import { itemData } from '@data/item-data';
import { pokemonData } from '@data/pokemon';
import { tmData } from '@data/tm-data';
import { blockReasonForItemUse } from '@systems/engine/ChallengeRules';
import { INVENTORY_CATEGORIES, applyItemUseResult, buildInventoryViewModel, categoryAt, emitBattleItemUse, emitPokeBallUse, normalizeCategoryIndex, planItemUse, type InventoryEntry } from '@systems/inventory';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';
import { InventoryPanel, InventoryItemList, ItemDetailPanel, TargetPickerPanel, InventoryActionMenu, SelectableController } from '@ui/index';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { TouchControls } from '@ui/controls/TouchControls';
import { SFX } from '@utils/audio-keys';
import type { InventorySceneData } from '@scenes/scene-data';
import type { PokemonInstance } from '@data/interfaces';

const MAX_VISIBLE_ITEMS = 6;
type SceneMode = 'browse' | 'action' | 'target';

export class InventoryScene extends Phaser.Scene {
  private readonly inputRegistry = new SceneInputRegistry(this);
  private categoryIndex = 0;
  private scrollOffset = 0;
  private selectedIndex = 0;
  private mode: SceneMode = 'browse';
  private battleMode = false;
  private entries: InventoryEntry[] = [];
  private panel?: InventoryPanel;
  private itemList?: InventoryItemList;
  private detailPanel?: ItemDetailPanel;
  private itemController?: SelectableController;
  private actionMenu?: InventoryActionMenu;
  private targetPanel?: TargetPickerPanel;

  constructor() { super({ key: SceneKey.Inventory }); }

  create(data?: InventorySceneData): void {
    this.battleMode = data?.battleMode ?? false;
    this.categoryIndex = normalizeCategoryIndex(data?.savedCategoryIndex ?? this.categoryIndex);
    this.scrollOffset = Math.max(0, data?.savedScrollOffset ?? this.scrollOffset);
    this.panel = new InventoryPanel(this, { categories: INVENTORY_CATEGORIES, categoryIndex: this.categoryIndex, money: GameManager.getInstance().getMoney(), onCategorySelect: index => this.selectCategory(index), onClose: () => this.handleEsc() });
    this.itemList = new InventoryItemList(this, { maxVisible: MAX_VISIBLE_ITEMS, onHover: index => this.itemController?.hoverIndex(index), onClick: index => this.itemController?.clickIndex(index), onScrollWindow: start => this.scrollListTo(start) });
    this.detailPanel = new ItemDetailPanel(this);
    this.bindInput(); this.switchCategory(); this.bindResizeRestart();
  }

  update(): void {
    const touch = TouchControls.getInstance();
    if (!touch) return;
    if (touch.consumeCancel()) { this.handleEsc(); return; }
    if (this.mode !== 'browse') return;
    if (touch.consumeSwipeUp()) this.itemController?.navigate('up');
    else if (touch.consumeSwipeDown()) this.itemController?.navigate('down');
  }

  shutdown(): void {
    this.closeTargetPicker(); this.closeActionMenu(); this.inputRegistry.clear(); this.itemController?.destroy();
    this.panel?.destroy(); this.itemList?.destroy(); this.detailPanel?.destroy();
    this.tweens.killAll();
  }

  private bindInput(): void {
    this.inputRegistry.bindKey('keydown-Q', () => this.shiftCategory(-1)); this.inputRegistry.bindKey('keydown-E', () => this.shiftCategory(1)); this.inputRegistry.bindKey('keydown-ESC', () => this.handleEsc());
  }

  private bindResizeRestart(): void {
    let resizeInit = false;
    layoutOn(this, () => {
      if (!resizeInit) { resizeInit = true; return; }
      this.scene.restart({ battleMode: this.battleMode, savedCategoryIndex: this.categoryIndex, savedScrollOffset: this.scrollOffset });
    });
  }

  private handleEsc(): void {
    if (this.mode === 'action') { this.closeActionMenu(); return; }
    if (this.mode === 'target') { this.closeTargetPicker(); return; }
    EventManager.getInstance().emit('inventory-closed');
    SceneRouter.for(this).stop();
  }

  private shiftCategory(delta: number): void {
    if (this.mode !== 'browse') return;
    this.categoryIndex = normalizeCategoryIndex(this.categoryIndex + delta);
    this.switchCategory();
    AudioManager.getInstance().playSFX(SFX.CURSOR);
  }

  private selectCategory(index: number): void {
    this.categoryIndex = normalizeCategoryIndex(index);
    this.switchCategory();
  }

  private switchCategory(): void {
    this.panel?.setCategoryIndex(this.categoryIndex); this.selectedIndex = 0; this.scrollOffset = 0;
    this.refreshItemList();
  }

  private refreshItemList(): void {
    this.itemController?.destroy();
    const view = buildInventoryViewModel({ bag: GameManager.getInstance().getBag(), category: categoryAt(this.categoryIndex), cursor: this.selectedIndex, scrollOffset: this.scrollOffset, maxVisible: MAX_VISIBLE_ITEMS, getItem: id => itemData[id] });
    this.entries = view.items;
    this.selectedIndex = view.cursor;
    this.scrollOffset = view.scrollOffset;
    this.renderBrowseState();
    if (view.isEmpty) return;
    this.itemController = new SelectableController({ itemCount: this.entries.length, wrap: true, initialIndex: this.selectedIndex, visibleCount: MAX_VISIBLE_ITEMS, windowStart: this.scrollOffset, onMove: index => this.selectItem(index), onConfirm: index => this.openActionMenu(index), onCancel: () => this.handleEsc(), onWindowChange: range => { this.scrollOffset = range.start; this.renderBrowseState(); }, sounds: inventorySounds() });
    this.itemController.bindKeyboard(this);
  }

  private selectItem(index: number): void {
    this.selectedIndex = index;
    this.scrollOffset = this.itemController?.getWindowStart() ?? this.scrollOffset;
    this.renderBrowseState();
  }

  private scrollListTo(start: number): void {
    if (!this.itemController || this.itemController.getWindowStart() === start) return;
    this.itemController.setWindowStart(start);
  }

  private renderBrowseState(): void {
    this.itemList?.render({ items: this.entries, selectedIndex: this.selectedIndex, scrollOffset: this.scrollOffset });
    this.detailPanel?.render(this.entries[this.selectedIndex]);
  }

  private openActionMenu(index: number): void {
    const entry = this.entries[index];
    if (!entry) return;
    this.mode = 'action';
    this.itemController?.setDisabled(true);
    this.actionMenu = new InventoryActionMenu(this, { labels: actionsFor(entry), sounds: inventorySounds(), onConfirm: action => { this.closeActionMenu(); this.handleAction(action, index); }, onCancel: () => this.closeActionMenu() });
  }

  private closeActionMenu(): void {
    this.actionMenu?.destroy();
    this.actionMenu = undefined;
    if (this.mode === 'action') this.mode = 'browse';
    this.itemController?.setDisabled(false);
  }

  private handleAction(action: string, index: number): void {
    if (action === 'USE') this.useItem(index);
    else if (action === 'TOSS') this.tossItem(index);
  }

  private useItem(index: number): void {
    const entry = this.entries[index];
    if (!entry) return;
    if (!this.battleMode) { const block = blockReasonForItemUse(); if (block) { this.showMessage(block); return; } }
    if (entry.item.effect.type === 'teach-move' && entry.item.effect.moveId) { this.launchMoveTutor(entry.item.effect.moveId); return; }
    if (entry.item.category === 'tm') { const tm = tmData[entry.item.id]; if (tm) { this.launchMoveTutor(tm.moveId); return; } }
    if (entry.item.effect.type === 'capture') { this.usePokeBall(entry); return; }
    if (['heal-hp', 'heal-status', 'full-restore', 'level-up'].includes(entry.item.effect.type)) { this.openTargetPicker(index); return; }
    this.showMessage("Can't use that here.");
  }

  private usePokeBall(entry: InventoryEntry): void {
    if (!this.battleMode) { this.showMessage('Can only be used in battle!'); return; }
    GameManager.getInstance().removeItem(entry.item.id, 1);
    emitPokeBallUse(this.events, entry.item.id);
    SceneRouter.for(this).stop();
  }

  private launchMoveTutor(moveId: string): void {
    const router = SceneRouter.for(this);
    router.pause();
    router.launch(SceneKey.MoveTutor, { tmMode: true, tmMoveId: moveId });
    router.get(SceneKey.MoveTutor).events.once('shutdown', () => router.resume());
  }

  private openTargetPicker(itemIndex: number): void {
    this.mode = 'target';
    this.itemController?.setDisabled(true);
    const party = GameManager.getInstance().getParty();
    if (party.length === 0) { this.showMessage('No Pokémon!'); this.closeTargetPicker(); return; }
    this.targetPanel = new TargetPickerPanel(this, { targets: party.map(targetLabel), sounds: inventorySounds(), onConfirm: index => this.applyItemToTarget(itemIndex, index), onCancel: () => this.closeTargetPicker() });
  }

  private closeTargetPicker(): void {
    this.targetPanel?.destroy();
    this.targetPanel = undefined;
    if (this.mode === 'target') this.mode = 'browse';
    this.itemController?.setDisabled(false);
  }

  private applyItemToTarget(itemIndex: number, targetIndex: number): void {
    const entry = this.entries[itemIndex];
    const target = GameManager.getInstance().getParty()[targetIndex];
    if (!entry || !target) { this.closeTargetPicker(); return; }
    const result = applyPlannedItem(entry, target, pokemonName(target), this.battleMode);
    if (result.used) {
      GameManager.getInstance().removeItem(entry.item.id, 1);
      EventManager.getInstance().emit('party-changed');
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
      if (this.battleMode) emitBattleItemUse(this.events);
    } else {
      AudioManager.getInstance().playSFX(SFX.ERROR);
    }
    this.closeTargetPicker();
    this.showMessage(result.message);
    this.refreshItemList();
  }

  private tossItem(index: number): void {
    const entry = this.entries[index];
    if (!entry) return;
    if (entry.item.category === 'key') { this.showMessage("Can't toss Key Items!"); return; }
    GameManager.getInstance().removeItem(entry.item.id, 1);
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.showMessage(`Tossed 1 ${entry.item.name}.`);
    this.refreshItemList();
  }

  private showMessage(text: string): void {
    const layout = ui(this);
    const msg = this.add.text(layout.cx, layout.h - 55, text, { ...FONTS.body, color: COLORS.textSuccess, fontSize: mobileFontSize(15) }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: msg, alpha: 0, delay: 1500, duration: 400, onComplete: () => msg.destroy() });
  }
}

function actionsFor(entry: InventoryEntry): readonly string[] { return entry.item.category === 'key' ? ['Cancel'] : entry.item.category === 'tm' ? ['USE', 'Cancel'] : ['USE', 'TOSS', 'Cancel']; }

function targetLabel(pokemon: PokemonInstance): { label: string } { return { label: `${pokemonName(pokemon)}  Lv.${pokemon.level}  HP:${pokemon.currentHp}/${pokemon.stats.hp}` }; }

function pokemonName(pokemon: PokemonInstance): string { return pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???'; }

function inventorySounds(): NonNullable<ConstructorParameters<typeof SelectableController>[0]['sounds']> {
  return { move: () => AudioManager.getInstance().playSFX(SFX.CURSOR), confirm: () => AudioManager.getInstance().playSFX(SFX.CONFIRM), cancel: () => AudioManager.getInstance().playSFX(SFX.CANCEL) };
}

function applyPlannedItem(entry: InventoryEntry, target: PokemonInstance, targetName: string, battleMode: boolean) {
  const planned = planItemUse(entry.item, target, { targetName, battleMode });
  applyItemUseResult(target, planned);
  return planned;
}
