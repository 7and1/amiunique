/**
 * Lie/Spoofing detection collectors
 * Detect inconsistencies that indicate fingerprint spoofing
 */

import type { FingerprintData } from '../types.js';

// ==================== LIE DETECTION RESULTS ====================

export interface LieDetectionResult {
  detected: boolean;
  reason?: string;
}

export interface AllLies {
  os: LieDetectionResult;
  browser: LieDetectionResult;
  resolution: LieDetectionResult;
  timezone: LieDetectionResult;
  webgl: LieDetectionResult;
  language: LieDetectionResult;
  platform: LieDetectionResult;
}

// ==================== OS MISMATCH DETECTION ====================

/**
 * Detect OS spoofing by comparing User-Agent with navigator.platform
 * @param ua - User-Agent string
 * @param platform - navigator.platform value
 * @returns Detection result
 */
export function detectOSMismatch(ua: string, platform: string): LieDetectionResult {
  const uaLower = ua.toLowerCase();
  const platformLower = platform.toLowerCase();

  // Windows checks
  if (uaLower.includes('windows') && !platformLower.includes('win')) {
    return { detected: true, reason: 'UA claims Windows but platform does not' };
  }

  // macOS checks
  if ((uaLower.includes('macintosh') || uaLower.includes('mac os x')) && !platformLower.includes('mac')) {
    return { detected: true, reason: 'UA claims macOS but platform does not' };
  }

  // Linux checks
  if (uaLower.includes('linux') && !uaLower.includes('android') && !platformLower.includes('linux')) {
    return { detected: true, reason: 'UA claims Linux but platform does not' };
  }

  // Android checks
  if (uaLower.includes('android') && !platformLower.includes('linux') && !platformLower.includes('android')) {
    return { detected: true, reason: 'UA claims Android but platform does not match' };
  }

  // iOS checks
  if ((uaLower.includes('iphone') || uaLower.includes('ipad')) && !platformLower.includes('iphone') && !platformLower.includes('ipad')) {
    return { detected: true, reason: 'UA claims iOS but platform does not match' };
  }

  return { detected: false };
}

// ==================== BROWSER MISMATCH DETECTION ====================

/**
 * Detect browser spoofing by checking browser-specific features
 * @param ua - User-Agent string
 * @returns Detection result
 */
export function detectBrowserMismatch(ua: string): LieDetectionResult {
  const uaLower = ua.toLowerCase();

  // Chrome-specific checks
  if (uaLower.includes('chrome') && !uaLower.includes('edg') && !uaLower.includes('opr')) {
    // Chrome should have window.chrome
    if (typeof (window as unknown as { chrome?: unknown }).chrome === 'undefined') {
      return { detected: true, reason: 'UA claims Chrome but window.chrome is missing' };
    }
  }

  // Firefox-specific checks
  if (uaLower.includes('firefox')) {
    // Firefox has InstallTrigger
    if (typeof (window as unknown as { InstallTrigger?: unknown }).InstallTrigger === 'undefined') {
      // Note: InstallTrigger was removed in Firefox 102+
      // Check for other Firefox-specific features
      if (!('mozInnerScreenX' in window)) {
        return { detected: true, reason: 'UA claims Firefox but Firefox-specific features missing' };
      }
    }
  }

  // Safari-specific checks
  if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('android')) {
    // Safari should have pushNotification
    const safariPush = (window as unknown as { safari?: { pushNotification?: unknown } }).safari;
    if (!safariPush?.pushNotification) {
      // Could be mobile Safari which doesn't have this
      if (!uaLower.includes('mobile')) {
        return { detected: true, reason: 'UA claims Safari but Safari-specific features missing' };
      }
    }
  }

  return { detected: false };
}

// ==================== RESOLUTION MISMATCH DETECTION ====================

/**
 * Detect resolution spoofing by comparing screen dimensions
 * @returns Detection result
 */
export function detectResolutionMismatch(): LieDetectionResult {
  // Available screen should not exceed total screen
  if (screen.availWidth > screen.width) {
    return { detected: true, reason: 'Available width exceeds total screen width' };
  }

  if (screen.availHeight > screen.height) {
    return { detected: true, reason: 'Available height exceeds total screen height' };
  }

  // Window should not exceed available screen
  if (window.outerWidth > screen.availWidth) {
    return { detected: true, reason: 'Window width exceeds available screen width' };
  }

  // Check for impossible aspect ratios
  const aspectRatio = screen.width / screen.height;
  if (aspectRatio < 0.3 || aspectRatio > 4) {
    return { detected: true, reason: 'Unusual aspect ratio detected' };
  }

  return { detected: false };
}

// ==================== TIMEZONE MISMATCH DETECTION ====================

/**
 * Detect timezone spoofing by checking consistency
 * @param timezone - Timezone name from Intl.DateTimeFormat
 * @param offset - Timezone offset from Date.getTimezoneOffset()
 * @returns Detection result
 */
export function detectTimezoneMismatch(timezone: string, offset: number): LieDetectionResult {
  // Map of expected offsets for common timezones
  // Note: This is simplified - real implementation would need full tz database
  const tzOffsets: Record<string, number[]> = {
    'America/New_York': [240, 300], // EST/EDT
    'America/Los_Angeles': [420, 480], // PST/PDT
    'America/Chicago': [300, 360], // CST/CDT
    'Europe/London': [0, -60], // GMT/BST
    'Europe/Paris': [-60, -120], // CET/CEST
    'Europe/Berlin': [-60, -120],
    'Asia/Tokyo': [-540],
    'Asia/Shanghai': [-480],
    'Asia/Hong_Kong': [-480],
    'Australia/Sydney': [-600, -660], // AEST/AEDT
  };

  const expectedOffsets = tzOffsets[timezone];
  if (expectedOffsets && !expectedOffsets.includes(offset)) {
    return {
      detected: true,
      reason: `Timezone ${timezone} does not match offset ${offset}`,
    };
  }

  return { detected: false };
}

// ==================== WEBGL MISMATCH DETECTION ====================

/**
 * Detect WebGL spoofing by comparing renderer with UA/platform
 * @param renderer - WebGL renderer string
 * @param vendor - WebGL vendor string
 * @param ua - User-Agent string
 * @returns Detection result
 */
export function detectWebGLMismatch(renderer: string, vendor: string, ua: string): LieDetectionResult {
  const uaLower = ua.toLowerCase();
  const rendererLower = renderer.toLowerCase();

  // Mac with NVIDIA desktop GPU (rare in modern Macs)
  if (uaLower.includes('mac') && rendererLower.includes('nvidia') && !rendererLower.includes('apple')) {
    // Could be legitimate with external GPU, but suspicious
    return { detected: true, reason: 'Mac with NVIDIA GPU is unusual' };
  }

  // Mobile device with desktop GPU
  if (
    (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('android')) &&
    (rendererLower.includes('geforce') || rendererLower.includes('radeon'))
  ) {
    return { detected: true, reason: 'Mobile device with desktop GPU' };
  }

  // iOS device without Apple GPU
  if ((uaLower.includes('iphone') || uaLower.includes('ipad')) && !rendererLower.includes('apple')) {
    return { detected: true, reason: 'iOS device without Apple GPU' };
  }

  // Chrome on Linux claiming to be Mesa but with wrong vendor
  if (uaLower.includes('linux') && rendererLower.includes('mesa') && !vendor.toLowerCase().includes('intel') && !vendor.toLowerCase().includes('amd') && !vendor.toLowerCase().includes('nvidia')) {
    return { detected: true, reason: 'Linux Mesa GPU with unexpected vendor' };
  }

  return { detected: false };
}

// ==================== LANGUAGE MISMATCH DETECTION ====================

/**
 * Detect language spoofing by comparing Accept-Language with Intl
 * @param language - navigator.language
 * @param languages - navigator.languages
 * @returns Detection result
 */
export function detectLanguageMismatch(language: string, languages: string[]): LieDetectionResult {
  // Primary language should be in languages array
  if (languages.length > 0 && !languages.includes(language)) {
    return { detected: true, reason: 'Primary language not in languages array' };
  }

  // Check for suspiciously empty language settings
  if (!language || language === '') {
    return { detected: true, reason: 'Empty primary language' };
  }

  return { detected: false };
}

// ==================== PLATFORM MISMATCH DETECTION ====================

/**
 * Detect platform spoofing by checking navigator properties
 * @param platform - navigator.platform
 * @param ua - User-Agent string
 * @returns Detection result
 */
export function detectPlatformMismatch(platform: string, ua: string): LieDetectionResult {
  // Check for generic/spoofed platform values
  const suspiciousPlatforms = ['', 'undefined', 'null', 'unknown'];

  if (suspiciousPlatforms.includes(platform.toLowerCase())) {
    return { detected: true, reason: 'Suspicious platform value' };
  }

  // 64-bit Windows should have Win64 in platform
  if (ua.includes('WOW64') || ua.includes('Win64')) {
    if (!platform.includes('Win') && !platform.includes('64')) {
      return { detected: true, reason: '64-bit Windows in UA but not in platform' };
    }
  }

  return { detected: false };
}

// ==================== COMBINED LIE DETECTION ====================

/**
 * Run all lie detection checks on fingerprint data
 * @param data - Partial fingerprint data
 * @returns Object with all lie detection results
 */
export function detectAllLies(data: Partial<FingerprintData>): AllLies {
  return {
    os: detectOSMismatch(data.sys_user_agent || '', data.sys_platform || ''),
    browser: detectBrowserMismatch(data.sys_user_agent || ''),
    resolution: detectResolutionMismatch(),
    timezone: detectTimezoneMismatch(data.sys_timezone || '', data.sys_tz_offset || 0),
    webgl: detectWebGLMismatch(data.hw_webgl_renderer || '', data.hw_webgl_vendor || '', data.sys_user_agent || ''),
    language: detectLanguageMismatch(data.sys_language || '', data.sys_languages || []),
    platform: detectPlatformMismatch(data.sys_platform || '', data.sys_user_agent || ''),
  };
}

/**
 * Get simplified lie detection flags for fingerprint
 * @param data - Partial fingerprint data
 * @returns Object with boolean flags
 */
export function getLieFlags(data: Partial<FingerprintData>): {
  lie_os_mismatch: boolean;
  lie_browser_mismatch: boolean;
  lie_resolution_mismatch: boolean;
  lie_timezone_mismatch: boolean;
  lie_webgl_mismatch: boolean;
} {
  const lies = detectAllLies(data);

  return {
    lie_os_mismatch: lies.os.detected,
    lie_browser_mismatch: lies.browser.detected,
    lie_resolution_mismatch: lies.resolution.detected,
    lie_timezone_mismatch: lies.timezone.detected,
    lie_webgl_mismatch: lies.webgl.detected,
  };
}
