import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'docs/evidence/fase-1-e2e.json' }]],
  use: { baseURL: 'http://127.0.0.1:3100', channel: 'chrome', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
});
