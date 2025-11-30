/**
 * @amiunique/core
 * Browser fingerprinting core library with 80+ dimensions
 */

// Types
export type {
  FingerprintData,
  NetworkFingerprint,
  FullFingerprintReport,
  ThreeLockHashes,
  AnalysisResult,
  GlobalStats,
} from './types.js';

// Main collection functions
export { collectFingerprint, collectFingerprintWithProgress } from './collect.js';
export type { CollectionProgressCallback } from './collect.js';

// Utilities
export { sha256, hashValues, hashObject } from './utils/hash.js';
export { detectFonts, getFontsHash, getFontCount } from './utils/fonts.js';

// Individual collectors (for advanced usage)
export {
  getCanvasFingerprint,
  getWebGLFingerprint,
  getAudioFingerprint,
  getScreenInfo,
  getHardwareInfo,
  getMathFingerprint,
  getMediaFeatures,
  getGamepadCount,
  hasVRDisplays,
} from './collectors/hardware.js';

export {
  getNavigatorInfo,
  getTimezoneInfo,
  getIntlInfo,
  getDoNotTrack,
  areCookiesEnabled,
  getVendor,
  getProduct,
  getBuildID,
  getOsCpu,
  getConnectionInfo,
  isPdfViewerEnabled,
  getMediaDevicesInfo,
} from './collectors/system.js';

export {
  getStorageCapabilities,
  getAPICapabilities,
  getPluginsFingerprint,
  getMimeTypesFingerprint,
  getPermissions,
  isFeatureAllowed,
  getBatteryStatus,
} from './collectors/capabilities.js';

export {
  getAudioCodecs,
  getVideoCodecs,
  getCodecSupport,
  checkMediaCapabilities,
  getDRMSupport,
  getSpeechVoices,
} from './collectors/media.js';

export {
  detectOSMismatch,
  detectBrowserMismatch,
  detectResolutionMismatch,
  detectTimezoneMismatch,
  detectWebGLMismatch,
  detectLanguageMismatch,
  detectPlatformMismatch,
  detectAllLies,
  getLieFlags,
} from './collectors/lies.js';

// Types from collectors
export type { WebGLInfo, ScreenInfo, HardwareInfo, MathFingerprint, MediaFeatures } from './collectors/hardware.js';
export type { NavigatorInfo, TimezoneInfo, IntlInfo } from './collectors/system.js';
export type { StorageCapabilities, APICapabilities, BatteryStatus } from './collectors/capabilities.js';
export type { AudioCodecs, VideoCodecs, CodecSupport, MediaCapabilityInfo, DRMSupport } from './collectors/media.js';
export type { LieDetectionResult, AllLies } from './collectors/lies.js';
