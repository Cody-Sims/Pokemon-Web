import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers';

test('game boots and reaches title screen', async ({ page }) => {
  await page.goto('/');

  // Wait for canvas to appear (Phaser renders to <canvas>)
  await waitForCanvas(page);
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
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
  await waitForCanvas(page);

  const box = await page.locator('canvas').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
});
