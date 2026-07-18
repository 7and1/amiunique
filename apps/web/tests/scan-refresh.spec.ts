import { expect, test } from '@playwright/test';

test('does not start another scan when a stored result is available after refresh', async ({
  page,
}) => {
  let analyzeRequests = 0;

  await page.addInitScript(() => {
    window.sessionStorage.setItem('scanResult', '{"success":true}');
  });
  await page.route('**/api/analyze', route => {
    analyzeRequests += 1;
    return route.abort();
  });

  await page.goto('/scan');

  await expect(page.getByRole('heading', { name: 'Previous Scan Available' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View previous results' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run a new scan' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(analyzeRequests).toBe(0);
});
