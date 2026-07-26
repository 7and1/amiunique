/**
 * Live integration test for the IPBot client.
 * Runs ONLY when IPBOT_API_ORIGIN + IPBOT_API_KEY are present in the environment
 * (e.g. `set -a; source .dev.vars; set +a; vitest run tests/ipbot.live.test.ts`).
 * Skipped in CI and normal test runs. Never logs the API key.
 */

import { describe, it, expect } from 'vitest';
import { lookupIP } from '../src/lib/ipbot.js';
import type { Env } from '../src/types/env.js';

// Worker-typed tsconfig has no Node types; read process.env via globalThis
const nodeEnv =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const origin = nodeEnv.IPBOT_API_ORIGIN;
const apiKey = nodeEnv.IPBOT_API_KEY;
const configured = Boolean(origin && apiKey);

function createMemoryKV() {
  const store = new Map<string, string>();
  return {
    async get(key: string, _type?: string) {
      const value = store.get(key);
      return value ? JSON.parse(value) : null;
    },
    async put(key: string, value: string, _options?: { expirationTtl?: number }) {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

describe.skipIf(!configured)('lookupIP (live)', () => {
  it('looks up 8.8.8.8 and serves the second call from cache', async () => {
    const env = {
      IPBOT_API_ORIGIN: origin,
      IPBOT_API_KEY: apiKey,
      RATE_LIMIT_KV: createMemoryKV(),
    } as Env;

    const first = await lookupIP('8.8.8.8', env);
    expect(first).not.toBeNull();
    expect(first!.cached).toBe(false);
    // The response schema strips `ip`: the address never round-trips through
    // our own payloads or cache entries.
    expect(first!.data.score).toBeDefined();
    expect(typeof first!.data.score?.risk_score).toBe('number');
    console.log(
      `[live] 8.8.8.8 risk_score=${first!.data.score?.risk_score} band=${first!.data.score?.band} asn=${first!.data.network?.asn}`
    );

    const second = await lookupIP('8.8.8.8', env);
    expect(second).not.toBeNull();
    expect(second!.cached).toBe(true);
    expect(second!.data.score?.risk_score).toBe(first!.data.score?.risk_score);
  }, 20000);
});
