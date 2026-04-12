import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
  },
});
