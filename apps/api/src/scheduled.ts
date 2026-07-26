/**
 * Scheduled Worker Handler
 * Processes background jobs on cron schedules:
 * - Deletion request processing (GDPR compliance)
 * - Stats cache refresh (scalar counters + distributions + daily rollup)
 * - Retention and privacy minimization, gated by a KV progress marker
 */

import type { Env } from './types/env.js';
import {
  computeAllDistributions,
  upsertDailyStats,
  type DistributionKey,
  type StoredDistribution,
} from './lib/stats-aggregation.js';

/** KV marker recording the last successful retention pass */
const MAINTENANCE_MARKER_KEY = 'maint:last_success';
const MAINTENANCE_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** Requests that keep failing this many times need a human to look */
const STUCK_RETRY_THRESHOLD = 3;

/**
 * Process pending deletion requests
 * Deletes visits matching the specified hash and marks request as completed
 */
async function processDeletionRequests(
  db: D1Database
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    // Get pending deletion requests (limit to 50 per run to avoid timeout)
    const pending = await db
      .prepare(
        `SELECT id, hash_type, hash_value, retry_count
         FROM deletion_requests
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 50`
      )
      .all<{ id: string; hash_type: string; hash_value: string; retry_count: number | null }>();

    if (!pending.results || pending.results.length === 0) {
      return { processed: 0, errors: 0 };
    }

    // Valid hash column mapping (prevents SQL injection)
    const VALID_HASH_COLUMNS = {
      hardware: 'hardware_hash',
      software: 'software_hash',
      full: 'full_hash',
    } as const;

    for (const request of pending.results) {
      try {
        // Validate and map hash type to column name
        const hashColumn = VALID_HASH_COLUMNS[request.hash_type as keyof typeof VALID_HASH_COLUMNS];

        if (!hashColumn) {
          console.error(`Invalid hash_type: ${request.hash_type} for request ${request.id}`);
          errors++;
          // Mark as rejected due to invalid hash type
          await db
            .prepare(
              `UPDATE deletion_requests
               SET status = 'rejected',
                   completed_at = ?,
                   hash_value = '',
                   email = NULL,
                   reason = NULL,
                   last_error = NULL
               WHERE id = ?`
            )
            .bind(Date.now(), request.id)
            .run();
          continue;
        }

        // Delete matching visits using validated column name
        // Note: Column name is from trusted constant, only value is parameterized
        const deleteResult = await db
          .prepare(
            hashColumn === 'hardware_hash'
              ? 'DELETE FROM visits WHERE hardware_hash = ?'
              : hashColumn === 'software_hash'
                ? 'DELETE FROM visits WHERE software_hash = ?'
                : 'DELETE FROM visits WHERE full_hash = ?'
          )
          .bind(request.hash_value)
          .run();

        // Mark request as completed
        await db
          .prepare(
            `UPDATE deletion_requests
             SET status = 'completed',
                 completed_at = ?,
                 hash_value = '',
                 email = NULL,
                 reason = NULL,
                 last_error = NULL
             WHERE id = ?`
          )
          .bind(Date.now(), request.id)
          .run();

        console.log(
          `Deletion request ${request.id}: deleted ${deleteResult.meta?.changes ?? 0} visits for ${request.hash_type} hash`
        );
        processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to process deletion request ${request.id}:`, errorMessage);
        errors++;

        // Keep the request pending so a transient D1 error never silently
        // converts an unfulfilled deletion request into a terminal state.
        try {
          await db
            .prepare(
              `UPDATE deletion_requests
               SET retry_count = COALESCE(retry_count, 0) + 1,
                   last_error = ?,
                   last_attempt_at = ?
               WHERE id = ?`
            )
            .bind('Deletion processing failed; retry scheduled', Date.now(), request.id)
            .run();

          const retryCount = (request.retry_count ?? 0) + 1;
          if (retryCount >= STUCK_RETRY_THRESHOLD) {
            console.warn(
              `[deletion-queue] stuck request id=${request.id} retry_count=${retryCount}`
            );
          }
        } catch (updateErr) {
          console.error(`Failed to update retry count for ${request.id}:`, updateErr);
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch pending deletion requests:', err);
    errors++;
  }

  return { processed, errors };
}

/**
 * Refresh the global stats cache.
 *
 * Pre-aggregates the expensive COUNT queries and all six distributions so the
 * read path never scans visits, then rolls up daily_stats.
 */
async function refreshStatsCache(db: D1Database): Promise<boolean> {
  try {
    const [total, uniqueFull, uniqueHardware, distributions] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
      db
        .prepare('SELECT COUNT(DISTINCT full_hash) as count FROM visits')
        .first<{ count: number }>(),
      db
        .prepare('SELECT COUNT(DISTINCT hardware_hash) as count FROM visits')
        .first<{ count: number }>(),
      computeAllDistributions(db),
    ]);

    const now = Date.now();
    const json = (key: DistributionKey): string =>
      JSON.stringify(distributions[key] satisfies StoredDistribution);

    // One row holds the whole snapshot, so a single INSERT OR REPLACE keeps the
    // scalar counters and every distribution consistent with each other.
    await db
      .prepare(
        `INSERT OR REPLACE INTO stats_cache
         (id, total_fingerprints, unique_full_hash, unique_hardware_hash, updated_at,
          browser_distribution, os_distribution, country_distribution,
          screen_distribution, device_distribution, gpu_distribution)
         VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        total?.count || 0,
        uniqueFull?.count || 0,
        uniqueHardware?.count || 0,
        now,
        json('browser'),
        json('os'),
        json('country'),
        json('screen'),
        json('device'),
        json('gpu')
      )
      .run();

    console.log(
      `Stats cache refreshed: ${total?.count} total, ${uniqueFull?.count} unique sessions, ${DISTRIBUTION_COUNT} distributions`
    );
    return true;
  } catch (err) {
    console.error('Failed to refresh stats cache:', err);
    return false;
  }
}

const DISTRIBUTION_COUNT = 6;

/**
 * Roll up today's and yesterday's daily_stats rows.
 * Yesterday is recomputed so late-arriving observations are not lost.
 */
async function refreshDailyStats(db: D1Database): Promise<boolean> {
  try {
    await upsertDailyStats(db, 2);
    return true;
  } catch (err) {
    console.error('Failed to upsert daily stats:', err);
    return false;
  }
}

/**
 * Remove legacy request-scoped network metadata and completed deletion inputs.
 * The update is idempotent and keeps aggregate country columns intact.
 */
async function enforcePrivacyMinimization(
  db: D1Database
): Promise<{ ok: boolean; visits: number; receipts: number }> {
  try {
    const [visitResult, receiptResult] = await Promise.all([
      db
        .prepare(
          `UPDATE visits
           SET raw_json = json_remove(
             raw_json,
             '$.net_ip_hash',
             '$.net_asn',
             '$.net_asn_org',
             '$.net_colo',
             '$.net_country',
             '$.net_timezone',
             '$.net_city',
             '$.net_region',
             '$.net_postal',
             '$.net_latitude',
             '$.net_longitude',
             '$.net_tls_version',
             '$.net_tls_cipher',
             '$.net_http_protocol',
             '$.net_tcp_rtt',
             '$.net_bot_score'
           )
           WHERE json_type(raw_json, '$.net_ip_hash') IS NOT NULL
              OR json_type(raw_json, '$.net_asn') IS NOT NULL
              OR json_type(raw_json, '$.net_country') IS NOT NULL`
        )
        .run(),
      db
        .prepare(
          `UPDATE deletion_requests
           SET hash_value = '',
               email = NULL,
               reason = NULL,
               last_error = NULL
           WHERE status IN ('completed', 'rejected')
             AND (hash_value <> '' OR email IS NOT NULL OR reason IS NOT NULL OR last_error IS NOT NULL)`
        )
        .run(),
    ]);

    return {
      ok: true,
      visits: visitResult.meta?.changes ?? 0,
      receipts: receiptResult.meta?.changes ?? 0,
    };
  } catch (err) {
    console.error('Failed to enforce privacy minimization:', err);
    return { ok: false, visits: 0, receipts: 0 };
  }
}

/**
 * Cleanup old data (optional, run weekly)
 * Removes data older than retention period
 */
async function cleanupOldData(
  db: D1Database,
  retentionDays = 90,
  deletionReceiptDays = 30
): Promise<{ ok: boolean; visits: number; receipts: number }> {
  try {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const receiptCutoff = Date.now() - deletionReceiptDays * 24 * 60 * 60 * 1000;

    const [visitResult, receiptResult] = await Promise.all([
      db.prepare('DELETE FROM visits WHERE created_at < ?').bind(cutoffTime).run(),
      db
        .prepare(
          `DELETE FROM deletion_requests
           WHERE status IN ('completed', 'rejected', 'failed')
             AND COALESCE(completed_at, created_at) < ?`
        )
        .bind(receiptCutoff)
        .run(),
    ]);

    const visits = visitResult.meta?.changes ?? 0;
    const receipts = receiptResult.meta?.changes ?? 0;
    if (visits > 0 || receipts > 0) {
      console.log(
        `Cleanup removed ${visits} visits older than ${retentionDays} days and ${receipts} deletion receipts older than ${deletionReceiptDays} days`
      );
    }

    return { ok: true, visits, receipts };
  } catch (err) {
    console.error('Failed to cleanup old data:', err);
    return { ok: false, visits: 0, receipts: 0 };
  }
}

/**
 * Run retention + minimization at most once a day, tracked by a KV marker
 * instead of a fixed weekly cron slot: a missed tick no longer delays the pass
 * by a whole week.
 *
 * The work is idempotent, so a KV read failure runs it rather than skipping it.
 * The marker is only written after a clean pass, which means a failure is
 * retried on the next hourly tick.
 */
async function runDueMaintenance(db: D1Database, kv: KVNamespace | undefined): Promise<void> {
  let due = true;

  if (kv) {
    try {
      const marker = await kv.get(MAINTENANCE_MARKER_KEY);
      const lastSuccess = marker ? parseInt(marker, 10) : NaN;
      if (Number.isFinite(lastSuccess) && Date.now() - lastSuccess < MAINTENANCE_INTERVAL_MS) {
        due = false;
      }
    } catch (err) {
      console.warn('[maintenance] marker read failed; running anyway:', err);
    }
  }

  if (!due) return;

  const minimized = await enforcePrivacyMinimization(db);
  const cleaned = await cleanupOldData(db, 90, 30);
  console.log(
    `Privacy maintenance: ${minimized.visits} visits and ${minimized.receipts} receipts minimized; ${cleaned.visits} visits and ${cleaned.receipts} receipts removed`
  );

  if (!minimized.ok || !cleaned.ok) {
    console.error('[maintenance] pass incomplete; marker not advanced');
    return;
  }

  if (!kv) return;
  try {
    await kv.put(MAINTENANCE_MARKER_KEY, String(Date.now()));
  } catch (err) {
    console.warn('[maintenance] marker write failed:', err);
  }
}

/**
 * Main scheduled event handler
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const db = env.DB;
  const triggerTime = new Date(event.scheduledTime);
  const cronPattern = event.cron;

  console.log(`Scheduled job triggered at ${triggerTime.toISOString()} (cron: ${cronPattern})`);

  // Determine which job to run based on cron pattern
  if (cronPattern === '0 * * * *') {
    // Hourly: Process deletion requests
    const result = await processDeletionRequests(db);
    console.log(
      `Deletion processing complete: ${result.processed} processed, ${result.errors} errors`
    );

    // Retention runs whenever a day has passed since the last clean pass
    await runDueMaintenance(db, env.RATE_LIMIT_KV);
  } else if (cronPattern === '*/5 * * * *') {
    // Every 5 minutes: Refresh stats cache and the daily rollup
    const success = await refreshStatsCache(db);
    const dailySuccess = await refreshDailyStats(db);
    console.log(
      `Stats cache refresh: ${success ? 'success' : 'failed'}; daily rollup: ${dailySuccess ? 'success' : 'failed'}`
    );
  }
}
