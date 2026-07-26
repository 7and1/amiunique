import { expect, test, type Page } from '@playwright/test';
import { resultFixture } from './fixtures/analysis-result';

const DIMENSION_GROUPS = [
  'Hardware & Rendering',
  'System & OS',
  'Capabilities',
  'Media Codecs',
  'Network & Edge',
  'WebRTC',
  'Client Hints',
  'Auxiliary Signals',
  'Lie Detection',
];

/** Stub /api/analyze (and its CORS preflight) and count real POSTs. */
async function stubAnalyze(page: Page, counter: { posts: number }) {
  await page.route('**/api/analyze', route => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
        },
      });
    }
    counter.posts += 1;
    return route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'application/json',
      body: JSON.stringify(resultFixture),
    });
  });
}

test.describe('click-gated inline scan flow', () => {
  test('collects only after click, shows real progress, renders the dashboard', async ({
    page,
  }) => {
    const counter = { posts: 0 };
    await stubAnalyze(page, counter);

    await page.goto('/');

    // Consent gate: nothing runs before the click.
    await expect(page.getByText(/Runs only when you click/)).toBeVisible();
    await page.waitForTimeout(800);
    expect(counter.posts).toBe(0);

    await page.getByRole('button', { name: 'Scan my fingerprint' }).click();

    // Real progress against the full 23-step collector list.
    await expect(page.getByText(/of 23/).first()).toBeVisible({ timeout: 15_000 });

    // Dashboard renders from the analyze response.
    await expect(page.getByRole('heading', { name: 'Your Fingerprint Analysis' })).toBeVisible({
      timeout: 45_000,
    });
    expect(counter.posts).toBe(1);

    // All nine dimension groups, including WebRTC, are present.
    for (const group of DIMENSION_GROUPS) {
      await expect(page.getByText(group, { exact: true }).first()).toBeVisible();
    }
  });

  test('completes under prefers-reduced-motion', async ({ page }) => {
    const counter = { posts: 0 };
    await stubAnalyze(page, counter);
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.getByRole('button', { name: 'Scan my fingerprint' }).click();

    await expect(page.getByRole('heading', { name: 'Your Fingerprint Analysis' })).toBeVisible({
      timeout: 45_000,
    });
    expect(counter.posts).toBe(1);
  });
});
