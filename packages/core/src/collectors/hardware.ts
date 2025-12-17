/**
 * Hardware fingerprint collectors
 * Canvas, WebGL, Audio, Screen, CPU, Memory, etc.
 * These are the most stable dimensions (Gold Lock components)
 */

import { sha256 } from '../utils/hash.js';

// ==================== CANVAS FINGERPRINT ====================

/**
 * Generate Canvas 2D fingerprint
 * Draws complex shapes, text, and gradients to create unique rendering output
 * @returns SHA-256 hash of canvas data URL
 */
export async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';

    // Fill background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw colored rectangle
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(125, 1, 62, 20);

    // Draw text with different styles
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#069';
    ctx.font = '14px Arial';
    ctx.fillText('AmiUnique.io 🔒', 2, 15);

    // Draw overlapping text with transparency
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '14px Times New Roman';
    ctx.fillText('AmiUnique.io 🔒', 4, 17);

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.67, '#0000ff');
    gradient.addColorStop(1, '#ff00ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 35, canvas.width, 20);

    // Draw arc
    ctx.beginPath();
    ctx.arc(50, 50, 10, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#008080';
    ctx.fill();

    // Draw bezier curve
    ctx.beginPath();
    ctx.moveTo(100, 30);
    ctx.bezierCurveTo(150, 60, 200, 0, 250, 30);
    ctx.strokeStyle = '#800080';
    ctx.lineWidth = 2;
    ctx.stroke();

    return sha256(canvas.toDataURL());
  } catch {
    return 'error';
  }
}

// ==================== WEBGL FINGERPRINT ====================

export interface WebGLInfo {
  hash: string;
  vendor: string;
  renderer: string;
  extensions: string;
}

/**
 * Generate WebGL fingerprint
 * Extracts GPU info, parameters, and extension support
 * @returns Object with hash, vendor, renderer, and extensions
 */
export async function getWebGLFingerprint(): Promise<WebGLInfo> {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return { hash: 'unsupported', vendor: '', renderer: '', extensions: '' };

    // Get debug info extension for unmasked GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

    // Get sorted extension list
    const extensions = (gl.getSupportedExtensions() || []).sort().join(',');

    // Collect various WebGL parameters for fingerprinting
    const params = [
      gl.getParameter(gl.VERSION),
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      gl.getParameter(gl.VENDOR),
      gl.getParameter(gl.RENDERER),
      gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      gl.getParameter(gl.MAX_VARYING_VECTORS),
      gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      vendor,
      renderer,
    ]
      .map(p => (Array.isArray(p) ? p.join(',') : String(p)))
      .join('|');

    return {
      hash: await sha256(params),
      vendor: String(vendor || ''),
      renderer: String(renderer || ''),
      extensions: await sha256(extensions),
    };
  } catch {
    return { hash: 'error', vendor: '', renderer: '', extensions: '' };
  }
}

// ==================== AUDIO FINGERPRINT ====================

/**
 * Generate AudioContext fingerprint
 * Uses OfflineAudioContext with oscillator to create unique audio signature
 * @returns SHA-256 hash of audio fingerprint
 */
export async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return 'unsupported';

    const context = new OfflineAudioContext(1, 44100, 44100);

    // Create oscillator
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    // Create compressor
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    // Connect nodes
    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);

    // Render and get buffer
    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    // Calculate fingerprint from audio samples
    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(channelData[i]);
    }

    return sha256(sum.toString());
  } catch {
    return 'error';
  }
}

// ==================== SCREEN INFO ====================

export interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
}

/**
 * Get screen information
 * @returns Object with screen dimensions and color info
 */
export function getScreenInfo(): ScreenInfo {
  return {
    width: screen.width,
    height: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

// ==================== HARDWARE INFO ====================

export interface HardwareInfo {
  cpuCores: number;
  memory: number;
  touchPoints: number;
}

/**
 * Get hardware capabilities
 * @returns Object with CPU, memory, and touch info
 */
export function getHardwareInfo(): HardwareInfo {
  return {
    cpuCores: navigator.hardwareConcurrency || 0,
    memory: (navigator as unknown as { deviceMemory?: number }).deviceMemory || 0,
    touchPoints: navigator.maxTouchPoints || 0,
  };
}

// ==================== MATH PRECISION ====================

export interface MathFingerprint {
  tan: string;
  sin: string;
}

/**
 * Get math precision fingerprint
 * Different hardware/browsers may produce slightly different results
 * @returns Object with tan and sin precision values
 */
export function getMathFingerprint(): MathFingerprint {
  return {
    tan: Math.tan(-1e300).toString(),
    sin: Math.sin(1).toString(),
  };
}

// ==================== CSS MEDIA FEATURES ====================

export interface MediaFeatures {
  hdr: boolean;
  colorGamut: string;
  contrast: string;
  darkMode: boolean;
  reducedMotion: boolean;
  invertedColors: boolean;
  forcedColors: boolean;
  pointerType: string;
}

/**
 * Get CSS media feature values
 * @returns Object with various media query results
 */
export function getMediaFeatures(): MediaFeatures {
  const match = window.matchMedia;

  // Color gamut detection
  let colorGamut = 'srgb';
  if (match('(color-gamut: rec2020)').matches) colorGamut = 'rec2020';
  else if (match('(color-gamut: p3)').matches) colorGamut = 'p3';

  // Contrast preference
  let contrast = 'no-preference';
  if (match('(prefers-contrast: more)').matches) contrast = 'more';
  else if (match('(prefers-contrast: less)').matches) contrast = 'less';
  else if (match('(prefers-contrast: custom)').matches) contrast = 'custom';

  // Pointer type
  let pointerType = 'none';
  if (match('(any-pointer: fine)').matches) pointerType = 'fine';
  else if (match('(any-pointer: coarse)').matches) pointerType = 'coarse';

  return {
    hdr: match('(dynamic-range: high)').matches,
    colorGamut,
    contrast,
    darkMode: match('(prefers-color-scheme: dark)').matches,
    reducedMotion: match('(prefers-reduced-motion: reduce)').matches,
    invertedColors: match('(inverted-colors: inverted)').matches,
    forcedColors: match('(forced-colors: active)').matches,
    pointerType,
  };
}

// ==================== GAMEPAD & VR ====================

/**
 * Get gamepad count
 * @returns Number of connected gamepads
 */
export function getGamepadCount(): number {
  try {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return 0;
    return Array.from(gamepads).filter(g => g !== null).length;
  } catch {
    return 0;
  }
}

/**
 * Check if VR is available (deprecated API)
 * @returns Whether VR displays are available
 */
export function hasVRDisplays(): boolean {
  return 'getVRDisplays' in navigator;
}
