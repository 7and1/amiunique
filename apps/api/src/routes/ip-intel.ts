/**
 * GET /api/ip-intel - Inspect the current request's own connection.
 *
 * This endpoint intentionally accepts no IP parameter. It returns a compact,
 * no-store response and never writes the address or provider payload to D1.
 */

import { Hono } from 'hono';
import type { Env, CFProperties, CFRequest } from '../types/env.js';
import { sha256 } from '../lib/hash.js';
import { getIPVersion, isValidIP, maskIPAddress } from '../lib/ip-utils.js';
import { lookupIP, summarizeIPIntel, type IPIntelResult } from '../lib/ipbot.js';
import { ipIntelRateLimit } from '../middleware/ip-intel-rate-limit.js';

const ipIntel = new Hono<{ Bindings: Env }>();
const inFlightLookups = new Map<string, Promise<IPIntelResult | null>>();

const TRUSTED_ORIGINS = new Set([
  'https://amiunique.io',
  'https://www.amiunique.io',
  'https://amiunique.pages.dev',
]);

function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  try {
    const url = new URL(origin);
    return (
      url.protocol === 'https:' &&
      (TRUSTED_ORIGINS.has(url.origin) || url.hostname.endsWith('.amiunique.pages.dev'))
    );
  } catch {
    return false;
  }
}

function setPrivateNoStoreHeaders(headers: Headers): void {
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  headers.set('CDN-Cache-Control', 'no-store');
}

async function lookupCurrentConnection(address: string, env: Env): Promise<IPIntelResult | null> {
  const key = await sha256(address);
  const pending = inFlightLookups.get(key);
  if (pending) return pending;

  const lookup = lookupIP(address, env, {
    timeoutMs: 5000,
    retryDelaysMs: [],
    requireCache: true,
  });
  inFlightLookups.set(key, lookup);
  try {
    return await lookup;
  } finally {
    if (inFlightLookups.get(key) === lookup) inFlightLookups.delete(key);
  }
}

ipIntel.get(
  '/',
  async (c, next) => {
    if (c.req.method !== 'GET') {
      const response = c.json(
        {
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
          message: 'Use GET to inspect the current connection.',
        },
        405
      );
      response.headers.set('Allow', 'GET');
      setPrivateNoStoreHeaders(response.headers);
      return response;
    }

    if (!isTrustedOrigin(c.req.header('Origin'))) {
      const response = c.json(
        {
          success: false,
          error: 'Origin not allowed',
          code: 'ORIGIN_NOT_ALLOWED',
          message: 'This visitor-specific endpoint is restricted to AmiUnique.io.',
        },
        403
      );
      setPrivateNoStoreHeaders(response.headers);
      return response;
    }

    if (new URL(c.req.url).search.length > 0) {
      const response = c.json(
        {
          success: false,
          error: 'Unsupported query parameters',
          code: 'UNSUPPORTED_QUERY',
          message: 'This endpoint only checks the current connection and accepts no IP parameter.',
        },
        400
      );
      setPrivateNoStoreHeaders(response.headers);
      return response;
    }

    await next();
    setPrivateNoStoreHeaders(c.res.headers);
    return c.res;
  },
  ipIntelRateLimit,
  async c => {
    const address = c.req.header('CF-Connecting-IP')?.trim() || '';
    const version = getIPVersion(address);
    if (!isValidIP(address) || version === null) {
      return c.json(
        {
          success: false,
          error: 'Connection identity unavailable',
          code: 'CLIENT_IP_UNAVAILABLE',
          message: 'The current connection address could not be determined.',
        },
        503
      );
    }

    const request = c.req.raw as CFRequest;
    const cf = request.cf || ({} as CFProperties);
    const result =
      c.env.RATE_LIMIT_KV && c.env.IP_INTEL_RATE_LIMITER
        ? await lookupCurrentConnection(address, c.env)
        : null;
    const summary = summarizeIPIntel(result);
    const intelligence = summary
      ? {
          risk_score: summary.risk_score,
          ip_score: summary.ip_score,
          band: summary.band,
          usage_type: summary.usage_type,
          is_datacenter: summary.is_datacenter,
          is_proxy: summary.is_proxy,
          threat_level: summary.threat_level,
          asn: summary.asn,
          asn_org: summary.asn_org,
          operator: summary.operator,
        }
      : null;

    console.log(
      `[ip-intel] status=${intelligence ? 'available' : 'unavailable'} cached=${result?.cached ?? false}`
    );

    return c.json({
      success: true,
      data: {
        address,
        masked_address: maskIPAddress(address),
        ip_version: version === 4 ? 'ipv4' : 'ipv6',
        network: {
          asn: cf.asn ?? intelligence?.asn ?? null,
          asn_org: cf.asOrganization ?? intelligence?.asn_org ?? intelligence?.operator ?? null,
          colo: cf.colo ?? null,
          country: cf.country ?? null,
          city: cf.city ?? null,
          region: cf.region ?? null,
          timezone: cf.timezone ?? null,
        },
        intelligence,
        intelligence_status: intelligence ? 'available' : 'unavailable',
        checked_at: Date.now(),
      },
    });
  }
);

export default ipIntel;
