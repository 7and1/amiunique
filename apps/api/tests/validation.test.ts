/**
 * Unit tests for Zod validation schemas
 * Tests FingerprintSchema and DeletionRequestSchema
 */

import { describe, it, expect } from 'vitest';
import { FingerprintSchema, DeletionRequestSchema } from '../src/lib/validation.js';

describe('FingerprintSchema', () => {
  describe('Valid inputs', () => {
    it('should accept minimal fingerprint', () => {
      const result = FingerprintSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept complete fingerprint', () => {
      const complete = {
        hw_canvas_hash: 'abc123',
        hw_webgl_hash: 'def456',
        hw_webgl_vendor: 'NVIDIA',
        hw_webgl_renderer: 'GeForce RTX',
        hw_audio_hash: 'audio123',
        hw_cpu_cores: 8,
        hw_memory: 16,
        hw_screen_width: 1920,
        hw_screen_height: 1080,
        hw_color_depth: 24,
        hw_pixel_ratio: 2,
        hw_hdr_support: true,
        hw_color_gamut: 'p3',
        hw_contrast_pref: 'more',
        hw_touch_points: 5,
        hw_vr_displays: false,
        hw_gamepads: 0,
        hw_math_tan: '-1.4214',
        hw_math_sin: '0.8178',
        hw_webgl_extensions: 'EXT_texture',
        sys_platform: 'Win32',
        sys_user_agent: 'Mozilla/5.0',
        sys_language: 'en-US',
        sys_languages: ['en-US', 'en'],
        sys_timezone: 'America/New_York',
        sys_tz_offset: -300,
        sys_intl_calendar: 'gregory',
        sys_intl_number: 'latn',
        sys_intl_collation: 'standard',
        sys_fonts_hash: 'fonts123',
        sys_dark_mode: true,
        sys_reduced_motion: false,
        sys_inverted_colors: false,
        sys_forced_colors: false,
        sys_pointer_type: 'fine',
        cap_cookies: true,
        cap_local_storage: true,
        cap_session_storage: true,
        cap_indexed_db: true,
        cap_open_database: false,
        cap_service_worker: true,
        cap_web_worker: true,
        cap_wasm: true,
        cap_shared_array: false,
        cap_bluetooth: false,
        cap_usb: false,
        cap_permissions: { camera: 'granted', microphone: 'denied' },
        cap_plugins_hash: 'plugins123',
        cap_mime_types: 'mimes123',
        cap_pdf_viewer: true,
        med_audio_mp3: 'probably',
        med_audio_aac: 'probably',
        med_audio_ogg: 'probably',
        med_audio_wav: 'probably',
        med_audio_opus: 'probably',
        med_video_h264: 'probably',
        med_video_h265: 'maybe',
        med_video_vp8: 'probably',
        med_video_vp9: 'probably',
        med_video_av1: '',
        aux_battery_level: 0.85,
        aux_battery_charging: true,
        aux_window_width: 1800,
        aux_window_height: 900,
        aux_webrtc_ip: '192.168.1.1',
        lie_os_mismatch: false,
        lie_browser_mismatch: false,
        lie_resolution_mismatch: false,
        lie_timezone_mismatch: false,
        lie_webgl_mismatch: false,
      };

      const result = FingerprintSchema.safeParse(complete);
      expect(result.success).toBe(true);
    });

    it('should allow additional unknown fields (passthrough)', () => {
      const withExtra = {
        hw_canvas_hash: 'abc123',
        future_field: 'some value',
        another_unknown: 42,
      };

      const result = FingerprintSchema.safeParse(withExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.future_field).toBe('some value');
      }
    });
  });

  describe('Hardware field validation', () => {
    it('should reject hw_cpu_cores outside range', () => {
      expect(FingerprintSchema.safeParse({ hw_cpu_cores: -1 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_cpu_cores: 300 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_cpu_cores: 128 }).success).toBe(true);
    });

    it('should reject hw_memory outside range', () => {
      expect(FingerprintSchema.safeParse({ hw_memory: -1 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_memory: 2000 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_memory: 512 }).success).toBe(true);
    });

    it('should reject hw_screen dimensions outside range', () => {
      expect(FingerprintSchema.safeParse({ hw_screen_width: -100 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_screen_width: 20000 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ hw_screen_height: 15000 }).success).toBe(false);
    });

    it('should reject strings exceeding max length', () => {
      expect(FingerprintSchema.safeParse({
        hw_canvas_hash: 'x'.repeat(200), // max 128
      }).success).toBe(false);

      expect(FingerprintSchema.safeParse({
        hw_webgl_vendor: 'x'.repeat(300), // max 256
      }).success).toBe(false);
    });

    it('should reject non-integer cpu cores', () => {
      expect(FingerprintSchema.safeParse({ hw_cpu_cores: 4.5 }).success).toBe(false);
    });
  });

  describe('System field validation', () => {
    it('should validate sys_tz_offset range', () => {
      // Valid range: -1440 to 1440 (24 hours in minutes)
      expect(FingerprintSchema.safeParse({ sys_tz_offset: -300 }).success).toBe(true);
      expect(FingerprintSchema.safeParse({ sys_tz_offset: 1440 }).success).toBe(true);
      expect(FingerprintSchema.safeParse({ sys_tz_offset: -1441 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ sys_tz_offset: 1441 }).success).toBe(false);
    });

    it('should validate sys_languages array', () => {
      expect(FingerprintSchema.safeParse({
        sys_languages: ['en-US', 'en', 'de'],
      }).success).toBe(true);

      // Array too large
      const tooMany = Array(40).fill('en');
      expect(FingerprintSchema.safeParse({
        sys_languages: tooMany, // max 32
      }).success).toBe(false);
    });

    it('should validate sys_user_agent max length', () => {
      expect(FingerprintSchema.safeParse({
        sys_user_agent: 'x'.repeat(600), // max 512
      }).success).toBe(false);
    });
  });

  describe('Capability field validation', () => {
    it('should accept boolean capability fields', () => {
      const result = FingerprintSchema.safeParse({
        cap_cookies: true,
        cap_local_storage: false,
        cap_wasm: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate cap_permissions as record', () => {
      expect(FingerprintSchema.safeParse({
        cap_permissions: { camera: 'granted', mic: 'denied' },
      }).success).toBe(true);

      expect(FingerprintSchema.safeParse({
        cap_permissions: 'not an object',
      }).success).toBe(false);
    });
  });

  describe('Auxiliary field validation', () => {
    it('should validate aux_battery_level range', () => {
      expect(FingerprintSchema.safeParse({ aux_battery_level: 0.5 }).success).toBe(true);
      expect(FingerprintSchema.safeParse({ aux_battery_level: 0 }).success).toBe(true);
      expect(FingerprintSchema.safeParse({ aux_battery_level: 1 }).success).toBe(true);
      expect(FingerprintSchema.safeParse({ aux_battery_level: -0.1 }).success).toBe(false);
      expect(FingerprintSchema.safeParse({ aux_battery_level: 1.5 }).success).toBe(false);
    });

    it('should validate aux_window dimensions', () => {
      expect(FingerprintSchema.safeParse({
        aux_window_width: 1920,
        aux_window_height: 1080,
      }).success).toBe(true);

      expect(FingerprintSchema.safeParse({
        aux_window_width: -100,
      }).success).toBe(false);
    });
  });
});

describe('DeletionRequestSchema', () => {
  describe('Valid inputs', () => {
    it('should accept valid hardware deletion request', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid software deletion request', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'software',
        hash_value: 'b'.repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid full deletion request', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'full',
        hash_value: 'c'.repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional email and reason', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(64),
        email: 'user@example.com',
        reason: 'I want my data deleted',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs', () => {
    it('should reject invalid hash_type', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'invalid',
        hash_value: 'a'.repeat(64),
      });
      expect(result.success).toBe(false);
    });

    it('should reject hash_value not 64 characters', () => {
      expect(DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'too-short',
      }).success).toBe(false);

      expect(DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(65), // too long
      }).success).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
      }).success).toBe(false);

      expect(DeletionRequestSchema.safeParse({
        hash_value: 'a'.repeat(64),
      }).success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(64),
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding max length', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(64),
        reason: 'x'.repeat(1100), // max 1000
      });
      expect(result.success).toBe(false);
    });

    it('should reject email exceeding max length', () => {
      const result = DeletionRequestSchema.safeParse({
        hash_type: 'hardware',
        hash_value: 'a'.repeat(64),
        email: 'a'.repeat(250) + '@example.com', // exceeds 256
      });
      expect(result.success).toBe(false);
    });
  });
});
