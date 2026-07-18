-- Bring the legacy production deletion table up to the current retry schema.
-- This migration targets databases created before these columns were added to schema.sql.
ALTER TABLE deletion_requests ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE deletion_requests ADD COLUMN last_error TEXT;
ALTER TABLE deletion_requests ADD COLUMN last_attempt_at INTEGER;

-- Remove request-scoped network metadata persisted by earlier releases.
-- Aggregate country statistics remain in visits.meta_country.
UPDATE visits
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
   OR json_type(raw_json, '$.net_country') IS NOT NULL;

-- Completed receipts retain only a random ID, status, and timestamps.
UPDATE deletion_requests
SET hash_value = '',
    email = NULL,
    reason = NULL,
    last_error = NULL
WHERE status IN ('completed', 'rejected');

-- Enforce the published retention windows immediately.
DELETE FROM visits
WHERE created_at < (unixepoch('now') - (90 * 24 * 60 * 60)) * 1000;

DELETE FROM deletion_requests
WHERE status IN ('completed', 'rejected', 'failed')
  AND COALESCE(completed_at, created_at) < (unixepoch('now') - (30 * 24 * 60 * 60)) * 1000;
