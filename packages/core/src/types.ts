/**
 * Complete fingerprint data interface with 80+ dimensions
 * Following the BLUEPRINT.md specification
 */
export interface FingerprintData {
  // ==================== HARDWARE & RENDERING (20 dimensions) ====================
  /** Canvas 2D rendering fingerprint hash */
  hw_canvas_hash: string;
  /** WebGL 3D rendering fingerprint hash */
  hw_webgl_hash: string;
  /** GPU vendor (unmasked) from WEBGL_debug_renderer_info */
  hw_webgl_vendor: string;
  /** GPU model/renderer (unmasked) from WEBGL_debug_renderer_info */
  hw_webgl_renderer: string;
  /** Audio oscillator waveform fingerprint hash */
  hw_audio_hash: string;
  /** Logical CPU core count from navigator.hardwareConcurrency */
  hw_cpu_cores: number;
  /** Device memory in GB from navigator.deviceMemory */
  hw_memory: number;
  /** Physical screen width in pixels */
  hw_screen_width: number;
  /** Physical screen height in pixels */
  hw_screen_height: number;
  /** Color depth (24/30/32 bits) */
  hw_color_depth: number;
  /** Device pixel ratio (Retina/HiDPI) */
  hw_pixel_ratio: number;
  /** HDR display capability */
  hw_hdr_support: boolean;
  /** Color gamut support (srgb/p3/rec2020) */
  hw_color_gamut: string;
  /** Contrast preference from CSS media query */
  hw_contrast_pref: string;
  /** Maximum touch points supported */
  hw_touch_points: number;
  /** VR device connected (deprecated API) */
  hw_vr_displays: boolean;
  /** Number of connected gamepads */
  hw_gamepads: number;
  /** Float precision fingerprint from Math.tan(-1e300) */
  hw_math_tan: string;
  /** Float precision fingerprint from Math.sin(1) */
  hw_math_sin: string;
  /** WebGL extension list hash */
  hw_webgl_extensions: string;

  // ==================== SYSTEM & OS ENVIRONMENT (15 dimensions) ====================
  /** OS platform identifier from navigator.platform */
  sys_platform: string;
  /** Full User-Agent string */
  sys_user_agent: string;
  /** Primary browser language */
  sys_language: string;
  /** Language preference list (order matters) */
  sys_languages: string[];
  /** Timezone name from Intl.DateTimeFormat */
  sys_timezone: string;
  /** Timezone offset in minutes */
  sys_tz_offset: number;
  /** Default calendar system from Intl.DateTimeFormat */
  sys_intl_calendar: string;
  /** Number formatting locale from Intl.NumberFormat */
  sys_intl_number: string;
  /** String collation rules from Intl.Collator */
  sys_intl_collation: string;
  /** Installed fonts fingerprint hash */
  sys_fonts_hash: string;
  /** Dark mode enabled from prefers-color-scheme */
  sys_dark_mode: boolean;
  /** Reduced motion preference */
  sys_reduced_motion: boolean;
  /** Inverted colors enabled */
  sys_inverted_colors: boolean;
  /** High contrast mode (forced-colors) */
  sys_forced_colors: boolean;
  /** Pointer precision (fine/coarse/none) */
  sys_pointer_type: string;

  // ==================== BROWSER CAPABILITIES (15 dimensions) ====================
  /** Cookies enabled */
  cap_cookies: boolean;
  /** LocalStorage available */
  cap_local_storage: boolean;
  /** SessionStorage available */
  cap_session_storage: boolean;
  /** IndexedDB available */
  cap_indexed_db: boolean;
  /** WebSQL (openDatabase) available */
  cap_open_database: boolean;
  /** Service Worker support */
  cap_service_worker: boolean;
  /** Web Worker support */
  cap_web_worker: boolean;
  /** WebAssembly support */
  cap_wasm: boolean;
  /** SharedArrayBuffer available (requires COOP/COEP) */
  cap_shared_array: boolean;
  /** Web Bluetooth API available */
  cap_bluetooth: boolean;
  /** WebUSB API available */
  cap_usb: boolean;
  /** Permission states for various APIs */
  cap_permissions: Record<string, string>;
  /** Browser plugins fingerprint hash */
  cap_plugins_hash: string;
  /** MIME types fingerprint hash */
  cap_mime_types: string;
  /** Built-in PDF viewer enabled */
  cap_pdf_viewer: boolean;

  // ==================== MEDIA CODECS (10 dimensions) ====================
  /** MP3 audio support (probably/maybe/no) */
  med_audio_mp3: string;
  /** AAC audio support */
  med_audio_aac: string;
  /** Ogg Vorbis audio support */
  med_audio_ogg: string;
  /** WAV audio support */
  med_audio_wav: string;
  /** Opus audio support */
  med_audio_opus: string;
  /** H.264 video support */
  med_video_h264: string;
  /** H.265/HEVC video support */
  med_video_h265: string;
  /** VP8 video support */
  med_video_vp8: string;
  /** VP9 video support */
  med_video_vp9: string;
  /** AV1 video support */
  med_video_av1: string;

  // ==================== CLIENT HINTS (Modern browsers only) ====================
  /** Client Hints API availability */
  ch_available: boolean;
  /** Browser brands from Client Hints */
  ch_brands: string[];
  /** Platform from Client Hints */
  ch_platform: string;
  /** Platform version from Client Hints */
  ch_platform_version: string;
  /** Mobile flag from Client Hints */
  ch_mobile: boolean;
  /** Device model from Client Hints */
  ch_model: string;
  /** CPU architecture from Client Hints */
  ch_architecture: string;
  /** CPU bitness from Client Hints */
  ch_bitness: string;

  // ==================== WEBRTC FINGERPRINT ====================
  /** WebRTC API availability */
  rtc_available: boolean;
  /** Local IP leaked via WebRTC */
  rtc_local_ip: string | null;
  /** Public IP leaked via WebRTC/STUN */
  rtc_public_ip: string | null;
  /** STUN server reachability */
  rtc_stun_available: boolean;
  /** IP type detected */
  rtc_ip_type: 'ipv4' | 'ipv6' | 'both' | 'none';
  /** Media device count */
  rtc_media_device_count: number;

  // ==================== AUXILIARY (Volatile - not in hash) ====================
  /** Battery percentage (if available) */
  aux_battery_level?: number;
  /** Battery charging status (if available) */
  aux_battery_charging?: boolean;
  /** Browser window inner width */
  aux_window_width: number;
  /** Browser window inner height */
  aux_window_height: number;
  /** WebRTC local/public IP leak (if available) - DEPRECATED: use rtc_* fields */
  aux_webrtc_ip?: string;
  /** Speech synthesis voice count */
  aux_speech_voices: number;

  // ==================== LIE DETECTION (Spoofing checks) ====================
  /** OS spoofing detected (UA vs platform mismatch) */
  lie_os_mismatch: boolean;
  /** Browser spoofing detected (UA vs features mismatch) */
  lie_browser_mismatch: boolean;
  /** Resolution spoofing detected */
  lie_resolution_mismatch: boolean;
  /** Timezone spoofing detected */
  lie_timezone_mismatch: boolean;
  /** GPU spoofing detected (WebGL renderer vs UA mismatch) */
  lie_webgl_mismatch: boolean;
  /** Headless browser detected (Puppeteer, Playwright, etc.) */
  lie_headless: boolean;
  /** Browser automation detected (Selenium, WebDriver, etc.) */
  lie_automation: boolean;
}

/**
 * Network fingerprint data injected by Cloudflare Worker
 * Cannot be spoofed by client
 */
export interface NetworkFingerprint {
  /** SHA-256 hash of IP address */
  net_ip_hash: string;
  /** Autonomous System Number */
  net_asn?: number;
  /** ISP/Organization name */
  net_asn_org?: string;
  /** Cloudflare datacenter code */
  net_colo?: string;
  /** ISO country code */
  net_country?: string;
  /** City name */
  net_city?: string;
  /** Region/State */
  net_region?: string;
  /** Postal code */
  net_postal?: string;
  /** Latitude */
  net_latitude?: number;
  /** Longitude */
  net_longitude?: number;
  /** TLS version (1.2/1.3) */
  net_tls_version?: string;
  /** TLS cipher suite */
  net_tls_cipher?: string;
  /** HTTP protocol (h2/h3) */
  net_http_protocol?: string;
  /** TCP round-trip time in ms */
  net_tcp_rtt?: number;
  /** Cloudflare bot detection score */
  net_bot_score?: number;
}

/**
 * Complete fingerprint report including client and network data
 */
export interface FullFingerprintReport extends FingerprintData, NetworkFingerprint {}

/**
 * Three-Lock hash results
 */
export interface ThreeLockHashes {
  /** Gold Lock - Hardware fingerprint (most stable) */
  gold: string;
  /** Silver Lock - Software fingerprint (medium stable) */
  silver: string;
  /** Bronze Lock - Full session fingerprint (includes network) */
  bronze: string;
}

/**
 * Analysis result from the API
 */
export interface AnalysisResult {
  success: boolean;
  meta: {
    id: string;
    timestamp: number;
    processing_time_ms: number;
  };
  hashes: ThreeLockHashes;
  result: {
    is_unique: boolean;
    uniqueness_ratio: number;
    uniqueness_display: string;
    exact_match_count: number;
    hardware_match_count: number;
    total_fingerprints: number;
    tracking_risk: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cross_browser_detected: boolean;
  };
  details: FullFingerprintReport;
  lies: {
    os_mismatch: boolean;
    browser_mismatch: boolean;
    resolution_mismatch: boolean;
    timezone_mismatch: boolean;
    webgl_mismatch: boolean;
    headless: boolean;
    automation: boolean;
  };
}

/**
 * Global statistics from the API
 */
export interface GlobalStats {
  total_fingerprints: number;
  unique_sessions: number;
  unique_devices: number;
  updated_at: number;
}
