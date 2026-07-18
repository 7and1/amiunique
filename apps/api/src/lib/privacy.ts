import { FingerprintSchema } from './validation.js';

const PersistenceClientSchema = FingerprintSchema.omit({
  rtc_local_ip: true,
  rtc_public_ip: true,
  aux_webrtc_ip: true,
}).strip();

const RESPONSE_NETWORK_KEYS = [
  'net_asn',
  'net_asn_org',
  'net_colo',
  'net_country',
  'net_timezone',
  'net_city',
  'net_region',
  'net_postal',
  'net_latitude',
  'net_longitude',
  'net_tls_version',
  'net_tls_cipher',
  'net_http_protocol',
  'net_tcp_rtt',
  'net_bot_score',
] as const;

/**
 * Project a validated fingerprint report onto the fields allowed in D1.
 * Network metadata and raw WebRTC addresses never cross this boundary.
 * Country is stored separately in the visits table for aggregate statistics.
 */
export function redactFingerprintForPersistence(
  report: Record<string, unknown>
): Record<string, unknown> {
  return PersistenceClientSchema.parse(report);
}

/**
 * Project the current visitor's report for the one-time API response.
 * Raw IP addresses and the connection-IP hash are excluded, while the
 * request-scoped Cloudflare metadata needed by the UI remains available.
 */
export function redactFingerprintForResponse(
  report: Record<string, unknown>
): Record<string, unknown> {
  const response: Record<string, unknown> = PersistenceClientSchema.parse(report);

  for (const key of RESPONSE_NETWORK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(report, key) && report[key] !== undefined) {
      response[key] = report[key];
    }
  }

  return response;
}
