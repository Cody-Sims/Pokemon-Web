import Phaser from 'phaser';
import { AchievementDef } from '@managers/AchievementManager';
import { ui } from '@utils/ui-layout';
import { isReducedMotion } from '@utils/accessibility';
import { COLORS, FONTS, PANEL_PRESETS, SPACING, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from './NinePatchPanel';

/** Slide-in toast notification for achievement unlocks. */
export class AchievementToast {
  static show(scene: Phaser.Scene, achievement: AchievementDef): void {
    const layout = ui(scene);
    const bannerW = Math.min(340, layout.w - SPACING.lg * 2);
    const bannerH = 64;
    const startY = -bannerH;
    const targetY = SPACING.sm;
    const reducedMotion = isReducedMotion();

    const container = scene.add
      .container(layout.cx, reducedMotion ? targetY : startY)
      .setDepth(200);

    const bg = new NinePatchPanel(scene, 0, bannerH / 2, bannerW, bannerH, {
      ...PANEL_PRESETS.menu,
      fillColor: 0x2a2414,
      borderColor: COLORS.borderHighlight,
      shadowAlpha: 0.45,
    });
    container.add(bg.getGraphics());

    // Trophy + header
    const header = scene.add
      .text(0, 10, '🏆 Achievement Unlocked!', {
        ...FONTS.caption,
        fontSize: mobileFontSize(11),
        color: COLORS.textHighlight,
      })
      .setOrigin(0.5);
    container.add(header);

    // Achievement name with icon
    const icon = achievement.icon ?? '🏆';
    const nameText = scene.add
      .text(0, 34, `${icon} ${achievement.name}`, {
        ...FONTS.body,
        fontSize: mobileFontSize(14),
        color: COLORS.textWhite,
        wordWrap: { width: bannerW - SPACING.lg * 2 },
        align: 'center',
        maxLines: 1,
      })
      .setOrigin(0.5);
    container.add(nameText);

    const dismiss = () => {
      if (reducedMotion) {
        container.destroy();
        return;
      }
      scene.tweens.add({
        targets: container,
        y: startY,
        duration: 260,
        ease: 'Cubic.easeIn',
        onComplete: () => container.destroy(),
      });
    };

    if (reducedMotion) {
      scene.time.delayedCall(3000, dismiss);
      return;
    }

    scene.tweens.add({
      targets: container,
      y: targetY,
      duration: 360,
      ease: 'Back.easeOut',
      onComplete: () => scene.time.delayedCall(3000, dismiss),
    });
  }
}
