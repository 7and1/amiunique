import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AnalysisResult, ConsistencyReport as ConsistencyReportData } from '@amiunique/core';
import { ConsistencyReport } from '@/components/scan/consistency-report';

const cleanLies: AnalysisResult['lies'] = {
  os_mismatch: false,
  browser_mismatch: false,
  resolution_mismatch: false,
  timezone_mismatch: false,
  webgl_mismatch: false,
  headless: false,
  automation: false,
};

const dualStackReport: ConsistencyReportData = {
  contradiction_count: 0,
  risk_signal_count: 0,
  checks: [
    {
      code: 'webrtc_ip_leak',
      status: 'indeterminate',
      severity: 'none',
      category: 'contradiction',
      state: 'different_address_family',
      title: 'WebRTC address exposure',
      message:
        'The WebRTC candidate and connection use different address families, so no leak is inferred.',
    },
  ],
};

describe('ConsistencyReport', () => {
  it('does not present a dual-stack comparison as a leak', () => {
    const html = renderToStaticMarkup(
      <ConsistencyReport report={dualStackReport} lies={cleanLies} />
    );

    expect(html).toContain('Inconclusive');
    expect(html).toContain('different address families');
    expect(html).not.toContain('VPN leaked');
  });

  it('treats a missing report as unavailable rather than clean', () => {
    const html = renderToStaticMarkup(<ConsistencyReport report={undefined} lies={cleanLies} />);

    expect(html).toContain('Network checks unavailable');
    expect(html).toContain('not treated as a clean result');
  });
});
