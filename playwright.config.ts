import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 30000,
  use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  projects: [
    { name: 'portfolio', testIgnore: /configured-form/, use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'configured-form', testMatch: /configured-form/, use: { baseURL: 'http://127.0.0.1:4174' } },
  ],
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false, env: { VITE_WEB3FORMS_KEY: '' } },
    { command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false, env: { VITE_WEB3FORMS_KEY: 'test-only-not-a-real-key' } },
  ],
});
