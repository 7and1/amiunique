import type { IPIntelSummary } from './ipbot.js';

export type ConsistencyCheckCode =
  | 'timezone_geo_mismatch'
  | 'language_geo_mismatch'
  | 'datacenter_traffic'
  | 'proxy_detected'
  | 'webrtc_ip_leak';

export type ConsistencyCheckStatus = 'pass' | 'flagged' | 'unavailable' | 'indeterminate';
export type ConsistencyCheckSeverity = 'none' | 'advisory' | 'warning' | 'critical';
export type ConsistencyCheckCategory = 'contradiction' | 'risk_signal';

export type WebRTCCheckState =
  | 'unsupported'
  | 'no_public_candidate'
  | 'same_connection'
  | 'different_address_family'
  | 'unverifiable'
  | 'leak_detected';

export interface ConsistencyCheck {
  code: ConsistencyCheckCode;
  status: ConsistencyCheckStatus;
  severity: ConsistencyCheckSeverity;
  category: ConsistencyCheckCategory;
  title: string;
  message: string;
  state?: WebRTCCheckState;
}

export interface ConsistencyReport {
  checks: ConsistencyCheck[];
  contradiction_count: number;
  risk_signal_count: number;
}

export interface ConsistencyClientData {
  sys_language?: string;
  sys_languages?: string[];
  sys_timezone?: string;
  rtc_available?: boolean;
  rtc_public_ip?: string | null;
  rtc_mdns_obfuscated?: boolean;
}

export interface ConsistencyNetworkData {
  net_country?: string;
  net_timezone?: string;
}

interface ParsedIP {
  family: 4 | 6;
  normalized: string;
}

function createCheck(
  code: ConsistencyCheckCode,
  status: ConsistencyCheckStatus,
  severity: ConsistencyCheckSeverity,
  category: ConsistencyCheckCategory,
  title: string,
  message: string,
  state?: WebRTCCheckState
): ConsistencyCheck {
  return {
    code,
    status,
    severity,
    category,
    title,
    message,
    ...(state ? { state } : {}),
  };
}

function canonicalTimezone(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    return new Intl.DateTimeFormat('en', { timeZone: value.trim() })
      .resolvedOptions()
      .timeZone.toLowerCase();
  } catch {
    return null;
  }
}

function extractLocaleRegion(clientData: ConsistencyClientData): string | null {
  const locales = [clientData.sys_language, ...(clientData.sys_languages ?? [])];

  for (const locale of locales) {
    if (!locale) continue;
    const parts = locale.replaceAll('_', '-').split('-');
    const region = parts.find(
      (part, index) => index > 0 && (/^[a-z]{2}$/i.test(part) || /^[0-9]{3}$/.test(part))
    );
    if (region) return region.toUpperCase();
  }

  return null;
}

function buildTimezoneCheck(
  clientData: ConsistencyClientData,
  networkData: ConsistencyNetworkData
): ConsistencyCheck {
  const clientTimezone = canonicalTimezone(clientData.sys_timezone);
  const networkTimezone = canonicalTimezone(networkData.net_timezone);

  if (!clientTimezone || !networkTimezone) {
    return createCheck(
      'timezone_geo_mismatch',
      'unavailable',
      'none',
      'contradiction',
      'Timezone consistency',
      'Timezone consistency could not be checked because one of the signals is unavailable.'
    );
  }

  if (clientTimezone === networkTimezone) {
    return createCheck(
      'timezone_geo_mismatch',
      'pass',
      'none',
      'contradiction',
      'Timezone consistency',
      'The browser timezone is consistent with the connection location.'
    );
  }

  return createCheck(
    'timezone_geo_mismatch',
    'flagged',
    'warning',
    'contradiction',
    'Timezone consistency',
    'The browser timezone differs from the timezone reported for the connection.'
  );
}

function buildLanguageCheck(
  clientData: ConsistencyClientData,
  networkData: ConsistencyNetworkData
): ConsistencyCheck {
  const localeRegion = extractLocaleRegion(clientData);
  const networkCountry = networkData.net_country?.trim().toUpperCase();

  if (!localeRegion || !networkCountry) {
    return createCheck(
      'language_geo_mismatch',
      'unavailable',
      'none',
      'contradiction',
      'Language and location',
      'Language-region consistency could not be checked because one of the signals is unavailable.'
    );
  }

  if (localeRegion === networkCountry) {
    return createCheck(
      'language_geo_mismatch',
      'pass',
      'none',
      'contradiction',
      'Language and location',
      'The browser language region is consistent with the connection country.'
    );
  }

  return createCheck(
    'language_geo_mismatch',
    'flagged',
    'advisory',
    'contradiction',
    'Language and location',
    'The browser language region differs from the connection country; this can be intentional.'
  );
}

function buildDatacenterCheck(ipIntel: IPIntelSummary | null): ConsistencyCheck {
  if (ipIntel?.is_datacenter == null) {
    return createCheck(
      'datacenter_traffic',
      'unavailable',
      'none',
      'risk_signal',
      'Data-center network',
      'Data-center classification is currently unavailable.'
    );
  }

  if (!ipIntel.is_datacenter) {
    return createCheck(
      'datacenter_traffic',
      'pass',
      'none',
      'risk_signal',
      'Data-center network',
      'The connection is not classified as data-center traffic.'
    );
  }

  return createCheck(
    'datacenter_traffic',
    'flagged',
    'warning',
    'risk_signal',
    'Data-center network',
    'The connection is associated with data-center infrastructure.'
  );
}

function buildProxyCheck(ipIntel: IPIntelSummary | null): ConsistencyCheck {
  if (ipIntel?.is_proxy == null) {
    return createCheck(
      'proxy_detected',
      'unavailable',
      'none',
      'risk_signal',
      'Proxy detection',
      'Proxy classification is currently unavailable.'
    );
  }

  if (!ipIntel.is_proxy) {
    return createCheck(
      'proxy_detected',
      'pass',
      'none',
      'risk_signal',
      'Proxy detection',
      'No proxy signal was detected for this connection.'
    );
  }

  return createCheck(
    'proxy_detected',
    'flagged',
    'warning',
    'risk_signal',
    'Proxy detection',
    'The connection is classified as proxy traffic.'
  );
}

function parseIPv4(value: string): ParsedIP | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;

  const octets = parts.map(part => {
    if (!/^[0-9]{1,3}$/.test(part)) return null;
    const octet = Number(part);
    return octet <= 255 ? octet : null;
  });
  if (octets.some(octet => octet == null)) return null;

  return { family: 4, normalized: octets.join('.') };
}

function expandIPv6Part(part: string): number[] | null {
  if (!part) return [];
  const segments = part.split(':');
  const expanded: number[] = [];

  for (const segment of segments) {
    if (!segment) return null;
    if (segment.includes('.')) {
      const ipv4 = parseIPv4(segment);
      if (!ipv4) return null;
      const octets = ipv4.normalized.split('.').map(Number);
      expanded.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      continue;
    }
    if (!/^[0-9a-f]{1,4}$/i.test(segment)) return null;
    expanded.push(parseInt(segment, 16));
  }

  return expanded;
}

function parseIPv6(value: string): ParsedIP | null {
  const doubleColonIndex = value.indexOf('::');
  if (doubleColonIndex !== value.lastIndexOf('::')) return null;

  const leftText = doubleColonIndex >= 0 ? value.slice(0, doubleColonIndex) : value;
  const rightText = doubleColonIndex >= 0 ? value.slice(doubleColonIndex + 2) : '';
  const left = expandIPv6Part(leftText);
  const right = expandIPv6Part(rightText);
  if (!left || !right) return null;

  let segments: number[];
  if (doubleColonIndex >= 0) {
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    segments = [...left, ...Array<number>(missing).fill(0), ...right];
  } else {
    if (left.length !== 8) return null;
    segments = left;
  }
  if (segments.length !== 8) return null;

  return {
    family: 6,
    normalized: segments.map(segment => segment.toString(16).padStart(4, '0')).join(':'),
  };
}

function parseIP(value: string | null | undefined): ParsedIP | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const withoutBrackets =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  const withoutZone = withoutBrackets.split('%', 1)[0];

  return withoutZone.includes(':') ? parseIPv6(withoutZone) : parseIPv4(withoutZone);
}

function buildWebRTCCheck(
  clientData: ConsistencyClientData,
  connectionIP: string | null | undefined
): ConsistencyCheck {
  if (clientData.rtc_available !== true) {
    return createCheck(
      'webrtc_ip_leak',
      'unavailable',
      'none',
      'contradiction',
      'WebRTC address exposure',
      'WebRTC address exposure could not be checked because collection is unavailable.',
      'unsupported'
    );
  }

  if (!clientData.rtc_public_ip?.trim()) {
    return createCheck(
      'webrtc_ip_leak',
      'pass',
      'none',
      'contradiction',
      'WebRTC address exposure',
      clientData.rtc_mdns_obfuscated
        ? 'No public WebRTC candidate was exposed; local candidates were protected by mDNS.'
        : 'No public WebRTC candidate was exposed.',
      'no_public_candidate'
    );
  }

  const candidate = parseIP(clientData.rtc_public_ip);
  const connection = parseIP(connectionIP);
  if (!candidate || !connection) {
    return createCheck(
      'webrtc_ip_leak',
      'indeterminate',
      'none',
      'contradiction',
      'WebRTC address exposure',
      'The WebRTC candidate could not be compared safely with the connection.',
      'unverifiable'
    );
  }

  if (candidate.family !== connection.family) {
    return createCheck(
      'webrtc_ip_leak',
      'indeterminate',
      'none',
      'contradiction',
      'WebRTC address exposure',
      'The WebRTC candidate and connection use different address families, so no leak is inferred.',
      'different_address_family'
    );
  }

  if (candidate.normalized === connection.normalized) {
    return createCheck(
      'webrtc_ip_leak',
      'pass',
      'none',
      'contradiction',
      'WebRTC address exposure',
      'The public WebRTC candidate matches the current connection.',
      'same_connection'
    );
  }

  return createCheck(
    'webrtc_ip_leak',
    'flagged',
    'critical',
    'contradiction',
    'WebRTC address exposure',
    'WebRTC exposed a different public address in the same address family.',
    'leak_detected'
  );
}

export function buildConsistencyReport(
  clientData: ConsistencyClientData,
  networkData: ConsistencyNetworkData,
  ipIntelSummary: IPIntelSummary | null,
  connectionIP: string | null | undefined
): ConsistencyReport {
  const checks = [
    buildTimezoneCheck(clientData, networkData),
    buildLanguageCheck(clientData, networkData),
    buildDatacenterCheck(ipIntelSummary),
    buildProxyCheck(ipIntelSummary),
    buildWebRTCCheck(clientData, connectionIP),
  ];

  return {
    checks,
    contradiction_count: checks.filter(
      check => check.category === 'contradiction' && check.status === 'flagged'
    ).length,
    risk_signal_count: checks.filter(
      check => check.category === 'risk_signal' && check.status === 'flagged'
    ).length,
  };
}
