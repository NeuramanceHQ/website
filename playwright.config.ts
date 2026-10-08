import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  fullyParallel: true,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'bun run start',
    url: baseURL,
    timeout: 30_000,
  },
});
