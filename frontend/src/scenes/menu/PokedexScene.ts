import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { pokemonData } from '@data/pokemon';
import { NinePatchPanel } from '@ui/NinePatchPanel';
import { MenuController } from '@ui/MenuController';
import { COLORS, FONTS, TYPE_COLORS, drawTypeBadge, mobileFontSize, isMobile } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';

export class PokedexScene extends Phaser.Scene {
  private cursor = 0;
  private scrollOffset = 0;
  private readonly maxVisible = 10;
  private speciesList: number[] = [];
  private controller?: MenuController;
  private listGroup!: Phaser.GameObjects.Group;
  private detailGroup!: Phaser.GameObjects.Group;
  private seenCount = 0;
  private caughtCount = 0;
  private countText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PokedexScene' });
  }

  create(): void {
    this.listGroup = this.add.group();
    this.detailGroup = this.add.group();

    const gm = GameManager.getInstance();
    const dex = gm.getPokedex();
    this.seenCount = dex.seen.length;
    this.caughtCount = dex.caught.length;

    // Build species list: all 151 IDs
    this.speciesList = [];
    for (let id = 1; id <= 151; id++) {
      this.speciesList.push(id);
    }

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 20, {
      fillColor: COLORS.bgPanel, borderColor: COLORS.border, cornerRadius: 8,
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 24, 'POKÉDEX', { ...FONTS.heading, fontSize: '24px' }).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, 42, 160, 2, COLORS.borderHighlight, 0.4);

    // Counters
    this.countText = this.add.text(GAME_WIDTH / 2, 56, `Seen: ${this.seenCount}   Caught: ${this.caughtCount}`, {
      ...FONTS.bodySmall, fontSize: '13px',
    }).setOrigin(0.5);

    // Detail panel (right side)
    new NinePatchPanel(this, GAME_WIDTH - 155, GAME_HEIGHT / 2 + 20, 270, GAME_HEIGHT - 130, {
      fillColor: COLORS.bgCard, fillAlpha: 0.7, borderColor: COLORS.border, cornerRadius: 6,
    });

    // Close hint / tappable close button
    if (isMobile()) {
      const closeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, '✕  CLOSE', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', () => { this.controller?.destroy(); this.scene.stop(); });
    } else {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'ESC to close', FONTS.caption).setOrigin(0.5);
    }

    this.scrollOffset = 0;
    this.cursor = 0;
    this.renderList();

    this.controller = new MenuController(this, {
      columns: 1,
      itemCount: this.speciesList.length,
      wrap: false,
      onMove: (idx) => {
        this.cursor = idx;
        this.ensureVisible(idx);
        this.highlightItem(idx);
        this.showDetail(idx);
      },
      onCancel: () => { this.controller?.destroy(); this.scene.stop(); },
    });

    this.highlightItem(0);
    this.showDetail(0);
  }

  private renderList(): void {
    this.listGroup.clear(true, true);
    const gm = GameManager.getInstance();
    const dex = gm.getPokedex();
    const seenSet = new Set(dex.seen);
    const caughtSet = new Set(dex.caught);

    const startY = 76;
    const itemH = 28;
    const endIdx = Math.min(this.scrollOffset + this.maxVisible, this.speciesList.length);

    for (let vi = this.scrollOffset; vi < endIdx; vi++) {
      const id = this.speciesList[vi];
      const seen = seenSet.has(id);
      const caught = caughtSet.has(id);
      const data = pokemonData[id];
      const y = startY + (vi - this.scrollOffset) * itemH;

      // Status icon
      const icon = caught ? '●' : seen ? '○' : ' ';
      const iconColor = caught ? COLORS.textSuccess : seen ? COLORS.textGray : COLORS.textDim;
      const iconText = this.add.text(18, y, icon, { fontSize: '14px', color: iconColor, fontFamily: 'monospace' });
      this.listGroup.add(iconText);

      // Number
      const numText = this.add.text(34, y, `#${String(id).padStart(3, '0')}`, {
        fontSize: '13px', color: COLORS.textGray, fontFamily: 'monospace',
      });
      this.listGroup.add(numText);

      // Name (hidden if not seen)
      const name = seen ? (data?.name ?? '???') : '----------';
      const nameColor = caught ? COLORS.textWhite : seen ? COLORS.textGray : COLORS.textDim;
      const nameText = this.add.text(85, y, name, {
        fontSize: '13px', color: nameColor, fontFamily: 'monospace',
      }).setInteractive({ useHandCursor: true });
      nameText.on('pointerover', () => this.controller?.hoverIndex(vi));
      nameText.on('pointerdown', () => this.controller?.clickIndex(vi));
      this.listGroup.add(nameText);
    }

    // Scroll indicators
    if (this.scrollOffset > 0) {
      const up = this.add.text(100, startY - 14, '▲', { ...FONTS.caption, color: COLORS.textHighlight }).setOrigin(0.5);
      this.listGroup.add(up);
    }
    if (endIdx < this.speciesList.length) {
      const down = this.add.text(100, startY + this.maxVisible * itemH, '▼', { ...FONTS.caption, color: COLORS.textHighlight }).setOrigin(0.5);
      this.listGroup.add(down);
    }
  }

  private ensureVisible(idx: number): void {
    if (idx < this.scrollOffset) {
      this.scrollOffset = idx;
      this.renderList();
    } else if (idx >= this.scrollOffset + this.maxVisible) {
      this.scrollOffset = idx - this.maxVisible + 1;
      this.renderList();
    }
  }

  private highlightItem(idx: number): void {
    // Re-render updates visual; the controller handles cursor color externally
    // For simplicity, re-render on every move to show highlight
    this.renderList();
  }

  private showDetail(idx: number): void {
    this.detailGroup.clear(true, true);
    const id = this.speciesList[idx];
    const gm = GameManager.getInstance();
    const dex = gm.getPokedex();
    const seen = dex.seen.includes(id);
    const caught = dex.caught.includes(id);

    const x = GAME_WIDTH - 270;
    let y = 90;

    if (!seen) {
      const unknown = this.add.text(GAME_WIDTH - 155, GAME_HEIGHT / 2, '???', {
        ...FONTS.heading, color: COLORS.textDim,
      }).setOrigin(0.5);
      this.detailGroup.add(unknown);
      return;
    }

    const data = pokemonData[id];
    if (!data) return;

    // Sprite — load on demand if not yet in texture cache
    const spriteKey = data.spriteKeys.front;
    if (spriteKey && this.textures.exists(spriteKey)) {
      const sprite = this.add.image(GAME_WIDTH - 155, y + 40, spriteKey).setScale(2);
      this.detailGroup.add(sprite);
    } else if (spriteKey) {
      const name = data.name.toLowerCase();
      this.load.image(spriteKey, `assets/sprites/pokemon/${name}-front.png`);
      this.load.once('complete', () => {
        if (this.detailGroup && this.textures.exists(spriteKey)) {
          const sprite = this.add.image(GAME_WIDTH - 155, y + 40, spriteKey).setScale(2);
          this.detailGroup.add(sprite);
        }
      });
      this.load.start();
    }
    y += 90;

    // Play Pokémon cry when viewing details
    AudioManager.getInstance().playCry(id);

    // Name
    const nameText = this.add.text(GAME_WIDTH - 155, y, data.name, {
      ...FONTS.body, fontStyle: 'bold', fontSize: '17px',
    }).setOrigin(0.5);
    this.detailGroup.add(nameText);
    y += 22;

    // Number
    const numText = this.add.text(GAME_WIDTH - 155, y, `#${String(id).padStart(3, '0')}`, {
      ...FONTS.caption,
    }).setOrigin(0.5);
    this.detailGroup.add(numText);
    y += 22;

    // Types
    data.types.forEach((type, ti) => {
      const badge = drawTypeBadge(this, GAME_WIDTH - 175 + ti * 72, y, type);
      this.detailGroup.add(badge);
    });
    y += 28;

    // Status
    const status = caught ? 'Caught ●' : 'Seen ○';
    const statusColor = caught ? COLORS.textSuccess : COLORS.textGray;
    const statusText = this.add.text(GAME_WIDTH - 155, y, status, {
      ...FONTS.bodySmall, color: statusColor,
    }).setOrigin(0.5);
    this.detailGroup.add(statusText);
    y += 28;

    // Base stats (only if caught)
    if (caught) {
      const stats = data.baseStats;
      const statLabels = [
        ['HP', stats.hp], ['ATK', stats.attack], ['DEF', stats.defense],
        ['SPA', stats.spAttack], ['SPD', stats.spDefense], ['SPE', stats.speed],
      ];
      statLabels.forEach(([label, val]) => {
        const row = this.add.text(x, y, `${label}: ${val}`, {
          fontSize: '12px', color: COLORS.textGray, fontFamily: 'monospace',
        });
        this.detailGroup.add(row);
        y += 18;
      });
    }
  }
}
