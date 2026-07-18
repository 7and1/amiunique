import { describe, expect, it } from 'vitest';
import {
  buildConsistencyReport,
  type ConsistencyCheck,
  type ConsistencyClientData,
  type ConsistencyNetworkData,
} from '../src/lib/cross-check.js';
import type { IPIntelSummary } from '../src/lib/ipbot.js';

const SAFE_IP_INTEL: IPIntelSummary = {
  risk_score: 10,
  ip_score: 90,
  band: 'excellent',
  usage_type: 'residential',
  is_datacenter: false,
  is_proxy: false,
  threat_level: 'low',
  asn: 64500,
  asn_org: 'Example',
  operator: 'Example',
  cached: false,
};

const BASE_CLIENT: ConsistencyClientData = {
  sys_language: 'en-US',
  sys_languages: ['en-US', 'en'],
  sys_timezone: 'America/New_York',
  rtc_available: true,
  rtc_public_ip: '198.51.100.10',
};

const BASE_NETWORK: ConsistencyNetworkData = {
  net_country: 'US',
  net_timezone: 'America/New_York',
};

function getCheck(checks: ConsistencyCheck[], code: ConsistencyCheck['code']): ConsistencyCheck {
  const check = checks.find(item => item.code === code);
  if (!check) throw new Error(`Missing check: ${code}`);
  return check;
}

describe('buildConsistencyReport', () => {
  it('returns five stable pass checks and zero counts for aligned signals', () => {
    const report = buildConsistencyReport(
      BASE_CLIENT,
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '198.51.100.10'
    );

    expect(report.checks.map(check => check.code)).toEqual([
      'timezone_geo_mismatch',
      'language_geo_mismatch',
      'datacenter_traffic',
      'proxy_detected',
      'webrtc_ip_leak',
    ]);
    expect(report.checks.every(check => check.status === 'pass')).toBe(true);
    expect(getCheck(report.checks, 'webrtc_ip_leak')).toMatchObject({
      severity: 'none',
      state: 'same_connection',
    });
    expect(report.contradiction_count).toBe(0);
    expect(report.risk_signal_count).toBe(0);
  });

  it('flags timezone and language contradictions while keeping language advisory', () => {
    const report = buildConsistencyReport(
      {
        ...BASE_CLIENT,
        sys_language: 'fr-FR',
        sys_languages: ['fr-FR'],
        sys_timezone: 'Europe/Paris',
      },
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '198.51.100.10'
    );

    expect(getCheck(report.checks, 'timezone_geo_mismatch')).toMatchObject({
      status: 'flagged',
      severity: 'warning',
      category: 'contradiction',
    });
    expect(getCheck(report.checks, 'language_geo_mismatch')).toMatchObject({
      status: 'flagged',
      severity: 'advisory',
      category: 'contradiction',
    });
    expect(report.contradiction_count).toBe(2);
  });

  it('marks checks unavailable when comparison or IP intelligence signals are missing', () => {
    const report = buildConsistencyReport({ rtc_available: false }, {}, null, '198.51.100.10');

    expect(report.checks.every(check => check.status === 'unavailable')).toBe(true);
    expect(getCheck(report.checks, 'webrtc_ip_leak').state).toBe('unsupported');
    expect(report.contradiction_count).toBe(0);
    expect(report.risk_signal_count).toBe(0);
  });

  it('counts data-center and proxy classifications as risk signals', () => {
    const report = buildConsistencyReport(
      BASE_CLIENT,
      BASE_NETWORK,
      { ...SAFE_IP_INTEL, is_datacenter: true, is_proxy: true },
      '198.51.100.10'
    );

    expect(getCheck(report.checks, 'datacenter_traffic')).toMatchObject({
      status: 'flagged',
      severity: 'warning',
      category: 'risk_signal',
    });
    expect(getCheck(report.checks, 'proxy_detected')).toMatchObject({
      status: 'flagged',
      severity: 'warning',
      category: 'risk_signal',
    });
    expect(report.risk_signal_count).toBe(2);
  });

  it('passes with no public WebRTC candidate and describes mDNS protection', () => {
    const report = buildConsistencyReport(
      {
        ...BASE_CLIENT,
        rtc_public_ip: null,
        rtc_mdns_obfuscated: true,
      },
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '198.51.100.10'
    );
    const check = getCheck(report.checks, 'webrtc_ip_leak');

    expect(check).toMatchObject({
      status: 'pass',
      severity: 'none',
      state: 'no_public_candidate',
    });
    expect(check.message).toContain('mDNS');
  });

  it('treats different address families as indeterminate rather than a leak', () => {
    const report = buildConsistencyReport(
      { ...BASE_CLIENT, rtc_public_ip: '2001:db8::10' },
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '198.51.100.10'
    );
    const check = getCheck(report.checks, 'webrtc_ip_leak');

    expect(check).toMatchObject({
      status: 'indeterminate',
      severity: 'none',
      state: 'different_address_family',
    });
    expect(report.contradiction_count).toBe(0);
  });

  it('normalizes equivalent IPv6 forms before comparison', () => {
    const report = buildConsistencyReport(
      { ...BASE_CLIENT, rtc_public_ip: '2001:db8::1' },
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '2001:0db8:0000:0000:0000:0000:0000:0001'
    );

    expect(getCheck(report.checks, 'webrtc_ip_leak')).toMatchObject({
      status: 'pass',
      state: 'same_connection',
    });
  });

  it('flags different public addresses only within the same address family', () => {
    const report = buildConsistencyReport(
      BASE_CLIENT,
      BASE_NETWORK,
      SAFE_IP_INTEL,
      '198.51.100.11'
    );
    const check = getCheck(report.checks, 'webrtc_ip_leak');

    expect(check).toMatchObject({
      status: 'flagged',
      severity: 'critical',
      state: 'leak_detected',
    });
    expect(report.contradiction_count).toBe(1);
  });

  it('never includes connection or candidate IPs in user-facing messages', () => {
    const candidate = '198.51.100.10';
    const connection = '198.51.100.11';
    const report = buildConsistencyReport(
      { ...BASE_CLIENT, rtc_public_ip: candidate },
      BASE_NETWORK,
      SAFE_IP_INTEL,
      connection
    );
    const messages = report.checks.map(check => check.message).join(' ');

    expect(messages).not.toContain(candidate);
    expect(messages).not.toContain(connection);
  });
});
