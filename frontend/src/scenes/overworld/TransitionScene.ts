import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TransitionScene' });
  }

  init(data: {
    targetScene: string;
    returnScene?: string;
    duration?: number;
    targetData?: Record<string, unknown>;
    returnData?: Record<string, unknown>;
    style?: 'fade' | 'stripes' | 'circles';
  }): void {
    const duration = data.duration ?? 600;
    const style = data.style ?? 'stripes';

    if (style === 'stripes') {
      this.playStripeTransition(duration, data);
    } else if (style === 'circles') {
      this.playCircleTransition(duration, data);
    } else {
      this.playFadeTransition(duration, data);
    }
  }

  private playFadeTransition(
    duration: number,
    data: { targetScene: string; returnScene?: string; targetData?: Record<string, unknown>; returnData?: Record<string, unknown> },
  ): void {
    const layout = ui(this);
    const cover = this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, 0x000000);
    cover.setAlpha(0);

    this.tweens.add({
      targets: cover,
      alpha: 1,
      duration: duration / 2,
      onComplete: () => this.launchTarget(data),
    });
  }

  private playStripeTransition(
    duration: number,
    data: { targetScene: string; returnScene?: string; targetData?: Record<string, unknown>; returnData?: Record<string, unknown> },
  ): void {
    const layout = ui(this);
    const stripeCount = 12;
    const stripeH = Math.ceil(layout.h / stripeCount);

    for (let i = 0; i < stripeCount; i++) {
      const fromLeft = i % 2 === 0;
      const stripe = this.add.rectangle(
        fromLeft ? -layout.w / 2 : layout.w + layout.w / 2,
        stripeH * i + stripeH / 2,
        layout.w,
        stripeH + 2,
        0x000000,
      );

      this.tweens.add({
        targets: stripe,
        x: layout.cx,
        duration: duration * 0.6,
        delay: i * (duration * 0.03),
        ease: 'Power2',
      });
    }

    this.time.delayedCall(duration, () => this.launchTarget(data));
  }

  private playCircleTransition(
    duration: number,
    data: { targetScene: string; returnScene?: string; targetData?: Record<string, unknown>; returnData?: Record<string, unknown> },
  ): void {
    const layout = ui(this);
    const gfx = this.add.graphics();
    const maxRadius = Math.sqrt(layout.w * layout.w + layout.h * layout.h) / 2;

    this.tweens.addCounter({
      from: 0,
      to: maxRadius,
      duration: duration * 0.7,
      ease: 'Power2',
      onUpdate: (tween) => {
        gfx.clear();
        gfx.fillStyle(0x000000, 1);
        gfx.fillCircle(layout.cx, layout.cy, tween.getValue() ?? 0);
      },
      onComplete: () => this.launchTarget(data),
    });
  }

  private launchTarget(data: {
    targetScene: string;
    returnScene?: string;
    targetData?: Record<string, unknown>;
    returnData?: Record<string, unknown>;
  }): void {
    this.scene.start(data.targetScene, {
      ...data.targetData,
      _returnScene: data.returnScene,
      _returnData: data.returnData,
    });
  }
}
