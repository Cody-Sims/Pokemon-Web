import { describe, expect, it } from 'vitest';
import { measureNameplate } from '@ui/theme';
import { resolveDialogueBoxHeight } from '@ui/widgets/TextBox';

describe('UI widget layout helpers', () => {
  it("keeps the Father's Letter speaker nameplate on one line inside a phone-width cap", () => {
    const layout = measureNameplate("Father's Letter", {
      maxWidth: 140,
      baseFontPx: 18,
      minFontPx: 10,
      minWidth: 92,
    });

    expect(layout.width).toBeLessThanOrEqual(140);
    expect(layout.label).not.toContain('\n');
    expect(layout.height).toBeGreaterThanOrEqual(
      Math.ceil(layout.fontPx * 1.18) + layout.paddingY * 2,
    );
  });

  it('ellipsizes very long speaker labels instead of permitting wraps', () => {
    const layout = measureNameplate('An Extremely Long Archival Letter Title', {
      maxWidth: 128,
      baseFontPx: 18,
      minFontPx: 11,
    });

    expect(layout.width).toBeLessThanOrEqual(128);
    expect(layout.label.endsWith('…')).toBe(true);
  });

  it('caps dialogue boxes to a proportionate height on short mobile screens', () => {
    expect(resolveDialogueBoxHeight(150, 390, true)).toBeLessThanOrEqual(110);
    expect(resolveDialogueBoxHeight(150, 390, false)).toBe(150);
  });
});
