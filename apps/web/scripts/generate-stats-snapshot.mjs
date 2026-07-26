#!/usr/bin/env node
/**
 * Build-time stats snapshot.
 *
 * Fetches live aggregates from the production API and writes
 * src/data/stats-snapshot.json so data pages prerender real numbers.
 * Any failure leaves the committed snapshot untouched and exits 0 —
 * builds must never fail because the API was unreachable.
 *
 * Skip with SKIP_STATS_SNAPSHOT=1.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://amiunique-api.7and1.workers.dev';

const OUT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'stats-snapshot.json'
);

if (process.env.SKIP_STATS_SNAPSHOT === '1') {
  console.log('[stats-snapshot] skipped (SKIP_STATS_SNAPSHOT=1)');
  process.exit(0);
}

async function fetchJson(pathname) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${pathname} -> HTTP ${res.status}`);
  const body = await res.json();
  // API responses are wrapped as { success, data }
  if (body && typeof body === 'object' && 'data' in body) return body.data;
  return body;
}

try {
  const [global, browsers, os, devices, countries, screens, daily] = await Promise.all([
    fetchJson('/api/stats'),
    fetchJson('/api/stats/browsers?limit=10'),
    fetchJson('/api/stats/os?limit=10'),
    fetchJson('/api/stats/devices'),
    fetchJson('/api/stats/countries?limit=10'),
    fetchJson('/api/stats/screens?limit=10'),
    fetchJson('/api/stats/daily?days=30'),
  ]);

  if (typeof global?.total_fingerprints !== 'number' || global.total_fingerprints <= 0) {
    throw new Error('global stats missing total_fingerprints');
  }

  const snapshot = {
    generated_at: new Date().toISOString(),
    global,
    browsers,
    os,
    devices,
    countries,
    screens,
    daily,
  };

  await writeFile(OUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `[stats-snapshot] wrote ${OUT_PATH} (total_fingerprints=${global.total_fingerprints})`
  );
} catch (error) {
  let existing = 'MISSING';
  try {
    const current = JSON.parse(await readFile(OUT_PATH, 'utf8'));
    existing = `generated_at=${current.generated_at}`;
  } catch {
    /* no committed snapshot — pages fall back to their own guards */
  }
  console.warn(
    `[stats-snapshot] fetch failed (${error.message}); keeping committed snapshot (${existing})`
  );
  process.exit(0);
}
