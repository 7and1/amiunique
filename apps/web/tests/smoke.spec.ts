import { test, expect } from '@playwright/test';

const routes = ['/', '/scan', '/scan/result', '/stats', '/stats/global-distribution', '/stats/fingerprints', '/developers/api-docs'];

const base = process.env.PLAYWRIGHT_BASE_URL;

if (!base) {
  test.describe('smoke', () => {
    test.skip(true, 'Set PLAYWRIGHT_BASE_URL to run smoke tests against a running site');
  });
} else {
  for (const route of routes) {
    test(`loads ${route} without 404`, async ({ page }) => {
      const res = await page.goto(`${base}${route}`);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator('body')).not.toContainText('404');
    });
  }
}
