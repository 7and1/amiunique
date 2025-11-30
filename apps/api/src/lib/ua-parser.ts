/**
 * User-Agent parsing utilities
 * Simple parser for extracting browser, OS, and device type
 */

export interface ParsedUA {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

/**
 * Parse User-Agent string to extract browser, OS, and device info
 * @param ua - User-Agent string
 * @returns Parsed UA object
 */
export function parseUserAgent(ua: string): ParsedUA {
  const result: ParsedUA = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    deviceType: 'desktop',
  };

  if (!ua) return result;

  // Detect OS
  if (ua.includes('Windows NT 10')) {
    result.os = 'Windows';
    result.osVersion = '10';
    if (ua.includes('Windows NT 10.0; Win64')) {
      result.osVersion = '10/11';
    }
  } else if (ua.includes('Windows NT 6.3')) {
    result.os = 'Windows';
    result.osVersion = '8.1';
  } else if (ua.includes('Windows NT 6.2')) {
    result.os = 'Windows';
    result.osVersion = '8';
  } else if (ua.includes('Windows NT 6.1')) {
    result.os = 'Windows';
    result.osVersion = '7';
  } else if (ua.includes('Windows')) {
    result.os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    result.os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
    if (match) {
      result.osVersion = match[1].replace(/_/g, '.');
    }
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    result.os = 'iOS';
    result.deviceType = ua.includes('iPad') ? 'tablet' : 'mobile';
    const match = ua.match(/OS (\d+_\d+(?:_\d+)?)/);
    if (match) {
      result.osVersion = match[1].replace(/_/g, '.');
    }
  } else if (ua.includes('Android')) {
    result.os = 'Android';
    result.deviceType = ua.includes('Mobile') ? 'mobile' : 'tablet';
    const match = ua.match(/Android (\d+\.?\d*)/);
    if (match) {
      result.osVersion = match[1];
    }
  } else if (ua.includes('Linux')) {
    result.os = 'Linux';
  } else if (ua.includes('CrOS')) {
    result.os = 'ChromeOS';
  }

  // Detect Browser (order matters - check specific browsers first)
  if (ua.includes('Edg/') || ua.includes('Edge/')) {
    result.browser = 'Edge';
    const match = ua.match(/Edg(?:e)?\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    result.browser = 'Opera';
    const match = ua.match(/OPR\/(\d+)/) || ua.match(/Opera\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('Vivaldi/')) {
    result.browser = 'Vivaldi';
    const match = ua.match(/Vivaldi\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('Brave')) {
    result.browser = 'Brave';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('SamsungBrowser/')) {
    result.browser = 'Samsung';
    const match = ua.match(/SamsungBrowser\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('Firefox/') && !ua.includes('Seamonkey/')) {
    result.browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) {
    result.browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/') && !ua.includes('Chromium/')) {
    result.browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
    result.browser = 'IE';
    const match = ua.match(/(?:MSIE |rv:)(\d+)/);
    if (match) {
      result.browserVersion = match[1];
    }
  }

  return result;
}

/**
 * Determine device type from various signals
 * @param ua - User-Agent string
 * @param touchPoints - Max touch points
 * @param screenWidth - Screen width
 * @param screenHeight - Screen height
 * @returns Device type
 */
export function determineDeviceType(
  ua: string,
  touchPoints?: number,
  screenWidth?: number,
  screenHeight?: number
): 'desktop' | 'mobile' | 'tablet' {
  // Mobile UA patterns
  if (/iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|webOS/i.test(ua)) {
    return 'mobile';
  }

  // Tablet UA patterns
  if (/iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i.test(ua)) {
    return 'tablet';
  }

  // Check touch support
  if (touchPoints && touchPoints > 0) {
    // Small screen with touch is likely mobile
    if (screenWidth && screenHeight) {
      const minDimension = Math.min(screenWidth, screenHeight);
      if (minDimension <= 480) return 'mobile';
      if (minDimension <= 1024) return 'tablet';
    }
    // Touch device but can't determine size, assume tablet
    return 'tablet';
  }

  return 'desktop';
}
