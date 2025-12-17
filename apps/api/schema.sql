-- ============================================
-- AmiUnique.io Database Schema for Cloudflare D1
-- Version: 1.0.0
-- ============================================

-- Main visits table
-- Stores fingerprint data with Three-Lock hashes
CREATE TABLE IF NOT EXISTS visits (
    -- Primary Key (UUID v4)
    id TEXT PRIMARY KEY,

    -- Timestamps (Unix epoch milliseconds)
    created_at INTEGER NOT NULL,

    -- Three-Lock Hash Indexes (Core Identity)
    hardware_hash TEXT NOT NULL,            -- Gold Lock (device fingerprint)
    software_hash TEXT NOT NULL,            -- Silver Lock (browser fingerprint)
    full_hash TEXT NOT NULL,                -- Bronze Lock (session fingerprint)

    -- Quick Aggregation Fields (avoid JSON parsing for stats)
    meta_browser TEXT,                      -- Chrome, Firefox, Safari, Edge, etc.
    meta_browser_version TEXT,              -- Major version number
    meta_os TEXT,                           -- Windows, macOS, Linux, iOS, Android
    meta_os_version TEXT,                   -- OS version string
    meta_device_type TEXT,                  -- desktop, mobile, tablet
    meta_country TEXT,                      -- ISO 3166-1 alpha-2 country code
    meta_screen TEXT,                       -- "1920x1080" format
    meta_gpu_vendor TEXT,                   -- GPU vendor name

    -- Full Payload (Cold Storage)
    raw_json TEXT NOT NULL                  -- Complete 80+ dimension JSON
);

-- Performance Indexes for common queries
-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_visits_full_hash ON visits(full_hash);
CREATE INDEX IF NOT EXISTS idx_visits_hardware_hash ON visits(hardware_hash);
CREATE INDEX IF NOT EXISTS idx_visits_software_hash ON visits(software_hash);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_browser ON visits(meta_browser);
CREATE INDEX IF NOT EXISTS idx_visits_os ON visits(meta_os);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(meta_country);
CREATE INDEX IF NOT EXISTS idx_visits_device_type ON visits(meta_device_type);

-- Composite indexes for common query patterns
-- Stats queries by date and browser/os
CREATE INDEX IF NOT EXISTS idx_visits_created_browser ON visits(created_at, meta_browser);
CREATE INDEX IF NOT EXISTS idx_visits_created_os ON visits(created_at, meta_os);
CREATE INDEX IF NOT EXISTS idx_visits_created_device ON visits(created_at, meta_device_type);
CREATE INDEX IF NOT EXISTS idx_visits_created_country ON visits(created_at, meta_country);

-- Distribution queries - covering indexes for GROUP BY with count
CREATE INDEX IF NOT EXISTS idx_visits_browser_device ON visits(meta_browser, meta_device_type);
CREATE INDEX IF NOT EXISTS idx_visits_os_device ON visits(meta_os, meta_device_type);
CREATE INDEX IF NOT EXISTS idx_visits_country_device ON visits(meta_country, meta_device_type);

-- Hash lookup with date range (for trend analysis)
CREATE INDEX IF NOT EXISTS idx_visits_hardware_created ON visits(hardware_hash, created_at);

-- ============================================
-- Statistics Cache Table (Pre-aggregated)
-- Updated periodically to avoid expensive queries
-- ============================================

CREATE TABLE IF NOT EXISTS stats_cache (
    id TEXT PRIMARY KEY,                    -- 'global' or date string 'YYYY-MM-DD'
    updated_at INTEGER NOT NULL,            -- Unix epoch milliseconds
    total_fingerprints INTEGER DEFAULT 0,
    unique_full_hash INTEGER DEFAULT 0,
    unique_hardware_hash INTEGER DEFAULT 0,
    browser_distribution TEXT,              -- JSON: {"Chrome": 45.2, "Firefox": 12.1}
    os_distribution TEXT,                   -- JSON: {"Windows": 65.3, "macOS": 20.1}
    country_distribution TEXT,              -- JSON: {"US": 30.5, "DE": 8.2}
    screen_distribution TEXT,               -- JSON: {"1920x1080": 35.2}
    device_distribution TEXT                -- JSON: {"desktop": 72.1, "mobile": 25.3}
);

-- ============================================
-- Daily Aggregation Table
-- Used for trend charts and historical data
-- ============================================

CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,                  -- YYYY-MM-DD format
    total_visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,      -- Unique hardware_hash count
    new_fingerprints INTEGER DEFAULT 0,     -- First-time full_hash count
    returning_visitors INTEGER DEFAULT 0,   -- Repeat hardware_hash count
    created_at INTEGER NOT NULL,            -- When this row was created
    updated_at INTEGER NOT NULL             -- Last update time
);

-- ============================================
-- Opt-out / Deletion Requests Table
-- For GDPR compliance
-- ============================================

CREATE TABLE IF NOT EXISTS deletion_requests (
    id TEXT PRIMARY KEY,
    hash_type TEXT NOT NULL,                -- 'hardware', 'software', 'full'
    hash_value TEXT NOT NULL,
    email TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',          -- pending, completed, rejected, failed
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    -- Retry mechanism fields
    retry_count INTEGER DEFAULT 0,          -- Number of processing attempts
    last_error TEXT,                        -- Last error message if failed
    last_attempt_at INTEGER                 -- Timestamp of last processing attempt
);

CREATE INDEX IF NOT EXISTS idx_deletion_hash ON deletion_requests(hash_value);
CREATE INDEX IF NOT EXISTS idx_deletion_status ON deletion_requests(status);
-- Composite index for efficient pending request queries (used by scheduled worker)
CREATE INDEX IF NOT EXISTS idx_deletion_status_created ON deletion_requests(status, created_at);
