import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';

export class TrainerCardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrainerCardScene' });
  }

  create(): void {
    const layout = ui(this);
    const gm = GameManager.getInstance();

    // Dim overlay
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgOverlay, 0.6);

    // Card panel
    const cardW = 560;
    const cardH = 380;
    const cx = layout.cx;
    const cy = layout.cy;

    new NinePatchPanel(this, cx, cy, cardW, cardH, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.borderHighlight,
      cornerRadius: 10,
    });

    // Title
    this.add.text(cx, cy - cardH / 2 + 24, 'TRAINER CARD', {
      ...FONTS.heading,
      fontSize: mobileFontSize(20),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    const leftX = cx - cardW / 2 + 40;
    const rightX = cx + 60;
    let rowY = cy - cardH / 2 + 64;
    const rowH = 32;

    // Player name
    this.add.text(leftX, rowY, `Name: ${gm.getPlayerName()}`, {
      ...FONTS.body, fontSize: mobileFontSize(15),
    }).setOrigin(0, 0.5);

    // Trainer ID (BUG-084: use proper GameManager field)
    const idStr = gm.getTrainerId();
    this.add.text(rightX, rowY, `ID No. ${idStr}`, {
      ...FONTS.body, fontSize: mobileFontSize(15),
    }).setOrigin(0, 0.5);

    rowY += rowH;

    // Difficulty
    this.add.text(leftX, rowY, `Mode: ${gm.getDifficulty().toUpperCase()}`, {
      ...FONTS.bodySmall, fontSize: mobileFontSize(13),
    }).setOrigin(0, 0.5);

    rowY += rowH + 8;

    // Badges (8 slots)
    this.add.text(leftX, rowY, 'Badges:', {
      ...FONTS.body, fontSize: mobileFontSize(14),
    }).setOrigin(0, 0.5);

    const badges = gm.getBadges();
    const badgeNames = [
      'Aster', 'Terra', 'Coral', 'Voltara',
      'Ember', 'Iron', 'Wraith', 'Drake',
    ];
    const badgeStartX = leftX + 80;
    for (let i = 0; i < 8; i++) {
      const bx = badgeStartX + i * 52;
      const earned = i < badges.length;
      const color = earned ? COLORS.borderHighlight : 0x333355;
      const g = this.add.graphics();
      g.fillStyle(color, earned ? 1 : 0.3);
      g.fillCircle(bx, rowY, 14);
      g.lineStyle(2, earned ? 0xffdd44 : 0x555577, 1);
      g.strokeCircle(bx, rowY, 14);
      if (earned) {
        this.add.text(bx, rowY, '★', {
          fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    }

    rowY += rowH + 12;

    // Pokédex
    const dex = gm.getPokedex();
    this.add.text(leftX, rowY, `Pokédex  Seen: ${dex.seen.length}  Caught: ${dex.caught.length}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    }).setOrigin(0, 0.5);

    rowY += rowH;

    // Playtime
    const totalSec = gm.getPlaytime();
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    this.add.text(leftX, rowY, `Playtime: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    }).setOrigin(0, 0.5);

    rowY += rowH;

    // Money
    this.add.text(leftX, rowY, `Money: ₽ ${gm.getMoney().toLocaleString()}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    }).setOrigin(0, 0.5);

    rowY += rowH + 12;

    // Player sprite
    const spriteKey = `player-${gm.getPlayerGender()}`;
    if (this.textures.exists(spriteKey)) {
      this.add.image(cx + 180, cy - 20, spriteKey, 0).setScale(3);
    }

    // Close hint
    this.add.text(cx, cy + cardH / 2 - 20, 'Press ESC or ENTER to close', {
      ...FONTS.caption,
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-ESC', () => this.close());
    this.input.keyboard!.on('keydown-ENTER', () => this.close());
    this.input.on('pointerdown', () => this.close());
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }
}
