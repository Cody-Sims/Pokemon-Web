import { test, expect } from '@playwright/test';
import { pressKey, bootToTitleMenu } from './helpers';

test('can start new game from title screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await bootToTitleMenu(page);
  await pressKey(page, 'Enter'); // Select "New Game"
  await page.waitForTimeout(2000);

  // Verify no crash occurred
  expect(errors).toEqual([]);
});
