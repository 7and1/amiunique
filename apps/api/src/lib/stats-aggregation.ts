/**
 * Shared statistics aggregation.
 *
 * One implementation of the distribution queries is used by both the cron
 * writer (src/scheduled.ts) and the read path (src/routes/stats.ts), so the
 * pre-aggregated JSON in stats_cache always means the same thing as a live
 * query.
 *
 * Percentages are computed against the TRUE corpus denominator (every row with
 * a usable value for that column), not against the sum of the returned buckets.
 * A top-10 view of a long-tailed column therefore no longer sums to 100%; the
 * remainder is reported as an explicit `other` bucket.
 */

export interface DistributionBucket {
  name: string;
  count: number;
}

/** Shape persisted in the stats_cache *_distribution columns */
export interface StoredDistribution {
  v: 1;
  /** Rows with a non-null, non-empty value for this column */
  total: number;
  buckets: DistributionBucket[];
  computed_at: number;
}

/** Shape served to clients */
export interface DistributionView {
  total: number;
  buckets: { name: string; count: number; percentage: number }[];
  /** total minus the shown buckets, when positive */
  other: { count: number; percentage: number } | null;
  updated_at: number;
}

export type DistributionKey = 'browser' | 'os' | 'country' | 'screen' | 'device' | 'gpu';

interface DistributionSource {
  /** visits column holding the dimension value */
  column: string;
  /** stats_cache column holding the pre-aggregated JSON */
  cacheColumn: string;
  /** Sentinel values excluded beyond NULL/empty (screens record 0x0 when unavailable) */
  excluded: string[];
}

/**
 * Column names are interpolated into SQL, so they must only ever come from this
 * table. Sentinel values are bound as parameters.
 */
const SOURCES: Record<DistributionKey, DistributionSource> = {
  browser: { column: 'meta_browser', cacheColumn: 'browser_distribution', excluded: [] },
  os: { column: 'meta_os', cacheColumn: 'os_distribution', excluded: [] },
  country: { column: 'meta_country', cacheColumn: 'country_distribution', excluded: [] },
  screen: { column: 'meta_screen', cacheColumn: 'screen_distribution', excluded: ['0x0'] },
  device: { column: 'meta_device_type', cacheColumn: 'device_distribution', excluded: [] },
  gpu: { column: 'meta_gpu_vendor', cacheColumn: 'gpu_distribution', excluded: [] },
};

export const DISTRIBUTION_KEYS = Object.keys(SOURCES) as DistributionKey[];

/** Buckets retained in the cache, independent of any route's display limit */
const MAX_STORED_BUCKETS = 50;

export function distributionCacheColumn(key: DistributionKey): string {
  return SOURCES[key].cacheColumn;
}

function filterClause(source: DistributionSource): string {
  const parts = [`${source.column} IS NOT NULL`, `${source.column} != ''`];
  for (const _sentinel of source.excluded) parts.push(`${source.column} != ?`);
  return parts.join(' AND ');
}

/** D1 rejects bind() with no arguments, so only bind when there are parameters */
function bound(db: D1Database, sql: string, params: unknown[]): D1PreparedStatement {
  const statement = db.prepare(sql);
  return params.length > 0 ? statement.bind(...params) : statement;
}

function percentOf(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

/**
 * Aggregate one dimension: the true denominator plus the top buckets.
 */
export async function computeDistribution(
  db: D1Database,
  key: DistributionKey
): Promise<StoredDistribution> {
  const source = SOURCES[key];
  const where = filterClause(source);
  const sentinels = source.excluded;

  const [totalRow, bucketRows] = await Promise.all([
    bound(db, `SELECT COUNT(*) as total FROM visits WHERE ${where}`, sentinels).first<{
      total: number;
    }>(),
    bound(
      db,
      `SELECT ${source.column} as name, COUNT(*) as count
       FROM visits
       WHERE ${where}
       GROUP BY ${source.column}
       ORDER BY count DESC
       LIMIT ?`,
      [...sentinels, MAX_STORED_BUCKETS]
    ).all<{ name: string; count: number }>(),
  ]);

  const buckets = (bucketRows.results || []).map(row => ({
    name: String(row.name),
    count: Number(row.count) || 0,
  }));

  return {
    v: 1,
    total: Number(totalRow?.total) || 0,
    buckets,
    computed_at: Date.now(),
  };
}

export async function computeAllDistributions(
  db: D1Database
): Promise<Record<DistributionKey, StoredDistribution>> {
  const computed = await Promise.all(DISTRIBUTION_KEYS.map(key => computeDistribution(db, key)));

  return DISTRIBUTION_KEYS.reduce(
    (all, key, index) => {
      all[key] = computed[index];
      return all;
    },
    {} as Record<DistributionKey, StoredDistribution>
  );
}

/**
 * Project a stored distribution to the requested number of buckets, with
 * percentages against the stored denominator and the remainder as `other`.
 */
export function toView(stored: StoredDistribution, limit: number): DistributionView {
  const total = Math.max(stored.total, 0);
  const shown = stored.buckets.slice(0, Math.max(limit, 0));
  const shownCount = shown.reduce((sum, bucket) => sum + bucket.count, 0);
  const otherCount = Math.max(total - shownCount, 0);

  return {
    total,
    buckets: shown.map(bucket => ({
      name: bucket.name,
      count: bucket.count,
      percentage: percentOf(bucket.count, total),
    })),
    other: otherCount > 0 ? { count: otherCount, percentage: percentOf(otherCount, total) } : null,
    updated_at: stored.computed_at,
  };
}

/**
 * Parse a stats_cache distribution column. Returns null for anything that is
 * not a current-version payload so callers fall back to a live query.
 */
export function parseStoredDistribution(raw: unknown): StoredDistribution | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const candidate = parsed as Partial<StoredDistribution>;
  if (candidate?.v !== 1) return null;
  if (typeof candidate.total !== 'number' || !Number.isFinite(candidate.total)) return null;
  if (typeof candidate.computed_at !== 'number' || !Number.isFinite(candidate.computed_at)) {
    return null;
  }
  if (!Array.isArray(candidate.buckets)) return null;

  return {
    v: 1,
    total: candidate.total,
    computed_at: candidate.computed_at,
    buckets: candidate.buckets
      .filter(
        (bucket): bucket is DistributionBucket =>
          typeof bucket?.name === 'string' && typeof bucket?.count === 'number'
      )
      .map(bucket => ({ name: bucket.name, count: bucket.count })),
  };
}

export function isFresh(stored: StoredDistribution, maxAgeMs: number): boolean {
  return Date.now() - stored.computed_at < maxAgeMs;
}

export interface StatsCacheRow {
  total_fingerprints: number;
  unique_full_hash: number;
  unique_hardware_hash: number;
  updated_at: number;
  browser_distribution?: string | null;
  os_distribution?: string | null;
  country_distribution?: string | null;
  screen_distribution?: string | null;
  device_distribution?: string | null;
  gpu_distribution?: string | null;
}

export async function readStatsCacheRow(db: D1Database): Promise<StatsCacheRow | null> {
  return db.prepare('SELECT * FROM stats_cache WHERE id = ?').bind('global').first<StatsCacheRow>();
}

export function readStoredDistribution(
  row: StatsCacheRow | null,
  key: DistributionKey
): StoredDistribution | null {
  if (!row) return null;
  return parseStoredDistribution(row[SOURCES[key].cacheColumn as keyof StatsCacheRow]);
}

/**
 * Upsert a single distribution column without clobbering the sibling columns.
 * The row-level updated_at is only seeded on insert: each column carries its
 * own computed_at, which is what freshness checks use.
 */
export function distributionUpsert(
  db: D1Database,
  key: DistributionKey,
  stored: StoredDistribution
): D1PreparedStatement {
  const column = SOURCES[key].cacheColumn;
  return db
    .prepare(
      `INSERT INTO stats_cache (id, updated_at, ${column})
       VALUES ('global', ?, ?)
       ON CONFLICT(id) DO UPDATE SET ${column} = excluded.${column}`
    )
    .bind(stored.computed_at, JSON.stringify(stored));
}

/**
 * Recompute daily_stats for the most recent `daysBack` UTC days (default today
 * and yesterday). Idempotent: safe to run on every cron tick.
 *
 * Late-arriving rows are the reason yesterday is recomputed rather than written
 * once at midnight.
 */
export async function upsertDailyStats(db: D1Database, daysBack = 2): Promise<number> {
  const days = Math.max(daysBack, 1);
  const now = Date.now();
  const cutoffDate = new Date(now - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const result = await db
    .prepare(
      `INSERT OR REPLACE INTO daily_stats (
         date,
         total_visits,
         unique_visitors,
         new_fingerprints,
         returning_visitors,
         created_at,
         updated_at
       )
       SELECT
         observed.date,
         observed.total_visits,
         observed.unique_visitors,
         COALESCE(new_full.new_fingerprints, 0),
         MAX(observed.unique_visitors - COALESCE(new_hardware.new_devices, 0), 0),
         COALESCE(
           (SELECT existing.created_at FROM daily_stats existing WHERE existing.date = observed.date),
           ?
         ),
         ?
       FROM (
         SELECT
           date(created_at / 1000, 'unixepoch') AS date,
           COUNT(*) AS total_visits,
           COUNT(DISTINCT hardware_hash) AS unique_visitors
         FROM visits
         GROUP BY date(created_at / 1000, 'unixepoch')
         HAVING date(created_at / 1000, 'unixepoch') >= ?
       ) AS observed
       LEFT JOIN (
         SELECT
           date(first_seen / 1000, 'unixepoch') AS date,
           COUNT(*) AS new_fingerprints
         FROM (
           SELECT full_hash, MIN(created_at) AS first_seen
           FROM visits
           GROUP BY full_hash
         )
         GROUP BY date(first_seen / 1000, 'unixepoch')
       ) AS new_full ON new_full.date = observed.date
       LEFT JOIN (
         SELECT
           date(first_seen / 1000, 'unixepoch') AS date,
           COUNT(*) AS new_devices
         FROM (
           SELECT hardware_hash, MIN(created_at) AS first_seen
           FROM visits
           GROUP BY hardware_hash
         )
         GROUP BY date(first_seen / 1000, 'unixepoch')
       ) AS new_hardware ON new_hardware.date = observed.date`
    )
    .bind(now, now, cutoffDate)
    .run();

  return result.meta?.changes ?? 0;
}
