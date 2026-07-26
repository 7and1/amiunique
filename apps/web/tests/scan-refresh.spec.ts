import { expect, test } from '@playwright/test';
import { resultFixture } from './fixtures/analysis-result';

test.describe('restored results never trigger a scan', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(fixture => {
      window.sessionStorage.setItem('scanResult', JSON.stringify(fixture));
    }, resultFixture);
  });

  test('homepage restores the stored result without calling analyze', async ({ page }) => {
    let analyzeRequests = 0;
    await page.route('**/api/analyze', route => {
      analyzeRequests += 1;
      return route.abort();
    });

    await page.goto('/');

    await expect(page.getByText('Restored from your last scan in this session.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Fingerprint Analysis' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run a new scan' }).first()).toBeVisible();
    await page.waitForTimeout(500);
    expect(analyzeRequests).toBe(0);
  });

  test('/scan shell lands back on the homepage without scanning', async ({ page }) => {
    let analyzeRequests = 0;
    await page.route('**/api/analyze', route => {
      analyzeRequests += 1;
      return route.abort();
    });

    await page.goto('/scan');
    // Production serves a real 301 to / via public/_redirects; the dev server
    // falls through to the RedirectNotice shell which replaces to /?scan=1#scan.
    await page.waitForURL(url => !url.pathname.startsWith('/scan'));

    // ?scan=1 only scrolls to the section — a restored result must stay restored.
    await expect(page.getByText('Restored from your last scan in this session.')).toBeVisible();
    await page.waitForTimeout(500);
    expect(analyzeRequests).toBe(0);
  });
});
