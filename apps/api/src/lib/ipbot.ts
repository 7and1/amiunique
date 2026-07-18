/**
 * IPBot IP intelligence client
 * Wraps GET {IPBOT_API_ORIGIN}/v1/ip/{ip} with KV caching and light 429 backoff.
 *
 * Configuration (see .github/SECRETS.md):
 * - IPBOT_API_ORIGIN: API origin URL (wrangler var)
 * - IPBOT_API_KEY: API key, sent as X-API-Key (wrangler secret / .dev.vars)
 *
 * Fails open: any error, timeout, or missing configuration returns null so
 * fingerprint analysis never depends on IPBot availability.
 */

import type { Env } from '../types/env.js';
import { z } from 'zod';
import { sha256 } from './hash.js';

export interface IPIntelScore {
  ip_score?: number;
  risk_score?: number;
  band?: string;
  verdict?: string;
  recommended_action?: string;
}

export interface IPIntelClassification {
  usage_type?: string;
  is_datacenter?: boolean;
  is_proxy?: boolean;
  is_public_resolver?: boolean;
  is_anycast?: boolean;
  threat_level?: string;
  [key: string]: unknown;
}

export interface IPIntelNetwork {
  asn?: number;
  org?: string;
  category?: string;
  operator?: string;
  operator_type?: string;
  [key: string]: unknown;
}

export interface IPIntelLocation {
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface IPIntelData {
  ip?: string;
  score?: IPIntelScore;
  classification?: IPIntelClassification;
  network?: IPIntelNetwork;
  location?: IPIntelLocation;
}

export interface IPIntelResult {
  data: IPIntelData;
  cached: boolean;
  fetched_at: number;
}

export interface LookupOptions {
  /** Fetch timeout per attempt in ms */
  timeoutMs?: number;
  /** Backoff delays between 429 retries in ms (length = max retries) */
  retryDelaysMs?: number[];
  /** Do not call the provider when the required KV cache cannot be read */
  requireCache?: boolean;
}

interface CacheEntry {
  data: IPIntelData;
  fetched_at: number;
}

export interface IPIntelSummary {
  risk_score: number | null;
  ip_score: number | null;
  band: string | null;
  usage_type: string | null;
  is_datacenter: boolean | null;
  is_proxy: boolean | null;
  threat_level: string | null;
  asn: number | null;
  asn_org: string | null;
  operator: string | null;
  cached: boolean;
}

const CACHE_PREFIX = 'ipintel:';
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24h for normal results
const HIGH_RISK_TTL_SECONDS = 60 * 60; // 1h for high-risk results (re-check sooner)
const HIGH_RISK_SCORE = 70;
// Observed live TTFB fluctuates 1.2-3s (VPS backend); 5s keeps the fail-open
// path rare while the lookup runs concurrently with D1 operations
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRY_DELAYS_MS = [400, 800];
const MAX_RESPONSE_BYTES = 64 * 1024;
// Top-level field projection keeps responses and cache entries small
const FIELDS = 'score,classification,network';

const IPIntelDataSchema = z
  .object({
    score: z
      .object({
        ip_score: z.number().min(0).max(100).optional(),
        risk_score: z.number().min(0).max(100).optional(),
        band: z.string().max(64).optional(),
        verdict: z.string().max(128).optional(),
        recommended_action: z.string().max(128).optional(),
      })
      .strip()
      .optional(),
    classification: z
      .object({
        usage_type: z.string().max(128).optional(),
        is_datacenter: z.boolean().optional(),
        is_proxy: z.boolean().optional(),
        is_public_resolver: z.boolean().optional(),
        is_anycast: z.boolean().optional(),
        threat_level: z.string().max(128).optional(),
      })
      .strip()
      .optional(),
    network: z
      .object({
        asn: z.number().int().min(0).max(4_294_967_295).optional(),
        org: z.string().max(256).optional(),
        category: z.string().max(128).optional(),
        operator: z.string().max(256).optional(),
        operator_type: z.string().max(128).optional(),
      })
      .strip()
      .optional(),
  })
  .strip();

/**
 * High-risk results get a shorter cache TTL so reputation changes surface faster
 */
export function isHighRisk(data: IPIntelData): boolean {
  const score = data.score;
  if (!score) return false;
  return (
    (typeof score.risk_score === 'number' && score.risk_score >= HIGH_RISK_SCORE) ||
    score.band === 'poor' ||
    score.band === 'danger'
  );
}

function logRateLimit(response: Response): void {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const tier = response.headers.get('X-RateLimit-Tier');
  if (!limit && !remaining && !tier) return;

  const summary = `limit=${limit} remaining=${remaining} tier=${tier}`;
  const remainingNum = remaining ? parseInt(remaining, 10) : NaN;
  const limitNum = limit ? parseInt(limit, 10) : NaN;
  if (!isNaN(remainingNum) && !isNaN(limitNum) && remainingNum < limitNum * 0.1) {
    console.warn(`[ipbot] rate limit nearly exhausted: ${summary}`);
  } else {
    console.log(`[ipbot] rate limit: ${summary}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function projectCacheData(data: IPIntelData): IPIntelData {
  return {
    score: data.score
      ? {
          ip_score: data.score.ip_score,
          risk_score: data.score.risk_score,
          band: data.score.band,
          verdict: data.score.verdict,
          recommended_action: data.score.recommended_action,
        }
      : undefined,
    classification: data.classification
      ? {
          usage_type: data.classification.usage_type,
          is_datacenter: data.classification.is_datacenter,
          is_proxy: data.classification.is_proxy,
          is_public_resolver: data.classification.is_public_resolver,
          is_anycast: data.classification.is_anycast,
          threat_level: data.classification.threat_level,
        }
      : undefined,
    network: data.network
      ? {
          asn: data.network.asn,
          org: data.network.org,
          category: data.network.category,
          operator: data.network.operator,
          operator_type: data.network.operator_type,
        }
      : undefined,
  };
}

/**
 * Look up IP intelligence for an IP address.
 * Results are cached in KV: 24h by default, 1h for high-risk IPs.
 * Retries lightly on 429 (honoring Retry-After up to 2s), fails open on errors.
 */
export async function lookupIP(
  ip: string,
  env: Pick<Env, 'IPBOT_API_ORIGIN' | 'IPBOT_API_KEY' | 'RATE_LIMIT_KV'>,
  options: LookupOptions = {}
): Promise<IPIntelResult | null> {
  const origin = env.IPBOT_API_ORIGIN;
  const apiKey = env.IPBOT_API_KEY;
  if (!origin || !apiKey) return null;
  if (!ip || ip === 'unknown') return null;

  const kv = env.RATE_LIMIT_KV;
  const cacheKey = `${CACHE_PREFIX}${await sha256(ip)}`;

  // 1. Cache lookup (skipped when KV is unavailable, e.g. local dev)
  if (kv) {
    try {
      const cached = (await kv.get(cacheKey, 'json')) as CacheEntry | null;
      if (cached?.data) {
        const parsed = IPIntelDataSchema.safeParse(cached.data);
        if (parsed.success && Number.isFinite(cached.fetched_at)) {
          return { data: parsed.data, cached: true, fetched_at: cached.fetched_at };
        }
      }
    } catch (err) {
      console.warn('[ipbot] cache read failed:', err);
      if (options.requireCache) return null;
    }
  } else if (options.requireCache) {
    return null;
  }

  // 2. Fetch with light 429 backoff
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const url = `${origin}/v1/ip/${encodeURIComponent(ip)}?fields=${FIELDS}`;

  let response: Response | null = null;
  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      response = await fetch(url, {
        headers: { 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      console.warn('[ipbot] lookup failed:', err instanceof Error ? err.message : err);
      return null;
    }

    logRateLimit(response);
    if (response.status !== 429) break;

    if (attempt === retryDelays.length) {
      console.warn(`[ipbot] lookup rate limited (429) after ${attempt + 1} attempts`);
      return null;
    }
    const retryAfter = parseInt(response.headers.get('Retry-After') || '', 10);
    const delay = !isNaN(retryAfter) ? Math.min(retryAfter * 1000, 2000) : retryDelays[attempt];
    await sleep(delay);
  }

  if (!response || !response.ok) {
    console.warn(`[ipbot] lookup returned HTTP ${response?.status}`);
    return null;
  }

  const declaredLength = Number(response.headers.get('Content-Length') || '0');
  if (declaredLength > MAX_RESPONSE_BYTES) {
    console.warn('[ipbot] response exceeded size limit');
    return null;
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch (err) {
    console.warn('[ipbot] failed to read response:', err);
    return null;
  }
  if (responseText.length > MAX_RESPONSE_BYTES) {
    console.warn('[ipbot] response exceeded size limit');
    return null;
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(responseText);
  } catch (err) {
    console.warn('[ipbot] failed to parse response:', err);
    return null;
  }

  const validated = IPIntelDataSchema.safeParse(parsedData);
  if (!validated.success) {
    console.warn('[ipbot] response schema validation failed');
    return null;
  }
  const data = validated.data;

  // 3. Cache write (shorter TTL for high-risk IPs)
  const fetchedAt = Date.now();
  if (kv) {
    const ttl = isHighRisk(data) ? HIGH_RISK_TTL_SECONDS : DEFAULT_TTL_SECONDS;
    const entry: CacheEntry = { data: projectCacheData(data), fetched_at: fetchedAt };
    try {
      await kv.put(cacheKey, JSON.stringify(entry), { expirationTtl: ttl });
    } catch (err) {
      console.warn('[ipbot] cache write failed:', err);
    }
  }

  return { data, cached: false, fetched_at: fetchedAt };
}

/**
 * Compact summary of an IPBot result for embedding in API responses
 */
export function summarizeIPIntel(result: IPIntelResult | null): IPIntelSummary | null {
  if (!result) return null;
  const { score, classification, network } = result.data;
  return {
    risk_score: score?.risk_score ?? null,
    ip_score: score?.ip_score ?? null,
    band: score?.band ?? null,
    usage_type: classification?.usage_type ?? null,
    is_datacenter: classification?.is_datacenter ?? null,
    is_proxy: classification?.is_proxy ?? null,
    threat_level: classification?.threat_level ?? null,
    asn: network?.asn ?? null,
    asn_org: network?.org ?? null,
    operator: network?.operator ?? null,
    cached: result.cached,
  };
}
