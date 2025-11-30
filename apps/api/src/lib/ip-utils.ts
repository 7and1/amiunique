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
  const cfIP = c.req.header('CF-Connecting-IP');
  if (cfIP) return cfIP;

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
  return ip !== '' && ip !== 'unknown';
}
