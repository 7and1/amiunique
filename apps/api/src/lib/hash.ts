/**
 * SHA-256 hash utilities for Worker
 * Uses Web Crypto API available in Cloudflare Workers
 */

/**
 * Calculate SHA-256 hash of a string
 * @param message - String to hash
 * @returns Hex-encoded hash string
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message || '');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate UUID v4 using crypto API
 * @returns UUID string
 */
export function uuidv4(): string {
  return crypto.randomUUID();
}

/**
 * Hash an array of values by joining with pipe separator
 * Handles undefined/null by converting to empty string
 * @param values - Array of values to hash
 * @returns Hex-encoded hash string
 */
export async function hashComponents(
  values: (string | number | boolean | undefined | null)[]
): Promise<string> {
  const normalized = values.map(v => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    return String(v);
  });
  return sha256(normalized.join('|'));
}
