import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Pokemon-Web E2E, visual regression, and
 * performance tests.
 *
 * The Vite dev server on port 3020 is started automatically before the
 * test suite runs.  Chromium is used with two device profiles (desktop
 * 1280x720 and mobile 390x844) so we cover both form-factors.
 */
export default defineConfig({
  testDir: '.',
  /* Ignore fuzz tests — they have their own long timeout and are run
     separately via `npm run test:fuzz`. */
  testIgnore: ['**/fuzz/**'],

  /* Global timeout per test — generous because Phaser games take time to
     boot (asset loading, WebGL init, etc.). */
  timeout: 60_000,

  /* Fail fast in CI so we don't waste runner minutes. */
  retries: process.env.CI ? 1 : 0,

  /* Parallelise across files in CI for speed. */
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  /* HTML report — written next to the config so it stays inside tests/. */
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: '../playwright-report' }]]
    : [['html', { open: 'on-failure', outputFolder: '../playwright-report' }]],

  /* Shared settings applied to every project. */
  use: {
    baseURL: 'http://localhost:3020',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  /* Visual-regression snapshot settings. */
  expect: {
    toHaveScreenshot: {
      /* Game animations (water, tween, etc.) cause minor pixel diffs —
         allow up to 2 % of pixels to differ before failing. */
      maxDiffPixelRatio: 0.02,
      /* Folder where golden screenshots live (checked into git). */
      snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
    },
  },

  /* Browser projects. */
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],

  /* Start Vite dev server before the run. */
  webServer: {
    command: 'npm run dev',
    port: 3020,
    reuseExistingServer: !process.env.CI,
    /* The game loads many assets; give the server time to start. */
    timeout: 30_000,
  },
});
