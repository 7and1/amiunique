/**
 * Main fingerprint collection orchestrator
 * Runs all collectors in parallel where possible
 */

import type { FingerprintData } from './types.js';
import {
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
import { getNavigatorInfo, getTimezoneInfo, getIntlInfo, getClientHints, getSpeechSynthesisFingerprint } from './collectors/system.js';
import {
  getStorageCapabilities,
  getAPICapabilities,
  getPluginsFingerprint,
  getMimeTypesFingerprint,
  getPermissions,
  getBatteryStatus,
  getWebRTCFingerprint,
} from './collectors/capabilities.js';
import { getAudioCodecs, getVideoCodecs } from './collectors/media.js';
import { getLieFlags } from './collectors/lies.js';
import { getFontsHash } from './utils/fonts.js';

/**
 * Collect all fingerprint dimensions
 * Runs collectors in parallel for performance
 * @returns Complete fingerprint data object
 */
export async function collectFingerprint(): Promise<FingerprintData> {
  // Run async collectors in parallel
  const [
    canvasHash,
    webglData,
    audioHash,
    fontsHash,
    pluginsHash,
    mimeTypesHash,
    permissions,
    battery,
    webrtcData,
    clientHints,
    speechData,
  ] = await Promise.all([
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getAudioFingerprint(),
    getFontsHash(),
    getPluginsFingerprint(),
    getMimeTypesFingerprint(),
    getPermissions(),
    getBatteryStatus(),
    getWebRTCFingerprint(),
    getClientHints(),
    getSpeechSynthesisFingerprint(),
  ]);

  // Get sync collectors
  const screenInfo = getScreenInfo();
  const hardwareInfo = getHardwareInfo();
  const mathFp = getMathFingerprint();
  const mediaFeatures = getMediaFeatures();
  const navInfo = getNavigatorInfo();
  const tzInfo = getTimezoneInfo();
  const intlInfo = getIntlInfo();
  const storageCapabilities = getStorageCapabilities();
  const apiCapabilities = getAPICapabilities();
  const audioCodecs = getAudioCodecs();
  const videoCodecs = getVideoCodecs();

  // Build partial data for lie detection
  const partialData: Partial<FingerprintData> = {
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    sys_user_agent: navInfo.userAgent,
    sys_platform: navInfo.platform,
    sys_language: navInfo.language,
    sys_languages: navInfo.languages,
    sys_timezone: tzInfo.timezone,
    sys_tz_offset: tzInfo.offset,
  };

  // Detect lies
  const lies = getLieFlags(partialData);

  // Assemble complete fingerprint
  const fingerprint: FingerprintData = {
    // Hardware & Rendering (20 dimensions)
    hw_canvas_hash: canvasHash,
    hw_webgl_hash: webglData.hash,
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    hw_audio_hash: audioHash,
    hw_cpu_cores: hardwareInfo.cpuCores,
    hw_memory: hardwareInfo.memory,
    hw_screen_width: screenInfo.width,
    hw_screen_height: screenInfo.height,
    hw_color_depth: screenInfo.colorDepth,
    hw_pixel_ratio: screenInfo.pixelRatio,
    hw_hdr_support: mediaFeatures.hdr,
    hw_color_gamut: mediaFeatures.colorGamut,
    hw_contrast_pref: mediaFeatures.contrast,
    hw_touch_points: hardwareInfo.touchPoints,
    hw_vr_displays: hasVRDisplays(),
    hw_gamepads: getGamepadCount(),
    hw_math_tan: mathFp.tan,
    hw_math_sin: mathFp.sin,
    hw_webgl_extensions: webglData.extensions,

    // System & OS (15 dimensions)
    sys_platform: navInfo.platform,
    sys_user_agent: navInfo.userAgent,
    sys_language: navInfo.language,
    sys_languages: navInfo.languages,
    sys_timezone: tzInfo.timezone,
    sys_tz_offset: tzInfo.offset,
    sys_intl_calendar: intlInfo.calendar,
    sys_intl_number: intlInfo.numberFormat,
    sys_intl_collation: intlInfo.collation,
    sys_fonts_hash: fontsHash,
    sys_dark_mode: mediaFeatures.darkMode,
    sys_reduced_motion: mediaFeatures.reducedMotion,
    sys_inverted_colors: mediaFeatures.invertedColors,
    sys_forced_colors: mediaFeatures.forcedColors,
    sys_pointer_type: mediaFeatures.pointerType,

    // Capabilities (15 dimensions)
    cap_cookies: storageCapabilities.cookies,
    cap_local_storage: storageCapabilities.localStorage,
    cap_session_storage: storageCapabilities.sessionStorage,
    cap_indexed_db: storageCapabilities.indexedDB,
    cap_open_database: storageCapabilities.openDatabase,
    cap_service_worker: apiCapabilities.serviceWorker,
    cap_web_worker: apiCapabilities.webWorker,
    cap_wasm: apiCapabilities.wasm,
    cap_shared_array: apiCapabilities.sharedArrayBuffer,
    cap_bluetooth: apiCapabilities.bluetooth,
    cap_usb: apiCapabilities.usb,
    cap_permissions: permissions,
    cap_plugins_hash: pluginsHash,
    cap_mime_types: mimeTypesHash,
    cap_pdf_viewer: apiCapabilities.pdfViewer,

    // Media Codecs (10 dimensions)
    med_audio_mp3: audioCodecs.mp3,
    med_audio_aac: audioCodecs.aac,
    med_audio_ogg: audioCodecs.ogg,
    med_audio_wav: audioCodecs.wav,
    med_audio_opus: audioCodecs.opus,
    med_video_h264: videoCodecs.h264,
    med_video_h265: videoCodecs.h265,
    med_video_vp8: videoCodecs.vp8,
    med_video_vp9: videoCodecs.vp9,
    med_video_av1: videoCodecs.av1,

    // Client Hints (modern browsers)
    ch_available: clientHints.available,
    ch_brands: clientHints.brands,
    ch_platform: clientHints.platform,
    ch_platform_version: clientHints.platformVersion,
    ch_mobile: clientHints.mobile,
    ch_model: clientHints.model,
    ch_architecture: clientHints.architecture,
    ch_bitness: clientHints.bitness,

    // WebRTC fingerprint
    rtc_available: webrtcData.available,
    rtc_local_ip: webrtcData.localIP,
    rtc_public_ip: webrtcData.publicIP,
    rtc_stun_available: webrtcData.stunAvailable,
    rtc_ip_type: webrtcData.ipType,
    rtc_media_device_count: webrtcData.mediaDeviceCount,

    // Auxiliary (volatile)
    aux_battery_level: battery?.level,
    aux_battery_charging: battery?.charging,
    aux_window_width: window.innerWidth,
    aux_window_height: window.innerHeight,
    aux_webrtc_ip: webrtcData.publicIP || webrtcData.localIP || undefined,
    aux_speech_voices: speechData.voiceCount,

    // Lie detection
    ...lies,
  };

  return fingerprint;
}

/**
 * Progress callback type for tracking collection
 */
export type CollectionProgressCallback = (
  dimension: string,
  index: number,
  total: number
) => void;

/**
 * Collect fingerprint with progress updates
 * Useful for animated UI during collection
 * @param onProgress - Callback for progress updates
 * @returns Complete fingerprint data object
 */
export async function collectFingerprintWithProgress(
  onProgress: CollectionProgressCallback
): Promise<FingerprintData> {
  const dimensions = [
    'Canvas fingerprint',
    'WebGL fingerprint',
    'Audio fingerprint',
    'Font detection',
    'Screen info',
    'Hardware info',
    'Math precision',
    'Media features',
    'Navigator info',
    'Timezone info',
    'Intl settings',
    'Storage capabilities',
    'API capabilities',
    'Plugins detection',
    'MIME types',
    'Audio codecs',
    'Video codecs',
    'Battery status',
    'Permissions',
    'WebRTC fingerprint',
    'Client Hints',
    'Speech synthesis',
    'Lie detection',
  ];

  let progress = 0;
  const total = dimensions.length;

  const reportProgress = (dimension: string) => {
    onProgress(dimension, ++progress, total);
  };

  // Run collectors with progress reporting
  reportProgress('Canvas fingerprint');
  const canvasHash = await getCanvasFingerprint();

  reportProgress('WebGL fingerprint');
  const webglData = await getWebGLFingerprint();

  reportProgress('Audio fingerprint');
  const audioHash = await getAudioFingerprint();

  reportProgress('Font detection');
  const fontsHash = await getFontsHash();

  reportProgress('Screen info');
  const screenInfo = getScreenInfo();

  reportProgress('Hardware info');
  const hardwareInfo = getHardwareInfo();

  reportProgress('Math precision');
  const mathFp = getMathFingerprint();

  reportProgress('Media features');
  const mediaFeatures = getMediaFeatures();

  reportProgress('Navigator info');
  const navInfo = getNavigatorInfo();

  reportProgress('Timezone info');
  const tzInfo = getTimezoneInfo();

  reportProgress('Intl settings');
  const intlInfo = getIntlInfo();

  reportProgress('Storage capabilities');
  const storageCapabilities = getStorageCapabilities();

  reportProgress('API capabilities');
  const apiCapabilities = getAPICapabilities();

  reportProgress('Plugins detection');
  const pluginsHash = await getPluginsFingerprint();

  reportProgress('MIME types');
  const mimeTypesHash = await getMimeTypesFingerprint();

  reportProgress('Audio codecs');
  const audioCodecs = getAudioCodecs();

  reportProgress('Video codecs');
  const videoCodecs = getVideoCodecs();

  reportProgress('Battery status');
  const battery = await getBatteryStatus();

  reportProgress('Permissions');
  const permissions = await getPermissions();

  reportProgress('WebRTC fingerprint');
  const webrtcData = await getWebRTCFingerprint();

  reportProgress('Client Hints');
  const clientHints = await getClientHints();

  reportProgress('Speech synthesis');
  const speechData = await getSpeechSynthesisFingerprint();

  reportProgress('Lie detection');
  const partialData: Partial<FingerprintData> = {
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    sys_user_agent: navInfo.userAgent,
    sys_platform: navInfo.platform,
    sys_language: navInfo.language,
    sys_languages: navInfo.languages,
    sys_timezone: tzInfo.timezone,
    sys_tz_offset: tzInfo.offset,
  };
  const lies = getLieFlags(partialData);

  // Return complete fingerprint
  return {
    hw_canvas_hash: canvasHash,
    hw_webgl_hash: webglData.hash,
    hw_webgl_vendor: webglData.vendor,
    hw_webgl_renderer: webglData.renderer,
    hw_audio_hash: audioHash,
    hw_cpu_cores: hardwareInfo.cpuCores,
    hw_memory: hardwareInfo.memory,
    hw_screen_width: screenInfo.width,
    hw_screen_height: screenInfo.height,
    hw_color_depth: screenInfo.colorDepth,
    hw_pixel_ratio: screenInfo.pixelRatio,
    hw_hdr_support: mediaFeatures.hdr,
    hw_color_gamut: mediaFeatures.colorGamut,
    hw_contrast_pref: mediaFeatures.contrast,
    hw_touch_points: hardwareInfo.touchPoints,
    hw_vr_displays: hasVRDisplays(),
    hw_gamepads: getGamepadCount(),
    hw_math_tan: mathFp.tan,
    hw_math_sin: mathFp.sin,
    hw_webgl_extensions: webglData.extensions,
    sys_platform: navInfo.platform,
    sys_user_agent: navInfo.userAgent,
    sys_language: navInfo.language,
    sys_languages: navInfo.languages,
    sys_timezone: tzInfo.timezone,
    sys_tz_offset: tzInfo.offset,
    sys_intl_calendar: intlInfo.calendar,
    sys_intl_number: intlInfo.numberFormat,
    sys_intl_collation: intlInfo.collation,
    sys_fonts_hash: fontsHash,
    sys_dark_mode: mediaFeatures.darkMode,
    sys_reduced_motion: mediaFeatures.reducedMotion,
    sys_inverted_colors: mediaFeatures.invertedColors,
    sys_forced_colors: mediaFeatures.forcedColors,
    sys_pointer_type: mediaFeatures.pointerType,
    cap_cookies: storageCapabilities.cookies,
    cap_local_storage: storageCapabilities.localStorage,
    cap_session_storage: storageCapabilities.sessionStorage,
    cap_indexed_db: storageCapabilities.indexedDB,
    cap_open_database: storageCapabilities.openDatabase,
    cap_service_worker: apiCapabilities.serviceWorker,
    cap_web_worker: apiCapabilities.webWorker,
    cap_wasm: apiCapabilities.wasm,
    cap_shared_array: apiCapabilities.sharedArrayBuffer,
    cap_bluetooth: apiCapabilities.bluetooth,
    cap_usb: apiCapabilities.usb,
    cap_permissions: permissions,
    cap_plugins_hash: pluginsHash,
    cap_mime_types: mimeTypesHash,
    cap_pdf_viewer: apiCapabilities.pdfViewer,
    med_audio_mp3: audioCodecs.mp3,
    med_audio_aac: audioCodecs.aac,
    med_audio_ogg: audioCodecs.ogg,
    med_audio_wav: audioCodecs.wav,
    med_audio_opus: audioCodecs.opus,
    med_video_h264: videoCodecs.h264,
    med_video_h265: videoCodecs.h265,
    med_video_vp8: videoCodecs.vp8,
    med_video_vp9: videoCodecs.vp9,
    med_video_av1: videoCodecs.av1,
    ch_available: clientHints.available,
    ch_brands: clientHints.brands,
    ch_platform: clientHints.platform,
    ch_platform_version: clientHints.platformVersion,
    ch_mobile: clientHints.mobile,
    ch_model: clientHints.model,
    ch_architecture: clientHints.architecture,
    ch_bitness: clientHints.bitness,
    rtc_available: webrtcData.available,
    rtc_local_ip: webrtcData.localIP,
    rtc_public_ip: webrtcData.publicIP,
    rtc_stun_available: webrtcData.stunAvailable,
    rtc_ip_type: webrtcData.ipType,
    rtc_media_device_count: webrtcData.mediaDeviceCount,
    aux_battery_level: battery?.level,
    aux_battery_charging: battery?.charging,
    aux_window_width: window.innerWidth,
    aux_window_height: window.innerHeight,
    aux_webrtc_ip: webrtcData.publicIP || webrtcData.localIP || undefined,
    aux_speech_voices: speechData.voiceCount,
    ...lies,
  };
}
