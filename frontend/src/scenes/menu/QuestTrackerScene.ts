import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize, isMobile } from '@ui/theme';
import { QuestManager } from '@managers/QuestManager';
import { EventManager } from '@managers/EventManager';

/**
 * QuestTrackerScene — Lightweight HUD overlay showing the current active quest step.
 * Launched alongside OverworldScene, sits in the top-right corner.
 * Auto-updates when quest flags change, cross-fading between quests / steps.
 */
export class QuestTrackerScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container;
  private iconText!: Phaser.GameObjects.Text;
  private questNameText!: Phaser.GameObjects.Text;
  private stepText!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Rectangle;
  private accent!: Phaser.GameObjects.Rectangle;
  private visible = true;
  /** Tracks the most recently rendered quest+step so we only fade on change. */
  private lastSignature = '';

  constructor() {
    super({ key: 'QuestTrackerScene' });
  }

  create(): void {
    const layout = ui(this);
    const padX = 24;          // leaves room for the icon
    const padY = 6;
    const width = isMobile() ? 200 : 230;
    const x = layout.w - width - 8;
    const y = 6;

    this.bg = this.add.rectangle(0, 0, width, 48, 0x101820, 0.78).setOrigin(0, 0);
    // Gold accent stripe on the left edge
    this.accent = this.add.rectangle(0, 0, 3, 48, 0xffd060, 1).setOrigin(0, 0);

    this.iconText = this.add.text(6, padY + 1, '★', {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(14),
      color: '#ffd060',
      fontStyle: 'bold',
    });

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
      wordWrap: { width: width - padX - 4 },
    });

    this.container = this.add.container(x, y, [
      this.bg, this.accent, this.iconText, this.questNameText, this.stepText,
    ]);
    this.container.setDepth(100);
    this.container.setAlpha(0);    // hidden until first refresh

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
      this.fadeTo(0);
      this.lastSignature = '';
      return;
    }

    // Show the first active quest
    const quest = activeQuests[0];
    const stepIdx = qm.getCurrentStep(quest.id);

    if (stepIdx >= quest.steps.length) {
      this.fadeTo(0);
      this.lastSignature = '';
      return;
    }

    const step = quest.steps[stepIdx];
    const signature = `${quest.id}#${stepIdx}`;
    if (signature === this.lastSignature) {
      // Same quest+step: just keep existing display visible.
      if (this.visible) this.fadeTo(1);
      return;
    }
    this.lastSignature = signature;

    // Cross-fade: fade out, swap text, fade back in.
    const swap = () => {
      this.questNameText.setText(quest.name);
      this.stepText.setText(`▸ ${step.description}`);
      // Resize background to fit content
      const h = this.stepText.y + this.stepText.height + 8;
      const newH = Math.max(48, h);
      this.bg.setSize(this.bg.width, newH);
      this.accent.setSize(this.accent.width, newH);
      if (this.visible) this.fadeTo(1);
    };

    if (this.container.alpha > 0) {
      this.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 140,
        onComplete: swap,
      });
    } else {
      swap();
    }
  }

  private fadeTo(alpha: number): void {
    this.tweens.killTweensOf(this.container);
    this.tweens.add({
      targets: this.container,
      alpha,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.fadeTo(this.visible ? 1 : 0);
  }
}

