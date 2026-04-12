import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { pokemonData } from '@data/pokemon-data';
import { COLORS, FONTS, SPACING, TYPE_COLORS, STATUS_COLORS, drawPanel, drawTypeBadge, drawHpBar, drawButton } from '@ui/theme';

export class PartyScene extends Phaser.Scene {
  private cursor = 0;
  private slotBgs: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'PartyScene' });
  }

  create(): void {
    const party = GameManager.getInstance().getParty();

    // Full-screen background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    drawPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 30, GAME_HEIGHT - 30);

    this.add.text(GAME_WIDTH / 2, 30, 'POKEMON PARTY', FONTS.heading).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, 48, 200, 2, COLORS.borderHighlight, 0.4);

    this.slotBgs = [];
    this.cursor = 0;

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

      this.add.text(55, slotY - 18, name, { ...FONTS.body, fontStyle: 'bold' });
      this.add.text(55, slotY + 4, `Lv. ${p.level}`, FONTS.caption);

      this.add.text(230, slotY - 18, 'HP', FONTS.label);
      drawHpBar(this, 256, slotY - 12, 170, 10, p.currentHp, p.stats.hp);
      this.add.text(434, slotY - 18, `${p.currentHp}/${p.stats.hp}`, FONTS.caption);

      if (pData) {
        pData.types.forEach((type, ti) => {
          drawTypeBadge(this, 256 + ti * 72, slotY + 10, type);
        });
      }

      if (p.status) {
        const col = STATUS_COLORS[p.status] ?? 0x888899;
        this.add.rectangle(GAME_WIDTH - 90, slotY, 64, 20, col).setStrokeStyle(1, 0xffffff);
        this.add.text(GAME_WIDTH - 90, slotY, p.status.toUpperCase(), { ...FONTS.label, color: '#ffffff' }).setOrigin(0.5);
      }

      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      slotBg.on('pointerdown', () => { this.cursor = i; this.openSummary(i); });
    }

    this.updateCursor();

    // Keyboard
    this.input.keyboard!.on('keydown-UP', () => { this.cursor = Math.max(0, this.cursor - 1); this.updateCursor(); });
    this.input.keyboard!.on('keydown-DOWN', () => { this.cursor = Math.min(party.length - 1, this.cursor + 1); this.updateCursor(); });
    this.input.keyboard!.on('keydown-ENTER', () => this.openSummary(this.cursor));
    this.input.keyboard!.on('keydown-SPACE', () => this.openSummary(this.cursor));
    this.input.keyboard!.on('keydown-ESC', () => this.scene.stop());

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 52, 'Select a Pokémon to view details', FONTS.caption).setOrigin(0.5);
    drawButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Close (ESC)', () => this.scene.stop(), 140, 30);
  }

  private updateCursor(): void {
    const party = GameManager.getInstance().getParty();
    this.slotBgs.forEach((bg, i) => {
      if (i < party.length) {
        bg.setStrokeStyle(i === this.cursor ? 2 : 1, i === this.cursor ? COLORS.borderHighlight : COLORS.border);
      }
    });
  }

  private openSummary(index: number): void {
    const party = GameManager.getInstance().getParty();
    if (index >= party.length) return;
    this.scene.sleep();
    this.scene.launch('SummaryScene', { pokemon: party[index], partyIndex: index });
    // When SummaryScene stops, wake PartyScene back up
    this.scene.get('SummaryScene').events.once('shutdown', () => {
      this.scene.wake();
    });
  }
}
