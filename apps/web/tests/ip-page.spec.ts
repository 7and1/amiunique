import { expect, test } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const artifactDir = process.env.OPENCLAW_ARTIFACT_DIR;

const selfIPFixture = {
  success: true,
  data: {
    address: '203.0.113.42',
    masked_address: '203.0.113.x',
    ip_version: 'ipv4',
    network: {
      asn: 15169,
      asn_org: 'Google LLC',
      colo: 'SJC',
      country: 'US',
      city: 'Mountain View',
      region: 'California',
      timezone: 'America/Los_Angeles',
    },
    intelligence: {
      risk_score: 12,
      ip_score: 88,
      band: 'excellent',
      usage_type: 'residential',
      is_datacenter: false,
      is_proxy: false,
      threat_level: 'low',
      asn: 15169,
      asn_org: 'Google LLC',
      operator: null,
    },
    intelligence_status: 'available',
    checked_at: 1_720_000_000_000,
  },
};

test.describe('current IP privacy report', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/ip-intel', async route => {
      expect(route.request().method()).toBe('GET');
      expect(new URL(route.request().url()).search).toBe('');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'private, no-store' },
        body: JSON.stringify(selfIPFixture),
      });
    });
  });

  test('masks the address until the visitor explicitly reveals it', async ({ page }) => {
    await page.goto(`${base}/ip`);

    await expect(page.getByRole('heading', { name: 'What does my IP reveal?' })).toBeVisible();
    await expect(page.getByText('203.0.113.x', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('203.0.113.42');
    await expect(page.getByRole('heading', { name: 'Low reputation risk' })).toBeVisible();
    await expect(page.getByText('AS15169 · Google LLC', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Show full IP' }).click();
    await expect(page.getByText('203.0.113.42', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide full IP' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.getByRole('button', { name: 'Hide full IP' }).click();
    await expect(page.locator('body')).not.toContainText('203.0.113.42');

    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/ip-desktop.png` });
    }
  });

  test('fits the mobile viewport and exposes one self-only task', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/ip`);

    await expect(page.getByText('203.0.113.x', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My IP' })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);

    const overflowElements = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
        })
        .slice(0, 10)
        .map(element => ({
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 80) || '',
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
        }))
    );

    expect(overflowElements, 'elements extending beyond the mobile viewport').toEqual([]);
    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/ip-mobile.png` });
    }
  });
});
