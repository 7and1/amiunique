/**
 * Browser capability collectors
 * Storage, Workers, WebAssembly, APIs, Plugins
 */

import { sha256 } from '../utils/hash.js';

// ==================== STORAGE CAPABILITIES ====================

export interface StorageCapabilities {
  cookies: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  openDatabase: boolean;
}

/**
 * Test various storage mechanisms
 * @returns Object with storage availability flags
 */
export function getStorageCapabilities(): StorageCapabilities {
  let localStorageAvailable = false;
  let sessionStorageAvailable = false;

  // Test localStorage
  try {
    if (window.localStorage) {
      window.localStorage.setItem('__fp_test__', 'test');
      window.localStorage.removeItem('__fp_test__');
      localStorageAvailable = true;
    }
  } catch {
    localStorageAvailable = false;
  }

  // Test sessionStorage
  try {
    if (window.sessionStorage) {
      window.sessionStorage.setItem('__fp_test__', 'test');
      window.sessionStorage.removeItem('__fp_test__');
      sessionStorageAvailable = true;
    }
  } catch {
    sessionStorageAvailable = false;
  }

  return {
    cookies: navigator.cookieEnabled,
    localStorage: localStorageAvailable,
    sessionStorage: sessionStorageAvailable,
    indexedDB: typeof indexedDB !== 'undefined',
    openDatabase: typeof (window as unknown as { openDatabase?: unknown }).openDatabase === 'function',
  };
}

// ==================== API CAPABILITIES ====================

export interface APICapabilities {
  serviceWorker: boolean;
  webWorker: boolean;
  wasm: boolean;
  sharedArrayBuffer: boolean;
  bluetooth: boolean;
  usb: boolean;
  pdfViewer: boolean;
  webGL: boolean;
  webGL2: boolean;
  webGPU: boolean;
  offscreenCanvas: boolean;
  audioWorklet: boolean;
  webRTC: boolean;
  webSocket: boolean;
  intersectionObserver: boolean;
  mutationObserver: boolean;
  resizeObserver: boolean;
  performanceObserver: boolean;
}

/**
 * Test various browser API availability
 * @returns Object with API availability flags
 */
export function getAPICapabilities(): APICapabilities {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    webWorker: typeof Worker !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    pdfViewer: (navigator as unknown as { pdfViewerEnabled?: boolean }).pdfViewerEnabled ?? false,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })(),
    webGL2: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch {
        return false;
      }
    })(),
    webGPU: 'gpu' in navigator,
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    audioWorklet: typeof AudioWorklet !== 'undefined',
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webSocket: typeof WebSocket !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    mutationObserver: typeof MutationObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    performanceObserver: typeof PerformanceObserver !== 'undefined',
  };
}

// ==================== PLUGINS FINGERPRINT ====================

/**
 * Get hash of installed plugins
 * Note: Modern browsers have limited plugin enumeration
 * @returns SHA-256 hash of plugin list
 */
export async function getPluginsFingerprint(): Promise<string> {
  const plugins: string[] = [];

  try {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push(`${plugin.name}::${plugin.filename}::${plugin.description}`);
    }
  } catch {
    // Plugins enumeration may be blocked
  }

  return sha256(plugins.sort().join(','));
}

/**
 * Get hash of supported MIME types
 * @returns SHA-256 hash of MIME type list
 */
export async function getMimeTypesFingerprint(): Promise<string> {
  const mimes: string[] = [];

  try {
    for (let i = 0; i < navigator.mimeTypes.length; i++) {
      const mime = navigator.mimeTypes[i];
      mimes.push(`${mime.type}::${mime.suffixes}`);
    }
  } catch {
    // MIME types enumeration may be blocked
  }

  return sha256(mimes.sort().join(','));
}

// ==================== PERMISSIONS ====================

/**
 * Permission names to query - these are a subset that work across browsers
 * Not all permissions are supported in all browsers
 */
const PERMISSION_NAMES = [
  'geolocation',
  'notifications',
  'push',
  'midi',
  'camera',
  'microphone',
  'background-sync',
  'persistent-storage',
  'accelerometer',
  'gyroscope',
  'magnetometer',
  'clipboard-read',
  'clipboard-write',
  'screen-wake-lock',
] as const;

/**
 * Query permission states for various APIs
 * @returns Record of permission names to states
 */
export async function getPermissions(): Promise<Record<string, string>> {
  const permissions: Record<string, string> = {};

  if (!('permissions' in navigator)) {
    return permissions;
  }

  for (const name of PERMISSION_NAMES) {
    try {
      // Use type assertion since browser support varies
      const status = await navigator.permissions.query({ name: name as globalThis.PermissionName });
      permissions[name] = status.state;
    } catch {
      permissions[name] = 'unsupported';
    }
  }

  return permissions;
}

// ==================== FEATURE POLICY / PERMISSIONS POLICY ====================

/**
 * Check if a feature is allowed by Permissions Policy
 * @param feature - Feature name to check
 * @returns Whether the feature is allowed
 */
export function isFeatureAllowed(feature: string): boolean {
  try {
    if ('featurePolicy' in document) {
      const policy = (document as unknown as { featurePolicy: { allowsFeature: (f: string) => boolean } }).featurePolicy;
      return policy.allowsFeature(feature);
    }
    if ('permissions' in document) {
      const policy = (document as unknown as { permissions: { allowsFeature?: (f: string) => boolean } }).permissions;
      if (policy.allowsFeature) {
        return policy.allowsFeature(feature);
      }
    }
  } catch {
    // Feature policy not supported
  }
  return true; // Assume allowed if can't check
}

// ==================== BATTERY STATUS ====================

export interface BatteryStatus {
  level?: number;
  charging?: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

/**
 * Get battery status if available
 * Note: This API is deprecated in many browsers
 * @returns Battery status or null
 */
export async function getBatteryStatus(): Promise<BatteryStatus | null> {
  try {
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        chargingTime: number;
        dischargingTime: number;
      }>;
    };

    if (!nav.getBattery) return null;

    const battery = await nav.getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  } catch {
    return null;
  }
}
