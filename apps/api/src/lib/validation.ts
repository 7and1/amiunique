/**
 * Zod validation schemas for API endpoints
 */

import { z } from 'zod';

/**
 * Client fingerprint validation schema
 * Validates the 80+ dimension fingerprint payload from the browser
 */
export const FingerprintSchema = z.object({
  // Hardware dimensions (20) - mostly optional as some browsers don't support all
  hw_canvas_hash: z.string().max(128).optional(),
  hw_webgl_hash: z.string().max(128).optional(),
  hw_webgl_vendor: z.string().max(256).optional(),
  hw_webgl_renderer: z.string().max(256).optional(),
  hw_audio_hash: z.string().max(128).optional(),
  hw_cpu_cores: z.number().int().min(0).max(256).optional(),
  hw_memory: z.number().min(0).max(1024).optional(),
  hw_screen_width: z.number().int().min(0).max(10000).optional(),
  hw_screen_height: z.number().int().min(0).max(10000).optional(),
  hw_color_depth: z.number().int().min(0).max(64).optional(),
  hw_pixel_ratio: z.number().min(0).max(10).optional(),
  hw_hdr_support: z.boolean().optional(),
  hw_color_gamut: z.string().max(32).optional(),
  hw_contrast_pref: z.string().max(32).optional(),
  hw_touch_points: z.number().int().min(0).max(256).optional(),
  hw_vr_displays: z.boolean().optional(),
  hw_gamepads: z.number().int().min(0).max(16).optional(),
  hw_math_tan: z.string().max(64).optional(),
  hw_math_sin: z.string().max(64).optional(),
  hw_webgl_extensions: z.string().max(1024).optional(),

  // System dimensions (15)
  sys_platform: z.string().max(64).optional(),
  sys_user_agent: z.string().max(512).optional(),
  sys_language: z.string().max(16).optional(),
  sys_languages: z.array(z.string().max(16)).max(32).optional(),
  sys_timezone: z.string().max(64).optional(),
  sys_tz_offset: z.number().int().min(-1440).max(1440).optional(),
  sys_intl_calendar: z.string().max(32).optional(),
  sys_intl_number: z.string().max(64).optional(),
  sys_intl_collation: z.string().max(32).optional(),
  sys_fonts_hash: z.string().max(128).optional(),
  sys_dark_mode: z.boolean().optional(),
  sys_reduced_motion: z.boolean().optional(),
  sys_inverted_colors: z.boolean().optional(),
  sys_forced_colors: z.boolean().optional(),
  sys_pointer_type: z.string().max(16).optional(),

  // Capabilities (15)
  cap_cookies: z.boolean().optional(),
  cap_local_storage: z.boolean().optional(),
  cap_session_storage: z.boolean().optional(),
  cap_indexed_db: z.boolean().optional(),
  cap_open_database: z.boolean().optional(),
  cap_service_worker: z.boolean().optional(),
  cap_web_worker: z.boolean().optional(),
  cap_wasm: z.boolean().optional(),
  cap_shared_array: z.boolean().optional(),
  cap_bluetooth: z.boolean().optional(),
  cap_usb: z.boolean().optional(),
  cap_permissions: z.record(z.string(), z.string()).optional(),
  cap_plugins_hash: z.string().max(128).optional(),
  cap_mime_types: z.string().max(128).optional(),
  cap_pdf_viewer: z.boolean().optional(),

  // Media codecs (10)
  med_audio_mp3: z.string().max(16).optional(),
  med_audio_aac: z.string().max(16).optional(),
  med_audio_ogg: z.string().max(16).optional(),
  med_audio_wav: z.string().max(16).optional(),
  med_audio_opus: z.string().max(16).optional(),
  med_video_h264: z.string().max(16).optional(),
  med_video_h265: z.string().max(16).optional(),
  med_video_vp8: z.string().max(16).optional(),
  med_video_vp9: z.string().max(16).optional(),
  med_video_av1: z.string().max(16).optional(),

  // Auxiliary (volatile)
  aux_battery_level: z.number().min(0).max(1).optional(),
  aux_battery_charging: z.boolean().optional(),
  aux_window_width: z.number().int().min(0).max(10000).optional(),
  aux_window_height: z.number().int().min(0).max(10000).optional(),
  aux_webrtc_ip: z.string().max(128).optional(),

  // Lie detection
  lie_os_mismatch: z.boolean().optional(),
  lie_browser_mismatch: z.boolean().optional(),
  lie_resolution_mismatch: z.boolean().optional(),
  lie_timezone_mismatch: z.boolean().optional(),
  lie_webgl_mismatch: z.boolean().optional(),
}).passthrough(); // Allow additional fields for future expansion

export type ValidatedFingerprint = z.infer<typeof FingerprintSchema>;

/**
 * Opt-out/deletion request schema
 */
export const DeletionRequestSchema = z.object({
  hash_type: z.enum(['hardware', 'software', 'full']),
  hash_value: z.string().length(64), // SHA-256 hex string
  email: z.string().email().max(256).optional(),
  reason: z.string().max(1000).optional(),
});

export type DeletionRequest = z.infer<typeof DeletionRequestSchema>;
