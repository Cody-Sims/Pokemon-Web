import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SpeedrunRecords } from '@systems/engine/SpeedrunRecords';
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

    // ── Speed-run splits (only when at least one is recorded) ──
    const splits = gm.getSpeedrunSplits();
    const pbs = SpeedrunRecords.getAll();
    if (splits.length > 0) {
      const splitsTop = startY + rows.length * lineH + 12;
      this.add.text(layout.cx, splitsTop, 'SPEED-RUN SPLITS  (PB ↘)', {
        ...FONTS.caption, color: COLORS.textHighlight, fontStyle: 'bold',
      }).setOrigin(0.5);
      const splitFont = mobileFontSize(12);
      const fmt = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
      };
      splits.forEach((split, i) => {
        const sy = splitsTop + 18 + i * (lineH * 0.7);
        if (i % 2 === 0) {
          this.add.rectangle(layout.cx, sy, layout.w - 80, lineH * 0.7, COLORS.bgCard, 0.25);
        }
        this.add.text(labelX + 10, sy, split.label, {
          fontSize: splitFont, color: '#cccccc',
        }).setOrigin(0, 0.5);
        const splitStr = fmt(split.playtime);
        const pb = pbs[split.id];
        const isPb = pb && pb.timestamp === split.timestamp;
        this.add.text(valueX - 90, sy, splitStr, {
          fontSize: splitFont, color: isPb ? '#ffd86b' : '#7fffd4', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0.5);
        const pbStr = pb ? fmt(pb.playtime) : '--';
        this.add.text(valueX - 10, sy, pbStr, {
          fontSize: splitFont, color: '#999999', fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
      });

      // Export Splits button (B.3)
      const exportY = splitsTop + 18 + splits.length * (lineH * 0.7) + 12;
      const exportBtn = this.add.text(layout.cx, exportY, '[ Export Splits JSON ]', {
        ...FONTS.caption, color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      exportBtn.on('pointerdown', () => this.exportSplits(splits));
      exportBtn.on('pointerover', () => exportBtn.setColor('#ffd86b'));
      exportBtn.on('pointerout', () => exportBtn.setColor(COLORS.textHighlight));
      this.input.keyboard!.on('keydown-E', () => this.exportSplits(splits));
    }

    // Close hint
    const closeBtn = this.add.text(layout.cx, layout.h - 25, '[ CLOSE ]', {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    // Input (BUG-085: removed global pointerdown close)
    this.input.keyboard!.on('keydown-ESC', () => this.close());
    this.input.keyboard!.on('keydown-ENTER', () => this.close());
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }

  /**
   * B.3 — download the current run's splits + lifetime PBs as JSON.
   * Uses the player's name + difficulty + playtime as `runMeta`.
   */
  private exportSplits(splits: { id: string; label: string; playtime: number; timestamp: number }[]): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const gm = GameManager.getInstance();
    SpeedrunRecords.downloadJson(
      {
        playerName: gm.getPlayerName(),
        trainerId: gm.getTrainerId(),
        difficulty: gm.getDifficulty(),
        playtime: gm.getPlaytime(),
        badges: gm.getBadges(),
      },
      splits,
    );
  }
}
