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
