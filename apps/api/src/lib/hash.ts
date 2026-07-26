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
 * Namespace for idempotency-key-derived visit IDs. Bump the version if the
 * derivation changes, so old and new keys cannot collide.
 */
const VISIT_ID_NAMESPACE = 'amiunique:idem:v1:';

/**
 * Derive the visit primary key from a client Idempotency-Key.
 *
 * The client picks the key but not the row ID: the ID is SHA-256 of the
 * namespaced key, truncated to 16 bytes and stamped with UUIDv4 version and
 * variant bits. Deterministic, so replaying a key still resolves to the same
 * row and the 409 conflict path still works.
 */
export async function deriveIdempotentVisitId(idempotencyKey: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${VISIT_ID_NAMESPACE}${idempotencyKey}`)
  );
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
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
