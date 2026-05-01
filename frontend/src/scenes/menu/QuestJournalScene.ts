import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize, mobileScale, isMobile, minTouchTarget } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import { QuestManager } from '@managers/QuestManager';
import { QuestDefinition } from '@data/quest-data';
import { TouchControls } from '@ui/controls/TouchControls';

export class QuestJournalScene extends Phaser.Scene {
  private tab: 'active' | 'complete' = 'active';
  private cursor = 0;
  private scrollOffset = 0;
  private readonly maxVisible = 8;
  private questList: QuestDefinition[] = [];
  private listGroup!: Phaser.GameObjects.Group;
  private detailGroup!: Phaser.GameObjects.Group;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private tabUnderlines: Phaser.GameObjects.Rectangle[] = [];
  private emptyText?: Phaser.GameObjects.Text;

  // Layout constants (computed in create)
  private listLeft = 20;
  private listRight = 0;
  private detailLeft = 0;
  private detailRight = 0;
  private readonly listStartY = 90;
  private readonly itemH = 28;

  constructor() {
    super({ key: 'QuestJournalScene' });
  }

  create(): void {
    const layout = ui(this);
    this.listRight = Math.floor(layout.w * 0.4);
    this.detailLeft = Math.floor(layout.w * 0.42);
    this.detailRight = layout.w - 20;

    this.listGroup = this.add.group();
    this.detailGroup = this.add.group();

    // Full-screen dark background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20, {
      fillColor: COLORS.bgPanel, borderColor: COLORS.border, cornerRadius: 8,
    });

    // Title
    this.add.text(layout.cx, 24, 'QUEST JOURNAL', { ...FONTS.heading, fontSize: mobileFontSize(24) }).setOrigin(0.5);
    this.add.rectangle(layout.cx, 42, 200, 2, COLORS.borderHighlight, 0.4);

    // Tabs
    this.buildTabs();

    // Left list panel
    const listW = this.listRight - this.listLeft;
    new NinePatchPanel(this, this.listLeft + listW / 2, layout.cy + 20, listW, layout.h - 130, {
      fillColor: COLORS.bgCard, fillAlpha: 0.7, borderColor: COLORS.border, cornerRadius: 6,
    });

    // Right detail panel
    const detailW = this.detailRight - this.detailLeft;
    new NinePatchPanel(this, this.detailLeft + detailW / 2, layout.cy + 20, detailW, layout.h - 130, {
      fillColor: COLORS.bgCard, fillAlpha: 0.7, borderColor: COLORS.border, cornerRadius: 6,
    });

    // Close hint
    if (isMobile()) {
      const closeBtn = this.add.text(layout.cx, layout.h - 18, '✕  CLOSE', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeBtn.setPadding(16, 8, 16, 8);
      closeBtn.on('pointerdown', () => this.scene.stop());
    } else {
      this.add.text(layout.cx, layout.h - 18, 'ESC to close', FONTS.caption).setOrigin(0.5);
    }

    // Keyboard bindings
    this.input.keyboard!.on('keydown-UP', () => this.moveCursor(-1));
    this.input.keyboard!.on('keydown-DOWN', () => this.moveCursor(1));
    this.input.keyboard!.on('keydown-LEFT', () => this.switchTab('active'));
    this.input.keyboard!.on('keydown-RIGHT', () => this.switchTab('complete'));
    this.input.keyboard!.on('keydown-ESC', () => {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.scene.stop();
    });

    this.refreshList();
  }

  /* ───── Tabs ───── */

  private buildTabs(): void {
    const labels = ['ACTIVE', 'COMPLETE'];
    const tabY = 56;
    const tabSpacing = 120;
    const layout = ui(this);
    const startX = layout.cx - (tabSpacing * (labels.length - 1)) / 2;

    labels.forEach((label, i) => {
      const x = startX + i * tabSpacing;
      const text = this.add.text(x, tabY, label, {
        ...FONTS.bodySmall, fontSize: mobileFontSize(13),
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      text.setPadding(12, 4, 12, 4);
      text.on('pointerdown', () => this.switchTab(i === 0 ? 'active' : 'complete'));
      this.tabTexts.push(text);

      const underline = this.add.rectangle(x, tabY + 12, 80, 2, COLORS.borderHighlight);
      this.tabUnderlines.push(underline);
    });
  }

  private updateTabVisuals(): void {
    const isActive = this.tab === 'active';
    this.tabTexts[0].setColor(isActive ? COLORS.textHighlight : COLORS.textGray);
    this.tabTexts[1].setColor(isActive ? COLORS.textGray : COLORS.textHighlight);
    this.tabUnderlines[0].setVisible(isActive);
    this.tabUnderlines[1].setVisible(!isActive);
  }

  private switchTab(tab: 'active' | 'complete'): void {
    if (this.tab === tab) return;
    this.tab = tab;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.refreshList();
  }

  /* ───── List management ───── */

  private refreshList(): void {
    const qm = QuestManager.getInstance();
    this.questList = this.tab === 'active' ? qm.getActiveQuests() : qm.getCompletedQuests();
    this.cursor = 0;
    this.scrollOffset = 0;
    this.updateTabVisuals();
    this.drawList();
    this.drawDetail();
  }

  private moveCursor(dir: number): void {
    if (this.questList.length === 0) return;
    this.cursor = (this.cursor + dir + this.questList.length) % this.questList.length;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.ensureVisible(this.cursor);
    this.drawList();
    this.drawDetail();
  }

  private ensureVisible(idx: number): void {
    if (idx < this.scrollOffset) {
      this.scrollOffset = idx;
    } else if (idx >= this.scrollOffset + this.maxVisible) {
      this.scrollOffset = idx - this.maxVisible + 1;
    }
  }

  /* ───── Draw quest list (left panel) ───── */

  private drawList(): void {
    const layout = ui(this);
    this.listGroup.clear(true, true);
    if (this.emptyText) { this.emptyText.destroy(); this.emptyText = undefined; }

    if (this.questList.length === 0) {
      const msg = this.tab === 'active' ? 'No active quests' : 'No completed quests';
      this.emptyText = this.add.text(
        (this.listLeft + this.listRight) / 2,
        layout.cy,
        msg,
        { ...FONTS.bodySmall, color: COLORS.textDim },
      ).setOrigin(0.5);
      return;
    }

    const qm = QuestManager.getInstance();
    const endIdx = Math.min(this.scrollOffset + this.maxVisible, this.questList.length);

    for (let vi = this.scrollOffset; vi < endIdx; vi++) {
      const quest = this.questList[vi];
      const y = this.listStartY + (vi - this.scrollOffset) * this.itemH;
      const isSel = vi === this.cursor;

      // Cursor icon
      if (isSel) {
        const arrow = this.add.text(this.listLeft + 12, y, '▸', {
          fontSize: mobileFontSize(14), color: COLORS.textHighlight, fontFamily: 'monospace',
        });
        this.listGroup.add(arrow);
      }

      // Step progress indicator
      const currentStep = qm.getCurrentStep(quest.id);
      const isComplete = qm.getQuestStatus(quest.id) === 'complete';
      const progress = isComplete
        ? `[${quest.steps.length}/${quest.steps.length}]`
        : `[${currentStep}/${quest.steps.length}]`;

      const progressText = this.add.text(this.listLeft + 26, y, progress, {
        fontSize: mobileFontSize(12), color: isComplete ? COLORS.textSuccess : COLORS.textGray, fontFamily: 'monospace',
      });
      this.listGroup.add(progressText);

      // Quest name
      const nameColor = isSel ? COLORS.textHighlight : COLORS.textWhite;
      const nameText = this.add.text(this.listLeft + 76, y, quest.name, {
        fontSize: mobileFontSize(13), color: nameColor, fontFamily: 'monospace',
      }).setInteractive({ useHandCursor: true });
      nameText.on('pointerdown', () => {
        this.cursor = vi;
        this.ensureVisible(vi);
        this.drawList();
        this.drawDetail();
      });
      this.listGroup.add(nameText);
    }

    // Scroll indicators
    if (this.scrollOffset > 0) {
      const up = this.add.text((this.listLeft + this.listRight) / 2, this.listStartY - 14, '▲', {
        ...FONTS.caption, color: COLORS.textHighlight,
      }).setOrigin(0.5);
      this.listGroup.add(up);
    }
    if (endIdx < this.questList.length) {
      const down = this.add.text((this.listLeft + this.listRight) / 2, this.listStartY + this.maxVisible * this.itemH, '▼', {
        ...FONTS.caption, color: COLORS.textHighlight,
      }).setOrigin(0.5);
      this.listGroup.add(down);
    }
  }

  /* ───── Draw quest detail (right panel) ───── */

  private drawDetail(): void {
    this.detailGroup.clear(true, true);

    if (this.questList.length === 0 || this.cursor >= this.questList.length) return;

    const qm = QuestManager.getInstance();
    const quest = this.questList[this.cursor];
    const currentStep = qm.getCurrentStep(quest.id);
    const isComplete = qm.getQuestStatus(quest.id) === 'complete';

    const cx = (this.detailLeft + this.detailRight) / 2;
    const leftPad = this.detailLeft + 16;
    let y = this.listStartY;

    // Quest name
    const nameText = this.add.text(cx, y, quest.name, {
      ...FONTS.body, fontStyle: 'bold', fontSize: mobileFontSize(16),
    }).setOrigin(0.5);
    this.detailGroup.add(nameText);
    y += 24;

    // Status badge
    const statusLabel = isComplete ? 'COMPLETE' : 'IN PROGRESS';
    const statusColor = isComplete ? COLORS.textSuccess : COLORS.textHighlight;
    const statusText = this.add.text(cx, y, statusLabel, {
      ...FONTS.caption, color: statusColor,
    }).setOrigin(0.5);
    this.detailGroup.add(statusText);
    y += 22;

    // Description
    const descText = this.add.text(leftPad, y, quest.description, {
      ...FONTS.bodySmall, fontSize: mobileFontSize(13), color: COLORS.textGray,
      wordWrap: { width: this.detailRight - this.detailLeft - 32 },
    });
    this.detailGroup.add(descText);
    y += descText.height + 16;

    // Divider
    const divider = this.add.rectangle(cx, y, this.detailRight - this.detailLeft - 40, 1, COLORS.border, 0.5);
    this.detailGroup.add(divider);
    y += 12;

    // Steps header
    const stepsHeader = this.add.text(leftPad, y, 'Steps:', {
      ...FONTS.bodySmall, fontStyle: 'bold', color: COLORS.textWhite, fontSize: mobileFontSize(13),
    });
    this.detailGroup.add(stepsHeader);
    y += 20;

    // Step list
    quest.steps.forEach((step, i) => {
      let icon: string;
      let iconColor: string;
      let textColor: string;

      if (i < currentStep || isComplete) {
        icon = '✓';
        iconColor = COLORS.textSuccess;
        textColor = COLORS.textGray;
      } else if (i === currentStep && !isComplete) {
        icon = '▸';
        iconColor = COLORS.textHighlight;
        textColor = COLORS.textHighlight;
      } else {
        icon = '○';
        iconColor = COLORS.textDim;
        textColor = COLORS.textDim;
      }

      const iconText = this.add.text(leftPad, y, icon, {
        fontSize: mobileFontSize(13), color: iconColor, fontFamily: 'monospace',
      });
      this.detailGroup.add(iconText);

      const stepText = this.add.text(leftPad + 20, y, step.description, {
        fontSize: mobileFontSize(12), color: textColor, fontFamily: 'monospace',
        wordWrap: { width: this.detailRight - this.detailLeft - 60 },
      });
      this.detailGroup.add(stepText);
      y += stepText.height + 8;
    });

    // Rewards (show for completed quests)
    if (isComplete && (quest.rewards.length > 0 || quest.rewardMoney > 0)) {
      y += 8;
      const rewardDivider = this.add.rectangle(cx, y, this.detailRight - this.detailLeft - 40, 1, COLORS.border, 0.5);
      this.detailGroup.add(rewardDivider);
      y += 12;

      const rewardHeader = this.add.text(leftPad, y, 'Rewards:', {
        ...FONTS.bodySmall, fontStyle: 'bold', color: COLORS.textWhite, fontSize: mobileFontSize(13),
      });
      this.detailGroup.add(rewardHeader);
      y += 20;

      if (quest.rewardMoney > 0) {
        const moneyText = this.add.text(leftPad + 8, y, `₽ ${quest.rewardMoney}`, {
          fontSize: mobileFontSize(12), color: COLORS.textHighlight, fontFamily: 'monospace',
        });
        this.detailGroup.add(moneyText);
        y += 18;
      }

      quest.rewards.forEach(r => {
        const rewardText = this.add.text(leftPad + 8, y, `${r.itemId} × ${r.quantity}`, {
          fontSize: mobileFontSize(12), color: COLORS.textGray, fontFamily: 'monospace',
        });
        this.detailGroup.add(rewardText);
        y += 18;
      });
    }
  }

  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.scene.stop();
    }
  }
}
