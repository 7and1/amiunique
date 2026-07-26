import { expect, test } from '@playwright/test';

test.describe('mobile navigation and theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
  });

  test('drawer opens, navigates, and closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();

    const nav = page.getByRole('navigation', { name: 'Mobile' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link').first()).toBeVisible();

    await page.getByRole('button', { name: 'Close navigation menu' }).click();
    await expect(nav).not.toBeVisible();
  });

  test('theme toggle persists across reloads', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();

    // Cycle system → light → dark.
    const toggle = page.getByRole('button', { name: /theme — click to switch/ });
    await toggle.click();
    await toggle.click();

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('au_theme')))
      .toBe('dark');
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('dark'))
    ).toBe(true);

    await page.reload();
    // The inline theme init script must re-apply dark before hydration.
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('dark'))
    ).toBe(true);
  });
});
