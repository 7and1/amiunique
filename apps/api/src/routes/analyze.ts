/**
 * POST /api/analyze - Main fingerprint analysis endpoint
 * Receives client fingerprint, adds network data, calculates Three-Lock hashes,
 * stores in D1, and returns uniqueness analysis
 */

import { Hono } from 'hono';
import type { Env, CFRequest, CFProperties } from '../types/env.js';
import { sha256, uuidv4 } from '../lib/hash.js';
import { calculateThreeLocks, type ClientFingerprint, type NetworkFingerprint } from '../lib/three-lock.js';
import { parseUserAgent, determineDeviceType } from '../lib/ua-parser.js';
import { FingerprintSchema } from '../lib/validation.js';
import { analyzeLimiter } from '../middleware/rate-limit.js';
import { getClientIP } from '../lib/ip-utils.js';

const analyze = new Hono<{ Bindings: Env }>();

// Apply rate limiting to all analyze routes
analyze.use('*', analyzeLimiter);

// Maximum payload size (50KB)
const MAX_PAYLOAD_SIZE = 50 * 1024;

/**
 * Extract network fingerprint from Cloudflare request.cf object
 */
async function extractNetworkFingerprint(
  request: CFRequest,
  ip: string
): Promise<NetworkFingerprint> {
  const cf = request.cf || {} as CFProperties;

  return {
    net_ip_hash: await sha256(ip),
    net_asn: cf.asn,
    net_asn_org: cf.asOrganization,
    net_colo: cf.colo,
    net_country: cf.country,
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
analyze.post('/', async (c) => {
  const startTime = Date.now();
  const db = c.env.DB;
  const request = c.req.raw as CFRequest;

  try {
    // 0. Check payload size (header check)
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return c.json(
        {
          success: false,
          error: 'Payload too large',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds maximum allowed size of 50KB',
        },
        413
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

    // 1a. Check payload size after parsing (in case Content-Length was missing/wrong)
    const payloadSize = JSON.stringify(rawData).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return c.json(
        {
          success: false,
          error: 'Payload too large',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds maximum allowed size of 50KB',
        },
        413
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
          details: parseResult.error.issues.slice(0, 5).map((issue) => ({
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
    const networkData = await extractNetworkFingerprint(request, clientIP);

    // 5. Calculate Three-Lock hashes
    const hashes = await calculateThreeLocks(clientData, networkData);

    // 6. Merge all data for storage
    const fullReport = { ...clientData, ...networkData };

    // 7. Parse UA for meta fields
    const uaInfo = parseUserAgent(clientData.sys_user_agent || '');
    const deviceType = determineDeviceType(
      clientData.sys_user_agent || '',
      clientData.hw_touch_points,
      clientData.hw_screen_width,
      clientData.hw_screen_height
    );
    const screenRes = `${clientData.hw_screen_width || 0}x${clientData.hw_screen_height || 0}`;

    // 8. Generate visit ID and timestamp
    const visitId = uuidv4();
    const now = Date.now();

    // 9. Parallel database operations
    const [insertResult, uniqueCheck, hardwareCheck, totalCount] = await Promise.all([
      // Insert new visit
      db
        .prepare(
          `INSERT INTO visits (
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
          JSON.stringify(fullReport)
        )
        .run(),

      // Check full hash uniqueness
      db
        .prepare('SELECT COUNT(*) as count FROM visits WHERE full_hash = ?')
        .bind(hashes.bronze)
        .first<{ count: number }>(),

      // Check hardware hash (cross-browser tracking)
      db
        .prepare('SELECT COUNT(*) as count FROM visits WHERE hardware_hash = ?')
        .bind(hashes.gold)
        .first<{ count: number }>(),

      // Get total fingerprint count
      db.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
    ]);

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

    // 11. Calculate results
    // Note: COUNT queries ran BEFORE INSERT, so they don't include current visit
    // previousExactMatches = fingerprints with same full_hash before this visit
    const previousExactMatches = uniqueCheck?.count || 0;
    const previousHardwareMatches = hardwareCheck?.count || 0;
    const previousTotal = totalCount?.count || 0;

    // For display, include current visit in counts
    const exactMatchCount = previousExactMatches + 1;
    const hardwareMatchCount = previousHardwareMatches + 1;
    const totalFingerprints = previousTotal + 1;

    // isUnique = true only if NO previous matches existed (this is the first with this fingerprint)
    const isUnique = previousExactMatches === 0;
    const uniquenessRatio = 1 / exactMatchCount;
    // Cross-browser tracking = same hardware seen with different full fingerprints
    const isDeviceTracked = previousHardwareMatches > previousExactMatches;

    // 12. Determine tracking risk level
    let trackingRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let message = '';

    if (isDeviceTracked) {
      trackingRisk = 'critical';
      message = `Cross-browser tracking detected! We found ${hardwareMatchCount} browser sessions from this device.`;
    } else if (isUnique) {
      trackingRisk = 'high';
      message = 'Your browser fingerprint is UNIQUE in our database! You can be easily tracked.';
    } else if (exactMatchCount < 5) {
      trackingRisk = 'high';
      message = `Only ${exactMatchCount} identical fingerprints found - you are highly identifiable.`;
    } else if (exactMatchCount < 50) {
      trackingRisk = 'medium';
      message = `${exactMatchCount} similar fingerprints found - moderate tracking risk.`;
    } else {
      trackingRisk = 'low';
      message = `${exactMatchCount} identical fingerprints found - you blend in with the crowd.`;
    }

    // 13. Return comprehensive response
    return c.json({
      success: true,
      meta: {
        id: visitId,
        timestamp: now,
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
        uniqueness_display: isUnique ? '1 in 1' : `1 in ${exactMatchCount.toLocaleString()}`,
        exact_match_count: exactMatchCount,
        hardware_match_count: hardwareMatchCount,
        total_fingerprints: totalFingerprints,
        tracking_risk: trackingRisk,
        message: message,
        cross_browser_detected: isDeviceTracked,
      },
      details: fullReport,
      lies: {
        os_mismatch: clientData.lie_os_mismatch || false,
        browser_mismatch: clientData.lie_browser_mismatch || false,
        resolution_mismatch: clientData.lie_resolution_mismatch || false,
        timezone_mismatch: clientData.lie_timezone_mismatch || false,
        webgl_mismatch: clientData.lie_webgl_mismatch || false,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to analyze fingerprint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default analyze;
