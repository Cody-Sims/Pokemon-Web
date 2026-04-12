import { test, expect, Page } from '@playwright/test';

async function pressKey(page: Page, key: string, duration = 200) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(50);
}

test('can start new game from title screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(3000); // Wait for title

  await pressKey(page, 'Enter'); // Select "New Game"
  await page.waitForTimeout(2000);

  // Verify no crash occurred
  expect(errors).toEqual([]);

  // Screenshot to verify we progressed past title
  await page.screenshot({ path: 'tests/e2e/screenshots/new-game.png' });
});
