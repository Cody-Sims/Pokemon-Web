import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE, MIN_TOUCH_TARGET } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SaveManager } from '@managers/SaveManager';
import { SFX } from '@utils/audio-keys';
import { ConfirmBox } from '@ui/widgets/ConfirmBox';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { TouchControls } from '@ui/controls/TouchControls';

export class MenuScene extends Phaser.Scene {
  private cursor = 0;
  private menuItems!: Phaser.GameObjects.Text[];
  private cursorIcon!: Phaser.GameObjects.Text;
  private menuLabels: string[] = [];
  private overlay!: Phaser.GameObjects.Rectangle;
  private menuPanel!: NinePatchPanel;
  private moneyText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
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
    const startY = panelY - panelH / 2 + 24;
    this.menuItems = this.menuLabels.map((label, i) => {
      // Center text on the panel center (no +10 offset) so longer labels
      // like HALL OF FAME and POKEDEX stay inside the panel borders.
      const item = this.add.text(panelX, startY + i * rowH, label, {
        ...FONTS.menuItem, fontSize: menuFontSize,
        fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2);

      item.setPadding(8, 4, 8, 4);
      item.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      item.on('pointerdown', () => { this.cursor = i; this.selectOption(); });
      return item;
    });

    this.cursorIcon = this.add.text(0, 0, '▸', {
      ...FONTS.menuItem, fontSize: menuFontSize, color: COLORS.textHighlight,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setDepth(2);

    this.cursor = 0;
    this.updateCursor();

    this.input.keyboard!.on('keydown-UP', () => {
      this.cursor = (this.cursor - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.cursor = (this.cursor + 1) % this.menuItems.length;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.selectOption());
    this.input.keyboard!.on('keydown-ESC', () => this.closeMenu());

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
      const sY = pY - pH / 2 + 24;
      const fSize = mobileFontSize(d.fontPx);
      this.menuItems.forEach((item, i) => {
        item.setPosition(pX, sY + i * rH);
        item.setFontSize(fSize);
      });
      this.cursorIcon.setFontSize(fSize);
      this.updateCursor();
    });
  }

  /**
   * Compute panel + row dimensions so the menu always fits inside the
   * viewport. Both axes get a small safe-margin (top HUD, bottom touch
   * controls), and the row height shrinks before the font does.
   */
  private computePanelDims(viewW: number, viewH: number): {
    panelW: number; panelH: number; rowH: number; fontPx: number;
  } {
    // Reserve room for the location HUD at the top and any touch controls
    // at the bottom of the viewport so the menu panel never overhangs.
    const topReserve = 56;
    const bottomReserve = 48;
    const maxPanelH = Math.max(160, viewH - topReserve - bottomReserve);
    const items = this.menuLabels.length;

    // Default sizes (kept for landscape / desktop where there is plenty of
    // vertical room).
    const baseRowH = Math.round(48 * MOBILE_SCALE);
    const baseFontPx = 18;
    const baseW = Math.round(220 * MOBILE_SCALE);

    // If the default row height already fits, use it.
    let rowH = baseRowH;
    let fontPx = baseFontPx;
    let panelH = items * rowH + 32;
    if (panelH > maxPanelH) {
      // Shrink rowH first (preserve readable font), but never below 28px.
      const fittedRowH = Math.max(28, Math.floor((maxPanelH - 32) / items));
      rowH = fittedRowH;
      panelH = items * rowH + 32;
      // If even the smallest sensible rowH doesn't fit, also drop the font.
      if (rowH <= 30) {
        fontPx = 14;
      } else if (rowH <= 36) {
        fontPx = 16;
      }
    }

    // Cap the panel width to the viewport so the side menu never spills
    // past the screen on narrow portrait phones. The minimum (160 px) is
    // wide enough to fit HALL OF FAME with a comfortable horizontal pad.
    const minW = 180;
    const rightInset = MenuScene.computeRightInset(viewW, viewH);
    const maxW = viewW - 32 - rightInset;
    const panelW = Math.max(minW, Math.min(baseW, maxW));
    return { panelW, panelH, rowH, fontPx };
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
    }
  }

  private updateCursor(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite);
    });
    const sel = this.menuItems[this.cursor];
    this.cursorIcon.setPosition(sel.x - sel.width / 2 - 20, sel.y - 10);
  }

  private selectOption(): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    switch (this.menuLabels[this.cursor]) {
      case 'POKEDEX':
        this.scene.sleep();
        this.scene.launch('PokedexScene');
        this.scene.get('PokedexScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'POKEMON':
        this.scene.sleep();
        this.scene.launch('PartyScene');
        this.scene.get('PartyScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'BAG':
        this.scene.sleep();
        this.scene.launch('InventoryScene');
        this.scene.get('InventoryScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'QUESTS':
        this.scene.sleep();
        this.scene.launch('QuestJournalScene');
        this.scene.get('QuestJournalScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'TOWN MAP':
        this.scene.sleep();
        this.scene.launch('TownMapScene');
        this.scene.get('TownMapScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'STATS':
        this.scene.sleep();
        this.scene.launch('StatisticsScene');
        this.scene.get('StatisticsScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'HALL OF FAME':
        this.scene.sleep();
        this.scene.launch('HallOfFameScene');
        this.scene.get('HallOfFameScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'FLY':
        this.scene.sleep();
        this.scene.launch('FlyMapScene');
        this.scene.get('FlyMapScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'SAVE':
        this.saveGame();
        break;
      case 'OPTIONS':
        this.scene.sleep();
        this.scene.launch('SettingsScene', { returnScene: 'MenuScene' });
        this.scene.get('SettingsScene').events.once('shutdown', () => {
          this.scene.wake();
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
    this.scene.stop();
    this.scene.resume('OverworldScene');
  }

  shutdown(): void {
    this.input.keyboard?.removeAllListeners();
  }

  private saveGame(): void {
    const sm = SaveManager.getInstance();
    sm.save();

    const layout = ui(this);

    // Show save confirmation text
    const confirmText = this.add.text(layout.cx, layout.h - 40, 'Game Saved!', {
      ...FONTS.heading, color: COLORS.textSuccess,
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
          this.scene.stop();
          this.scene.stop('OverworldScene');
          for (const hud of ['MinimapScene', 'QuestTrackerScene', 'PartyQuickViewScene']) {
            if (this.scene.isActive(hud) || this.scene.isSleeping(hud)) {
              this.scene.stop(hud);
            }
          }
          this.scene.start('TitleScene');
        }
      },
    );
  }
}
