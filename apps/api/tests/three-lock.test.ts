/**
 * Unit tests for Three-Lock hash calculation
 * Tests Gold, Silver, and Bronze lock hash generation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGoldLock,
  calculateSilverLock,
  calculateBronzeLock,
  calculateThreeLocks,
  type ClientFingerprint,
  type NetworkFingerprint,
} from '../src/lib/three-lock.js';

// Sample client fingerprint data
const sampleClientFingerprint: ClientFingerprint = {
  // Hardware dimensions
  hw_canvas_hash: 'abc123canvas',
  hw_webgl_hash: 'def456webgl',
  hw_webgl_vendor: 'NVIDIA Corporation',
  hw_webgl_renderer: 'GeForce RTX 3080',
  hw_audio_hash: 'ghi789audio',
  hw_cpu_cores: 8,
  hw_memory: 16,
  hw_screen_width: 1920,
  hw_screen_height: 1080,
  hw_color_depth: 24,
  hw_pixel_ratio: 1,
  hw_touch_points: 0,
  hw_hdr_support: true,
  hw_color_gamut: 'srgb',
  hw_math_tan: '-1.4214488238747245',
  hw_math_sin: '0.8178819121159085',
  hw_webgl_extensions: 'EXT_texture_filter_anisotropic,WEBGL_compressed_texture_s3tc',

  // System dimensions
  sys_fonts_hash: 'fontshash123',
  sys_platform: 'Win32',
  sys_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  sys_language: 'en-US',
  sys_languages: ['en-US', 'en'],
  sys_timezone: 'America/New_York',
  sys_tz_offset: -300,
  sys_intl_calendar: 'gregory',
  sys_intl_number: 'latn',

  // Capabilities
  cap_plugins_hash: 'plugins123',
  cap_mime_types: 'mimetypes456',
  cap_cookies: true,

  // Media codecs
  med_video_h264: 'probably',
  med_video_h265: 'maybe',
  med_video_av1: '',
};

// Sample network fingerprint
const sampleNetworkFingerprint: NetworkFingerprint = {
  net_ip_hash: 'iphash123',
  net_asn: 7922,
  net_asn_org: 'Comcast',
  net_colo: 'EWR',
  net_country: 'US',
  net_city: 'New York',
  net_region: 'NY',
  net_postal: '10001',
  net_latitude: 40.7128,
  net_longitude: -74.006,
  net_tls_version: 'TLSv1.3',
  net_tls_cipher: 'AEAD-AES256-GCM-SHA384',
  net_http_protocol: 'HTTP/2',
  net_tcp_rtt: 15,
  net_bot_score: 99,
};

describe('calculateGoldLock', () => {
  it('should return a valid 64-character hex hash', async () => {
    const hash = await calculateGoldLock(sampleClientFingerprint);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce consistent hash for same input', async () => {
    const hash1 = await calculateGoldLock(sampleClientFingerprint);
    const hash2 = await calculateGoldLock(sampleClientFingerprint);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash when hardware changes', async () => {
    const modified = { ...sampleClientFingerprint, hw_cpu_cores: 16 };
    const hash1 = await calculateGoldLock(sampleClientFingerprint);
    const hash2 = await calculateGoldLock(modified);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle missing optional fields', async () => {
    const minimal: ClientFingerprint = {
      hw_canvas_hash: 'canvas',
    };
    const hash = await calculateGoldLock(minimal);
    expect(hash).toHaveLength(64);
  });

  it('should handle empty fingerprint', async () => {
    const empty: ClientFingerprint = {};
    const hash = await calculateGoldLock(empty);
    expect(hash).toHaveLength(64);
  });

  it('should be affected by WebGL renderer changes', async () => {
    const modified = { ...sampleClientFingerprint, hw_webgl_renderer: 'Intel UHD Graphics' };
    const hash1 = await calculateGoldLock(sampleClientFingerprint);
    const hash2 = await calculateGoldLock(modified);
    expect(hash1).not.toBe(hash2);
  });

  it('should be affected by screen dimension changes', async () => {
    const modified = { ...sampleClientFingerprint, hw_screen_width: 2560, hw_screen_height: 1440 };
    const hash1 = await calculateGoldLock(sampleClientFingerprint);
    const hash2 = await calculateGoldLock(modified);
    expect(hash1).not.toBe(hash2);
  });
});

describe('calculateSilverLock', () => {
  it('should return a valid 64-character hex hash', async () => {
    const hash = await calculateSilverLock(sampleClientFingerprint);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce consistent hash for same input', async () => {
    const hash1 = await calculateSilverLock(sampleClientFingerprint);
    const hash2 = await calculateSilverLock(sampleClientFingerprint);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash when browser changes', async () => {
    const modified = { ...sampleClientFingerprint, sys_user_agent: 'Mozilla/5.0 Firefox/120.0' };
    const hash1 = await calculateSilverLock(sampleClientFingerprint);
    const hash2 = await calculateSilverLock(modified);
    expect(hash1).not.toBe(hash2);
  });

  it('should be affected by timezone changes', async () => {
    const modified = { ...sampleClientFingerprint, sys_timezone: 'Europe/London' };
    const hash1 = await calculateSilverLock(sampleClientFingerprint);
    const hash2 = await calculateSilverLock(modified);
    expect(hash1).not.toBe(hash2);
  });

  it('should be affected by language changes', async () => {
    const modified = { ...sampleClientFingerprint, sys_languages: ['de-DE', 'de'] };
    const hash1 = await calculateSilverLock(sampleClientFingerprint);
    const hash2 = await calculateSilverLock(modified);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty fingerprint', async () => {
    const empty: ClientFingerprint = {};
    const hash = await calculateSilverLock(empty);
    expect(hash).toHaveLength(64);
  });
});

describe('calculateBronzeLock', () => {
  it('should return a valid 64-character hex hash', async () => {
    const gold = await calculateGoldLock(sampleClientFingerprint);
    const silver = await calculateSilverLock(sampleClientFingerprint);
    const bronze = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    expect(bronze).toHaveLength(64);
    expect(bronze).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce consistent hash for same input', async () => {
    const gold = await calculateGoldLock(sampleClientFingerprint);
    const silver = await calculateSilverLock(sampleClientFingerprint);
    const bronze1 = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    const bronze2 = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    expect(bronze1).toBe(bronze2);
  });

  it('should produce different hash when ASN changes', async () => {
    const gold = await calculateGoldLock(sampleClientFingerprint);
    const silver = await calculateSilverLock(sampleClientFingerprint);

    const modified = { ...sampleNetworkFingerprint, net_asn: 15169 }; // Google
    const bronze1 = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    const bronze2 = await calculateBronzeLock(gold, silver, modified);
    expect(bronze1).not.toBe(bronze2);
  });

  it('should produce different hash when colo changes', async () => {
    const gold = await calculateGoldLock(sampleClientFingerprint);
    const silver = await calculateSilverLock(sampleClientFingerprint);

    const modified = { ...sampleNetworkFingerprint, net_colo: 'SFO' };
    const bronze1 = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    const bronze2 = await calculateBronzeLock(gold, silver, modified);
    expect(bronze1).not.toBe(bronze2);
  });

  it('should include TLS cipher in hash', async () => {
    const gold = await calculateGoldLock(sampleClientFingerprint);
    const silver = await calculateSilverLock(sampleClientFingerprint);

    const modified = { ...sampleNetworkFingerprint, net_tls_cipher: 'ECDHE-RSA-AES128-GCM-SHA256' };
    const bronze1 = await calculateBronzeLock(gold, silver, sampleNetworkFingerprint);
    const bronze2 = await calculateBronzeLock(gold, silver, modified);
    expect(bronze1).not.toBe(bronze2);
  });
});

describe('calculateThreeLocks', () => {
  it('should return all three locks', async () => {
    const locks = await calculateThreeLocks(sampleClientFingerprint, sampleNetworkFingerprint);

    expect(locks).toHaveProperty('gold');
    expect(locks).toHaveProperty('silver');
    expect(locks).toHaveProperty('bronze');

    expect(locks.gold).toHaveLength(64);
    expect(locks.silver).toHaveLength(64);
    expect(locks.bronze).toHaveLength(64);
  });

  it('should produce unique hashes for each lock', async () => {
    const locks = await calculateThreeLocks(sampleClientFingerprint, sampleNetworkFingerprint);

    expect(locks.gold).not.toBe(locks.silver);
    expect(locks.gold).not.toBe(locks.bronze);
    expect(locks.silver).not.toBe(locks.bronze);
  });

  it('should produce consistent results', async () => {
    const locks1 = await calculateThreeLocks(sampleClientFingerprint, sampleNetworkFingerprint);
    const locks2 = await calculateThreeLocks(sampleClientFingerprint, sampleNetworkFingerprint);

    expect(locks1.gold).toBe(locks2.gold);
    expect(locks1.silver).toBe(locks2.silver);
    expect(locks1.bronze).toBe(locks2.bronze);
  });

  it('should handle minimal input', async () => {
    const minimalClient: ClientFingerprint = {};
    const minimalNetwork: NetworkFingerprint = {
      net_ip_hash: 'hash',
    };

    const locks = await calculateThreeLocks(minimalClient, minimalNetwork);

    expect(locks.gold).toHaveLength(64);
    expect(locks.silver).toHaveLength(64);
    expect(locks.bronze).toHaveLength(64);
  });
});

describe('Lock stability guarantees', () => {
  it('Gold Lock should NOT change when software changes', async () => {
    const base = { ...sampleClientFingerprint };
    const modified = {
      ...base,
      sys_user_agent: 'Different Browser',
      sys_timezone: 'Different/Timezone',
      cap_plugins_hash: 'different-plugins',
    };

    const hash1 = await calculateGoldLock(base);
    const hash2 = await calculateGoldLock(modified);
    expect(hash1).toBe(hash2); // Gold should be unaffected by software
  });

  it('Silver Lock should NOT change when hardware changes', async () => {
    const base = { ...sampleClientFingerprint };
    const modified = {
      ...base,
      hw_canvas_hash: 'different-canvas',
      hw_cpu_cores: 32,
      hw_screen_width: 3840,
    };

    const hash1 = await calculateSilverLock(base);
    const hash2 = await calculateSilverLock(modified);
    expect(hash1).toBe(hash2); // Silver should be unaffected by hardware
  });

  it('Bronze Lock should change when network changes', async () => {
    const locks1 = await calculateThreeLocks(sampleClientFingerprint, sampleNetworkFingerprint);
    const locks2 = await calculateThreeLocks(sampleClientFingerprint, {
      ...sampleNetworkFingerprint,
      net_asn: 99999,
    });

    // Gold and Silver should stay same
    expect(locks1.gold).toBe(locks2.gold);
    expect(locks1.silver).toBe(locks2.silver);
    // Bronze should change
    expect(locks1.bronze).not.toBe(locks2.bronze);
  });
});
