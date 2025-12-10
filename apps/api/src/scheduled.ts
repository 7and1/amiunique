/**
 * Scheduled Worker Handler
 * Processes background jobs on cron schedules:
 * - Deletion request processing (GDPR compliance)
 * - Stats cache refresh
 */

import type { Env } from './types/env.js';

/**
 * Process pending deletion requests
 * Deletes visits matching the specified hash and marks request as completed
 */
async function processDeletionRequests(db: D1Database): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    // Get pending deletion requests (limit to 50 per run to avoid timeout)
    const pending = await db
      .prepare(
        `SELECT id, hash_type, hash_value
         FROM deletion_requests
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 50`
      )
      .all<{ id: string; hash_type: string; hash_value: string }>();

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
               SET status = 'rejected', completed_at = ?
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
             SET status = 'completed', completed_at = ?
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

        // Update retry count and error info
        // Mark as 'failed' after 3 unsuccessful attempts
        const MAX_RETRIES = 3;
        try {
          await db
            .prepare(
              `UPDATE deletion_requests
               SET retry_count = COALESCE(retry_count, 0) + 1,
                   last_error = ?,
                   last_attempt_at = ?,
                   status = CASE
                     WHEN COALESCE(retry_count, 0) >= ? THEN 'failed'
                     ELSE status
                   END
               WHERE id = ?`
            )
            .bind(errorMessage, Date.now(), MAX_RETRIES - 1, request.id)
            .run();
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
 * Refresh the global stats cache
 * Pre-aggregates expensive COUNT queries for fast API responses
 */
async function refreshStatsCache(db: D1Database): Promise<boolean> {
  try {
    // Calculate aggregated stats
    const [total, uniqueFull, uniqueHardware] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
      db.prepare('SELECT COUNT(DISTINCT full_hash) as count FROM visits').first<{ count: number }>(),
      db.prepare('SELECT COUNT(DISTINCT hardware_hash) as count FROM visits').first<{ count: number }>(),
    ]);

    const now = Date.now();

    // Update or insert cache entry
    await db
      .prepare(
        `INSERT OR REPLACE INTO stats_cache
         (id, total_fingerprints, unique_full_hash, unique_hardware_hash, updated_at)
         VALUES ('global', ?, ?, ?, ?)`
      )
      .bind(
        total?.count || 0,
        uniqueFull?.count || 0,
        uniqueHardware?.count || 0,
        now
      )
      .run();

    console.log(`Stats cache refreshed: ${total?.count} total, ${uniqueFull?.count} unique sessions`);
    return true;
  } catch (err) {
    console.error('Failed to refresh stats cache:', err);
    return false;
  }
}

/**
 * Cleanup old data (optional, run weekly)
 * Removes data older than retention period
 */
async function cleanupOldData(db: D1Database, retentionDays = 365): Promise<number> {
  try {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const result = await db
      .prepare('DELETE FROM visits WHERE created_at < ?')
      .bind(cutoffTime)
      .run();

    const deleted = result.meta?.changes ?? 0;
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} visits older than ${retentionDays} days`);
    }

    return deleted;
  } catch (err) {
    console.error('Failed to cleanup old data:', err);
    return 0;
  }
}

/**
 * Main scheduled event handler
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const db = env.DB;
  const triggerTime = new Date(event.scheduledTime);
  const cronPattern = event.cron;

  console.log(`Scheduled job triggered at ${triggerTime.toISOString()} (cron: ${cronPattern})`);

  // Determine which job to run based on cron pattern
  if (cronPattern === '0 * * * *') {
    // Hourly: Process deletion requests
    const result = await processDeletionRequests(db);
    console.log(`Deletion processing complete: ${result.processed} processed, ${result.errors} errors`);

    // Also run weekly cleanup on Sunday at midnight
    if (triggerTime.getUTCDay() === 0 && triggerTime.getUTCHours() === 0) {
      const cleaned = await cleanupOldData(db, 365);
      console.log(`Weekly cleanup: ${cleaned} old records removed`);
    }
  } else if (cronPattern === '*/5 * * * *') {
    // Every 5 minutes: Refresh stats cache
    const success = await refreshStatsCache(db);
    console.log(`Stats cache refresh: ${success ? 'success' : 'failed'}`);
  }
}
