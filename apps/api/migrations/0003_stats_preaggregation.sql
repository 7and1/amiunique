-- Add the GPU distribution column that schema.sql now declares, then seed
-- daily_stats so the /api/stats/daily trend endpoint has history to serve
-- before the first cron tick writes to it.
ALTER TABLE stats_cache ADD COLUMN gpu_distribution TEXT;

-- Backfill daily_stats from the retained 90-day visit window.
--   total_visits        = observations that day
--   unique_visitors     = distinct hardware hashes that day
--   new_fingerprints    = full hashes first observed that day
--   returning_visitors  = unique_visitors minus hardware hashes first seen that day
-- created_at is epoch milliseconds; date() needs seconds.
INSERT OR REPLACE INTO daily_stats (
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
    unixepoch('now') * 1000
  ),
  unixepoch('now') * 1000
FROM (
  SELECT
    date(created_at / 1000, 'unixepoch') AS date,
    COUNT(*) AS total_visits,
    COUNT(DISTINCT hardware_hash) AS unique_visitors
  FROM visits
  WHERE created_at >= (unixepoch('now') - (90 * 24 * 60 * 60)) * 1000
  GROUP BY date(created_at / 1000, 'unixepoch')
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
) AS new_hardware ON new_hardware.date = observed.date;
