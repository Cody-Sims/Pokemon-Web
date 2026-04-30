import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { GameManager } from '@managers/GameManager';
import { pokemonData } from '@data/pokemon';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { TouchControls } from '@ui/controls/TouchControls';
import { ScrollContainer } from '@ui/widgets/ScrollContainer';
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
  private scrollContainer?: ScrollContainer;
  /** BUG-016: debounce the Pokémon cry so scrolling doesn't spam audio. */
  private cryTimer?: Phaser.Time.TimerEvent;
  /** BUG-036 sibling: drop late sprite-load callbacks if the user navigated away. */
  private detailRequestId = 0;

  constructor() {
    super({ key: 'PokedexScene' });
  }

  create(): void {
    const layout = ui(this);
    this.listGroup = this.add.group();
    this.detailGroup = this.add.group();

    const gm = GameManager.getInstance();
    const dex = gm.getPokedex();
    this.seenCount = dex.seen.length;
    this.caughtCount = dex.caught.length;

    // Build species list: all available Pokémon IDs
    this.speciesList = [];
    const maxId = Math.max(...Object.values(pokemonData).map(p => p.id));
    for (let id = 1; id <= maxId; id++) {
      this.speciesList.push(id);
    }

    // Background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20, {
      fillColor: COLORS.bgPanel, borderColor: COLORS.border, cornerRadius: 8,
    });

    // Title
    this.add.text(layout.cx, 24, 'POKÉDEX', { ...FONTS.heading, fontSize: mobileFontSize(24) }).setOrigin(0.5);
    this.add.rectangle(layout.cx, 42, 160, 2, COLORS.borderHighlight, 0.4);

    // Counters
    this.countText = this.add.text(layout.cx, 56, `Seen: ${this.seenCount}   Caught: ${this.caughtCount}`, {
      ...FONTS.bodySmall, fontSize: mobileFontSize(13),
    }).setOrigin(0.5);

    // Detail panel — landscape uses the right-rail layout; portrait stacks
    // it below the species list so neither pane gets clipped (BUG-017).
    const isPortrait = layout.h > layout.w;
    if (isPortrait) {
      const detailH = Math.floor(layout.h * 0.40);
      new NinePatchPanel(this, layout.cx, layout.h - detailH / 2 - 50, layout.w - 30, detailH, {
        fillColor: COLORS.bgCard, fillAlpha: 0.7, borderColor: COLORS.border, cornerRadius: 6,
      });
    } else {
      new NinePatchPanel(this, layout.w - 155, layout.cy + 20, 270, layout.h - 130, {
        fillColor: COLORS.bgCard, fillAlpha: 0.7, borderColor: COLORS.border, cornerRadius: 6,
      });
    }

    // Close hint / tappable close button
    if (isMobile()) {
      const closeBtn = this.add.text(layout.cx, layout.h - 18, '✕  CLOSE', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', () => { this.controller?.destroy(); this.scene.stop(); });
    } else {
      this.add.text(layout.cx, layout.h - 18, 'ESC to close', FONTS.caption).setOrigin(0.5);
    }

    this.scrollOffset = 0;
    this.cursor = 0;
    this.renderList();

    // Touch drag-to-scroll for the Pokédex list area
    const itemH = 28;
    const listH = this.maxVisible * itemH;
    this.scrollContainer = new ScrollContainer(this, {
      x: 10, y: 72, width: 200, height: listH,
      contentHeight: this.speciesList.length * itemH,
      onScroll: (offset) => {
        const newOffset = Math.round(offset / itemH);
        if (newOffset !== this.scrollOffset) {
          this.scrollOffset = Math.max(0, Math.min(newOffset, this.speciesList.length - this.maxVisible));
          this.renderList();
        }
      },
    });

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

    // Re-layout on resize / orientation change
    let resizeInit = false;
    layoutOn(this, () => {
      if (!resizeInit) { resizeInit = true; return; }
      this.controller?.destroy();
      this.scrollContainer?.destroy();
      this.scene.restart();
    });
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
      const iconText = this.add.text(18, y, icon, { fontSize: mobileFontSize(14), color: iconColor, fontFamily: 'monospace' });
      this.listGroup.add(iconText);

      // Number
      const numText = this.add.text(34, y, `#${String(id).padStart(3, '0')}`, {
        fontSize: mobileFontSize(13), color: COLORS.textGray, fontFamily: 'monospace',
      });
      this.listGroup.add(numText);

      // Name (hidden if not seen)
      const name = seen ? (data?.name ?? '???') : '----------';
      const nameColor = caught ? COLORS.textWhite : seen ? COLORS.textGray : COLORS.textDim;
      const nameText = this.add.text(85, y, name, {
        fontSize: mobileFontSize(13), color: nameColor, fontFamily: 'monospace',
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
    let changed = false;
    if (idx < this.scrollOffset) {
      this.scrollOffset = idx;
      changed = true;
    } else if (idx >= this.scrollOffset + this.maxVisible) {
      this.scrollOffset = idx - this.maxVisible + 1;
      changed = true;
    }
    if (changed) {
      this.renderList();
      this.scrollContainer?.scrollTo(this.scrollOffset * 28);
    }
  }

  private highlightItem(idx: number): void {
    // Re-render updates visual; the controller handles cursor color externally
    // For simplicity, re-render on every move to show highlight
    this.renderList();
  }

  private showDetail(idx: number): void {
    const layout = ui(this);
    this.detailGroup.clear(true, true);
    // BUG-036: invalidate any in-flight async sprite-load callback.
    const requestId = ++this.detailRequestId;
    const id = this.speciesList[idx];
    const gm = GameManager.getInstance();
    const dex = gm.getPokedex();
    const seen = dex.seen.includes(id);
    const caught = dex.caught.includes(id);

    const x = layout.w - 270;
    let y = 90;

    if (!seen) {
      const isPortraitU = layout.h > layout.w;
      const ux = isPortraitU ? layout.cx : layout.w - 155;
      const uy = isPortraitU ? Math.floor(layout.h * 0.75) : layout.cy;
      const unknown = this.add.text(ux, uy, '???', {
        ...FONTS.heading, color: COLORS.textDim,
      }).setOrigin(0.5);
      this.detailGroup.add(unknown);
      return;
    }

    const data = pokemonData[id];
    if (!data) return;

    // BUG-017: Pick layout anchors based on orientation — landscape keeps the
    // legacy right-rail detail panel; portrait stacks the detail block below
    // the species list so neither pane gets clipped.
    const isPortrait = layout.h > layout.w;
    const detailCx = isPortrait ? layout.cx : layout.w - 155;
    const detailTop = isPortrait ? Math.floor(layout.h * 0.55) : 90;

    // Sprite — load on demand if not yet in texture cache
    const spriteKey = data.spriteKeys.front;
    const spriteY = isPortrait ? detailTop + 40 : y + 40;
    if (spriteKey && this.textures.exists(spriteKey)) {
      const sprite = this.add.image(detailCx, spriteY, spriteKey).setScale(2);
      this.detailGroup.add(sprite);
    } else if (spriteKey) {
      const name = data.name.toLowerCase();
      this.load.image(spriteKey, `assets/sprites/pokemon/${name}-front.png`);
      this.load.once('complete', () => {
        // BUG-036: ignore if user navigated to a different species in the meantime.
        if (requestId !== this.detailRequestId) return;
        if (this.detailGroup && this.textures.exists(spriteKey)) {
          const sprite = this.add.image(detailCx, spriteY, spriteKey).setScale(2);
          this.detailGroup.add(sprite);
        }
      });
      this.load.start();
    }
    y = (isPortrait ? detailTop : y) + 90;

    // BUG-016: Debounce the cry so scrolling doesn't spam the procedural
    // audio generator — only fire after the cursor settles for ~250 ms.
    if (this.cryTimer) {
      this.cryTimer.remove(false);
      this.cryTimer = undefined;
    }
    this.cryTimer = this.time.delayedCall(250, () => {
      if (requestId !== this.detailRequestId) return;
      AudioManager.getInstance().playCry(id);
    });

    // Name
    const nameText = this.add.text(detailCx, y, data.name, {
      ...FONTS.body, fontStyle: 'bold', fontSize: mobileFontSize(17),
    }).setOrigin(0.5);
    this.detailGroup.add(nameText);
    y += 22;

    // Number
    const numText = this.add.text(detailCx, y, `#${String(id).padStart(3, '0')}`, {
      ...FONTS.caption,
    }).setOrigin(0.5);
    this.detailGroup.add(numText);
    y += 22;

    // Types
    data.types.forEach((type, ti) => {
      const badgeX = isPortrait ? detailCx - 36 + ti * 72 : layout.w - 175 + ti * 72;
      const badge = drawTypeBadge(this, badgeX, y, type);
      this.detailGroup.add(badge);
    });
    y += 28;

    // Status
    const status = caught ? 'Caught ●' : 'Seen ○';
    const statusColor = caught ? COLORS.textSuccess : COLORS.textGray;
    const statusText = this.add.text(detailCx, y, status, {
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
      const statX = isPortrait ? detailCx - 60 : x;
      statLabels.forEach(([label, val]) => {
        const row = this.add.text(statX, y, `${label}: ${val}`, {
          fontSize: mobileFontSize(12), color: COLORS.textGray, fontFamily: 'monospace',
        });
        this.detailGroup.add(row);
        y += 18;
      });
    }
  }

  update(): void {
    const touch = TouchControls.getInstance();
    if (!touch) return;
    if (touch.consumeSwipeUp()) {
      this.controller?.navigate('up');
    } else if (touch.consumeSwipeDown()) {
      this.controller?.navigate('down');
    }
  }

  shutdown(): void {
    this.cryTimer?.destroy();
    this.cryTimer = undefined;
    this.input.keyboard?.removeAllListeners();
  }
}
