import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  use: { baseURL },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'bun run build && bun run start',
    url: baseURL,
    timeout: 300_000,
  },
});
