import snapshot from '@/data/stats-snapshot.json';
import type { GlobalStats } from '@amiunique/core';
import type { DistributionResponse } from '@/lib/api';
import type { StatsSeed, DailyTrendsPayload } from '@/hooks/use-stats';

/**
 * Build-time stats snapshot (see scripts/generate-stats-snapshot.mjs).
 * Lets data pages prerender real corpus numbers for crawlers; the client
 * upgrades to live figures after hydration.
 */

function wrap(data: DistributionResponse['data']): DistributionResponse {
  return { success: true, data };
}

export const snapshotGeneratedAt: string = snapshot.generated_at;

export const snapshotGlobal = snapshot.global as GlobalStats;

export const statsSnapshotSeed: StatsSeed = {
  stats: snapshotGlobal,
  browsers: wrap(snapshot.browsers),
  os: wrap(snapshot.os),
  devices: wrap(snapshot.devices),
  countries: wrap(snapshot.countries),
  screens: wrap(snapshot.screens),
  trends: snapshot.daily as DailyTrendsPayload,
};
