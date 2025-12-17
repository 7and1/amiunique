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

// ==================== WEBRTC FINGERPRINT ====================

export interface WebRTCFingerprint {
  /** Whether WebRTC is available */
  available: boolean;
  /** Local IP address (if leaked) */
  localIP: string | null;
  /** Public IP address (if leaked via STUN) */
  publicIP: string | null;
  /** Whether STUN server is reachable */
  stunAvailable: boolean;
  /** Detected IP type: 'ipv4', 'ipv6', 'both', 'none' */
  ipType: 'ipv4' | 'ipv6' | 'both' | 'none';
  /** Number of media devices detected */
  mediaDeviceCount: number;
  /** Hash of available media device kinds */
  mediaDeviceHash: string;
}

/**
 * Extract IP addresses from WebRTC candidates
 * This can reveal local and public IPs even through VPNs
 */
export async function getWebRTCFingerprint(): Promise<WebRTCFingerprint> {
  const result: WebRTCFingerprint = {
    available: typeof RTCPeerConnection !== 'undefined',
    localIP: null,
    publicIP: null,
    stunAvailable: false,
    ipType: 'none',
    mediaDeviceCount: 0,
    mediaDeviceHash: '',
  };

  if (!result.available) {
    return result;
  }

  // Get media devices count (fingerprinting vector)
  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      result.mediaDeviceCount = devices.length;
      const deviceKinds = devices.map(d => d.kind).sort().join(',');
      result.mediaDeviceHash = await sha256(deviceKinds);
    }
  } catch {
    // Media devices enumeration blocked
  }

  // WebRTC IP leak detection
  return new Promise((resolve) => {
    const updateIPType = () => {
      const hasIPv4 = (result.localIP?.includes('.') || result.publicIP?.includes('.')) ?? false;
      const hasIPv6 = (result.localIP?.includes(':') || result.publicIP?.includes(':')) ?? false;
      if (hasIPv4 && hasIPv6) {
        result.ipType = 'both';
      } else if (hasIPv4) {
        result.ipType = 'ipv4';
      } else if (hasIPv6) {
        result.ipType = 'ipv6';
      }
    };

    const timeout = setTimeout(() => {
      updateIPType();
      resolve(result);
    }, 3000);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      const localIPs = new Set<string>();
      const publicIPs = new Set<string>();

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          // Gathering complete
          clearTimeout(timeout);
          pc.close();
          updateIPType();
          resolve(result);
          return;
        }

        const candidate = event.candidate.candidate;
        if (!candidate) return;

        // Extract IP addresses from ICE candidate
        // Format: candidate:... typ host/srflx/relay
        const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}|([a-f0-9]{1,4}:){7}[a-f0-9]{1,4}|([a-f0-9]{1,4}:){1,7}:|:([a-f0-9]{1,4}:){1,7}|([a-f0-9]{1,4}:){1,6}:[a-f0-9]{1,4}/gi;
        const matches = candidate.match(ipRegex);

        if (matches) {
          matches.forEach((ip) => {
            // Filter out mDNS addresses (.local)
            if (ip.endsWith('.local')) return;

            // Check if it's a local/private IP
            if (isPrivateIP(ip)) {
              localIPs.add(ip);
              if (!result.localIP) result.localIP = ip;
            } else {
              publicIPs.add(ip);
              if (!result.publicIP) {
                result.publicIP = ip;
                result.stunAvailable = true;
              }
            }
          });
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          pc.close();
          updateIPType();
          resolve(result);
        }
      };

      // Create offer to trigger ICE gathering
      pc.createDataChannel('fp');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timeout);
          resolve(result);
        });

    } catch {
      clearTimeout(timeout);
      resolve(result);
    }
  });
}

/**
 * Check if an IP address is private/local
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('169.254.')) return true; // Link-local

  // IPv6 private ranges
  if (ip.toLowerCase().startsWith('fe80:')) return true; // Link-local
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true; // Unique local
  if (ip === '::1') return true; // Loopback

  return false;
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
