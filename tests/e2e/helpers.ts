import { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared helpers for Pokemon-Web Playwright E2E tests.
// ---------------------------------------------------------------------------

/** Press a key for a given duration (simulate holding it down). */
export async function pressKey(page: Page, key: string, duration = 200): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(50);
}

/** Wait for the Phaser `<canvas>` to appear and be visible. */
export async function waitForCanvas(page: Page, timeout = 15_000): Promise<void> {
  await page.locator('canvas').waitFor({ state: 'visible', timeout });
}

/**
 * Navigate to the app, wait for the canvas, and dismiss the "PRESS START"
 * prompt so the title menu is visible.
 */
export async function bootToTitleMenu(page: Page): Promise<void> {
  await page.goto('/');
  await waitForCanvas(page);
  // Let title scene fully initialise (BGM, tweens, etc.)
  await page.waitForTimeout(2_000);
  // Dismiss "PRESS START"
  await pressKey(page, 'Enter');
  // Small pause for menu reveal animation
  await page.waitForTimeout(500);
}

/**
 * From the title menu, select "New Game" and choose Classic difficulty.
 * Returns once the IntroScene has started.
 */
export async function startNewGame(page: Page): Promise<void> {
  // "New Game" is the first (and only) option when there is no save.
  await pressKey(page, 'Enter');
  await page.waitForTimeout(500);
  // Classic difficulty is pre-selected — confirm it.
  await pressKey(page, 'Enter');
  await page.waitForTimeout(1_000);
}

/**
 * Skip through the IntroScene slides, type a player name, select an
 * appearance, and confirm — arriving at StarterSelectScene.
 *
 * This is intentionally aggressive with Enter presses; extra presses on
 * scenes that are already dismissed are harmless.
 */
export async function skipIntro(page: Page, playerName = 'Ash'): Promise<void> {
  // IntroScene has ~8 text slides; pressing Enter advances each one.
  for (let i = 0; i < 12; i++) {
    await pressKey(page, 'Enter', 100);
    await page.waitForTimeout(300);
  }

  // Naming phase — type the player name and confirm.
  await page.keyboard.type(playerName, { delay: 50 });
  await page.waitForTimeout(200);
  await pressKey(page, 'Enter');
  await page.waitForTimeout(500);

  // Appearance select — just confirm the default.
  await pressKey(page, 'Enter');
  await page.waitForTimeout(500);

  // Final confirmation slide.
  await pressKey(page, 'Enter');
  await page.waitForTimeout(1_000);
}

/**
 * Select the first starter Pokemon (Bulbasaur) and wait for the
 * OverworldScene to load.
 */
export async function selectStarter(page: Page): Promise<void> {
  // StarterSelectScene: first card is already highlighted.
  await pressKey(page, 'Enter');
  await page.waitForTimeout(500);
  // Confirmation prompt — press Enter again.
  await pressKey(page, 'Enter');
  // Wait for overworld to render (map + player sprite loading).
  await page.waitForTimeout(3_000);
}
