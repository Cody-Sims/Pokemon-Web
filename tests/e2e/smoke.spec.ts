import { test, expect } from '@playwright/test';
import {
  pressKey,
  waitForCanvas,
  bootToTitleMenu,
  startNewGame,
  skipIntro,
  selectStarter,
} from './helpers';

// ---------------------------------------------------------------------------
// E2E Smoke Tests — verify the critical happy-path through the game:
//   boot → title → starter select → overworld → battle
// ---------------------------------------------------------------------------

test.describe('Smoke: boot & title', () => {
  test('game boots and renders a canvas', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('no console errors during boot', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await waitForCanvas(page);
    // Allow a few seconds for asset loading to finish.
    await page.waitForTimeout(4_000);

    expect(errors).toEqual([]);
  });

  test('title menu appears after pressing Enter', async ({ page }) => {
    await bootToTitleMenu(page);

    // The canvas should still be visible (no blank screen).
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Smoke: new game flow', () => {
  test('can start a new game and reach the intro', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bootToTitleMenu(page);
    await startNewGame(page);

    // IntroScene should now be running — no crash.
    expect(errors).toEqual([]);
  });

  test('can navigate through intro to starter select', async ({ page }) => {
    test.setTimeout(90_000); // Intro has many slides.

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);

    // We should now be on StarterSelectScene — no crash.
    expect(errors).toEqual([]);
  });

  test('can select a starter and reach the overworld', async ({ page }) => {
    test.setTimeout(120_000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);

    // Overworld should now be running.
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Smoke: overworld & battle', () => {
  test('can walk in the overworld without errors', async ({ page }) => {
    test.setTimeout(120_000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);

    // Walk around — four directions.
    const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    for (const dir of dirs) {
      for (let i = 0; i < 3; i++) {
        await pressKey(page, dir, 250);
      }
    }
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('walking into grass can trigger a battle without crashing', async ({ page }) => {
    test.setTimeout(120_000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);

    // Walk north repeatedly — Pallet Town has tall grass above the
    // starting position.  Encounters are random so we just walk a lot
    // and verify no crash regardless of whether a battle starts.
    for (let i = 0; i < 30; i++) {
      await pressKey(page, 'ArrowUp', 200);
    }
    await page.waitForTimeout(2_000);

    // If we entered a battle the canvas is still there; if not, we're
    // still in the overworld.  Either way, no errors.
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    expect(errors).toEqual([]);
  });
});
