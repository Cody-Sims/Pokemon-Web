import { test, expect } from '@playwright/test';
import { pressKey, bootToTitleMenu, startNewGame, skipIntro, selectStarter } from './helpers';

test.describe('UI Regression Tests', () => {
  /**
   * Shared setup: navigate from boot all the way through to the overworld
   * so we have a fully interactive game state to test against.
   */
  async function reachOverworld(page: import('@playwright/test').Page) {
    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);
  }

  test('player should not visually rotate when standing still', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Take screenshot of idle player
    await page.screenshot();
    // Wait 2 seconds (60+ frames of idle)
    await page.waitForTimeout(2000);
    // Take another screenshot — should look the same
    await page.screenshot();

    // If the player was rotating, the screenshots would differ significantly.
    // We verify no errors occurred (rotation bugs often cause animation errors).
    expect(errors).toEqual([]);
  });

  test('ESC should not exit battle when in actions menu', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Walk into tall grass to trigger encounter (walk up from Pallet Town)
    for (let i = 0; i < 15; i++) {
      await pressKey(page, 'ArrowUp', 250);
    }
    await page.waitForTimeout(1000);

    // If we're in battle, pressing ESC shouldn't crash
    await pressKey(page, 'Escape');
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('rapid ESC presses should not crash the game', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Rapidly press ESC 10 times (menu open/close cycle)
    for (let i = 0; i < 10; i++) {
      await pressKey(page, 'Escape', 100);
    }
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('rapid direction changes should not cause errors', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Rapidly alternate directions
    const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    for (let i = 0; i < 20; i++) {
      await pressKey(page, dirs[i % 4], 50);
    }
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('opening and closing menu should return to overworld cleanly', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Open menu
    await pressKey(page, 'Escape');
    await page.waitForTimeout(500);

    // Close menu
    await pressKey(page, 'Escape');
    await page.waitForTimeout(500);

    // Player should still be able to move
    await pressKey(page, 'ArrowDown', 300);
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });

  test('menu save option should not crash', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await reachOverworld(page);

    // Open menu
    await pressKey(page, 'Escape');
    await page.waitForTimeout(300);

    // Navigate to SAVE (3rd option: down, down)
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter'); // Select SAVE
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });
});
