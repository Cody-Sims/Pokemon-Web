import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';
import { QuestManager } from '@managers/QuestManager';
import { EventManager } from '@managers/EventManager';

/**
 * QuestTrackerScene — Lightweight HUD overlay showing the current active quest step.
 * Launched alongside OverworldScene, sits in the top-right corner.
 * Auto-updates when quest flags change.
 */
export class QuestTrackerScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container;
  private questNameText!: Phaser.GameObjects.Text;
  private stepText!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Rectangle;
  private visible = true;

  constructor() {
    super({ key: 'QuestTrackerScene' });
  }

  create(): void {
    const layout = ui(this);
    const padX = 8;
    const padY = 6;
    const width = isMobile() ? 180 : 210;
    const x = layout.w - width - 8;
    const y = 6;

    this.bg = this.add.rectangle(0, 0, width, 48, 0x000000, 0.55).setOrigin(0, 0);

    this.questNameText = this.add.text(padX, padY, '', {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(11),
      color: COLORS.textHighlight,
      fontStyle: 'bold',
    });

    this.stepText = this.add.text(padX, padY + 16, '', {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(10),
      color: COLORS.textWhite,
      wordWrap: { width: width - padX * 2 },
    });

    this.container = this.add.container(x, y, [this.bg, this.questNameText, this.stepText]);
    this.container.setDepth(100);

    // Listen for quest updates
    const em = EventManager.getInstance();
    const updateHandler = () => this.refresh();
    em.on('flag-set', updateHandler);
    em.on('quest-completed', updateHandler);

    // Clean up listeners when scene is stopped
    this.events.once('shutdown', () => {
      em.off('flag-set', updateHandler);
      em.off('quest-completed', updateHandler);
    });

    this.refresh();
  }

  refresh(): void {
    const qm = QuestManager.getInstance();
    const activeQuests = qm.getActiveQuests();

    if (activeQuests.length === 0) {
      this.container.setVisible(false);
      return;
    }

    // Show the first active quest
    const quest = activeQuests[0];
    const stepIdx = qm.getCurrentStep(quest.id);

    if (stepIdx >= quest.steps.length) {
      this.container.setVisible(false);
      return;
    }

    const step = quest.steps[stepIdx];
    this.questNameText.setText(quest.name);
    this.stepText.setText(`▸ ${step.description}`);

    // Resize background to fit content
    const h = this.stepText.y + this.stepText.height + 8;
    this.bg.setSize(this.bg.width, Math.max(48, h));

    this.container.setVisible(this.visible);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
  }
}
