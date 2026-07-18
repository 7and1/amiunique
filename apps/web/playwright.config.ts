import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  retries: 0,
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev --hostname 127.0.0.1 --port 3000',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
