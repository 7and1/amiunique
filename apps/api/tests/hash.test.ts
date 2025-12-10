/**
 * Unit tests for hash utilities
 * Tests SHA-256 hashing, UUID generation, and component hashing
 */

import { describe, it, expect } from 'vitest';
import { sha256, uuidv4, hashComponents } from '../src/lib/hash.js';

describe('sha256', () => {
  it('should produce consistent hash for same input', async () => {
    const input = 'test-input-string';
    const hash1 = await sha256(input);
    const hash2 = await sha256(input);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', async () => {
    const hash1 = await sha256('input-a');
    const hash2 = await sha256('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should return 64-character hex string', async () => {
    const hash = await sha256('any-string');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle empty string', async () => {
    const hash = await sha256('');
    expect(hash).toHaveLength(64);
    // Known SHA-256 of empty string
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode characters', async () => {
    const hash = await sha256('Hello 世界 🌍');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle very long strings', async () => {
    const longString = 'x'.repeat(100000);
    const hash = await sha256(longString);
    expect(hash).toHaveLength(64);
  });
});

describe('uuidv4', () => {
  it('should generate valid UUID v4 format', () => {
    const uuid = uuidv4();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      uuids.add(uuidv4());
    }
    expect(uuids.size).toBe(1000);
  });

  it('should have correct length', () => {
    const uuid = uuidv4();
    expect(uuid).toHaveLength(36);
  });
});

describe('hashComponents', () => {
  it('should hash array of strings', async () => {
    const hash = await hashComponents(['a', 'b', 'c']);
    expect(hash).toHaveLength(64);
  });

  it('should produce consistent hash for same components', async () => {
    const components = ['canvas-hash', '1920', '1080', 'true'];
    const hash1 = await hashComponents(components);
    const hash2 = await hashComponents(components);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash for different order', async () => {
    const hash1 = await hashComponents(['a', 'b']);
    const hash2 = await hashComponents(['b', 'a']);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle undefined values', async () => {
    const hash = await hashComponents(['a', undefined, 'c']);
    expect(hash).toHaveLength(64);
    // undefined should be treated as empty string
    const hashWithEmpty = await hashComponents(['a', '', 'c']);
    expect(hash).toBe(hashWithEmpty);
  });

  it('should handle null values', async () => {
    const hash = await hashComponents(['a', null, 'c']);
    const hashWithEmpty = await hashComponents(['a', '', 'c']);
    expect(hash).toBe(hashWithEmpty);
  });

  it('should handle boolean values', async () => {
    const hashTrue = await hashComponents(['test', true]);
    const hashFalse = await hashComponents(['test', false]);
    expect(hashTrue).not.toBe(hashFalse);

    // true should become '1', false should become '0'
    const hashWithOne = await hashComponents(['test', '1']);
    const hashWithZero = await hashComponents(['test', '0']);
    expect(hashTrue).toBe(hashWithOne);
    expect(hashFalse).toBe(hashWithZero);
  });

  it('should handle number values', async () => {
    const hashNum = await hashComponents([1920, 1080]);
    const hashStr = await hashComponents(['1920', '1080']);
    expect(hashNum).toBe(hashStr);
  });

  it('should handle mixed types', async () => {
    const hash = await hashComponents([
      'string',
      42,
      true,
      false,
      null,
      undefined,
      0,
      '',
    ]);
    expect(hash).toHaveLength(64);
  });

  it('should handle empty array', async () => {
    const hash = await hashComponents([]);
    expect(hash).toHaveLength(64);
  });
});
