import { describe, expect, it } from 'vitest';
import { COLORS, hpColor } from '@ui/theme';

describe('hpColor', () => {
  it.each([
    { pct: 1, expected: COLORS.hpGreen },
    { pct: 0.5001, expected: COLORS.hpGreen },
    { pct: 0.5, expected: COLORS.hpYellow },
    { pct: 0.2001, expected: COLORS.hpYellow },
    { pct: 0.2, expected: COLORS.hpRed },
    { pct: 0, expected: COLORS.hpRed },
  ])('returns the expected semantic color at $pct HP ratio', ({ pct, expected }) => {
    expect(hpColor(pct)).toBe(expected);
  });
});
