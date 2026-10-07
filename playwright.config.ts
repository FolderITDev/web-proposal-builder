import { defineConfig, devices } from '@playwright/test';

const PORT = 3020;
const BASE_URL = `http://localhost:${PORT}/apps/proposal-builder/`;
const RENDERER_PORT = 3029;

/**
 * End-to-end tests run against a production build (`pnpm build` first) with a migrated and
 * seeded database, and a test double of the document renderer that answers the documented
 * API. Locally an already running dev server is reused.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm exec tsx tests/support/document-renderer-server.ts',
      port: RENDERER_PORT,
      env: { PORT: String(RENDERER_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm start',
      url: BASE_URL,
      env: { DOCUMENT_RENDERER_URL: `http://127.0.0.1:${RENDERER_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
