import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for CI environments.
 * Overrides the main config to:
 * - Use npm instead of yarn for the dev server
 * - Only run Chromium browser tests
 * - Skip the webServer auto-start (server is managed by CI workflow)
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
