import { test, expect } from '@playwright/test';
import {
  pressKey,
  bootToTitleMenu,
  bootSavedGameToOverworld,
  startNewGame,
  waitForCanvas,
  waitForRotateGate,
  waitForScene,
  getPlayerState,
  getPlaytestSnapshot,
  installCleanStorage,
} from './helpers';

// ---------------------------------------------------------------------------
// Rendering state checks.
//
// These used to be pixel-baseline visual regressions. The repository ignores
// Playwright snapshot directories, so CI never has Linux baselines to compare
// against. Until baselines are un-ignored and committed from Linux, keep this
// suite deterministic by asserting rendered canvas/state invariants instead.
// ---------------------------------------------------------------------------

async function expectRenderedScene(page: import('@playwright/test').Page, sceneName: string): Promise<void> {
  await waitForScene(page, sceneName);
  await expect(page.locator('canvas')).toBeVisible();
  await waitForRotateGate(page, 'hidden');
  const snapshot = await getPlaytestSnapshot(page);
  expect(snapshot.activeScenes).toContain(sceneName);
  expect(snapshot.canvas.width).toBeGreaterThan(0);
  expect(snapshot.canvas.height).toBeGreaterThan(0);
}

test.describe('Render state: title screen', () => {
  test('title screen boots to a visible Phaser canvas', async ({ page }) => {
    await installCleanStorage(page);
    await page.goto('/');
    await waitForCanvas(page);
    await expectRenderedScene(page, 'TitleScene');
  });

  test('title menu remains on the title scene after press-start', async ({ page }) => {
    await bootToTitleMenu(page);
    await expectRenderedScene(page, 'TitleScene');
  });
});

test.describe('Render state: new game flow', () => {
  test('difficulty select keeps the title scene active until confirmed', async ({ page }) => {
    await bootToTitleMenu(page);
    await pressKey(page, 'Enter', 75);
    await expectRenderedScene(page, 'TitleScene');

    const snapshot = await getPlaytestSnapshot(page);
    expect(snapshot.activeScenes).not.toContain('IntroScene');
  });

  test('intro scene starts after difficulty and challenge confirmation', async ({ page }) => {
    test.setTimeout(90_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await expectRenderedScene(page, 'IntroScene');
  });

});

test.describe('Render state: overworld', () => {
  test('overworld initial view reaches the starting map', async ({ page }) => {
    test.setTimeout(120_000);

    await bootSavedGameToOverworld(page);
    await expectRenderedScene(page, 'OverworldScene');

    const state = await getPlayerState(page);
    expect(state.currentMap).toBe('pallet-town');
    expect(state.playerPosition.x).toBeGreaterThanOrEqual(0);
    expect(state.playerPosition.y).toBeGreaterThanOrEqual(0);
  });

  test('pause menu opens as an active scene over the overworld', async ({ page }) => {
    test.setTimeout(120_000);

    await bootSavedGameToOverworld(page);

    await pressKey(page, 'Escape', 75);
    await expectRenderedScene(page, 'MenuScene');

    const snapshot = await getPlaytestSnapshot(page);
    expect(snapshot.loadedScenes).toContain('OverworldScene');
  });
});
