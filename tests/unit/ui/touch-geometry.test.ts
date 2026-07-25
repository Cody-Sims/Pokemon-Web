import { describe, expect, it } from 'vitest';
import {
  clampJoystickVector,
  computeTouchControlLayout,
  resolveJoystickDirection,
} from '@ui/controls/touch-geometry';

describe('touch control geometry', () => {
  it('clamps joystick thumb travel while preserving the original distance', () => {
    const vector = clampJoystickVector(90, 0, 60);

    expect(vector.x).toBeCloseTo(60);
    expect(vector.y).toBeCloseTo(0);
    expect(vector.distance).toBeCloseTo(90);
  });

  it('uses the dead zone to suppress drift near the joystick origin', () => {
    expect(resolveJoystickDirection(8, 7, { deadZone: 12 })).toBeNull();
    expect(resolveJoystickDirection(28, 4, { deadZone: 12 })).toBe('right');
  });

  it('holds the previous cardinal direction during near-diagonal input', () => {
    expect(resolveJoystickDirection(30, -31, { deadZone: 12, previousDirection: 'right' })).toBe(
      'right',
    );
    expect(resolveJoystickDirection(30, -31, { deadZone: 12, previousDirection: 'up' })).toBe('up');
    expect(resolveJoystickDirection(30, -31, { deadZone: 12 })).toBe('up');
  });

  it('keeps landscape controls reachable and clear of the bottom HUD/dialogue area', () => {
    const layout = computeTouchControlLayout({
      width: 844,
      height: 390,
      insets: { top: 0, right: 16, bottom: 12, left: 24 },
      minTouchTarget: 48,
      mobileScale: 1.35,
    });

    expect(layout.metrics.actionButtonSize).toBeGreaterThanOrEqual(48);
    expect(layout.buttonContainerX).toBeLessThan(844 - 16);
    expect(
      layout.buttonContainerY + layout.cancelOffsetY + layout.metrics.actionButtonSize / 2,
    ).toBeLessThanOrEqual(390 - 12);
    expect(layout.menuX).toBeLessThan(layout.buttonContainerX);
    expect(layout.menuY).toBeGreaterThanOrEqual(layout.metrics.menuButtonSize / 2);
  });

  it('supports a left-handed action cluster without changing safe target sizes', () => {
    const right = computeTouchControlLayout({
      width: 844,
      height: 390,
      insets: { top: 0, right: 16, bottom: 0, left: 24 },
      minTouchTarget: 48,
      mobileScale: 1.35,
    });
    const left = computeTouchControlLayout({
      width: 844,
      height: 390,
      insets: { top: 0, right: 16, bottom: 0, left: 24 },
      minTouchTarget: 48,
      mobileScale: 1.35,
      oneHandedMode: 'left',
    });

    expect(left.buttonContainerX).toBeLessThan(right.buttonContainerX);
    expect(left.menuX).toBeLessThan(right.menuX);
    expect(left.metrics.actionButtonSize).toBe(right.metrics.actionButtonSize);
  });
});
