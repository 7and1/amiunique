# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AmiUnique.io is a browser fingerprinting detection platform with 80+ dimensions, using Cloudflare's edge infrastructure (Workers, D1, Pages).

**Tech Stack**: Next.js 14, Cloudflare Workers + Hono.js, Cloudflare D1 (SQLite), Tailwind CSS

## Project Structure

pnpm monorepo managed by Turborepo:

```
amiunique/
├── apps/
│   ├── web/              # Next.js 14 frontend (@amiunique/web)
│   │   ├── src/app/      # App router pages
│   │   ├── src/components/
│   │   └── src/lib/      # API client, scan flow, history
│   └── api/              # Cloudflare Worker (@amiunique/api)
│       ├── src/
│       │   ├── index.ts  # Hono app entry
│       │   ├── routes/   # analyze.ts, stats.ts, health.ts
│       │   └── lib/      # three-lock.ts, hash.ts, ua-parser.ts
│       └── schema.sql    # D1 database schema
└── packages/
    └── core/             # Shared fingerprinting logic (@amiunique/core)
        └── src/
            ├── collect.ts      # Main orchestrator
            ├── types.ts        # FingerprintData interface
            └── collectors/     # hardware.ts, system.ts, media.ts, capabilities.ts, lies.ts
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (Turborepo runs all apps)
pnpm dev              # Start all services
pnpm dev:web          # Frontend only (localhost:3000)
pnpm dev:api          # API only (localhost:8787)

# Build
pnpm build            # Build all packages
pnpm build:web        # Build frontend
pnpm build:api        # Build worker

# Lint
pnpm lint             # Lint all packages

# Database (Cloudflare D1)
pnpm db:create        # Create D1 database (first time only)
pnpm db:migrate       # Apply schema from apps/api/schema.sql
wrangler d1 execute amiunique-db --command="SELECT * FROM visits LIMIT 5"
wrangler d1 execute amiunique-db --local --command="..."  # Local D1

# Deploy
pnpm deploy:api       # Deploy Worker to production
pnpm deploy:web       # Deploy frontend to Pages
pnpm deploy           # Build + deploy all
```

## Architecture

### Three-Lock Fingerprinting System

Located in `apps/api/src/lib/three-lock.ts`:

1. **Gold Lock (Hardware)**: Most stable - survives browser reinstall. Uses: Canvas, WebGL, Audio, GPU, Screen, CPU cores, Memory, Math precision
2. **Silver Lock (Software)**: Medium stability - changes with browser/OS updates. Uses: Fonts, UA, Platform, Timezone, Intl APIs, Plugins, Codecs
3. **Bronze Lock (Full)**: Session-specific - includes network. Uses: Gold + Silver + ASN, TLS cipher, CF datacenter

### Data Flow

1. Frontend (`@amiunique/core`) collects 80+ dimensions via `collectFingerprint()`
2. POST to `/api/analyze` with JSON payload
3. Worker extracts `request.cf` for network fingerprint (cannot be spoofed)
4. Calculates Three-Lock hashes, queries D1 for uniqueness
5. Returns analysis with tracking risk assessment

### Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/collect.ts` | Main fingerprint collection orchestrator |
| `packages/core/src/types.ts` | `FingerprintData` interface (80+ fields) |
| `apps/api/src/lib/three-lock.ts` | Gold/Silver/Bronze hash calculation |
| `apps/api/src/routes/analyze.ts` | Main analysis endpoint |
| `apps/api/schema.sql` | D1 tables: visits, stats_cache, daily_stats, deletion_requests |
| `apps/web/src/lib/scan-flow.tsx` | Frontend scan UI flow |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Submit fingerprint, get Three-Lock analysis |
| GET | `/api/stats` | Global statistics (total, unique counts) |
| GET | `/api/health` | Health check |

## Database Schema (D1)

Main table: `visits` with indexes on all hash columns and meta fields.
- Three-Lock hashes: `hardware_hash`, `software_hash`, `full_hash`
- Quick aggregation: `meta_browser`, `meta_os`, `meta_country`, `meta_screen`, `meta_gpu_vendor`
- Full data: `raw_json` (complete 80+ dimension payload)

Pre-aggregated stats in `stats_cache` and `daily_stats` tables.

## Testing Fingerprint Stability

**Critical requirement**: Canvas/WebGL/Audio hashes must be deterministic across page refreshes.

```javascript
// Browser console test
const { collectFingerprint } = await import('@amiunique/core');
const fp1 = await collectFingerprint();
const fp2 = await collectFingerprint();
console.log('Canvas stable:', fp1.hw_canvas_hash === fp2.hw_canvas_hash);
console.log('WebGL stable:', fp1.hw_webgl_hash === fp2.hw_webgl_hash);
```

## Cloudflare Configuration

- **wrangler.toml**: `apps/api/wrangler.toml` - Update `database_id` after D1 creation
- **D1 Binding**: `DB` bound to `amiunique-db`
- **CORS**: Configured for localhost:3000, localhost:8787, amiunique.io

## Important Notes

- `@amiunique/core` is a workspace dependency used by frontend
- Network fingerprint (`net_*` fields) comes from Cloudflare's `request.cf` object - not spoofable
- Lie detection checks for OS/browser/GPU spoofing inconsistencies
- GDPR compliance via `deletion_requests` table

## Reference

- `BLUEPRINT.md` - Complete technical specification with all 80+ dimensions documented
