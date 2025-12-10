import type { FingerprintData, CollectionProgressCallback } from '@amiunique/core';
import {
  getCanvasFingerprint,
  getWebGLFingerprint,
  getScreenInfo,
  getHardwareInfo,
  getNavigatorInfo,
  getTimezoneInfo,
} from '@amiunique/core';
import { getStorageCapabilities, getAPICapabilities } from '@amiunique/core';
import { getLieFlags } from '@amiunique/core';

const liteSteps = [
  'Canvas fingerprint',
  'WebGL fingerprint',
  'Screen info',
  'Hardware info',
  'Navigator info',
  'Timezone info',
  'Storage capabilities',
  'API capabilities',
  'Lie detection',
];

/**
 * Lightweight collector that skips heavy probes (audio, fonts, plugins, mime types, codec sweeps)
 * to speed up on slow networks or low-power devices.
 */
export async function collectFingerprintLite(onProgress?: CollectionProgressCallback): Promise<FingerprintData> {
  const total = liteSteps.length;
  let index = 0;
  const step = (label: string) => {
    index += 1;
    onProgress?.(label, index, total);
  };

  const canvasHash = await getCanvasFingerprint();
  step(liteSteps[0]);

  const webgl = await getWebGLFingerprint();
  step(liteSteps[1]);

  const screen = getScreenInfo();
  step(liteSteps[2]);

  const hardware = getHardwareInfo();
  step(liteSteps[3]);

  const nav = getNavigatorInfo();
  step(liteSteps[4]);

  const tz = getTimezoneInfo();
  step(liteSteps[5]);

  const storage = getStorageCapabilities();
  step(liteSteps[6]);

  const apiCaps = getAPICapabilities();
  step(liteSteps[7]);

  const partial: Partial<FingerprintData> = {
    hw_canvas_hash: canvasHash,
    hw_webgl_hash: webgl.hash,
    hw_webgl_vendor: webgl.vendor,
    hw_webgl_renderer: webgl.renderer,
    hw_screen_width: screen.width,
    hw_screen_height: screen.height,
    hw_color_depth: screen.colorDepth,
    hw_pixel_ratio: screen.pixelRatio,
    hw_cpu_cores: hardware.cpuCores,
    hw_memory: hardware.memory,
    hw_touch_points: hardware.touchPoints,

    sys_platform: nav.platform,
    sys_user_agent: nav.userAgent,
    sys_language: nav.language,
    sys_languages: nav.languages,
    sys_timezone: tz.timezone,
    sys_tz_offset: tz.offset,

    cap_cookies: storage.cookies,
    cap_local_storage: storage.localStorage,
    cap_session_storage: storage.sessionStorage,
    cap_indexed_db: storage.indexedDB,
    cap_service_worker: apiCaps.serviceWorker,
    cap_web_worker: apiCaps.webWorker,
    cap_wasm: apiCaps.wasm,
    cap_shared_array: apiCaps.sharedArrayBuffer,
  };

  const lies = getLieFlags({
    hw_webgl_vendor: partial.hw_webgl_vendor,
    hw_webgl_renderer: partial.hw_webgl_renderer,
    sys_user_agent: partial.sys_user_agent,
    sys_platform: partial.sys_platform,
    sys_timezone: partial.sys_timezone,
    sys_tz_offset: partial.sys_tz_offset,
  });
  step(liteSteps[8]);

  return {
    ...partial,
    ...lies,
  } as FingerprintData;
}
