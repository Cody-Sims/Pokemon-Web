import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';

/**
 * Statistics sub-menu scene showing tracked GameStats data.
 * Accessible from the pause menu.
 */
export class StatisticsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatisticsScene' });
  }

  create(): void {
    const gm = GameManager.getInstance();
    const stats = gm.getGameStats();
    const layout = ui(this);

    // Background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    // Title
    this.add.text(layout.cx, 28, 'STATISTICS', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(layout.cx, 52, layout.w - 50, 2, COLORS.border, 0.5);

    // Format playtime
    const playtime = gm.getPlaytime();
    const hours = Math.floor(playtime / 3600);
    const mins = Math.floor((playtime % 3600) / 60);
    const playtimeStr = `${hours}h ${mins}m`;

    // Pokédex counts
    const dex = gm.getPokedex();

    // Stat rows
    const rows: [string, string][] = [
      ['Play Time', playtimeStr],
      ['Pokédex Seen', `${dex.seen.length}`],
      ['Pokédex Caught', `${dex.caught.length}`],
      ['Total Steps', `${stats.totalSteps}`],
      ['Battles Won', `${stats.totalBattlesWon}`],
      ['Battles Lost', `${stats.totalBattlesLost}`],
      ['Wild Battles', `${stats.wildBattles}`],
      ['Trainer Battles', `${stats.trainerBattles}`],
      ['Pokémon Caught', `${stats.totalCatches}`],
      ['Pokémon Evolved', `${stats.pokemonEvolved}`],
      ['Money Earned', `₽${stats.moneyEarned}`],
      ['Money Spent', `₽${stats.moneySpent}`],
      ['Critical Hits', `${stats.criticalHits}`],
      ['Highest Damage', `${stats.highestDamage}`],
    ];

    const startY = 70;
    const lineH = Math.round(34 * MOBILE_SCALE);
    const fontSize = mobileFontSize(15);
    const labelX = 60;
    const valueX = layout.w - 60;

    rows.forEach(([label, value], i) => {
      // Alternating row backgrounds
      if (i % 2 === 0) {
        this.add.rectangle(layout.cx, startY + i * lineH, layout.w - 40, lineH, COLORS.bgCard, 0.3);
      }

      this.add.text(labelX, startY + i * lineH, label, {
        fontSize, color: '#aaaaaa',
      }).setOrigin(0, 0.5);

      this.add.text(valueX, startY + i * lineH, value, {
        fontSize, color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    });

    // Close hint
    this.add.text(layout.cx, layout.h - 25, 'Press ESC to close', {
      ...FONTS.caption, color: COLORS.textDim,
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
