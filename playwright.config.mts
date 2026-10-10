import { defineConfig, devices } from '@playwright/test';
import { createServer } from 'node:net';

process.env.SITE_PORT ??= await new Promise<string>((resolve, reject) => {
  const server = createServer();
  const timeout = setTimeout(() => {
    server.close();
    reject(new Error('Timed out choosing a localhost port'));
  }, 5000);
  server.once('error', (error) => {
    clearTimeout(timeout);
    reject(error);
  });
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.close((error) => {
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else if (address === null || typeof address === 'string') {
        reject(new Error('Expected a localhost TCP port'));
      } else {
        resolve(String(address.port));
      }
    });
  });
});

const port = Number(process.env.SITE_PORT);
if (!/^\d+$/.test(process.env.SITE_PORT) || port < 1 || port > 65535) {
  throw new Error('SITE_PORT must be a TCP port from 1 to 65535');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  fullyParallel: true,
  timeout: 15_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 10_000,
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'bun run start',
    url: baseURL,
    timeout: 30_000,
  },
});
