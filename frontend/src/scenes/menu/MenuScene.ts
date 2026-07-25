import Phaser from 'phaser';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, mobileFontSize, mobileScale, minTouchTarget } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { SelectableController } from '@ui/controls/SelectableController';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SaveManager } from '@managers/SaveManager';
import { SFX } from '@utils/audio-keys';
import { ConfirmBox } from '@ui/widgets/ConfirmBox';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { TouchControls } from '@ui/controls/TouchControls';
import { EventManager } from '@managers/EventManager';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';

export class MenuScene extends Phaser.Scene {
  private cursor = 0;
  private menuItems!: Phaser.GameObjects.Text[];
  private menuButtons: Phaser.GameObjects.Rectangle[] = [];
  private cursorIcon!: Phaser.GameObjects.Text;
  private menuLabels: string[] = [];
  private overlay!: Phaser.GameObjects.Rectangle;
  private menuPanel!: NinePatchPanel;
  private moneyText!: Phaser.GameObjects.Text;
  private scrollText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Rectangle;
  private closeButtonText!: Phaser.GameObjects.Text;
  private menuController?: SelectableController;
  private windowStart = 0;

  private readonly inputRegistry = new SceneInputRegistry(this);

  constructor() {
    super({ key: SceneKey.Menu });
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    // Drain any stale confirm/cancel flags left by the previous scene
    // so MenuScene's first update() doesn't immediately act on them.
    TouchControls.getInstance()?.drain();

    // Build menu labels dynamically.
    // BUG-060: "QUIT" used to sit adjacent to "EXIT" and both verbs read as
    // "close this screen" — a mis-tap discarded unsaved progress. The
    // close-the-pause-menu action is now "RESUME" and the return-to-title
    // action is "TITLE SCREEN" (still gated behind a ConfirmBox).
    this.menuLabels = ['POKEDEX', 'POKEMON', 'BAG', 'QUESTS', 'TOWN MAP', 'STATS', 'HALL OF FAME'];
    if (OverworldAbilities.canUse('fly')) {
      this.menuLabels.push('FLY');
    }
    this.menuLabels.push('SAVE', 'OPTIONS', 'TITLE SCREEN', 'RESUME');

    const layout = ui(this);

    // Dim overlay
    this.overlay = this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgOverlay, 0.45);

    // Menu panel — fully opaque so menu text always has its full contrast
    // ratio against the panel fill, even with bright/varied overworld scenes
    // bleeding through.
    const dims = this.computePanelDims(layout.w, layout.h);
    const panelW = dims.panelW;
    const panelH = dims.panelH;
    const rowH = dims.rowH;
    // Position the panel inset from the right edge. In landscape mobile
    // the DOM touch controls overlay the right ~120 px of the canvas, so
    // tuck the menu further inward there to keep every label visible.
    const rightInset = MenuScene.computeRightInset(layout.w, layout.h);
    const panelX = layout.w - panelW / 2 - rightInset;
    const panelY = layout.cy;
    this.menuPanel = new NinePatchPanel(this, panelX, panelY, panelW, panelH, {
      fillColor: COLORS.bgPanel,
      fillAlpha: 1,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });
    this.menuPanel.setDepth(0);

    // Money display above menu panel
    const gm = GameManager.getInstance();
    this.moneyText = this.add.text(panelX, panelY - panelH / 2 - 16, `₽ ${gm.getMoney()}`, {
      ...FONTS.bodySmall, color: COLORS.textHighlight, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    const menuFontSize = mobileFontSize(dims.fontPx);
    const startY = panelY - panelH / 2 + 42;
    this.menuItems = this.menuLabels.map((label, i) => {
      const itemButton = this.add.rectangle(panelX, startY + i * rowH, panelW - 24, rowH - 6, COLORS.bgCard, 0.9)
        .setStrokeStyle(2, COLORS.border)
        .setDepth(1)
        .setInteractive({ useHandCursor: true });
      this.menuButtons.push(itemButton);
      // Center text on the panel center (no +10 offset) so longer labels
      // like HALL OF FAME and POKEDEX stay inside the panel borders.
      const item = this.add.text(panelX, startY + i * rowH, label, {
        ...FONTS.menuItem, fontSize: menuFontSize,
        fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(2);

      this.inputRegistry.bindPointer(itemButton, 'pointerover', () => this.menuController?.hoverIndex(i));
      this.inputRegistry.bindPointer(itemButton, 'pointerdown', () => this.menuController?.clickIndex(i));
      return item;
    });

    this.cursorIcon = this.add.text(0, 0, '▸', {
      ...FONTS.menuItem, fontSize: menuFontSize, color: COLORS.textHighlight,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setDepth(2);

    this.scrollText = this.add.text(panelX, panelY + panelH / 2 - 42, '', {
      ...FONTS.caption,
      fontSize: mobileFontSize(11),
      color: COLORS.textDim,
    }).setOrigin(0.5).setDepth(2);

    const closeH = Math.max(minTouchTarget(), 42);
    this.closeButton = this.add.rectangle(panelX, panelY + panelH / 2 - closeH / 2 - 6, panelW - 24, closeH, COLORS.btnBg, 0.95)
      .setStrokeStyle(2, COLORS.borderLight)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });
    this.closeButtonText = this.add.text(panelX, this.closeButton.y, 'RESUME', {
      ...FONTS.button,
      fontSize: mobileFontSize(14),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
    this.inputRegistry.bindPointer(this.closeButton, 'pointerover', () => this.closeButton.setFillStyle(COLORS.btnHover, 0.98));
    this.inputRegistry.bindPointer(this.closeButton, 'pointerout', () => this.closeButton.setFillStyle(COLORS.btnBg, 0.95));
    this.inputRegistry.bindPointer(this.closeButton, 'pointerdown', () => this.closeMenu());

    this.cursor = 0;
    this.menuController = new SelectableController({
      itemCount: this.menuLabels.length,
      wrap: true,
      visibleCount: dims.visibleCount,
      windowStart: this.windowStart,
      onMove: (index) => {
        this.cursor = index;
        this.updateCursor();
      },
      onConfirm: () => this.selectOption(),
      onCancel: () => this.closeMenu(),
      onWindowChange: range => {
        this.windowStart = range.start;
        this.renderVisibleMenuItems();
      },
      sounds: {
        move: () => AudioManager.getInstance().playSFX(SFX.CURSOR),
        confirm: () => AudioManager.getInstance().playSFX(SFX.CONFIRM),
        cancel: () => AudioManager.getInstance().playSFX(SFX.CANCEL),
      },
    });
    this.updateCursor();
    this.renderVisibleMenuItems();

    this.inputRegistry.bindKey('keydown-UP', () => this.menuController?.navigate('up'));
    this.inputRegistry.bindKey('keydown-DOWN', () => this.menuController?.navigate('down'));
    this.inputRegistry.bindKey('keydown-ENTER', () => this.menuController?.confirm());
    this.inputRegistry.bindKey('keydown-ESC', () => this.menuController?.cancel());

    // Re-layout on resize / orientation change
    layoutOn(this, () => {
      const l = ui(this);
      const d = this.computePanelDims(l.w, l.h);
      const rH = d.rowH;
      const pW = d.panelW;
      const pH = d.panelH;
      const inset = MenuScene.computeRightInset(l.w, l.h);
      const pX = l.w - pW / 2 - inset;
      const pY = l.cy;
      this.overlay.setPosition(l.cx, l.cy).setSize(l.w, l.h);
      this.menuPanel.destroy();
      this.menuPanel = new NinePatchPanel(this, pX, pY, pW, pH, {
        fillColor: COLORS.bgPanel, fillAlpha: 1, borderColor: COLORS.border, cornerRadius: 8,
      });
      this.menuPanel.setDepth(0);
      this.moneyText.setPosition(pX, pY - pH / 2 - 16);
      const sY = pY - pH / 2 + 42;
      const fSize = mobileFontSize(d.fontPx);
      this.menuItems.forEach((item, i) => {
        item.setPosition(pX, sY + i * rH);
        item.setFontSize(fSize);
      });
      this.menuButtons.forEach((button, i) => {
        button.setPosition(pX, sY + i * rH);
        button.setSize(pW - 24, rH - 6);
        button.setDisplaySize(pW - 24, rH - 6);
      });
      this.scrollText.setPosition(pX, pY + pH / 2 - 42);
      const closeHeight = Math.max(minTouchTarget(), 42);
      this.closeButton.setPosition(pX, pY + pH / 2 - closeHeight / 2 - 6);
      this.closeButton.setSize(pW - 24, closeHeight);
      this.closeButton.setDisplaySize(pW - 24, closeHeight);
      this.closeButtonText.setPosition(pX, this.closeButton.y);
      this.menuController?.setVisibleCount(d.visibleCount);
      this.cursorIcon.setFontSize(fSize);
      this.updateCursor();
      this.renderVisibleMenuItems();
    });

    // Drain stale confirm/cancel when returning from a child scene
    this.inputRegistry.bindSceneEvent('wake', () => {
      TouchControls.getInstance()?.drain();
    });
  }

  /**
   * Compute panel + row dimensions so the menu always fits inside the
   * viewport. Both axes get a small safe-margin (top HUD, bottom touch
   * controls), and the row height shrinks before the font does.
   */
  private computePanelDims(viewW: number, viewH: number): {
    panelW: number; panelH: number; rowH: number; fontPx: number; visibleCount: number;
  } {
    // Reserve room for the location HUD at the top and any touch controls
    // at the bottom of the viewport so the menu panel never overhangs.
    const topReserve = 56;
    const bottomReserve = 48;
    const maxPanelH = Math.max(190, viewH - topReserve - bottomReserve);
    const items = this.menuLabels.length;

    // Default sizes (kept for landscape / desktop where there is plenty of
    // vertical room).
    const baseRowH = Math.max(minTouchTarget(), 48);
    const baseFontPx = 18;
    const baseW = Math.round(220 * mobileScale());
    const rowH = baseRowH;
    const visibleCount = Math.max(3, Math.min(items, Math.floor((maxPanelH - 92) / rowH)));
    const fontPx = visibleCount < items ? 16 : baseFontPx;
    const panelH = visibleCount * rowH + 92;

    // Cap the panel width to the viewport so the side menu never spills
    // past the screen on narrow portrait phones. The minimum (160 px) is
    // wide enough to fit HALL OF FAME with a comfortable horizontal pad.
    const minW = 180;
    const rightInset = MenuScene.computeRightInset(viewW, viewH);
    const maxW = viewW - 32 - rightInset;
    const panelW = Math.max(minW, Math.min(baseW, maxW));
    return { panelW, panelH, rowH, fontPx, visibleCount };
  }

  /**
   * In landscape mobile the DOM touch controls overlay roughly the right
   * 120 px of the canvas (joystick + A/B side panels), so the menu panel
   * needs to sit further inside than the regular 20 px desktop margin to
   * keep every label visible. Portrait + desktop keep the legacy inset.
   */
  private static computeRightInset(viewW: number, viewH: number): number {
    const isLandscape = viewW > viewH;
    const isMobileTouch = TouchControls.isTouchDevice();
    if (isMobileTouch && isLandscape) return 140; // clear the side controls
    return 20;
  }

  /** Poll touch B / hamburger button to close menu on mobile. */
  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      this.closeMenu();
      return;
    }
    if (tc?.consumeSwipeUp()) this.menuController?.navigate('up');
    else if (tc?.consumeSwipeDown()) this.menuController?.navigate('down');
  }

  private updateCursor(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite);
      this.menuButtons[i]?.setFillStyle(i === this.cursor ? COLORS.btnHover : COLORS.bgCard, 0.9);
      this.menuButtons[i]?.setStrokeStyle(2, i === this.cursor ? COLORS.borderHighlight : COLORS.border);
    });
    const sel = this.menuItems[this.cursor];
    this.cursorIcon.setPosition(sel.x - sel.width / 2 - 20, sel.y - 10);
  }

  private renderVisibleMenuItems(): void {
    const range = this.menuController?.getWindowRange() ?? {
      start: this.windowStart,
      end: this.menuItems.length,
      size: this.menuItems.length,
    };
    this.menuItems.forEach((item, i) => {
      const visible = i >= range.start && i < range.end;
      item.setVisible(visible);
      this.menuButtons[i]?.setVisible(visible);
      if (visible) {
        this.menuButtons[i]?.setInteractive({ useHandCursor: true });
      } else {
        this.menuButtons[i]?.disableInteractive();
      }
    });
    this.cursorIcon.setVisible(this.cursor >= range.start && this.cursor < range.end);
    this.scrollText.setText(range.end < this.menuItems.length || range.start > 0
      ? `${range.start + 1}-${range.end} / ${this.menuItems.length}  ▲▼`
      : '');
    this.updateCursor();
  }

  private selectOption(): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const router = SceneRouter.for(this);
    switch (this.menuLabels[this.cursor]) {
      case 'POKEDEX':
        router.sleep();
        router.launch(SceneKey.Pokedex);
        router.get(SceneKey.Pokedex).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'POKEMON':
        router.sleep();
        router.launch(SceneKey.Party);
        router.get(SceneKey.Party).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'BAG':
        router.sleep();
        router.launch(SceneKey.Inventory);
        this.wakeOnInventoryClosed();
        break;
      case 'QUESTS':
        router.sleep();
        router.launch(SceneKey.QuestJournal);
        router.get(SceneKey.QuestJournal).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'TOWN MAP':
        router.sleep();
        router.launch(SceneKey.TownMap);
        router.get(SceneKey.TownMap).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'STATS':
        router.sleep();
        router.launch(SceneKey.Statistics);
        router.get(SceneKey.Statistics).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'HALL OF FAME':
        router.sleep();
        router.launch(SceneKey.HallOfFame);
        router.get(SceneKey.HallOfFame).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'FLY':
        router.sleep();
        router.launch(SceneKey.FlyMap);
        router.get(SceneKey.FlyMap).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'SAVE':
        this.saveGame();
        break;
      case 'OPTIONS':
        router.sleep();
        router.launch(SceneKey.Settings, { returnScene: SceneKey.Menu });
        router.get(SceneKey.Settings).events.once('shutdown', () => {
          router.wake();
        });
        break;
      case 'QUIT':
      case 'TITLE SCREEN':
        this.confirmQuit();
        break;
      case 'EXIT':
      case 'RESUME':
        this.closeMenu();
        break;
    }
  }

  private closeMenu(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    const router = SceneRouter.for(this);
    router.stop();
    router.resume(SceneKey.Overworld);
  }

  shutdown(): void {
    EventManager.getInstance().clearByTag(this.scene.key);
    this.menuController?.destroy();
    this.inputRegistry.clear();
  }

  private wakeOnInventoryClosed(): void {
    const em = EventManager.getInstance();
    const onClosed = () => {
      em.clearByTag(this.scene.key);
      SceneRouter.for(this).wake();
    };
    em.onTagged(this.scene.key, 'inventory-closed', onClosed);
  }

  private saveGame(): void {
    const sm = SaveManager.getInstance();
    const success = sm.save();

    const layout = ui(this);

    // MED-22 / MED-25: Show appropriate feedback for blocked or failed saves
    const message = success ? 'Game Saved!' : "Can't save right now!";
    const color = success ? COLORS.textSuccess : COLORS.textHighlight;
    const confirmText = this.add.text(layout.cx, layout.h - 40, message, {
      ...FONTS.heading, color,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: confirmText,
      alpha: 0,
      delay: 1200,
      duration: 400,
      onComplete: () => confirmText.destroy(),
    });
  }

  private confirmQuit(): void {
    const layout = ui(this);
    new ConfirmBox(
      this,
      layout.cx - 70,
      layout.cy - 45,
      'Quit to title?',
      (confirmed) => {
        if (confirmed) {
          // Stop overworld and every HUD overlay scene that OverworldScene
          // launches as siblings, so the title screen is not left with a
          // lingering minimap / quest tracker / party quick-view (B3).
          const router = SceneRouter.for(this);
          router.stop(SceneKey.Overworld);
          for (const hud of [SceneKey.Minimap, SceneKey.QuestTracker, SceneKey.PartyQuickView]) {
            if (router.isActive(hud) || router.isSleeping(hud)) {
              router.stop(hud);
            }
          }
          router.transitionTo(SceneKey.Title);
        }
      },
    );
  }
}
