import { test, expect } from '@playwright/test';
import { pressKey, bootToTitleMenu, startNewGame, skipIntro, selectStarter } from './helpers';

test('menu can be opened and closed', async ({ page }) => {
  test.setTimeout(120_000);

  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await bootToTitleMenu(page);
  await startNewGame(page);
  await skipIntro(page);
  await selectStarter(page);

  // Try opening menu with Escape
  await pressKey(page, 'Escape');
  await page.waitForTimeout(500);

  // Close menu
  await pressKey(page, 'Escape');
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});
