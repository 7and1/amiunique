import type { Context } from 'hono';

/**
 * Extract client IP address from request headers
 * Uses consistent fallback chain across all API endpoints
 *
 * Priority:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Forwarded-For first entry (reverse proxies)
 * 3. X-Real-IP (nginx)
 * 4. 'unknown' fallback
 */
export function getClientIP(c: Context): string {
  // Cloudflare header (most reliable when deployed)
  const cfIP = c.req.header('CF-Connecting-IP')?.trim();
  if (cfIP) return cfIP;

  // Proxy headers are only a local/self-hosted development convenience. In
  // production they are caller-controlled unless a trusted proxy rewrites them.
  const environment = (c.env as { ENVIRONMENT?: string } | undefined)?.ENVIRONMENT;
  if (environment === 'production') return 'unknown';

  // X-Forwarded-For (may contain multiple IPs, take first)
  const xForwardedFor = c.req.header('X-Forwarded-For');
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(',')[0]?.trim();
    if (firstIP) return firstIP;
  }

  // X-Real-IP (nginx)
  const xRealIP = c.req.header('X-Real-IP');
  if (xRealIP) return xRealIP;

  // Fallback
  return 'unknown';
}

/**
 * Check if IP is valid (not empty or unknown)
 */
export function isValidIP(ip: string): boolean {
  return getIPVersion(ip) !== null;
}

/**
 * Determine whether a canonical address is IPv4 or IPv6.
 * This intentionally rejects legacy shorthand IPv4 forms.
 */
export function getIPVersion(ip: string): 4 | 6 | null {
  const value = ip.trim();
  const ipv4Parts = value.split('.');

  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every(part => {
      if (!/^[0-9]{1,3}$/.test(part)) return false;
      const value = Number(part);
      return value >= 0 && value <= 255;
    })
  ) {
    return 4;
  }

  if (!value.includes(':') || value.includes('%')) return null;

  try {
    const parsed = new URL(`http://[${value}]/`);
    return parsed.hostname.startsWith('[') && parsed.hostname.endsWith(']') ? 6 : null;
  } catch {
    return null;
  }
}

/**
 * Mask the host portion for default display while preserving enough prefix
 * context for the visitor to recognize the connection.
 */
export function maskIPAddress(ip: string): string {
  const version = getIPVersion(ip);
  if (version === 4) {
    const parts = ip.trim().split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  if (version === 6) {
    const visible = ip.trim().split('::', 1)[0].split(':').filter(Boolean).slice(0, 3);
    return visible.length > 0 ? `${visible.join(':')}:…` : '…';
  }

  return 'Unavailable';
}
