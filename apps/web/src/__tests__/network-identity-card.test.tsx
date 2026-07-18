import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AnalysisDetails, IPIntelSummary } from '@amiunique/core';
import { NetworkIdentityCard } from '@/components/scan/network-identity-card';

const details = {
  net_asn: 15169,
  net_asn_org: 'Google LLC',
  net_city: 'Mountain View',
  net_country: 'US',
  net_timezone: 'America/Los_Angeles',
} as AnalysisDetails;

const intel: IPIntelSummary = {
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
};

describe('NetworkIdentityCard', () => {
  it('renders a neutral degraded state when IP intelligence is unavailable', () => {
    const html = renderToStaticMarkup(<NetworkIdentityCard intel={null} details={details} />);

    expect(html).toContain('Network intelligence unavailable');
    expect(html).toContain('unknown state');
  });

  it('separates reputation from anonymity and never renders a raw IP', () => {
    const html = renderToStaticMarkup(<NetworkIdentityCard intel={intel} details={details} />);

    expect(html).toContain('Low reputation risk');
    expect(html).toContain('Datacenter network');
    expect(html).toContain('AS15169');
    expect(html).toContain('does not measure how anonymous you are');
    expect(html).not.toContain('8.8.8.8');
  });
});
