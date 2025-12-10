/**
 * Three-Lock Hash Calculation
 * Implements the Gold/Silver/Bronze hash system
 *
 * IMPORTANT: Hash versioning ensures backwards compatibility tracking.
 * When changing hash components, increment the version to distinguish
 * between old and new hashes in the database.
 */

import { sha256 } from './hash.js';

/**
 * Hash version prefix - increment when changing hash components
 * v1: Initial version (2024)
 */
const HASH_VERSION = 'v1';

/**
 * Client fingerprint data structure
 * Matches the FingerprintData interface from @amiunique/core
 */
export interface ClientFingerprint {
  // Hardware dimensions (for Gold Lock)
  hw_canvas_hash?: string;
  hw_webgl_hash?: string;
  hw_webgl_vendor?: string;
  hw_webgl_renderer?: string;
  hw_audio_hash?: string;
  hw_cpu_cores?: number;
  hw_memory?: number;
  hw_screen_width?: number;
  hw_screen_height?: number;
  hw_color_depth?: number;
  hw_pixel_ratio?: number;
  hw_touch_points?: number;
  hw_hdr_support?: boolean;
  hw_color_gamut?: string;
  hw_math_tan?: string;
  hw_math_sin?: string;
  hw_webgl_extensions?: string;

  // System dimensions (for Silver Lock)
  sys_fonts_hash?: string;
  sys_platform?: string;
  sys_user_agent?: string;
  sys_language?: string;
  sys_languages?: string[];
  sys_timezone?: string;
  sys_tz_offset?: number;
  sys_intl_calendar?: string;
  sys_intl_number?: string;

  // Capabilities (for Silver Lock)
  cap_plugins_hash?: string;
  cap_mime_types?: string;
  cap_cookies?: boolean;

  // Media codecs (for Silver Lock)
  med_video_h264?: string;
  med_video_h265?: string;
  med_video_av1?: string;

  // Lie detection results
  lie_os_mismatch?: boolean;
  lie_browser_mismatch?: boolean;
  lie_resolution_mismatch?: boolean;
  lie_timezone_mismatch?: boolean;
  lie_webgl_mismatch?: boolean;

  // Any other fields
  [key: string]: unknown;
}

/**
 * Network fingerprint data from Cloudflare
 */
export interface NetworkFingerprint {
  net_ip_hash: string;
  net_asn?: number;
  net_asn_org?: string;
  net_colo?: string;
  net_country?: string;
  net_city?: string;
  net_region?: string;
  net_postal?: string;
  net_latitude?: number;
  net_longitude?: number;
  net_tls_version?: string;
  net_tls_cipher?: string;
  net_http_protocol?: string;
  net_tcp_rtt?: number;
  net_bot_score?: number;
}

/**
 * Three-Lock hash results
 */
export interface ThreeLockHashes {
  /** Gold Lock - Hardware fingerprint (most stable, survives browser reinstall) */
  gold: string;
  /** Silver Lock - Software fingerprint (changes with browser/OS updates) */
  silver: string;
  /** Bronze Lock - Full session fingerprint (includes network) */
  bronze: string;
}

/**
 * Calculate Gold Lock hash (Hardware fingerprint)
 * Most stable - survives browser reinstall, only changes with hardware
 * @param data - Client fingerprint data
 * @returns Gold Lock hash string
 */
export async function calculateGoldLock(data: ClientFingerprint): Promise<string> {
  const components = [
    HASH_VERSION, // Version prefix for future compatibility
    data.hw_canvas_hash || '',
    data.hw_webgl_hash || '',
    data.hw_webgl_vendor || '',
    data.hw_webgl_renderer || '',
    data.hw_audio_hash || '',
    String(data.hw_cpu_cores || ''),
    String(data.hw_memory || ''),
    String(data.hw_screen_width || ''),
    String(data.hw_screen_height || ''),
    String(data.hw_color_depth || ''),
    String(data.hw_pixel_ratio || ''),
    String(data.hw_touch_points || ''),
    data.hw_hdr_support ? '1' : '0',
    data.hw_color_gamut || '',
    data.hw_math_tan || '',
    data.hw_math_sin || '',
    data.hw_webgl_extensions || '',
  ];

  return sha256(components.join('|'));
}

/**
 * Calculate Silver Lock hash (Software fingerprint)
 * Medium stability - changes with browser/OS updates
 * @param data - Client fingerprint data
 * @returns Silver Lock hash string
 */
export async function calculateSilverLock(data: ClientFingerprint): Promise<string> {
  const components = [
    HASH_VERSION, // Version prefix for future compatibility
    data.sys_fonts_hash || '',
    data.sys_platform || '',
    data.sys_user_agent || '',
    data.sys_language || '',
    JSON.stringify(data.sys_languages || []),
    data.sys_timezone || '',
    String(data.sys_tz_offset || ''),
    data.sys_intl_calendar || '',
    data.sys_intl_number || '',
    data.cap_plugins_hash || '',
    data.cap_mime_types || '',
    data.cap_cookies ? '1' : '0',
    // Media codecs
    data.med_video_h264 || '',
    data.med_video_h265 || '',
    data.med_video_av1 || '',
  ];

  return sha256(components.join('|'));
}

/**
 * Calculate Bronze Lock hash (Full session fingerprint)
 * Least stable - includes network factors that change with location/VPN
 * @param goldLock - Pre-calculated Gold Lock hash
 * @param silverLock - Pre-calculated Silver Lock hash
 * @param network - Network fingerprint from Cloudflare
 * @returns Bronze Lock hash string
 */
export async function calculateBronzeLock(
  goldLock: string,
  silverLock: string,
  network: NetworkFingerprint
): Promise<string> {
  const components = [
    HASH_VERSION, // Version prefix for future compatibility
    goldLock,
    silverLock,
    String(network.net_asn || ''),
    network.net_colo || '',
    network.net_tls_cipher || '',
  ];

  return sha256(components.join('|'));
}

/**
 * Calculate all three locks
 * @param clientData - Client fingerprint data
 * @param networkData - Network fingerprint from Cloudflare
 * @returns Object with all three lock hashes
 */
export async function calculateThreeLocks(
  clientData: ClientFingerprint,
  networkData: NetworkFingerprint
): Promise<ThreeLockHashes> {
  const gold = await calculateGoldLock(clientData);
  const silver = await calculateSilverLock(clientData);
  const bronze = await calculateBronzeLock(gold, silver, networkData);

  return { gold, silver, bronze };
}
