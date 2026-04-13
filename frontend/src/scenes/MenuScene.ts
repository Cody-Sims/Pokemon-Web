import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { COLORS, FONTS, drawPanel } from '@ui/theme';
import { NinePatchPanel } from '@ui/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SaveManager } from '@managers/SaveManager';
import { SFX } from '@utils/audio-keys';

export class MenuScene extends Phaser.Scene {
  private cursor = 0;
  private menuItems!: Phaser.GameObjects.Text[];
  private cursorIcon!: Phaser.GameObjects.Text;
  private menuLabels = ['POKEMON', 'BAG', 'SAVE', 'OPTIONS', 'EXIT'];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgOverlay, 0.45);

    // Menu panel
    const panelW = 220;
    const panelH = this.menuLabels.length * 48 + 32;
    const panelX = GAME_WIDTH - panelW / 2 - 20;
    const panelY = GAME_HEIGHT / 2;
    new NinePatchPanel(this, panelX, panelY, panelW, panelH, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    const startY = panelY - panelH / 2 + 32;
    this.menuItems = this.menuLabels.map((label, i) => {
      const item = this.add.text(panelX + 10, startY + i * 48, label, FONTS.menuItem)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });

      item.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      item.on('pointerdown', () => { this.cursor = i; this.selectOption(); });
      return item;
    });

    this.cursorIcon = this.add.text(0, 0, '▸', { ...FONTS.menuItem, color: COLORS.textHighlight });

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

  private saveGame(): void {
    const sm = SaveManager.getInstance();
    sm.save();

    // Show save confirmation text
    const confirmText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Game Saved!', {
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
}
