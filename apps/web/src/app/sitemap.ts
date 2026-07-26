import { MetadataRoute } from 'next';
import { snapshotGeneratedAt } from '@/lib/stats-seed';

export const dynamic = 'force-static';

const BASE_URL = 'https://amiunique.io';

// Fixed per-release date for editorial pages so the sitemap doesn't churn on
// every build; data pages use the stats snapshot date instead.
const RELEASE_DATE = new Date('2026-07-26');
const SNAPSHOT_DATE = new Date(snapshotGeneratedAt);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: SNAPSHOT_DATE,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/ip/`,
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stats/`,
      lastModified: SNAPSHOT_DATE,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/stats/fingerprints/`,
      lastModified: SNAPSHOT_DATE,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/stats/global-distribution/`,
      lastModified: SNAPSHOT_DATE,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/developers/`,
      lastModified: RELEASE_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/legal/privacy/`,
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/legal/terms/`,
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/legal/opt-out/`,
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
