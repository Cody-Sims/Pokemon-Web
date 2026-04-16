import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { AchievementManager, AchievementDef } from '@managers/AchievementManager';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';

type CategoryFilter = 'all' | 'story' | 'collection' | 'battle' | 'exploration' | 'challenge';

export class AchievementScene extends Phaser.Scene {
  private cursor = 0;
  private scrollOffset = 0;
  private filtered: AchievementDef[] = [];
  private category: CategoryFilter = 'all';
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private descText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private readonly COLS = 5;
  private readonly VISIBLE_ROWS = 5;

  constructor() {
    super({ key: 'AchievementScene' });
  }

  create(): void {
    const am = AchievementManager.getInstance();

    // Dim background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark, 1);

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'ACHIEVEMENTS', {
      ...FONTS.heading, fontSize: mobileFontSize(22),
    }).setOrigin(0.5);

    // Progress counter
    const prog = am.getProgress();
    this.progressText = this.add.text(GAME_WIDTH / 2, 46, `Unlocked: ${prog.unlocked} / ${prog.total}`, {
      ...FONTS.bodySmall, fontSize: mobileFontSize(13), color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Category tabs
    const categories: { label: string; value: CategoryFilter }[] = [
      { label: 'All', value: 'all' },
      { label: 'Story', value: 'story' },
      { label: 'Collection', value: 'collection' },
      { label: 'Battle', value: 'battle' },
      { label: 'Explore', value: 'exploration' },
      { label: 'Challenge', value: 'challenge' },
    ];
    const tabY = 70;
    const tabW = Math.floor((GAME_WIDTH - 40) / categories.length);
    this.tabTexts = categories.map((cat, i) => {
      const t = this.add.text(20 + i * tabW + tabW / 2, tabY, cat.label, {
        ...FONTS.caption, fontSize: mobileFontSize(12),
        color: this.category === cat.value ? COLORS.textHighlight : COLORS.textGray,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.category = cat.value;
        this.cursor = 0;
        this.scrollOffset = 0;
        this.refreshGrid();
      });
      return t;
    });

    // Description area at bottom
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 70, GAME_WIDTH - 40, 60, {
      fillColor: COLORS.bgPanel, borderColor: COLORS.border, cornerRadius: 6,
    });
    this.descText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '', {
      ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textWhite,
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(40, GAME_HEIGHT - 25, '← BACK', {
      ...FONTS.menuItem, fontSize: mobileFontSize(14), color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.closeScene());

    // Input
    this.input.keyboard!.on('keydown-LEFT', () => this.navigate(-1, 0));
    this.input.keyboard!.on('keydown-RIGHT', () => this.navigate(1, 0));
    this.input.keyboard!.on('keydown-UP', () => this.navigate(0, -1));
    this.input.keyboard!.on('keydown-DOWN', () => this.navigate(0, 1));
    this.input.keyboard!.on('keydown-ESC', () => this.closeScene());
    this.input.keyboard!.on('keydown-TAB', () => this.cycleCategory());

    this.refreshGrid();
  }

  private cycleCategory(): void {
    const cats: CategoryFilter[] = ['all', 'story', 'collection', 'battle', 'exploration', 'challenge'];
    const idx = cats.indexOf(this.category);
    this.category = cats[(idx + 1) % cats.length];
    this.cursor = 0;
    this.scrollOffset = 0;
    this.refreshGrid();
  }

  private refreshGrid(): void {
    const am = AchievementManager.getInstance();
    const all = am.getAll();
    this.filtered = this.category === 'all' ? all : all.filter(a => a.category === this.category);

    // Update tabs
    const cats: CategoryFilter[] = ['all', 'story', 'collection', 'battle', 'exploration', 'challenge'];
    this.tabTexts.forEach((t, i) => {
      t.setColor(this.category === cats[i] ? COLORS.textHighlight : COLORS.textGray);
    });

    // Update progress
    const prog = am.getProgress();
    this.progressText.setText(`Unlocked: ${prog.unlocked} / ${prog.total}`);

    // Destroy old items
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts = [];

    // Grid layout
    const startY = 95;
    const cellW = Math.floor((GAME_WIDTH - 40) / this.COLS);
    const cellH = Math.round(52 * MOBILE_SCALE);
    const maxIdx = Math.min(this.filtered.length, (this.scrollOffset + this.VISIBLE_ROWS) * this.COLS);

    for (let i = this.scrollOffset * this.COLS; i < maxIdx; i++) {
      const ach = this.filtered[i];
      const row = Math.floor((i - this.scrollOffset * this.COLS) / this.COLS);
      const col = (i - this.scrollOffset * this.COLS) % this.COLS;
      const x = 20 + col * cellW + cellW / 2;
      const y = startY + row * cellH + cellH / 2;

      const unlocked = am.isUnlocked(ach.id);
      const icon = unlocked ? (ach.icon ?? '🏆') : '🔒';
      const color = unlocked ? COLORS.textHighlight : COLORS.textDim;

      const t = this.add.text(x, y, `${icon}\n${ach.name}`, {
        ...FONTS.caption, fontSize: mobileFontSize(11), color,
        align: 'center',
        wordWrap: { width: cellW - 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      t.on('pointerdown', () => {
        this.cursor = i;
        this.updateDescription();
      });
      t.on('pointerover', () => {
        this.cursor = i;
        this.updateDescription();
      });

      this.itemTexts.push(t);
    }

    this.updateDescription();
  }

  private navigate(dx: number, dy: number): void {
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    const total = this.filtered.length;
    if (total === 0) return;

    let newCursor = this.cursor + dx + dy * this.COLS;
    newCursor = Math.max(0, Math.min(total - 1, newCursor));
    this.cursor = newCursor;

    // Scroll if needed
    const row = Math.floor(this.cursor / this.COLS);
    if (row < this.scrollOffset) {
      this.scrollOffset = row;
      this.refreshGrid();
    } else if (row >= this.scrollOffset + this.VISIBLE_ROWS) {
      this.scrollOffset = row - this.VISIBLE_ROWS + 1;
      this.refreshGrid();
    }

    this.updateDescription();
  }

  private updateDescription(): void {
    if (this.filtered.length === 0) {
      this.descText.setText('No achievements in this category.');
      return;
    }
    const ach = this.filtered[this.cursor];
    if (!ach) return;
    const am = AchievementManager.getInstance();
    const status = am.isUnlocked(ach.id) ? '✅' : '🔒';
    this.descText.setText(`${status} ${ach.name} — ${ach.description}`);

    // Highlight current in grid
    const gridIdx = this.cursor - this.scrollOffset * this.COLS;
    this.itemTexts.forEach((t, i) => {
      const isSelected = i === gridIdx;
      t.setScale(isSelected ? 1.1 : 1.0);
    });
  }

  private closeScene(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }
}
