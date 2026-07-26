import { test, expect } from '@playwright/test';

// Indexable pages plus the redirect shells kept for old links —
// every route must answer < 400 even before public/_redirects kicks in.
const routes = [
  '/',
  '/ip',
  '/stats',
  '/stats/global-distribution',
  '/stats/fingerprints',
  '/developers',
  '/legal/privacy',
  '/legal/terms',
  '/legal/opt-out',
  '/scan',
  '/scan/result',
  '/scan/history',
  '/developers/api-docs',
];

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

for (const route of routes) {
  test(`loads ${route} without 404`, async ({ page }) => {
    const res = await page.goto(`${base}${route}`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toContainText('404');
  });
}
