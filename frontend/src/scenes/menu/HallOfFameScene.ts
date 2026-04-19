import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE, TYPE_COLORS, isMobile } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager, HallOfFameEntry } from '@managers/GameManager';
import { pokemonData } from '@data/pokemon';
import { SFX } from '@utils/audio-keys';

/**
 * Hall of Fame scene showing past champion completions.
 * Accessible from both the title screen and pause menu.
 */
export class HallOfFameScene extends Phaser.Scene {
  private entries: HallOfFameEntry[] = [];
  private page = 0;
  private readonly entriesPerPage = 3;

  constructor() {
    super({ key: 'HallOfFameScene' });
  }

  create(): void {
    const gm = GameManager.getInstance();
    this.entries = gm.getHallOfFame();
    this.page = 0;
    const layout = ui(this);

    // Background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    // Title
    this.add.text(layout.cx, 28, '★ HALL OF FAME ★', {
      ...FONTS.heading, color: '#ffcc00',
    }).setOrigin(0.5);

    this.add.rectangle(layout.cx, 52, layout.w - 50, 2, 0xffcc00, 0.5);

    if (this.entries.length === 0) {
      this.add.text(layout.cx, layout.cy, 'No champion records yet.', {
        ...FONTS.body, color: COLORS.textGray,
      }).setOrigin(0.5);
    } else {
      this.drawPage();
    }

    // Navigation hint
    const navHint = this.entries.length > this.entriesPerPage
      ? (isMobile() ? 'Swipe to browse  •  Tap to close' : 'LEFT/RIGHT to browse  •  ESC to close')
      : (isMobile() ? 'Tap to close' : 'Press ESC to close');
    const closeBtn = this.add.text(layout.cx, layout.h - 25, `[ ${navHint} ]`, {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    // Input (BUG-085: removed global pointerdown close)
    this.input.keyboard!.on('keydown-ESC', () => this.close());
    this.input.keyboard!.on('keydown-ENTER', () => this.close());
    this.input.keyboard!.on('keydown-LEFT', () => this.prevPage());
    this.input.keyboard!.on('keydown-RIGHT', () => this.nextPage());
  }

  private drawPage(): void {
    // Remove old content (tagged as 'page-content') — BUG-086: copy array first
    const toRemove = this.children.list.filter(c => c.getData('pageContent'));
    toRemove.forEach(c => c.destroy());

    const layout = ui(this);
    const start = this.page * this.entriesPerPage;
    const pageEntries = this.entries.slice(start, start + this.entriesPerPage);
    const totalPages = Math.ceil(this.entries.length / this.entriesPerPage);

    // Page indicator
    if (totalPages > 1) {
      const pi = this.addTagged(
        this.add.text(layout.cx, layout.h - 50, `Page ${this.page + 1} / ${totalPages}`, {
          ...FONTS.caption, color: COLORS.textGray,
        }).setOrigin(0.5),
      );
    }

    const cardH = 150;
    const startY = 75;

    pageEntries.forEach((entry, i) => {
      const y = startY + i * (cardH + 10);

      // Card background
      this.addTagged(
        this.add.rectangle(layout.cx, y + cardH / 2, layout.w - 50, cardH, COLORS.bgCard, 0.8)
          .setStrokeStyle(1, 0xffcc00),
      );

      // Entry number and date
      const entryNum = start + i + 1;
      const dateStr = new Date(entry.timestamp).toLocaleDateString();
      this.addTagged(
        this.add.text(40, y + 10, `#${entryNum} — ${dateStr}`, {
          ...FONTS.bodySmall, color: '#ffcc00',
        }),
      );

      // Player name and playtime
      const hours = Math.floor(entry.playtime / 3600);
      const mins = Math.floor((entry.playtime % 3600) / 60);
      this.addTagged(
        this.add.text(40, y + 30, `${entry.playerName}  •  ${hours}h ${mins}m`, {
          ...FONTS.body, color: COLORS.textWhite,
        }),
      );

      // Party display
      const partyY = y + 60;
      const slotW = 85;
      const startX = 40;

      entry.party.forEach((p, pi) => {
        const data = pokemonData[p.pokemonId];
        const name = data?.name ?? `#${p.pokemonId}`;
        const typeColor = data ? TYPE_COLORS[data.types[0]] ?? 0x888888 : 0x888888;

        const sx = startX + pi * slotW;

        // Type dot
        this.addTagged(
          this.add.circle(sx + 8, partyY + 8, 6, typeColor),
        );

        // Name
        this.addTagged(
          this.add.text(sx + 20, partyY, name, {
            fontSize: mobileFontSize(12), color: '#ffffff',
          }),
        );

        // Level
        this.addTagged(
          this.add.text(sx + 20, partyY + 16, `Lv${p.level}`, {
            fontSize: mobileFontSize(11), color: '#aaaaaa',
          }),
        );
      });
    });
  }

  private addTagged<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    obj.setData('pageContent', true);
    return obj;
  }

  private nextPage(): void {
    const totalPages = Math.ceil(this.entries.length / this.entriesPerPage);
    if (this.page < totalPages - 1) {
      this.page++;
      this.drawPage();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    }
  }

  private prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.drawPage();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    }
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }
}
