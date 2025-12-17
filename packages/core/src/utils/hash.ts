/**
 * SHA-256 hash utility for client-side fingerprinting
 * Uses Web Crypto API for consistent, native hashing
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
 * Hash an array of values by joining with separator
 * Handles undefined/null by converting to empty string
 * @param values - Array of values to hash
 * @param separator - Separator between values (default: |)
 * @returns Hex-encoded hash string
 */
export async function hashValues(
  values: (string | number | boolean | undefined | null)[],
  separator = '|'
): Promise<string> {
  const normalized = values.map(v => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    return String(v);
  });
  return sha256(normalized.join(separator));
}

/**
 * Create a deterministic hash from an object
 * Keys are sorted to ensure consistent ordering
 * @param obj - Object to hash
 * @returns Hex-encoded hash string
 */
export async function hashObject(obj: Record<string, unknown>): Promise<string> {
  const sortedKeys = Object.keys(obj).sort();
  const values = sortedKeys.map(key => {
    const val = obj[key];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
  return sha256(values.join('|'));
}
