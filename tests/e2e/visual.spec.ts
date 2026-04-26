import { test, expect } from '@playwright/test';
import {
  pressKey,
  bootToTitleMenu,
  startNewGame,
  skipIntro,
  selectStarter,
} from './helpers';

// ---------------------------------------------------------------------------
// Visual Regression Tests — capture golden screenshots at key game states.
//
// Run `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`
// once to generate the initial baselines, then commit the __screenshots__
// directory.  Subsequent runs compare against those baselines.
//
// The config sets maxDiffPixelRatio: 0.02 to tolerate minor animation
// differences (water shimmer, tween offsets, etc.).
// ---------------------------------------------------------------------------

test.describe('Visual: title screen', () => {
  test('title screen matches baseline', async ({ page }) => {
    await page.goto('/');
    // Wait for title scene to stabilise (BGM init, tweens start).
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(3_000);

    await expect(page).toHaveScreenshot('title-press-start.png', {
      fullPage: true,
      // Blinking "PRESS START" text causes expected diffs — be lenient.
      maxDiffPixelRatio: 0.05,
    });
  });

  test('title menu matches baseline', async ({ page }) => {
    await bootToTitleMenu(page);
    // Allow menu reveal animation to settle.
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('title-menu.png', { fullPage: true });
  });
});

test.describe('Visual: new game flow', () => {
  test('difficulty select matches baseline', async ({ page }) => {
    await bootToTitleMenu(page);
    // Select "New Game" to open difficulty overlay.
    await pressKey(page, 'Enter');
    await page.waitForTimeout(800);

    await expect(page).toHaveScreenshot('difficulty-select.png', { fullPage: true });
  });

  test('intro scene matches baseline', async ({ page }) => {
    test.setTimeout(90_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    // First intro slide should be visible now.
    await page.waitForTimeout(1_000);

    await expect(page).toHaveScreenshot('intro-slide-1.png', { fullPage: true });
  });

  test('starter select matches baseline', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    // StarterSelectScene should be showing.
    await page.waitForTimeout(1_000);

    await expect(page).toHaveScreenshot('starter-select.png', { fullPage: true });
  });
});

test.describe('Visual: overworld', () => {
  test('overworld initial view matches baseline', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);
    // Extra settle time for map rendering + NPC spawns.
    await page.waitForTimeout(2_000);

    await expect(page).toHaveScreenshot('overworld-start.png', {
      fullPage: true,
      // Animated tiles (water, grass sway) may cause slight diffs.
      maxDiffPixelRatio: 0.03,
    });
  });

  test('pause menu matches baseline', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);

    // Open menu.
    await pressKey(page, 'Escape');
    await page.waitForTimeout(600);

    await expect(page).toHaveScreenshot('pause-menu.png', { fullPage: true });
  });
});
