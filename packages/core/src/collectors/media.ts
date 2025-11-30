/**
 * Media codec collectors
 * Audio and Video codec support detection
 */

// ==================== AUDIO CODECS ====================

export interface AudioCodecs {
  mp3: string;
  aac: string;
  ogg: string;
  wav: string;
  opus: string;
  flac: string;
  webm: string;
}

/**
 * Detect audio codec support
 * @returns Object with codec support levels (probably/maybe/no)
 */
export function getAudioCodecs(): AudioCodecs {
  const audio = document.createElement('audio');

  return {
    mp3: audio.canPlayType('audio/mpeg') || 'no',
    aac: audio.canPlayType('audio/aac') || audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') || 'no',
    ogg: audio.canPlayType('audio/ogg; codecs="vorbis"') || 'no',
    wav: audio.canPlayType('audio/wav; codecs="1"') || audio.canPlayType('audio/wav') || 'no',
    opus: audio.canPlayType('audio/ogg; codecs="opus"') || audio.canPlayType('audio/opus') || 'no',
    flac: audio.canPlayType('audio/flac') || audio.canPlayType('audio/x-flac') || 'no',
    webm: audio.canPlayType('audio/webm; codecs="vorbis"') || 'no',
  };
}

// ==================== VIDEO CODECS ====================

export interface VideoCodecs {
  h264: string;
  h265: string;
  vp8: string;
  vp9: string;
  av1: string;
  theora: string;
  webm: string;
  ogg: string;
}

/**
 * Detect video codec support
 * @returns Object with codec support levels (probably/maybe/no)
 */
export function getVideoCodecs(): VideoCodecs {
  const video = document.createElement('video');

  return {
    h264:
      video.canPlayType('video/mp4; codecs="avc1.42E01E"') ||
      video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') ||
      'no',
    h265:
      video.canPlayType('video/mp4; codecs="hev1"') ||
      video.canPlayType('video/mp4; codecs="hvc1"') ||
      video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') ||
      'no',
    vp8: video.canPlayType('video/webm; codecs="vp8"') || video.canPlayType('video/webm; codecs="vp8, vorbis"') || 'no',
    vp9: video.canPlayType('video/webm; codecs="vp9"') || video.canPlayType('video/webm; codecs="vp09.00.10.08"') || 'no',
    av1:
      video.canPlayType('video/mp4; codecs="av01.0.00M.08"') ||
      video.canPlayType('video/webm; codecs="av01.0.00M.08"') ||
      video.canPlayType('video/mp4; codecs="av1"') ||
      'no',
    theora: video.canPlayType('video/ogg; codecs="theora"') || 'no',
    webm: video.canPlayType('video/webm') || 'no',
    ogg: video.canPlayType('video/ogg') || 'no',
  };
}

// ==================== COMBINED CODEC SUPPORT ====================

export interface CodecSupport {
  audio: AudioCodecs;
  video: VideoCodecs;
}

/**
 * Get all codec support information
 * @returns Object with audio and video codec support
 */
export function getCodecSupport(): CodecSupport {
  return {
    audio: getAudioCodecs(),
    video: getVideoCodecs(),
  };
}

// ==================== MEDIA CAPABILITIES API ====================

export interface MediaCapabilityInfo {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

/**
 * Check media capabilities for a specific configuration
 * Uses the MediaCapabilities API for more detailed info
 * @param config - Media configuration to test
 * @returns Capability info or null if not supported
 */
export async function checkMediaCapabilities(config: {
  type: 'file' | 'media-source';
  video?: {
    contentType: string;
    width: number;
    height: number;
    bitrate: number;
    framerate: number;
  };
  audio?: {
    contentType: string;
    channels?: number;
    bitrate?: number;
    samplerate?: number;
  };
}): Promise<MediaCapabilityInfo | null> {
  try {
    if (!('mediaCapabilities' in navigator)) {
      return null;
    }

    const result = await navigator.mediaCapabilities.decodingInfo(config as MediaDecodingConfiguration);
    return {
      supported: result.supported,
      smooth: result.smooth,
      powerEfficient: result.powerEfficient,
    };
  } catch {
    return null;
  }
}

// ==================== DRM SUPPORT ====================

export interface DRMSupport {
  widevine: boolean;
  fairplay: boolean;
  playready: boolean;
  clearkey: boolean;
}

/**
 * Check DRM (Encrypted Media Extensions) support
 * @returns Object with DRM system availability
 */
export async function getDRMSupport(): Promise<DRMSupport> {
  const result: DRMSupport = {
    widevine: false,
    fairplay: false,
    playready: false,
    clearkey: false,
  };

  if (!('requestMediaKeySystemAccess' in navigator)) {
    return result;
  }

  const configs = [
    {
      initDataTypes: ['cenc'],
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    },
  ];

  const keySystemMap: Record<string, keyof DRMSupport> = {
    'com.widevine.alpha': 'widevine',
    'com.apple.fps.1_0': 'fairplay',
    'com.apple.fps': 'fairplay',
    'com.microsoft.playready': 'playready',
    'org.w3.clearkey': 'clearkey',
  };

  for (const [keySystem, key] of Object.entries(keySystemMap)) {
    try {
      await navigator.requestMediaKeySystemAccess(keySystem, configs);
      result[key] = true;
    } catch {
      result[key] = false;
    }
  }

  return result;
}

// ==================== SPEECH SYNTHESIS ====================

/**
 * Get available speech synthesis voices
 * @returns Array of voice info objects
 */
export function getSpeechVoices(): Array<{
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}> {
  try {
    const voices = speechSynthesis.getVoices();
    return voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService,
    }));
  } catch {
    return [];
  }
}
