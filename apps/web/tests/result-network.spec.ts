import { expect, test } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const artifactDir = process.env.OPENCLAW_ARTIFACT_DIR;

const resultFixture = {
  success: true,
  meta: {
    id: 'visual-result-fixture',
    timestamp: 1_720_000_000_000,
    processing_time_ms: 84,
  },
  hashes: {
    gold: 'a'.repeat(64),
    silver: 'b'.repeat(64),
    bronze: 'c'.repeat(64),
  },
  result: {
    is_unique: false,
    uniqueness_ratio: 0.01,
    uniqueness_display: '100 of 15,000',
    exact_match_count: 100,
    hardware_match_count: 1,
    browser_variant_count: 1,
    total_fingerprints: 15000,
    tracking_risk: 'low',
    message: 'Your fingerprint shares signals with other browsers.',
    cross_browser_detected: false,
  },
  details: {
    hw_canvas_hash: 'canvas-fixture',
    sys_platform: 'MacIntel',
    sys_user_agent: 'Visual QA browser',
    sys_language: 'en-US',
    sys_timezone: 'America/Los_Angeles',
    rtc_available: true,
    rtc_mdns_obfuscated: true,
    rtc_stun_available: true,
    rtc_ip_type: 'both',
    rtc_media_device_count: 3,
    net_asn: 15169,
    net_asn_org: 'Google LLC',
    net_country: 'US',
    net_city: 'Mountain View',
    net_timezone: 'America/Los_Angeles',
  },
  ip_intel: {
    risk_score: 12,
    ip_score: 88,
    band: 'excellent',
    usage_type: 'infrastructure',
    is_datacenter: true,
    is_proxy: false,
    threat_level: 'low',
    asn: 15169,
    asn_org: 'Google LLC',
    operator: null,
    cached: false,
  },
  consistency: {
    contradiction_count: 0,
    risk_signal_count: 1,
    checks: [
      {
        code: 'timezone_geo_mismatch',
        status: 'pass',
        severity: 'none',
        category: 'contradiction',
        title: 'Timezone consistency',
        message: 'The browser timezone is consistent with the connection location.',
      },
      {
        code: 'language_geo_mismatch',
        status: 'pass',
        severity: 'none',
        category: 'contradiction',
        title: 'Language and location',
        message: 'The browser language region is consistent with the connection country.',
      },
      {
        code: 'datacenter_traffic',
        status: 'flagged',
        severity: 'warning',
        category: 'risk_signal',
        title: 'Data-center network',
        message: 'The connection is associated with data-center infrastructure.',
      },
      {
        code: 'proxy_detected',
        status: 'pass',
        severity: 'none',
        category: 'risk_signal',
        title: 'Proxy detection',
        message: 'No proxy signal was detected for this connection.',
      },
      {
        code: 'webrtc_ip_leak',
        status: 'pass',
        severity: 'none',
        category: 'contradiction',
        state: 'no_public_candidate',
        title: 'WebRTC address exposure',
        message: 'No public WebRTC candidate was exposed; local candidates were protected by mDNS.',
      },
    ],
  },
  lies: {
    os_mismatch: false,
    browser_mismatch: false,
    resolution_mismatch: false,
    timezone_mismatch: false,
    webgl_mismatch: false,
    headless: false,
    automation: false,
  },
};

test.describe('scan result network privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(fixture => {
      window.sessionStorage.setItem('scanResult', JSON.stringify(fixture));
    }, resultFixture);
  });

  test('shows reputation separately from privacy checks', async ({ page }) => {
    await page.goto(`${base}/scan/result`);

    await expect(page.getByRole('heading', { name: 'Low reputation risk' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Privacy and consistency report' })
    ).toBeVisible();
    await expect(page.getByText('Datacenter network', { exact: true })).toBeVisible();
    await expect(page.getByText(/does not measure how anonymous you are/i)).toBeVisible();
    await expect(page.getByText('Exact Matches', { exact: true })).toBeVisible();
    await expect(page.getByText('Hardware Hash Observations', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Device Matches');
    await expect(page.locator('body')).not.toContainText('198.51.100');
    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/result-desktop.png` });
    }
  });

  test('stays within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/scan/result`);

    await expect(
      page.getByRole('heading', { name: 'Privacy and consistency report' })
    ).toBeVisible();
    if (artifactDir) {
      await page.screenshot({ path: `${artifactDir}/result-mobile.png` });
    }
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
  });
});
