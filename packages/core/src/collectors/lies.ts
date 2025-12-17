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
  headless: LieDetectionResult;
  automation: LieDetectionResult;
  vm: LieDetectionResult;
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
 * Uses dynamic validation via Intl API instead of hardcoded database
 * @param timezone - Timezone name from Intl.DateTimeFormat
 * @param offset - Timezone offset from Date.getTimezoneOffset()
 * @returns Detection result
 */
export function detectTimezoneMismatch(timezone: string, offset: number): LieDetectionResult {
  // Skip validation for empty timezone
  if (!timezone || timezone === '') {
    return { detected: false };
  }

  try {
    // Use Intl.DateTimeFormat to get the expected offset for the timezone
    // This dynamically validates against the browser's timezone database
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });

    // Get the formatted time with offset
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');

    if (!offsetPart) {
      // Fallback: If we can't get the offset from Intl, don't flag as spoofed
      return { detected: false };
    }

    // Parse offset like "GMT-5" or "GMT+8" or "UTC"
    const offsetStr = offsetPart.value;
    let expectedOffset = 0;

    if (offsetStr === 'UTC' || offsetStr === 'GMT') {
      expectedOffset = 0;
    } else {
      const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
      if (match) {
        const sign = match[1] === '+' ? -1 : 1; // getTimezoneOffset is inverted
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3] || '0', 10);
        expectedOffset = sign * (hours * 60 + minutes);
      }
    }

    // Allow 60 minute tolerance for DST transitions
    if (Math.abs(expectedOffset - offset) > 60) {
      return {
        detected: true,
        reason: `Timezone ${timezone} expected offset ~${expectedOffset}, got ${offset}`,
      };
    }

    return { detected: false };
  } catch {
    // Unknown timezone or Intl API error - don't flag as spoofed
    // This prevents false positives for legitimate but uncommon timezones
    return { detected: false };
  }
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

// ==================== HEADLESS BROWSER DETECTION ====================

/**
 * Detect headless browsers (Puppeteer, Playwright, PhantomJS, etc.)
 * Uses multiple heuristics to identify automated browsers
 * @returns Detection result
 */
export function detectHeadlessBrowser(): LieDetectionResult {
  const win = window as unknown as Record<string, unknown>;
  const nav = navigator as unknown as Record<string, unknown>;

  // Check for Puppeteer/Playwright markers
  if (win.__puppeteer_evaluation_script__ !== undefined) {
    return { detected: true, reason: 'Puppeteer evaluation script detected' };
  }

  if (win.__playwright !== undefined) {
    return { detected: true, reason: 'Playwright marker detected' };
  }

  // Check for PhantomJS
  if (win.callPhantom !== undefined || win._phantom !== undefined) {
    return { detected: true, reason: 'PhantomJS markers detected' };
  }

  // Check for Nightmare.js
  if (win.__nightmare !== undefined) {
    return { detected: true, reason: 'Nightmare.js marker detected' };
  }

  // Check for headless Chrome markers
  if (nav.webdriver === true) {
    return { detected: true, reason: 'navigator.webdriver is true' };
  }

  // Chrome-specific headless detection
  const ua = String(nav.userAgent || '').toLowerCase();
  if (ua.includes('headlesschrome')) {
    return { detected: true, reason: 'HeadlessChrome in user-agent' };
  }

  // Check for missing plugins in Chrome (headless has none)
  if (ua.includes('chrome') && !ua.includes('mobile') && !ua.includes('android')) {
    const plugins = nav.plugins as PluginArray | undefined;
    if (plugins && plugins.length === 0) {
      return { detected: true, reason: 'Chrome with no plugins (headless indicator)' };
    }
  }

  // Check for missing language (some headless browsers)
  if (!nav.language || nav.language === '') {
    return { detected: true, reason: 'Empty navigator.language' };
  }

  // Check for unusual screen dimensions
  if (window.outerWidth === 0 || window.outerHeight === 0) {
    return { detected: true, reason: 'Zero outer window dimensions' };
  }

  // Check for missing deviceMemory (removed in headless)
  if (ua.includes('chrome') && nav.deviceMemory === undefined && !ua.includes('mobile')) {
    // Note: deviceMemory is not supported in all Chrome versions
    // This is a weak signal
  }

  // Check for Selenium/WebDriver markers
  if (win.domAutomation !== undefined || win.domAutomationController !== undefined) {
    return { detected: true, reason: 'Selenium automation markers detected' };
  }

  // Check document.$cdc_asdjflasutopfhvcZLmcfl (Chromedriver marker)
  const doc = document as unknown as Record<string, unknown>;
  for (const key in doc) {
    if (key.match(/\$cdc_|cdc_/)) {
      return { detected: true, reason: 'ChromeDriver marker detected in document' };
    }
  }

  // Check for permission anomalies (headless browsers handle these differently)
  // Note: Notification.permission check removed - not a reliable signal

  return { detected: false };
}

// ==================== AUTOMATION DETECTION ====================

/**
 * Detect browser automation tools and scripts
 * Looks for signs of programmatic browser control
 * @returns Detection result
 */
export function detectAutomation(): LieDetectionResult {
  const win = window as unknown as Record<string, unknown>;
  const doc = document as unknown as Record<string, unknown>;

  // Check for Selenium markers
  if (win.selenium !== undefined || win._selenium !== undefined) {
    return { detected: true, reason: 'Selenium marker detected' };
  }

  if (win.callSelenium !== undefined) {
    return { detected: true, reason: 'callSelenium function detected' };
  }

  // Check for WebDriver-related properties
  const webdriverKeys = [
    '__webdriver_script_fn',
    '__driver_unwrapped',
    '__webdriver_unwrapped',
    '__driver_evaluate',
    '__webdriver_evaluate',
    '__fxdriver_evaluate',
    '__driver_commands',
    '__webdriver_commands',
  ];

  for (const key of webdriverKeys) {
    if (win[key] !== undefined) {
      return { detected: true, reason: `WebDriver marker "${key}" detected` };
    }
  }

  // Check for CDP (Chrome DevTools Protocol) markers
  if (win.cdc_adoQpoasnfa76pfcZLmcfl_ !== undefined) {
    return { detected: true, reason: 'CDP marker detected' };
  }

  // Check for automation-related functions
  if (typeof doc.getElementByXPath === 'function') {
    return { detected: true, reason: 'getElementByXPath function detected' };
  }

  // Check navigator.webdriver (standard automation detection)
  // Object.getOwnPropertyDescriptor check for overridden getter
  try {
    const webdriverDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (webdriverDescriptor && webdriverDescriptor.get?.toString().includes('native code') === false) {
      return { detected: true, reason: 'navigator.webdriver getter has been modified' };
    }
  } catch {
    // Property access failed
  }

  // Check for modified toString methods using multiple vectors
  // A single check can be bypassed, so we use multiple validation approaches
  try {
    const fnToString = Function.prototype.toString;

    // Vector 1: Check if toString itself returns native code indicator
    const toStringResult = fnToString.call(fnToString);
    const hasNativeCode =
      toStringResult.includes('native code') || toStringResult.includes('[native code]');

    // Vector 2: Check toString.length (native toString has length 0)
    const hasCorrectLength = fnToString.length === 0;

    // Vector 3: Check a known native function
    const arrayPushString = fnToString.call(Array.prototype.push);
    const arrayPushNative =
      arrayPushString.includes('native code') || arrayPushString.includes('[native code]');

    // Require at least 2 of 3 vectors to pass
    const passedVectors = [hasNativeCode, hasCorrectLength, arrayPushNative].filter(Boolean).length;

    if (passedVectors < 2) {
      return { detected: true, reason: 'Function.prototype.toString integrity check failed' };
    }
  } catch {
    // Error during check - could indicate tampering, but don't false positive
    // Some legitimate security extensions may cause this
  }

  // Check for eval-based automation using indirect eval
  // Direct eval() can throw in strict mode or CSP environments legitimately
  try {
    // Use indirect eval to avoid strict mode restrictions
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-eval
    const indirectEval = eval;
    const testEval = indirectEval('1+1');
    if (testEval !== 2) {
      return { detected: true, reason: 'eval() behavior modified' };
    }
  } catch (err) {
    // CSP or strict mode restrictions - these are legitimate security measures
    // Only flag if the error message suggests intentional modification
    const errorMessage = err instanceof Error ? err.message : '';
    if (
      errorMessage.includes('modified') ||
      errorMessage.includes('override') ||
      errorMessage.includes('intercept')
    ) {
      return { detected: true, reason: 'eval() appears to be intercepted' };
    }
    // Otherwise, don't flag - CSP/strict mode restrictions are legitimate
  }

  return { detected: false };
}

// ==================== VM ENVIRONMENT DETECTION ====================

/**
 * Detect virtual machine environments (VirtualBox, VMware, Parallels, etc.)
 * Uses WebGL renderer strings and other signals to identify VMs
 * @param renderer - WebGL renderer string
 * @param vendor - WebGL vendor string
 * @returns Detection result
 */
export function detectVMEnvironment(renderer: string, vendor: string): LieDetectionResult {
  const rendererLower = renderer.toLowerCase();
  const vendorLower = vendor.toLowerCase();

  // VirtualBox indicators
  if (
    rendererLower.includes('virtualbox') ||
    rendererLower.includes('vbox') ||
    rendererLower.includes('chromium') && vendorLower.includes('chromium')
  ) {
    return { detected: true, reason: 'VirtualBox GPU detected' };
  }

  // VMware indicators
  if (
    rendererLower.includes('vmware') ||
    rendererLower.includes('svga') ||
    rendererLower.includes('svga3d')
  ) {
    return { detected: true, reason: 'VMware GPU detected' };
  }

  // Parallels Desktop indicators
  if (rendererLower.includes('parallels')) {
    return { detected: true, reason: 'Parallels GPU detected' };
  }

  // Hyper-V / Microsoft Virtual Machine
  if (
    rendererLower.includes('microsoft basic render') ||
    rendererLower.includes('hyper-v') ||
    rendererLower.includes('microsoft remoteapp')
  ) {
    return { detected: true, reason: 'Hyper-V/Microsoft VM detected' };
  }

  // QEMU/KVM indicators
  if (
    rendererLower.includes('qemu') ||
    rendererLower.includes('virtio') ||
    rendererLower.includes('llvmpipe') ||
    rendererLower.includes('softpipe')
  ) {
    return { detected: true, reason: 'QEMU/KVM VM detected' };
  }

  // Generic virtualization indicators
  if (
    rendererLower.includes('swiftshader') ||
    rendererLower.includes('software') ||
    rendererLower.includes('emulated')
  ) {
    return { detected: true, reason: 'Software renderer detected (possible VM)' };
  }

  // Check for extremely low-end GPU specs that suggest virtualization
  // Most VMs expose limited GPU capabilities
  if (
    rendererLower.includes('basic') ||
    rendererLower.includes('generic') ||
    vendorLower.includes('microsoft') && !rendererLower.includes('intel') && !rendererLower.includes('nvidia') && !rendererLower.includes('amd')
  ) {
    return { detected: true, reason: 'Basic/generic renderer suggests VM' };
  }

  // Check navigator for VM hardware hints
  try {
    const nav = navigator as unknown as { deviceMemory?: number; hardwareConcurrency?: number };

    // VMs often have exactly 1-2 cores and very low memory
    const cores = nav.hardwareConcurrency;
    const memory = nav.deviceMemory;

    // Extremely low specs combined with software renderer is suspicious
    if (cores === 1 && memory !== undefined && memory <= 2) {
      return { detected: true, reason: 'Very low hardware specs suggest VM' };
    }
  } catch {
    // Navigator checks failed, continue
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
    headless: detectHeadlessBrowser(),
    automation: detectAutomation(),
    vm: detectVMEnvironment(data.hw_webgl_renderer || '', data.hw_webgl_vendor || ''),
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
  lie_headless: boolean;
  lie_automation: boolean;
  lie_vm: boolean;
} {
  const lies = detectAllLies(data);

  return {
    lie_os_mismatch: lies.os.detected,
    lie_browser_mismatch: lies.browser.detected,
    lie_resolution_mismatch: lies.resolution.detected,
    lie_timezone_mismatch: lies.timezone.detected,
    lie_webgl_mismatch: lies.webgl.detected,
    lie_headless: lies.headless.detected,
    lie_automation: lies.automation.detected,
    lie_vm: lies.vm.detected,
  };
}
