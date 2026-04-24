import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Production E2E tests
 * Tests the deployed Railway app
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for production tests
  forbidOnly: true,
  retries: 2, // Retry failed tests in production
  workers: 1, // Single worker for production
  reporter: 'html',
  timeout: 30000, // 30 second timeout for production tests

  use: {
    baseURL: 'https://tetrix-game-frontend-production.up.railway.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer - testing deployed app
});
