import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { pokemonData } from '@data/pokemon';
import { COLORS, FONTS, SPACING, TYPE_COLORS, STATUS_COLORS, drawTypeBadge, drawHpBar, drawButton } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { SFX } from '@utils/audio-keys';

export class PartyScene extends Phaser.Scene {
  private cursor = 0;
  private slotBgs: Phaser.GameObjects.Rectangle[] = [];
  private controller?: MenuController;
  private contextMenu?: { panel: NinePatchPanel; texts: Phaser.GameObjects.Text[]; controller: MenuController };
  private swapMode = false;
  private swapSourceIdx = -1;
  private selectMode = false;

  constructor() {
    super({ key: 'PartyScene' });
  }

  init(data?: { selectMode?: boolean }): void {
    this.selectMode = data?.selectMode ?? false;
  }

  create(): void {
    const party = GameManager.getInstance().getParty();

    // Full-screen background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 30, GAME_HEIGHT - 30, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    this.add.text(GAME_WIDTH / 2, 30, 'POKEMON PARTY', FONTS.heading).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, 48, 200, 2, COLORS.borderHighlight, 0.4);

    this.slotBgs = [];
    this.cursor = 0;
    this.swapMode = false;

    for (let i = 0; i < 6; i++) {
      const y = 64 + i * SPACING.slotHeight;
      const hasMon = i < party.length;
      const p = hasMon ? party[i] : null;

      const slotBg = this.add.rectangle(GAME_WIDTH / 2, y + SPACING.slotHeight / 2, GAME_WIDTH - 70, SPACING.slotHeight - 6,
        hasMon ? COLORS.bgCard : COLORS.bgDark, hasMon ? 0.9 : 0.5)
        .setStrokeStyle(1, hasMon ? COLORS.border : 0x2a2a3a);
      this.slotBgs.push(slotBg);

      if (!hasMon || !p) {
        this.add.text(GAME_WIDTH / 2, y + SPACING.slotHeight / 2, '—  Empty  —', { ...FONTS.bodySmall, color: COLORS.textDim }).setOrigin(0.5);
        continue;
      }

      const pData = pokemonData[p.dataId];
      const name = p.nickname ?? pData?.name ?? '???';
      const slotY = y + SPACING.slotHeight / 2;
      const isFainted = p.currentHp <= 0;

      // Mini sprite (icon) if texture exists
      const iconKey = pData?.spriteKeys.icon;
      if (iconKey && this.textures.exists(iconKey)) {
        const icon = this.add.image(30, slotY, iconKey).setScale(1.5);
        if (isFainted) icon.setAlpha(0.4).setTint(0x888888);
      }

      // Name (dimmed if fainted)
      const nameText = this.add.text(55, slotY - 18, name, { ...FONTS.body, fontStyle: 'bold' });
      if (isFainted) nameText.setAlpha(0.5);

      // Level
      const lvText = this.add.text(55, slotY + 4, `Lv. ${p.level}`, FONTS.caption);
      if (isFainted) lvText.setAlpha(0.5);

      // HP bar
      this.add.text(230, slotY - 18, 'HP', FONTS.label);
      drawHpBar(this, 256, slotY - 12, 170, 10, p.currentHp, p.stats.hp);
      this.add.text(434, slotY - 18, `${p.currentHp}/${p.stats.hp}`, FONTS.caption);

      // Type badges
      if (pData) {
        pData.types.forEach((type, ti) => {
          drawTypeBadge(this, 256 + ti * 72, slotY + 10, type);
        });
      }

      // Status condition badge
      if (p.status) {
        const col = STATUS_COLORS[p.status] ?? 0x888899;
        this.add.rectangle(GAME_WIDTH - 90, slotY, 64, 20, col).setStrokeStyle(1, 0xffffff);
        this.add.text(GAME_WIDTH - 90, slotY, p.status.toUpperCase(), { ...FONTS.label, color: '#ffffff' }).setOrigin(0.5);
      }

      // Fainted indicator
      if (isFainted) {
        this.add.rectangle(GAME_WIDTH - 90, slotY, 64, 20, 0x661111).setStrokeStyle(1, 0xff3333);
        this.add.text(GAME_WIDTH - 90, slotY, 'FNT', { ...FONTS.label, color: '#ff5555' }).setOrigin(0.5);
        slotBg.setAlpha(0.6);
      }

      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on('pointerover', () => this.controller?.hoverIndex(i));
      slotBg.on('pointerdown', () => this.controller?.clickIndex(i));
    }

    this.controller = new MenuController(this, {
      columns: 1,
      itemCount: party.length,
      wrap: false,
      onMove: (idx) => { this.cursor = idx; this.updateCursor(); },
      onConfirm: (idx) => this.onSlotConfirm(idx),
      onCancel: () => this.closeScene(),
      audioFeedback: true,
    });

    this.updateCursor();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 52, this.selectMode ? 'Choose a Pokémon' : 'Select a Pokémon to view options', FONTS.caption).setOrigin(0.5);
    drawButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Close (ESC)', () => this.closeScene(), 140, 30);
  }

  private updateCursor(): void {
    const party = GameManager.getInstance().getParty();
    this.slotBgs.forEach((bg, i) => {
      if (i < party.length) {
        bg.setStrokeStyle(i === this.cursor ? 2 : 1, i === this.cursor ? COLORS.borderHighlight : COLORS.border);
      }
    });
  }

  private onSlotConfirm(index: number): void {
    const party = GameManager.getInstance().getParty();
    if (index >= party.length) return;

    // In select mode, emit the selection and close
    if (this.selectMode) {
      this.events.emit('pokemon-selected', index);
      return;
    }

    if (this.swapMode) {
      // Complete the swap
      this.performSwap(this.swapSourceIdx, index);
      return;
    }

    this.openContextMenu(index);
  }

  private openContextMenu(index: number): void {
    this.controller?.setDisabled(true);
    const actions = ['SUMMARY', 'SWITCH', 'Cancel'];
    const menuX = GAME_WIDTH - 140;
    const menuY = 64 + index * SPACING.slotHeight + SPACING.slotHeight / 2;

    const panel = new NinePatchPanel(this, menuX, menuY, 130, actions.length * 32 + 12, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });

    const texts = actions.map((label, i) => {
      return this.add.text(menuX, menuY - ((actions.length - 1) * 16) + i * 32, label, {
        ...FONTS.body, fontSize: '15px',
      }).setOrigin(0.5);
    });

    const controller = new MenuController(this, {
      columns: 1,
      itemCount: actions.length,
      wrap: true,
      onMove: (ci) => {
        texts.forEach((t, i) => t.setColor(i === ci ? COLORS.textHighlight : COLORS.textWhite));
      },
      onConfirm: (ci) => {
        this.closeContextMenu();
        const action = actions[ci];
        if (action === 'SUMMARY') this.openSummary(index);
        else if (action === 'SWITCH') this.startSwap(index);
      },
      onCancel: () => this.closeContextMenu(),
    });
    texts[0]?.setColor(COLORS.textHighlight);

    this.contextMenu = { panel, texts, controller };
  }

  private closeContextMenu(): void {
    if (!this.contextMenu) return;
    this.contextMenu.controller.destroy();
    this.contextMenu.panel.destroy();
    this.contextMenu.texts.forEach(t => t.destroy());
    this.contextMenu = undefined;
    this.controller?.setDisabled(false);
  }

  private startSwap(sourceIdx: number): void {
    this.swapMode = true;
    this.swapSourceIdx = sourceIdx;
    // Highlight source slot
    if (sourceIdx < this.slotBgs.length) {
      this.slotBgs[sourceIdx].setStrokeStyle(3, 0x55ff88);
    }
  }

  private performSwap(srcIdx: number, destIdx: number): void {
    if (srcIdx === destIdx) {
      this.swapMode = false;
      this.slotBgs[srcIdx]?.setStrokeStyle(2, COLORS.borderHighlight);
      return;
    }
    const gm = GameManager.getInstance();
    const party = gm.getParty();
    const temp = party[srcIdx];
    party[srcIdx] = party[destIdx];
    party[destIdx] = temp;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.swapMode = false;
    // Refresh
    this.controller?.destroy();
    this.scene.restart();
  }

  private openSummary(index: number): void {
    const party = GameManager.getInstance().getParty();
    if (index >= party.length) return;
    this.controller?.setDisabled(true);
    this.scene.sleep();
    this.scene.launch('SummaryScene', { pokemon: party[index], partyIndex: index });
    this.scene.get('SummaryScene').events.once('shutdown', () => {
      this.scene.wake();
      this.controller?.setDisabled(false);
    });
  }

  private closeScene(): void {
    this.controller?.destroy();
    this.scene.stop();
  }
}
