import { describe, expect, it } from 'vitest';
import { computeOverworldHudLayout } from '@scenes/overworld/overworld-hud-layout';

type Rect = { left: number; top: number; right: number; bottom: number };

const noInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function centeredRect(x: number, y: number, width: number, height: number): Rect {
  return { left: x - width / 2, top: y - height / 2, right: x + width / 2, bottom: y + height / 2 };
}

function topLeftRect(x: number, y: number, width: number, height: number): Rect {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

describe('computeOverworldHudLayout', () => {
  it('separates the landscape phone map label, talk hint, party strip, minimap, and quest areas', () => {
    const layout = computeOverworldHudLayout({
      width: 1298,
      height: 600,
      safeArea: noInsets,
      hasTouchControls: true,
      hasSpeedrunTimer: false,
      partyWidth: 176,
      partyHeight: 32,
      questWidth: 200,
      questHeight: 48,
      minimapSize: 68,
      touchPanelWidth: 118,
    });

    const touchLeft = 118;
    const touchRight = 1298 - 118;
    const mapName = topLeftRect(layout.mapName.x - 70, layout.mapName.y, 140, 18);
    const hint = topLeftRect(layout.interactionHint.x - 55, layout.interactionHint.y, 110, 16);
    const party = centeredRect(layout.partyQuickView.x, layout.partyQuickView.y, 176, 32);
    const minimap = topLeftRect(layout.minimap.x, layout.minimap.y, 68, 68);
    const quest = topLeftRect(layout.questTracker.x, layout.questTracker.y, 200, 48);

    expect(overlaps(mapName, hint)).toBe(false);
    expect(overlaps(hint, party)).toBe(false);
    expect(overlaps(party, minimap)).toBe(false);
    expect(overlaps(party, quest)).toBe(false);
    expect(minimap.left).toBeGreaterThanOrEqual(touchLeft);
    expect(quest.right).toBeLessThanOrEqual(touchRight);
    expect(layout.clock.x).toBeGreaterThanOrEqual(touchLeft);
  });

  it.each([
    { name: 'portrait phone', width: 600, height: 1298, touch: true, panel: 116 },
    { name: 'tablet', width: 1024, height: 768, touch: true, panel: 124 },
    { name: 'desktop', width: 1280, height: 720, touch: false, panel: 0 },
  ])('keeps HUD rectangles disjoint at $name size', ({ width, height, touch, panel }) => {
    const layout = computeOverworldHudLayout({
      width,
      height,
      safeArea: noInsets,
      hasTouchControls: touch,
      hasSpeedrunTimer: false,
      partyWidth: touch ? 176 : 144,
      partyHeight: touch ? 32 : 28,
      questWidth: touch ? 200 : 230,
      questHeight: 48,
      minimapSize: touch ? 68 : 83,
      touchPanelWidth: panel,
    });

    const rects = [
      topLeftRect(layout.mapName.x - 80, layout.mapName.y, 160, 18),
      topLeftRect(layout.interactionHint.x - 95, layout.interactionHint.y, 190, 16),
      centeredRect(
        layout.partyQuickView.x,
        layout.partyQuickView.y,
        touch ? 176 : 144,
        touch ? 32 : 28,
      ),
      topLeftRect(layout.minimap.x, layout.minimap.y, touch ? 68 : 83, touch ? 68 : 83),
      topLeftRect(layout.questTracker.x, layout.questTracker.y, touch ? 200 : 230, 48),
    ];

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(overlaps(rects[i], rects[j])).toBe(false);
      }
    }
  });

  it('honors safe-area insets when anchoring edge HUD elements', () => {
    const layout = computeOverworldHudLayout({
      width: 1298,
      height: 600,
      safeArea: { top: 20, right: 34, bottom: 10, left: 28 },
      hasTouchControls: true,
      hasSpeedrunTimer: true,
      partyWidth: 176,
      partyHeight: 32,
      questWidth: 200,
      questHeight: 48,
      minimapSize: 68,
      touchPanelWidth: 118,
    });

    expect(layout.clock.x).toBeGreaterThanOrEqual(28 + 118);
    expect(layout.clock.y).toBeGreaterThanOrEqual(20);
    expect(layout.minimap.x).toBeGreaterThanOrEqual(28 + 118);
    expect(layout.questTracker.x + 200).toBeLessThanOrEqual(1298 - 34 - 118);
  });
});
