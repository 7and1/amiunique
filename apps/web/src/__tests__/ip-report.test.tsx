import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SelfIPIntelReport } from '@amiunique/core';
import { IPReportResult } from '@/components/ip/ip-report';

const report: SelfIPIntelReport = {
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
};

describe('IPReportResult', () => {
  it('keeps the full address out of the default rendered DOM', () => {
    const html = renderToStaticMarkup(<IPReportResult report={report} revealed={false} />);

    expect(html).toContain('203.0.113.x');
    expect(html).toContain('Show full IP');
    expect(html).toContain('Low reputation risk');
    expect(html).not.toContain('203.0.113.42');
  });

  it('renders the full current address only after explicit reveal', () => {
    const html = renderToStaticMarkup(<IPReportResult report={report} revealed />);

    expect(html).toContain('203.0.113.42');
    expect(html).toContain('Hide full IP');
  });

  it('presents missing optional reputation as unknown rather than safe', () => {
    const unavailable: SelfIPIntelReport = {
      ...report,
      address: '2001:db8::42',
      masked_address: '2001:db8:…',
      ip_version: 'ipv6',
      intelligence: null,
      intelligence_status: 'unavailable',
    };
    const html = renderToStaticMarkup(<IPReportResult report={unavailable} revealed={false} />);

    expect(html).toContain('2001:db8:…');
    expect(html).toContain('Network intelligence unavailable');
    expect(html).toContain('unknown state');
    expect(html).not.toContain('2001:db8::42');
  });
});
