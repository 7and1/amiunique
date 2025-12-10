import { describe, it, expect } from 'vitest';
import {
  detectOSMismatch,
  detectTimezoneMismatch,
  detectWebGLMismatch,
  detectResolutionMismatch,
} from './lies.js';

describe('detectOSMismatch', () => {
  it('flags inconsistent Windows UA/platform', () => {
    const res = detectOSMismatch('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'MacIntel');
    expect(res.detected).toBe(true);
  });

  it('passes matching macOS UA/platform', () => {
    const res = detectOSMismatch('Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0)', 'MacIntel');
    expect(res.detected).toBe(false);
  });
});

describe('detectTimezoneMismatch', () => {
  it('flags mismatched offset for timezone', () => {
    const res = detectTimezoneMismatch('America/New_York', 0);
    expect(res.detected).toBe(true);
  });

  it('accepts known offset for timezone', () => {
    const res = detectTimezoneMismatch('America/New_York', 300);
    expect(res.detected).toBe(false);
  });
});

describe('detectWebGLMismatch', () => {
  it('flags mobile UA with desktop GPU strings', () => {
    const res = detectWebGLMismatch('GeForce GTX 1080', 'NVIDIA', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
    expect(res.detected).toBe(true);
  });

  it('accepts common renderer for desktop', () => {
    const res = detectWebGLMismatch('Apple M2', 'Apple', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0)');
    expect(res.detected).toBe(false);
  });
});

describe('detectResolutionMismatch', () => {
  it('returns false for normal screen metrics', () => {
    // Mock minimal screen/window globals
    // @ts-expect-error allow partial mock
    globalThis.window = { outerWidth: 1280, outerHeight: 720 };
    globalThis.screen = {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
    } as unknown as Screen;

    const res = detectResolutionMismatch();
    expect(res.detected).toBe(false);
  });
});
