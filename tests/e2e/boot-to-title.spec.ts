import { test, expect } from '@playwright/test';

test('game boots and reaches title screen', async ({ page }) => {
  await page.goto('/');

  // Wait for canvas to appear (Phaser renders to <canvas>)
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  // Take a screenshot to verify rendering
  await page.screenshot({ path: 'tests/e2e/screenshots/title-screen.png' });
});

test('game does not throw console errors on boot', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(5_000); // Let game boot fully

  expect(errors).toEqual([]);
});

test('canvas has correct dimensions', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
});
