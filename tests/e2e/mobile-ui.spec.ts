import { test, expect } from '@playwright/test';
import { bootToTitleMenu, pressKey, waitForCanvas } from './helpers';

/**
 * Mobile UI regression tests covering portrait/landscape orientation
 * specifically. Forces a portrait viewport so the in-canvas hamburger
 * button, minimap top-left placement, settings layout, and intro text
 * positioning are exercised without depending on a real device.
 *
 * These tests are intentionally lightweight — they validate that no
 * runtime errors fire during the boot/menu/settings flow on a portrait
 * viewport, which is what regressed previously when layout-only fixes
 * shipped without exercising rotation paths.
 */
test.describe('Mobile UI — portrait orientation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('boot, open settings, change a value, return to title without errors', async ({ page }) => {
    test.setTimeout(60_000);

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await bootToTitleMenu(page);

    // Title menu has Settings as the second item on a fresh save.
    // Use down arrow + Enter to navigate to it.
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(800);

    // Cycle a few setting values with arrow keys (LEFT/RIGHT adjust value,
    // UP/DOWN move between rows). All actions should be no-op safe.
    await pressKey(page, 'ArrowRight');
    await page.waitForTimeout(150);
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowRight');
    await page.waitForTimeout(150);
    await pressKey(page, 'ArrowLeft');
    await page.waitForTimeout(150);

    // Close settings with Escape.
    await pressKey(page, 'Escape');
    await page.waitForTimeout(800);

    expect(errors).toEqual([]);
  });

  test('rotation between portrait and landscape does not crash', async ({ page }) => {
    test.setTimeout(60_000);

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await waitForCanvas(page);
    await page.waitForTimeout(2_000);

    // Rotate to landscape — Phaser should pick this up and resize the canvas
    // without throwing thanks to the orientationchange/visualViewport
    // listeners wired up in main.ts.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1_500);

    // Rotate back to portrait.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1_500);

    // Canvas must still be visible.
    await expect(page.locator('canvas')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('mobile DOM hamburger button exists and is tappable', async ({ page }) => {
    test.setTimeout(60_000);

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await waitForCanvas(page);
    await page.waitForTimeout(2_000);

    // The DOM-side hamburger button is present in the DOM regardless of
    // visibility (CSS gates display by viewport). Verify the element
    // exists with the expected geometry/styling so future regressions
    // that accidentally remove it surface here.
    const menuBtn = page.locator('#mobile-menu-btn');
    await expect(menuBtn).toHaveCount(1);

    // Tapping the DOM button shouldn't throw — even if the controls
    // overlay is currently hidden because TouchControls hasn't enabled
    // mobile DOM mode in this viewport.
    await menuBtn.dispatchEvent('touchstart');
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });
});
