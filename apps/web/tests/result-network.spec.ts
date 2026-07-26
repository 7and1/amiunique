import { expect, test } from '@playwright/test';
import { resultFixture } from './fixtures/analysis-result';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const artifactDir = process.env.OPENCLAW_ARTIFACT_DIR;

test.describe('scan result network privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(fixture => {
      window.sessionStorage.setItem('scanResult', JSON.stringify(fixture));
    }, resultFixture);
  });

  test('shows reputation separately from privacy checks', async ({ page }) => {
    await page.goto(`${base}/`);

    await expect(page.getByRole('heading', { name: 'Low reputation risk' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Privacy and consistency report' })
    ).toBeVisible();
    await expect(page.getByText('Datacenter network', { exact: true })).toBeVisible();
    await expect(page.getByText(/does not measure how anonymous you are/i)).toBeVisible();
    await expect(page.getByText('Exact matches', { exact: true })).toBeVisible();
    await expect(page.getByText('Hardware observations', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Device Matches');
    await expect(page.locator('body')).not.toContainText('198.51.100');
    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/result-desktop.png` });
    }
  });

  test('stays within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/`);

    await expect(
      page.getByRole('heading', { name: 'Privacy and consistency report' })
    ).toBeVisible();
    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/result-mobile.png` });
    }
    // The page itself must never scroll horizontally.
    const pageOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      pageOverflow.scrollWidth,
      'page must not scroll horizontally'
    ).toBeLessThanOrEqual(pageOverflow.clientWidth + 1);

    const overflowElements = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter(element => {
          const rect = element.getBoundingClientRect();
          const overflows =
            rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
          if (!overflows) return false;
          // Content clipped inside an intentional horizontal scroller
          // (e.g. the sticky section nav) is not a viewport leak.
          for (let node = element.parentElement; node; node = node.parentElement) {
            const overflowX = window.getComputedStyle(node).overflowX;
            if (overflowX === 'auto' || overflowX === 'scroll') return false;
          }
          return true;
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
  });
});
