import { describe, expect, it } from 'vitest';
import {
  redactFingerprintForPersistence,
  redactFingerprintForResponse,
} from '../src/lib/privacy.js';

describe('redactFingerprintForPersistence', () => {
  it('keeps client verdicts while stripping all IP and network metadata from D1', () => {
    const report = {
      hw_canvas_hash: 'canvas-hash',
      sys_language: 'en-US',
      rtc_available: true,
      rtc_local_ip: '192.168.1.20',
      rtc_public_ip: '198.51.100.10',
      rtc_mdns_obfuscated: true,
      rtc_stun_available: true,
      rtc_ip_type: 'both',
      rtc_media_device_count: 3,
      aux_webrtc_ip: '198.51.100.10',
      net_ip_hash: 'hashed-connection',
      net_country: 'US',
      net_timezone: 'America/New_York',
      net_asn: 64500,
    };

    expect(redactFingerprintForPersistence(report)).toEqual({
      hw_canvas_hash: 'canvas-hash',
      sys_language: 'en-US',
      rtc_available: true,
      rtc_mdns_obfuscated: true,
      rtc_stun_available: true,
      rtc_ip_type: 'both',
      rtc_media_device_count: 3,
    });
  });

  it('keeps request-scoped network metadata in the response without an IP hash', () => {
    expect(
      redactFingerprintForResponse({
        hw_canvas_hash: 'canvas-hash',
        rtc_public_ip: '198.51.100.10',
        net_ip_hash: 'hashed-connection',
        net_country: 'US',
        net_city: 'New York',
        net_asn: 64500,
      })
    ).toEqual({
      hw_canvas_hash: 'canvas-hash',
      net_country: 'US',
      net_city: 'New York',
      net_asn: 64500,
    });
  });

  it('uses an allowlist and removes unknown client and network-shaped fields', () => {
    const persisted = redactFingerprintForPersistence({
      hw_cpu_cores: 8,
      future_client_field: 'not-yet-reviewed',
      net_future_field: 'not-yet-reviewed',
      arbitrary_secret: 'must-not-persist',
    });

    expect(persisted).toEqual({ hw_cpu_cores: 8 });
  });

  it('does not mutate the input report or its nested values', () => {
    const report = {
      sys_languages: ['en-US', 'en'],
      cap_permissions: { camera: 'prompt' },
      rtc_public_ip: '198.51.100.10',
      net_country: 'US',
    };
    const original = {
      ...report,
      sys_languages: [...report.sys_languages],
      cap_permissions: { ...report.cap_permissions },
    };

    const persisted = redactFingerprintForPersistence(report);

    expect(report).toEqual(original);
    expect(persisted).not.toBe(report);
  });
});
