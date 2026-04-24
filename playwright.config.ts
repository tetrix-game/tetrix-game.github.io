import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Run tests sequentially for production tests to avoid rate limits
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Single worker to avoid rate limit issues in production tests
  workers: 1,
  // Reporter to use
  reporter: 'html',
  // Shared settings for all the projects below
  use: {
    // Base URL - can be overridden with BASE_URL env var for production tests
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests (only for local tests)
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Timeout for each test
  timeout: 60000,
});
