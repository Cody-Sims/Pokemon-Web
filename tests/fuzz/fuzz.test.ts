import { test, expect } from '@playwright/test';

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'z', 'x'];

test('monkey test: 2000 random inputs without crash', async ({ page }) => {
  test.setTimeout(120_000); // 2 minutes

  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(3000);

  // Press Enter to start a new game
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const rng = mulberry32(42);

  for (let i = 0; i < 2000; i++) {
    const key = KEYS[Math.floor(rng() * KEYS.length)];
    const duration = Math.floor(rng() * 300) + 50;

    await page.keyboard.down(key);
    await page.waitForTimeout(duration);
    await page.keyboard.up(key);
    await page.waitForTimeout(20);

    // Every 500 inputs, take a screenshot for debugging
    if (i % 500 === 0) {
      await page.screenshot({ path: `tests/fuzz/screenshots/frame-${i}.png` });
    }
  }

  expect(errors).toEqual([]);
});
