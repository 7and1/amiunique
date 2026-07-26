/**
 * POST /api/analyze - Main fingerprint analysis endpoint
 * Receives client fingerprint, adds network data, calculates Three-Lock hashes,
 * stores in D1, and returns uniqueness analysis
 */

import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env, CFRequest, CFProperties } from '../types/env.js';
import { deriveIdempotentVisitId, uuidv4 } from '../lib/hash.js';
import {
  calculateThreeLocks,
  type ClientFingerprint,
  type NetworkFingerprint,
} from '../lib/three-lock.js';
import { parseUserAgent, determineDeviceType } from '../lib/ua-parser.js';
import { FingerprintSchema } from '../lib/validation.js';
import { analyzeLimiter } from '../middleware/rate-limit.js';
import { requireClientIP } from '../middleware/require-client-ip.js';
import { getClientIP, isValidIP } from '../lib/ip-utils.js';
import { lookupIP, summarizeIPIntel, type IPIntelResult } from '../lib/ipbot.js';
import { buildConsistencyReport } from '../lib/cross-check.js';
import { redactFingerprintForPersistence, redactFingerprintForResponse } from '../lib/privacy.js';

const analyze = new Hono<{
  Bindings: Env;
  Variables: { requestId: string };
}>();

// Maximum payload size (50KB)
const MAX_PAYLOAD_SIZE = 50 * 1024;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * How long the response waits on IP intelligence before answering without it.
 * The lookup keeps its full 5s budget in the background: on a timeout the
 * client gets ip_intel_status 'pending' and polls GET /api/ip-intel, which by
 * then reads the warmed KV entry.
 */
const IP_INTEL_GRACE_MS = 1500;
const IP_INTEL_PENDING = Symbol('ip-intel-pending');

export type IPIntelStatus = 'available' | 'unavailable' | 'pending';

analyze.use(
  '*',
  bodyLimit({
    maxSize: MAX_PAYLOAD_SIZE,
    onError: c =>
      c.json(
        {
          success: false,
          error: 'Payload too large',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds maximum allowed size of 50KB',
        },
        413
      ),
  })
);
analyze.use('*', requireClientIP);
analyze.use('*', analyzeLimiter);

/**
 * Extract network fingerprint from Cloudflare request.cf object
 */
async function extractNetworkFingerprint(request: CFRequest): Promise<NetworkFingerprint> {
  const cf = request.cf || ({} as CFProperties);

  return {
    net_asn: cf.asn,
    net_asn_org: cf.asOrganization,
    net_colo: cf.colo,
    net_country: cf.country,
    net_timezone: cf.timezone,
    net_city: cf.city,
    net_region: cf.region,
    net_postal: cf.postalCode,
    net_latitude: cf.latitude ? parseFloat(cf.latitude) : undefined,
    net_longitude: cf.longitude ? parseFloat(cf.longitude) : undefined,
    net_tls_version: cf.tlsVersion,
    net_tls_cipher: cf.tlsCipher,
    net_http_protocol: cf.httpProtocol,
    net_tcp_rtt: cf.clientTcpRtt,
    net_bot_score: cf.botManagement?.score,
  };
}

/**
 * Main analysis endpoint
 */
analyze.post('/', async c => {
  const startTime = Date.now();
  const db = c.env.DB;
  const request = c.req.raw as CFRequest;

  try {
    const idempotencyKey = c.req.header('Idempotency-Key');
    if (idempotencyKey && !UUID_V4_PATTERN.test(idempotencyKey)) {
      return c.json(
        {
          success: false,
          error: 'Invalid idempotency key',
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be a UUID v4.',
        },
        400
      );
    }

    // 1. Parse JSON with error handling
    let rawData: unknown;
    try {
      rawData = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: 'Invalid JSON',
          code: 'JSON_PARSE_ERROR',
          message: 'Request body is not valid JSON',
        },
        400
      );
    }

    // 2. Validate client fingerprint data
    const parseResult = FingerprintSchema.safeParse(rawData);

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: 'Invalid fingerprint data',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.issues.slice(0, 5).map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        400
      );
    }

    const clientData = parseResult.data as ClientFingerprint;

    // 3. Get client IP using consistent fallback chain
    const clientIP = getClientIP(c);

    // 4. Extract network fingerprint from Cloudflare
    const networkData = await extractNetworkFingerprint(request);

    // 4a. Start one bounded IP intelligence attempt (concurrent with DB work, fails open)
    const ipIntelPromise =
      isValidIP(clientIP) && c.env.RATE_LIMIT_KV
        ? lookupIP(clientIP, c.env, {
            timeoutMs: 5000,
            retryDelaysMs: [],
            requireCache: true,
          }).catch(() => null)
        : Promise.resolve(null);

    // 5. Calculate Three-Lock hashes
    const hashes = await calculateThreeLocks(clientData, networkData);

    // 6. Merge all data for storage
    const fullReport = { ...clientData, ...networkData };
    const safeReport = redactFingerprintForPersistence(fullReport);
    const responseReport = redactFingerprintForResponse(fullReport);

    // 7. Parse UA for meta fields
    const uaInfo = parseUserAgent(clientData.sys_user_agent || '');
    const deviceType = determineDeviceType(
      clientData.sys_user_agent || '',
      clientData.hw_touch_points,
      clientData.hw_screen_width,
      clientData.hw_screen_height
    );
    const screenRes = `${clientData.hw_screen_width || 0}x${clientData.hw_screen_height || 0}`;

    // 8. Reuse a client submission ID across network retries. The key selects
    // the row deterministically but never becomes the primary key itself, so a
    // caller cannot choose where its data lands.
    const visitId = idempotencyKey ? await deriveIdempotentVisitId(idempotencyKey) : uuidv4();
    const now = Date.now();

    // 9. Insert first so every aggregate query observes one deterministic snapshot.
    // Replaying the same Idempotency-Key leaves the original row unchanged.
    const insertResult = await db
      .prepare(
        `INSERT OR IGNORE INTO visits (
          id, created_at, hardware_hash, software_hash, full_hash,
          meta_browser, meta_browser_version, meta_os, meta_os_version,
          meta_device_type, meta_country, meta_screen, meta_gpu_vendor, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        visitId,
        now,
        hashes.gold,
        hashes.silver,
        hashes.bronze,
        uaInfo.browser,
        uaInfo.browserVersion,
        uaInfo.os,
        uaInfo.osVersion,
        deviceType,
        networkData.net_country || null,
        screenRes,
        clientData.hw_webgl_vendor || null,
        JSON.stringify(safeReport)
      )
      .run();

    // 10. Verify INSERT succeeded
    if (!insertResult.success) {
      console.error('Database insert failed:', insertResult);
      return c.json(
        {
          success: false,
          error: 'Database error',
          code: 'DB_INSERT_FAILED',
          message: 'Failed to store fingerprint data',
        },
        500
      );
    }

    let observationTimestamp = now;
    if (insertResult.meta?.changes === 0) {
      const existingVisit = await db
        .prepare(
          `SELECT created_at, hardware_hash, software_hash, full_hash
           FROM visits
           WHERE id = ?`
        )
        .bind(visitId)
        .first<{
          created_at: number;
          hardware_hash: string;
          software_hash: string;
          full_hash: string;
        }>();

      if (!existingVisit) {
        return c.json(
          {
            success: false,
            error: 'Database error',
            code: 'IDEMPOTENCY_LOOKUP_FAILED',
            message: 'Unable to resolve the existing fingerprint submission.',
          },
          500
        );
      }

      if (
        existingVisit.hardware_hash !== hashes.gold ||
        existingVisit.software_hash !== hashes.silver ||
        existingVisit.full_hash !== hashes.bronze
      ) {
        return c.json(
          {
            success: false,
            error: 'Idempotency conflict',
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'This Idempotency-Key was already used for another fingerprint.',
          },
          409
        );
      }

      observationTimestamp = existingVisit.created_at || now;
    }

    // 11. Read all post-insert counts from one database snapshot. The corpus
    // size comes from the cron-maintained cache so the hot path never runs a
    // full table COUNT(*); the live count remains the fallback.
    const observationCounts = await db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM visits WHERE full_hash = ?) AS exact_count,
          (SELECT COUNT(*) FROM visits WHERE hardware_hash = ?) AS hardware_count,
          (
            SELECT COUNT(DISTINCT software_hash)
            FROM visits
            WHERE hardware_hash = ?
          ) AS browser_variant_count,
          COALESCE(
            (SELECT total_fingerprints FROM stats_cache WHERE id = 'global'),
            (SELECT COUNT(*) FROM visits)
          ) AS total_count`
      )
      .bind(hashes.bronze, hashes.gold, hashes.gold)
      .first<{
        exact_count: number;
        hardware_count: number;
        browser_variant_count: number;
        total_count: number;
      }>();

    // 12. Calculate results from observations, not inferred physical devices.
    const exactMatchCount = observationCounts?.exact_count || 0;
    const hardwareMatchCount = observationCounts?.hardware_count || 0;
    const browserVariantCount = observationCounts?.browser_variant_count || 0;
    // The cached corpus size lags by up to 5 minutes, so clamp it above the
    // exact counts this request just observed. A subset can never exceed the
    // whole, and "1 of 0" must never reach the client.
    const totalFingerprints = Math.max(
      observationCounts?.total_count || 0,
      exactMatchCount,
      hardwareMatchCount
    );
    const isUnique = exactMatchCount === 1;
    const observationMatchRate = totalFingerprints === 0 ? 1 : exactMatchCount / totalFingerprints;
    const comparableObservations = Math.max(totalFingerprints - 1, 0);
    const matchingObservations = Math.max(exactMatchCount - 1, 0);
    const uniquenessRatio =
      comparableObservations === 0
        ? 1
        : Math.max(0, 1 - matchingObservations / comparableObservations);
    const isDeviceTracked = browserVariantCount > 1;

    // 13. Determine tracking risk level
    let trackingRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let message = '';

    if (isDeviceTracked) {
      trackingRisk = 'critical';
      message = `Cross-browser tracking detected: ${browserVariantCount} browser fingerprints share this hardware signal.`;
    } else if (isUnique) {
      trackingRisk = 'high';
      message = 'Your browser fingerprint is UNIQUE in our database! You can be easily tracked.';
    } else if (exactMatchCount < 5 || observationMatchRate < 0.001) {
      trackingRisk = 'high';
      message = `Only ${exactMatchCount} identical fingerprints found - you are highly identifiable.`;
    } else if (exactMatchCount < 50 || observationMatchRate < 0.01) {
      trackingRisk = 'medium';
      message = `${exactMatchCount} similar fingerprints found - moderate tracking risk.`;
    } else {
      trackingRisk = 'low';
      message = `${exactMatchCount} identical fingerprints found - you blend in with the crowd.`;
    }

    // 14. Give IP intelligence (in flight since step 4a) a short grace window.
    // Past it the response ships without the summary and the lookup finishes in
    // the background so the client's follow-up read hits a warm cache.
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const grace = new Promise<typeof IP_INTEL_PENDING>(resolve => {
      graceTimer = setTimeout(() => resolve(IP_INTEL_PENDING), IP_INTEL_GRACE_MS);
    });
    const raced = await Promise.race([ipIntelPromise, grace]);
    clearTimeout(graceTimer);

    let ipIntel: IPIntelResult | null = null;
    let ipIntelStatus: IPIntelStatus;
    if (raced === IP_INTEL_PENDING) {
      ipIntelStatus = 'pending';
      try {
        c.executionCtx.waitUntil(ipIntelPromise);
      } catch {
        // No executionCtx outside the Worker runtime; the lookup already
        // swallows its own errors, so there is nothing to keep alive.
      }
    } else {
      ipIntel = raced;
      ipIntelStatus = ipIntel ? 'available' : 'unavailable';
    }

    const ipIntelSummary = summarizeIPIntel(ipIntel);
    const consistency = buildConsistencyReport(clientData, networkData, ipIntelSummary, clientIP);
    if (c.env.IPBOT_API_ORIGIN && c.env.IPBOT_API_KEY) {
      console.log(
        `[analysis] ip_intel=${ipIntelStatus} contradictions=${consistency.contradiction_count} risk_signals=${consistency.risk_signal_count}`
      );
    }

    // 15. Return comprehensive response
    return c.json({
      success: true,
      meta: {
        id: visitId,
        timestamp: observationTimestamp,
        processing_time_ms: Date.now() - startTime,
      },
      hashes: {
        gold: hashes.gold,
        silver: hashes.silver,
        bronze: hashes.bronze,
      },
      result: {
        is_unique: isUnique,
        uniqueness_ratio: uniquenessRatio,
        uniqueness_display: `${exactMatchCount.toLocaleString()} of ${totalFingerprints.toLocaleString()}`,
        exact_match_count: exactMatchCount,
        hardware_match_count: hardwareMatchCount,
        browser_variant_count: browserVariantCount,
        total_fingerprints: totalFingerprints,
        tracking_risk: trackingRisk,
        message: message,
        cross_browser_detected: isDeviceTracked,
      },
      details: responseReport,
      ip_intel: ipIntelSummary,
      ip_intel_status: ipIntelStatus,
      consistency,
      lies: {
        os_mismatch: clientData.lie_os_mismatch || false,
        browser_mismatch: clientData.lie_browser_mismatch || false,
        resolution_mismatch: clientData.lie_resolution_mismatch || false,
        timezone_mismatch: clientData.lie_timezone_mismatch || false,
        webgl_mismatch: clientData.lie_webgl_mismatch || false,
        headless: clientData.lie_headless || false,
        automation: clientData.lie_automation || false,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to analyze fingerprint',
        code: 'ANALYSIS_FAILED',
        message:
          c.env.ENVIRONMENT === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'Unable to complete the analysis',
        request_id: c.get('requestId') || 'unknown',
      },
      500
    );
  }
});

export default analyze;
