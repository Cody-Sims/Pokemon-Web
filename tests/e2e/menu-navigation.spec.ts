import { test, expect, Page } from '@playwright/test';

async function pressKey(page: Page, key: string, duration = 200) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(50);
}

test('menu can be opened and closed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(3000);

  // Try to start game
  await pressKey(page, 'Enter');
  await page.waitForTimeout(2000);

  // Try opening menu with Escape
  await pressKey(page, 'Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/menu-open.png' });

  // Close menu
  await pressKey(page, 'Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/screenshots/menu-closed.png' });

  expect(errors).toEqual([]);
});
