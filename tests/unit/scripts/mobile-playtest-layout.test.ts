import { describe, expect, it } from 'vitest';
import { analyzeMobileLayout } from '../../../scripts/playtest/discover.mjs';

describe('mobile visual layout oracle', () => {
  const validLayout = {
    viewport: { width: 390, height: 844 },
    documentSize: { width: 390, height: 844 },
    boxes: {
      controls: { x: 0, y: 590, width: 390, height: 254 },
      joystick: { x: 16, y: 598, width: 150, height: 230 },
      buttonA: { x: 190, y: 612, width: 72, height: 72 },
      buttonB: { x: 190, y: 700, width: 72, height: 72 },
      menu: { x: 300, y: 680, width: 56, height: 56 },
    },
  };

  it('accepts reachable, non-overlapping portrait controls', () => {
    expect(analyzeMobileLayout(validLayout)).toEqual([]);
  });

  it('reports clipped, undersized, overlapping, and missing controls', () => {
    const messages = analyzeMobileLayout({
      ...validLayout,
      documentSize: { width: 410, height: 844 },
      boxes: {
        ...validLayout.boxes,
        joystick: { x: 16, y: 598, width: 220, height: 230 },
        buttonA: { x: 220, y: 612, width: 32, height: 32 },
        buttonB: null,
        menu: { x: 370, y: 680, width: 56, height: 56 },
      },
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('overflows'),
        expect.stringContaining('#btn-a is smaller'),
        expect.stringContaining('#btn-b is not visible'),
        expect.stringContaining('#mobile-menu-btn extends outside'),
        expect.stringContaining('#joystick-zone and #btn-a overlap'),
      ]),
    );
  });
});
