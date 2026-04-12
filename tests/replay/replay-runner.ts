import { Page } from '@playwright/test';
import { ReplayData, ReplayAssertion } from './replay-types';
import { mulberry32 } from '../../frontend/src/utils/seeded-random';

export interface ReplayResult {
  passed: boolean;
  errors: string[];
  assertionResults: { assertion: ReplayAssertion; passed: boolean; actual?: unknown }[];
}

/** Runs a replay JSON against the game in a Playwright page. */
export async function runReplay(page: Page, replay: ReplayData): Promise<ReplayResult> {
  const errors: string[] = [];
  const assertionResults: ReplayResult['assertionResults'] = [];

  // Collect errors
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Override Math.random with seeded PRNG via page evaluate
  await page.addInitScript(`
    (function() {
      let seed = ${replay.seed};
      Math.random = function() {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    })();
  `);

  await page.goto('/');
  await page.waitForTimeout(3000); // Wait for game to boot

  // Execute frames
  let currentFrame = 0;
  for (const frame of replay.frames) {
    // Wait for the right frame timing (simplified: use frame index as ms delay)
    const delay = (frame.frame - currentFrame) * 16; // ~60fps
    if (delay > 0) await page.waitForTimeout(delay);
    currentFrame = frame.frame;

    // Press keys
    for (const key of frame.keys) {
      await page.keyboard.down(key);
    }
    await page.waitForTimeout(50);
    for (const key of frame.keys) {
      await page.keyboard.up(key);
    }

    // Check assertions at this frame
    const frameAssertions = replay.assertions.filter(a => a.atFrame === frame.frame);
    for (const assertion of frameAssertions) {
      if (assertion.type === 'no-errors') {
        assertionResults.push({
          assertion,
          passed: errors.length === 0,
          actual: errors.length > 0 ? errors : undefined,
        });
      }
      // Additional assertion types can be added here
    }
  }

  // Check remaining assertions (e.g., end-of-replay checks)
  const endAssertions = replay.assertions.filter(
    a => !replay.frames.some(f => f.frame === a.atFrame)
  );
  for (const assertion of endAssertions) {
    if (assertion.type === 'no-errors') {
      assertionResults.push({
        assertion,
        passed: errors.length === 0,
        actual: errors.length > 0 ? errors : undefined,
      });
    }
  }

  return {
    passed: errors.length === 0 && assertionResults.every(r => r.passed),
    errors,
    assertionResults,
  };
}
