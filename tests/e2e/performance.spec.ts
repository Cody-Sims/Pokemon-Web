import { test, expect, Page } from '@playwright/test';
import { waitForCanvas, bootToTitleMenu, startNewGame, skipIntro, selectStarter, pressKey } from './helpers';

// ---------------------------------------------------------------------------
// Performance Budget Tests
//
// These tests enforce runtime budgets so regressions in load time, memory
// usage, and frame rate are caught automatically.
//
// Budgets:
//   - Page load (to canvas visible): < 5 s
//   - JS heap after boot:            < 150 MB
//   - Overworld FPS (sustained):     > 30 FPS
// ---------------------------------------------------------------------------

/** Collect JS heap size via Chrome DevTools Protocol. */
async function getJSHeapUsedMB(page: Page): Promise<number> {
  const metrics = await page.evaluate(() => {
    // performance.memory is a Chrome-only extension.
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return mem ? mem.usedJSHeapSize : 0;
  });
  return metrics / (1024 * 1024);
}

/**
 * Measure average FPS over a given duration using requestAnimationFrame
 * inside the page context.
 */
async function measureFPS(page: Page, durationMs = 3_000): Promise<number> {
  return page.evaluate((dur) => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();

      function tick() {
        frames++;
        if (performance.now() - start < dur) {
          requestAnimationFrame(tick);
        } else {
          const elapsed = performance.now() - start;
          resolve((frames / elapsed) * 1000);
        }
      }

      requestAnimationFrame(tick);
    });
  }, durationMs);
}

// ---------------------------------------------------------------------------

test.describe('Performance budgets', () => {
  test('page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await waitForCanvas(page);
    const loadTime = Date.now() - start;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5_000);
  });

  test('JS heap stays under 150 MB after boot', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);
    // Let asset loading finish.
    await page.waitForTimeout(5_000);

    const heapMB = await getJSHeapUsedMB(page);
    console.log(`JS heap after boot: ${heapMB.toFixed(1)} MB`);

    // If the browser doesn't expose performance.memory (non-Chromium),
    // skip rather than fail.
    if (heapMB === 0) {
      test.skip(true, 'performance.memory not available in this browser');
      return;
    }

    expect(heapMB).toBeLessThan(150);
  });

  test('JS heap stays under 200 MB after reaching overworld', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);

    // Let overworld settle.
    await page.waitForTimeout(3_000);

    const heapMB = await getJSHeapUsedMB(page);
    console.log(`JS heap in overworld: ${heapMB.toFixed(1)} MB`);

    if (heapMB === 0) {
      test.skip(true, 'performance.memory not available in this browser');
      return;
    }

    expect(heapMB).toBeLessThan(200);
  });

  test('title screen sustains > 30 FPS', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);
    await page.waitForTimeout(2_000);

    const fps = await measureFPS(page, 3_000);
    console.log(`Title screen FPS: ${fps.toFixed(1)}`);

    expect(fps).toBeGreaterThan(30);
  });

  test('overworld sustains > 30 FPS', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);
    await page.waitForTimeout(2_000);

    // Walk a bit to exercise the renderer (scrolling, tile animation).
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'ArrowUp', 200);
    }
    await page.waitForTimeout(500);

    const fps = await measureFPS(page, 3_000);
    console.log(`Overworld FPS: ${fps.toFixed(1)}`);

    expect(fps).toBeGreaterThan(30);
  });

  test('no memory leak after opening and closing menu 10 times', async ({ page }) => {
    test.setTimeout(120_000);

    await bootToTitleMenu(page);
    await startNewGame(page);
    await skipIntro(page);
    await selectStarter(page);
    await page.waitForTimeout(2_000);

    // Baseline heap.
    const baseHeap = await getJSHeapUsedMB(page);
    if (baseHeap === 0) {
      test.skip(true, 'performance.memory not available in this browser');
      return;
    }

    // Open/close menu 10 times.
    for (let i = 0; i < 10; i++) {
      await pressKey(page, 'Escape');
      await page.waitForTimeout(400);
      await pressKey(page, 'Escape');
      await page.waitForTimeout(400);
    }

    // Force GC if available (Chromium with --js-flags=--expose-gc).
    await page.evaluate(() => {
      if (typeof (globalThis as unknown as { gc?: () => void }).gc === 'function') {
        (globalThis as unknown as { gc: () => void }).gc();
      }
    });
    await page.waitForTimeout(1_000);

    const afterHeap = await getJSHeapUsedMB(page);
    const growth = afterHeap - baseHeap;
    console.log(`Heap growth after 10 menu cycles: ${growth.toFixed(1)} MB (${baseHeap.toFixed(1)} → ${afterHeap.toFixed(1)})`);

    // Allow up to 20 MB of growth — anything beyond suggests a leak.
    expect(growth).toBeLessThan(20);
  });
});
