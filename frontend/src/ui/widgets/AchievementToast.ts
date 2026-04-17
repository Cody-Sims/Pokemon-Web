import Phaser from 'phaser';
import { AchievementDef } from '@managers/AchievementManager';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS } from '@ui/theme';

/** Slide-in toast notification for achievement unlocks. */
export class AchievementToast {
  static show(scene: Phaser.Scene, achievement: AchievementDef): void {
    const layout = ui(scene);
    const bannerW = 320;
    const bannerH = 54;
    const startY = -bannerH;
    const targetY = 10;

    const container = scene.add.container(layout.cx, startY).setDepth(200);

    // Gold/dark background
    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2a1a, 0.95);
    bg.fillRoundedRect(-bannerW / 2, 0, bannerW, bannerH, 8);
    bg.lineStyle(2, 0xffcc00, 1);
    bg.strokeRoundedRect(-bannerW / 2, 0, bannerW, bannerH, 8);
    container.add(bg);

    // Trophy + header
    const header = scene.add.text(0, 8, '🏆 Achievement Unlocked!', {
      ...FONTS.caption, fontSize: '11px', color: COLORS.textHighlight,
    }).setOrigin(0.5);
    container.add(header);

    // Achievement name with icon
    const icon = achievement.icon ?? '🏆';
    const nameText = scene.add.text(0, 30, `${icon} ${achievement.name}`, {
      ...FONTS.body, fontSize: '15px', color: COLORS.textWhite,
    }).setOrigin(0.5);
    container.add(nameText);

    // Slide down
    scene.tweens.add({
      targets: container,
      y: targetY,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Wait 3s then slide back up and destroy
        scene.time.delayedCall(3000, () => {
          scene.tweens.add({
            targets: container,
            y: startY,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => container.destroy(),
          });
        });
      },
    });
  }
}
