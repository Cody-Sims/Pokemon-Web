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
    // Build menu labels dynamically
    this.menuLabels = ['POKEDEX', 'POKEMON', 'BAG', 'QUESTS', 'STATS', 'HALL OF FAME'];
    if (OverworldAbilities.canUse('fly')) {
      this.menuLabels.push('FLY');
    }
    this.menuLabels.push('SAVE', 'OPTIONS', 'QUIT', 'EXIT');

    const layout = ui(this);

    // Dim overlay
    this.overlay = this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgOverlay, 0.45);

    // Menu panel
    const rowH = Math.round(48 * MOBILE_SCALE);
    const panelW = Math.round(220 * MOBILE_SCALE);
    const panelH = this.menuLabels.length * rowH + 32;
    const panelX = layout.w - panelW / 2 - 20;
    const panelY = layout.cy;
    this.menuPanel = new NinePatchPanel(this, panelX, panelY, panelW, panelH, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Money display above menu panel
    const gm = GameManager.getInstance();
    this.moneyText = this.add.text(panelX, panelY - panelH / 2 - 16, `₽ ${gm.getMoney()}`, {
      ...FONTS.bodySmall, color: COLORS.textHighlight,
    }).setOrigin(0.5);

    const menuFontSize = mobileFontSize(18);
    const startY = panelY - panelH / 2 + 32;
    this.menuItems = this.menuLabels.map((label, i) => {
      const item = this.add.text(panelX + 10, startY + i * rowH, label, {
        ...FONTS.menuItem, fontSize: menuFontSize,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      item.setPadding(8, 6, 8, 6);
      item.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      item.on('pointerdown', () => { this.cursor = i; this.selectOption(); });
      return item;
    });

    this.cursorIcon = this.add.text(0, 0, '▸', { ...FONTS.menuItem, fontSize: menuFontSize, color: COLORS.textHighlight });

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
      const rH = Math.round(48 * MOBILE_SCALE);
      const pW = Math.round(220 * MOBILE_SCALE);
      const pH = this.menuLabels.length * rH + 32;
      const pX = l.w - pW / 2 - 20;
      const pY = l.cy;
      this.overlay.setPosition(l.cx, l.cy).setSize(l.w, l.h);
      this.menuPanel.destroy();
      this.menuPanel = new NinePatchPanel(this, pX, pY, pW, pH, {
        fillColor: COLORS.bgPanel, borderColor: COLORS.border, cornerRadius: 8,
      });
      this.moneyText.setPosition(pX, pY - pH / 2 - 16);
      const sY = pY - pH / 2 + 32;
      this.menuItems.forEach((item, i) => item.setPosition(pX + 10, sY + i * rH));
      this.updateCursor();
    });
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
        this.confirmQuit();
        break;
      case 'EXIT':
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
          this.scene.stop();
          this.scene.stop('OverworldScene');
          this.scene.start('TitleScene');
        }
      },
    );
  }
}
