/**
 * System/OS fingerprint collectors
 * Platform, User-Agent, Language, Timezone, Intl APIs
 * These are medium stability dimensions (Silver Lock components)
 */

// ==================== NAVIGATOR INFO ====================

export interface NavigatorInfo {
  platform: string;
  userAgent: string;
  language: string;
  languages: string[];
}

/**
 * Get navigator/system information
 * @returns Object with platform, UA, and language info
 */
export function getNavigatorInfo(): NavigatorInfo {
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: [...navigator.languages],
  };
}

// ==================== TIMEZONE INFO ====================

export interface TimezoneInfo {
  timezone: string;
  offset: number;
}

/**
 * Get timezone information
 * @returns Object with timezone name and offset
 */
export function getTimezoneInfo(): TimezoneInfo {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: new Date().getTimezoneOffset(),
  };
}

// ==================== INTL API INFO ====================

export interface IntlInfo {
  calendar: string;
  numberFormat: string;
  collation: string;
}

/**
 * Get Intl API configuration
 * These reveal locale-specific settings
 * @returns Object with calendar, number format, and collation info
 */
export function getIntlInfo(): IntlInfo {
  const dateOpts = Intl.DateTimeFormat().resolvedOptions();
  const numOpts = Intl.NumberFormat().resolvedOptions();
  const collOpts = Intl.Collator().resolvedOptions();

  return {
    calendar: dateOpts.calendar || 'gregory',
    numberFormat: `${numOpts.locale}-${numOpts.numberingSystem}`,
    collation: collOpts.collation || 'default',
  };
}

// ==================== DETAILED SYSTEM PROBES ====================

/**
 * Get DNT (Do Not Track) header status
 * @returns DNT status as string
 */
export function getDoNotTrack(): string {
  const dnt =
    navigator.doNotTrack ||
    (window as unknown as { doNotTrack?: string }).doNotTrack ||
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;

  if (dnt === '1' || dnt === 'yes') return 'enabled';
  if (dnt === '0' || dnt === 'no') return 'disabled';
  return 'unspecified';
}

/**
 * Check if cookies are enabled
 * @returns Boolean indicating cookie support
 */
export function areCookiesEnabled(): boolean {
  return navigator.cookieEnabled;
}

/**
 * Get vendor information
 * @returns Browser vendor string
 */
export function getVendor(): string {
  return navigator.vendor || '';
}

/**
 * Get product information
 * @returns Product name (usually "Gecko")
 */
export function getProduct(): string {
  return navigator.product || '';
}

/**
 * Get build ID (Firefox specific)
 * @returns Build ID string or empty
 */
export function getBuildID(): string {
  return (navigator as unknown as { buildID?: string }).buildID || '';
}

/**
 * Get oscpu (Firefox specific)
 * @returns OS/CPU string or empty
 */
export function getOsCpu(): string {
  return (navigator as unknown as { oscpu?: string }).oscpu || '';
}

/**
 * Get connection type if available
 * @returns Connection info or null
 */
export function getConnectionInfo(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} | null {
  const conn = (navigator as unknown as { connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } }).connection;

  if (!conn) return null;

  return {
    effectiveType: conn.effectiveType,
    downlink: conn.downlink,
    rtt: conn.rtt,
    saveData: conn.saveData,
  };
}

/**
 * Get PDF viewer status
 * @returns Whether built-in PDF viewer is enabled
 */
export function isPdfViewerEnabled(): boolean {
  return (navigator as unknown as { pdfViewerEnabled?: boolean }).pdfViewerEnabled ?? false;
}

/**
 * Get media devices info (without requiring permission)
 * @returns Promise with device kind counts
 */
export async function getMediaDevicesInfo(): Promise<{
  audioinput: number;
  audiooutput: number;
  videoinput: number;
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioinput: devices.filter(d => d.kind === 'audioinput').length,
      audiooutput: devices.filter(d => d.kind === 'audiooutput').length,
      videoinput: devices.filter(d => d.kind === 'videoinput').length,
    };
  } catch {
    return { audioinput: 0, audiooutput: 0, videoinput: 0 };
  }
}

// ==================== CLIENT HINTS API ====================

export interface ClientHintsData {
  /** Whether Client Hints API is available */
  available: boolean;
  /** Browser brand names (e.g., "Chromium", "Chrome") */
  brands: string[];
  /** Full browser brand with versions */
  brandsWithVersion: { brand: string; version: string }[];
  /** Platform name (e.g., "Windows", "macOS") */
  platform: string;
  /** Platform version */
  platformVersion: string;
  /** Mobile device indicator */
  mobile: boolean;
  /** Device model (for mobile devices) */
  model: string;
  /** CPU architecture (e.g., "x86", "arm") */
  architecture: string;
  /** CPU bitness ("32" or "64") */
  bitness: string;
  /** Full version of the browser */
  fullVersion: string;
  /** Is "wow64" (Windows 32-bit on 64-bit) */
  wow64: boolean;
}

/**
 * Get User-Agent Client Hints (modern browsers only)
 * Provides more accurate and structured browser/device info than UA string
 * @returns Promise with Client Hints data
 */
export async function getClientHints(): Promise<ClientHintsData> {
  const result: ClientHintsData = {
    available: false,
    brands: [],
    brandsWithVersion: [],
    platform: '',
    platformVersion: '',
    mobile: false,
    model: '',
    architecture: '',
    bitness: '',
    fullVersion: '',
    wow64: false,
  };

  // Check if Navigator.userAgentData is available (Chromium 90+)
  const nav = navigator as unknown as {
    userAgentData?: {
      brands: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
      getHighEntropyValues?: (hints: string[]) => Promise<{
        platform?: string;
        platformVersion?: string;
        model?: string;
        architecture?: string;
        bitness?: string;
        fullVersionList?: { brand: string; version: string }[];
        uaFullVersion?: string;
        wow64?: boolean;
      }>;
    };
  };

  if (!nav.userAgentData) {
    return result;
  }

  result.available = true;

  // Low entropy values (always available without permission)
  if (nav.userAgentData.brands) {
    result.brands = nav.userAgentData.brands.map(b => b.brand);
    result.brandsWithVersion = nav.userAgentData.brands.map(b => ({
      brand: b.brand,
      version: b.version,
    }));
  }
  result.mobile = nav.userAgentData.mobile;
  result.platform = nav.userAgentData.platform || '';

  // High entropy values (require async call, may be restricted)
  if (nav.userAgentData.getHighEntropyValues) {
    try {
      const highEntropyValues = await nav.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'architecture',
        'bitness',
        'fullVersionList',
        'uaFullVersion',
        'wow64',
      ]);

      result.platform = highEntropyValues.platform || result.platform;
      result.platformVersion = highEntropyValues.platformVersion || '';
      result.model = highEntropyValues.model || '';
      result.architecture = highEntropyValues.architecture || '';
      result.bitness = highEntropyValues.bitness || '';
      result.wow64 = highEntropyValues.wow64 ?? false;

      if (highEntropyValues.fullVersionList?.length) {
        result.fullVersion = highEntropyValues.fullVersionList[0]?.version || '';
        result.brandsWithVersion = highEntropyValues.fullVersionList.map(b => ({
          brand: b.brand,
          version: b.version,
        }));
      } else if (highEntropyValues.uaFullVersion) {
        result.fullVersion = highEntropyValues.uaFullVersion;
      }
    } catch {
      // High entropy values not available or blocked
    }
  }

  return result;
}

// ==================== SPEECH SYNTHESIS FINGERPRINT ====================

/**
 * Get available speech synthesis voices
 * The list of voices is a fingerprinting vector
 * @returns Promise with voice count and hash
 */
export async function getSpeechSynthesisFingerprint(): Promise<{
  available: boolean;
  voiceCount: number;
  voiceListHash: string;
}> {
  if (!('speechSynthesis' in window)) {
    return { available: false, voiceCount: 0, voiceListHash: '' };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ available: true, voiceCount: 0, voiceListHash: '' });
    }, 1000);

    const getVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        clearTimeout(timeout);
        const voiceList = voices
          .map(v => `${v.name}|${v.lang}|${v.localService}`)
          .sort()
          .join(',');
        // Use a simple hash since we can't import sha256 here
        const simpleHash = voiceList.split('').reduce((a, b) => {
          const hash = ((a << 5) - a) + b.charCodeAt(0);
          return hash & hash;
        }, 0).toString(16);
        resolve({
          available: true,
          voiceCount: voices.length,
          voiceListHash: simpleHash,
        });
      }
    };

    // Try immediately
    getVoices();

    // Also listen for voiceschanged event (some browsers load voices async)
    speechSynthesis.addEventListener('voiceschanged', getVoices, { once: true });
  });
}
