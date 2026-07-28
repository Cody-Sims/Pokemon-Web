import { test, expect, Page, TestInfo } from '@playwright/test';
import {
  bootSavedGameToOverworld,
  dismissRotateGate,
  getPlayerState,
  getPlaytestSnapshot,
  tapCanvasFraction,
  waitForRotateGate,
  waitForSceneInactive,
  waitForScene,
} from './helpers';

const LANDSCAPE_PROJECT = 'mobile-chromium';
const PORTRAIT_PROJECT = 'mobile-portrait-chromium';

type Point = { x: number; y: number };
type Direction = 'down' | 'right';

function skipUnlessProject(testInfo: TestInfo, projectName: string): void {
  test.skip(testInfo.project.name !== projectName, `Runs only in ${projectName}`);
}

function isIgnorableConsoleError(text: string): boolean {
  return text.includes('Framebuffer status: Framebuffer Unsupported');
}

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnorableConsoleError(msg.text())) {
      errors.push(`console.error: ${msg.text()}`);
    }
  });
  return errors;
}

async function reachMobileOverworld(page: Page): Promise<void> {
  await bootSavedGameToOverworld(page);
  await dismissRotateGate(page);
  await expect(page.locator('#mobile-controls')).toBeVisible({ timeout: 10_000 });
}

async function expectMobilePauseMenuLayout(page: Page): Promise<void> {
  const snapshot = await getPlaytestSnapshot(page);
  expect(snapshot.visibleScenes).toContain('MenuScene');
  expect(snapshot.visibleScenes).not.toEqual(
    expect.arrayContaining(['QuestTrackerScene', 'PartyQuickViewScene', 'MinimapScene']),
  );

  const menuText = snapshot.sceneText.MenuScene ?? [];
  expect(menuText.filter(text => text === 'RESUME')).toHaveLength(1);

  const canvasBox = await page.locator('canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const renderedScaleY = canvasBox!.height / snapshot.canvas.height;
  const menuTargets = snapshot.interactiveObjects.filter(
    object => object.scene === 'MenuScene' && object.visible,
  );
  expect(menuTargets.length).toBeGreaterThanOrEqual(4);
  for (const target of menuTargets) {
    expect.soft(
      target.width * (canvasBox!.width / snapshot.canvas.width),
      `${target.type} should remain at least 180 CSS px wide`,
    ).toBeGreaterThanOrEqual(180);
    expect.soft(
      target.height * renderedScaleY,
      `${target.type} should remain at least 44 CSS px tall`,
    ).toBeGreaterThanOrEqual(44);
  }

  const label = snapshot.textObjects
    .find(object => object.scene === 'MenuScene' && object.text === 'POKEDEX');
  expect(label, 'POKEDEX label metrics should be available').toBeDefined();
  expect(label!.fontSize * renderedScaleY).toBeGreaterThanOrEqual(14);

  const scrollStatus = snapshot.textObjects
    .find(object => object.scene === 'MenuScene' && object.visible && object.text.includes(' / '));
  const resumeLabel = snapshot.textObjects
    .find(object => object.scene === 'MenuScene' && object.visible && object.text === 'RESUME');
  expect(resumeLabel, 'RESUME label metrics should be available').toBeDefined();
  if (scrollStatus) {
    expect(scrollStatus.y + scrollStatus.height / 2)
      .toBeLessThanOrEqual(resumeLabel!.y - resumeLabel!.height / 2 - 4);
  }
}

async function visibleBox(page: Page, selector: string) {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible({ timeout: 10_000 });
  const box = await locator.boundingBox();
  expect(box, `${selector} should have a layout box`).not.toBeNull();
  return box!;
}

function expectBoxInsideViewport(
  label: string,
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): void {
  expect.soft(box.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect.soft(box.height, `${label} height`).toBeGreaterThanOrEqual(44);
  expect.soft(box.x, `${label} left safe area`).toBeGreaterThanOrEqual(0);
  expect.soft(box.y, `${label} top safe area`).toBeGreaterThanOrEqual(0);
  expect.soft(box.x + box.width, `${label} right safe area`).toBeLessThanOrEqual(viewport.width);
  expect.soft(box.y + box.height, `${label} bottom safe area`).toBeLessThanOrEqual(viewport.height);
}

function boxesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function dragTarget(
  zone: { x: number; y: number; width: number; height: number },
  direction: Direction,
): {
  from: Point;
  to: Point;
} {
  const from = {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2,
  };
  if (direction === 'down') {
    return {
      from,
      to: { x: from.x, y: Math.min(zone.y + zone.height - 24, from.y + 72) },
    };
  }
  return {
    from,
    to: { x: Math.min(zone.x + zone.width - 24, from.x + 72), y: from.y },
  };
}

async function dragJoystickUntilPlayerMoves(page: Page, direction: Direction): Promise<void> {
  const start = await getPlayerState(page);
  const zone = await visibleBox(page, '#joystick-zone');
  const { from, to } = dragTarget(zone, direction);
  const client = await page.context().newCDPSession(page);

  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, id: 1, radiusX: 4, radiusY: 4 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: to.x, y: to.y, id: 1, radiusX: 4, radiusY: 4 }],
    });
    await expect
      .poll(
        async () => {
          const current = await getPlayerState(page);
          return (
            current.playerPosition.x !== start.playerPosition.x ||
            current.playerPosition.y !== start.playerPosition.y
          );
        },
        { timeout: 6_000 },
      )
      .toBe(true);
  } finally {
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  }

  await expect(page.locator('#joystick-base')).toBeHidden({ timeout: 2_000 });
}

test.describe('Mobile UI — landscape gameplay', () => {
  test('touch controls are visible, reachable, and inside the safe viewport', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, LANDSCAPE_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await reachMobileOverworld(page);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport!.width).toBeGreaterThan(viewport!.height);
    await waitForRotateGate(page, 'hidden');

    expectBoxInsideViewport('joystick zone', await visibleBox(page, '#joystick-zone'), viewport!);
    expectBoxInsideViewport('A button', await visibleBox(page, '#btn-a'), viewport!);
    expectBoxInsideViewport('B button', await visibleBox(page, '#btn-b'), viewport!);
    expectBoxInsideViewport('menu button', await visibleBox(page, '#mobile-menu-btn'), viewport!);
    expect(errors).toEqual([]);
  });

  test('dragging the touch joystick moves the player and releases cleanly', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, LANDSCAPE_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await reachMobileOverworld(page);
    const start = await getPlayerState(page);

    await dragJoystickUntilPlayerMoves(page, 'right');

    const end = await getPlayerState(page);
    expect(end.currentMap).toBe('pallet-town');
    expect(end.playerPosition).not.toMatchObject({
      x: start.playerPosition.x,
      y: start.playerPosition.y,
    });
    expect(errors).toEqual([]);
  });

  test('hamburger and canvas resume affordance open and close the pause menu', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, LANDSCAPE_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await reachMobileOverworld(page);

    await page.tap('#mobile-menu-btn');
    await waitForScene(page, 'MenuScene', 10_000);
    await expectMobilePauseMenuLayout(page);

    await tapCanvasFraction(page, 0.77, 0.82);
    await waitForSceneInactive(page, 'MenuScene', 10_000);
    await waitForScene(page, 'OverworldScene', 10_000);

    expect(errors).toEqual([]);
  });

  test('rotation shows the portrait gate, returns to landscape controls, and keeps touch input usable', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, LANDSCAPE_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await reachMobileOverworld(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForRotateGate(page, 'visible', 10_000);

    const portraitSnapshot = await getPlaytestSnapshot(page);
    expect(portraitSnapshot.activeScenes).toContain('OverworldScene');

    await page.setViewportSize({ width: 844, height: 390 });
    await waitForRotateGate(page, 'hidden', 10_000);
    await expect(page.locator('#mobile-controls')).toBeVisible({ timeout: 10_000 });

    await dragJoystickUntilPlayerMoves(page, 'right');
    expect(errors).toEqual([]);
  });
});

test.describe('Mobile UI — portrait gameplay', () => {
  test('pause menu hides overworld HUD and keeps every action touch-sized', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, PORTRAIT_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await reachMobileOverworld(page);
    await page.tap('#mobile-menu-btn');
    await waitForScene(page, 'MenuScene', 10_000);
    await expectMobilePauseMenuLayout(page);

    await tapCanvasFraction(page, 0.62, 0.19);
    await waitForScene(page, 'PokedexScene', 10_000);
    const childSnapshot = await getPlaytestSnapshot(page);
    expect(childSnapshot.visibleScenes).not.toEqual(
      expect.arrayContaining(['QuestTrackerScene', 'PartyQuickViewScene', 'MinimapScene']),
    );

    await tapCanvasFraction(page, 0.5, 0.97);
    await waitForSceneInactive(page, 'PokedexScene', 10_000);
    await waitForScene(page, 'MenuScene', 10_000);

    expect(errors).toEqual([]);
  });

  test('portrait controls remain reachable, distinct, and able to move the player', async ({
    page,
  }, testInfo) => {
    skipUnlessProject(testInfo, PORTRAIT_PROJECT);
    test.setTimeout(120_000);
    const errors = collectRuntimeErrors(page);

    await bootSavedGameToOverworld(page);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport!.height).toBeGreaterThan(viewport!.width);

    const joystick = await visibleBox(page, '#joystick-zone');
    const buttonA = await visibleBox(page, '#btn-a');
    const buttonB = await visibleBox(page, '#btn-b');
    const menu = await visibleBox(page, '#mobile-menu-btn');
    expectBoxInsideViewport('joystick zone', joystick, viewport!);
    expectBoxInsideViewport('A button', buttonA, viewport!);
    expectBoxInsideViewport('B button', buttonB, viewport!);
    expectBoxInsideViewport('menu button', menu, viewport!);
    expect(boxesOverlap(joystick, buttonA), 'joystick and A button should not overlap').toBe(false);
    expect(boxesOverlap(joystick, buttonB), 'joystick and B button should not overlap').toBe(false);
    expect(boxesOverlap(menu, buttonA), 'menu and A button should not overlap').toBe(false);
    expect(boxesOverlap(menu, buttonB), 'menu and B button should not overlap').toBe(false);

    await dragJoystickUntilPlayerMoves(page, 'down');
    expect(errors).toEqual([]);
  });
});
