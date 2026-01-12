import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for IRIS Vista E2E Testing
 *
 * Features:
 * - Human-like interaction simulation (slowMo)
 * - Full screenshot and video capture
 * - Trace recording for debugging
 * - Multiple device configurations
 * - Retry mechanism for flaky tests
 */
export default defineConfig({
  testDir: './flows',

  /* Maximum time one test can run */
  timeout: 60000,

  /* Run tests in parallel */
  fullyParallel: false, // Sequential for stateful tests

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry on failure */
  retries: process.env.CI ? 2 : 1,

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: './reports/html' }],
    ['json', { outputFile: './reports/results.json' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying */
    trace: 'on',

    /* Screenshot on failure and always */
    screenshot: 'on',

    /* Video recording */
    video: 'on',

    /* Action timeout */
    actionTimeout: 15000,

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Slow down actions for human-like behavior */
    launchOptions: {
      slowMo: process.env.FAST_MODE ? 0 : 100,
    },

    /* Headless mode */
    headless: process.env.HEADLESS !== 'false',
  },

  /* Output folders */
  outputDir: './reports/test-results',

  /* Configure projects for different devices */
  projects: [
    /* Desktop browsers - Primary testing */
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Safari disabled - requires system dependencies
    // {
    //   name: 'Desktop Safari',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    /* Tablet devices - using Chromium */
    {
      name: 'Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
      },
    },

    /* Mobile devices - using Chromium */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  /* Local development server */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
